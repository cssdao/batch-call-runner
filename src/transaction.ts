import { ethers } from "ethers";
import { CallResult } from "./types";
import { generateInputData } from "./abi";
import { SUPPORTED_CHAINS } from "./config";
import { parseAndReplaceAddress } from "./input-data-parser";

export async function executeSingleTransaction(
  provider: ethers.JsonRpcProvider,
  privateKey: string,
  contractAddress: string,
  functionName: string,
  params: any[],
  chainId: number,
  valueInEther = "0",
  transactionData?: string,
): Promise<any> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address;
  const balance = await provider.getBalance(address);

  let inputData: string;
  if (transactionData) {
    // 使用预解析的交易数据，只需要替换地址
    inputData = parseAndReplaceAddress(transactionData, address, false);
  } else {
    // 使用传统的 ABI 方式生成数据
    inputData = generateInputData(address, functionName, params);
  }

  const value = ethers.parseEther(valueInEther);
  const { explorerUrl, symbol } = SUPPORTED_CHAINS.find(
    (e) => e.chainId === chainId,
  ) || { explorerUrl: "", symbol: "" };

  console.log(
    `📤 钱包: ${address}，当前余额: ${ethers.formatEther(balance)} ${symbol}`,
  );

  try {
    const gasEstimate = await provider.estimateGas({
      to: contractAddress,
      data: inputData,
      value: value,
    });
    const feeData = await provider.getFeeData();
    // 计算预估的gas费用
    const gasLimit = gasEstimate + (gasEstimate * 20n) / 100n;
    const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
    const estimatedGasCost = gasLimit * gasPrice;
    // 检查余额是否足够支付gas费用和发送的代币
    const totalRequired = estimatedGasCost + value;
    if (balance < totalRequired) {
      const neededEth = ethers.formatEther(totalRequired - balance);
      console.log(`⚠️余额不足! 需要更多 ${symbol} 来支付 gas 费用和交易金额`);
      return {
        success: false,
        error: `Insufficient balance. Need ${neededEth} more ${symbol} for gas fees and transaction value`,
        address: wallet.address,
      };
    }
    const tx = await wallet.sendTransaction({
      to: contractAddress,
      data: inputData,
      value: value,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    });
    console.log(`交易已发送: ${explorerUrl}/tx/${tx.hash}`);
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null.");
    }
    console.log(`✅ 交易成功! 区块号: ${receipt.blockNumber}`);
    return {
      hash: tx.hash,
      success: true,
      actualGasUsed: receipt.gasUsed.toString(),
      address: wallet.address,
    };
  } catch (e: any) {
    console.error(`交易失败: ${e.message}`);
    return { success: false, error: e.message, address: wallet.address };
  }
}

export async function executeTransactions(
  provider: ethers.JsonRpcProvider,
  privateKeys: string[],
  contractAddress: string,
  functionName: string,
  params: any[],
  chainId: number,
  concurrency = 1,
  valueInEther = "0",
  executionCount = 1,
  minDelayMs = 0,
  maxDelayMs = 5000,
  transactionData?: string,
): Promise<CallResult[]> {
  const results: CallResult[] = [];
  let walletIndex = 0;

  // 每个 wallet 串行执行多次交易，但多个 wallets 之间可以并行
  const worker = async () => {
    while (true) {
      const currentWalletIndex = walletIndex++;
      if (currentWalletIndex >= privateKeys.length) return;

      const privateKey = privateKeys[currentWalletIndex];
      const walletAddress = new ethers.Wallet(privateKey).address;
      console.log(`\n🔑 开始处理钱包: ${walletAddress}`);

      // 对同一个钱包的所有交易进行串行执行
      for (
        let executionIndex = 1;
        executionIndex <= executionCount;
        executionIndex++
      ) {
        try {
          console.log(
            `📋 [${walletAddress}] 执行第 ${executionIndex}/${executionCount} 次交易`,
          );

          const result = await executeSingleTransaction(
            provider,
            privateKey,
            contractAddress,
            functionName,
            params,
            chainId,
            valueInEther,
            transactionData,
          );

          // 添加执行次数信息到结果中
          results.push({
            ...result,
            executionIndex,
            totalExecutions: executionCount,
          });

          // 如果不是最后一次执行，添加随机延迟
          if (
            executionIndex < executionCount &&
            (minDelayMs > 0 || maxDelayMs > 0)
          ) {
            const delayMs =
              Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) +
              minDelayMs;
            console.log(
              `⏱️  [${walletAddress}] 等待 ${(delayMs / 1000).toFixed(1)} 秒后执行下次交易...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } catch (err) {
          console.error(
            `❌ [${walletAddress}] 第 ${executionIndex}/${executionCount} 次交易失败: ${(err as any).message}`,
          );

          results.push({
            success: false,
            error: (err as any).message || String(err),
            address: walletAddress,
            executionIndex,
            totalExecutions: executionCount,
          });

          // 失败后立即重试，不等待延迟
          if (executionIndex < executionCount) {
            console.log(
              `🔄 [${walletAddress}] 立即重试第 ${executionIndex + 1}/${executionCount} 次交易...`,
            );
          }
        }

        // 不同钱包之间的小节流，防卡链
        if (executionIndex === executionCount) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      console.log(`✅ [${walletAddress}] 所有交易执行完成`);
    }
  };

  // 启动 concurrency 个 worker 并行执行不同的钱包
  await Promise.all(Array.from({ length: concurrency }, worker));

  return results;
}
