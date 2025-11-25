import { ethers } from "ethers";
import { CallResult } from "./types";
import { generateInputData } from "./abi";
import { SUPPORTED_CHAINS } from "./config";

export async function executeSingleTransaction(
  provider: ethers.JsonRpcProvider,
  privateKey: string,
  contractAddress: string,
  functionName: string,
  params: any[],
  chainId: number,
): Promise<any> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address;
  const balance = await provider.getBalance(address);
  const inputData = generateInputData(address, functionName, params);
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
      value: 0,
    });
    const feeData = await provider.getFeeData();
    // 计算预估的gas费用
    const gasLimit = gasEstimate + (gasEstimate * 20n) / 100n;
    const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
    const estimatedGasCost = gasLimit * gasPrice;
    // 检查余额是否足够支付gas费用
    if (balance < estimatedGasCost) {
      const neededEth = ethers.formatEther(estimatedGasCost - balance);
      console.log(`⚠️余额不足! 需要更多 ETH 来支付 gas 费用`);
      return {
        success: false,
        error: `Insufficient balance. Need ${neededEth} more ETH for gas fees`,
        address: wallet.address,
      };
    }
    const tx = await wallet.sendTransaction({
      to: contractAddress,
      data: inputData,
      value: 0,
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
): Promise<CallResult[]> {
  const results: CallResult[] = new Array(privateKeys.length);
  let index = 0;

  // 一个 worker：持续取任务执行
  const worker = async () => {
    while (true) {
      const cur = index++;
      if (cur >= privateKeys.length) return;

      const pk = privateKeys[cur];
      try {
        results[cur] = await executeSingleTransaction(
          provider,
          pk,
          contractAddress,
          functionName,
          params,
          chainId,
        );
      } catch (err) {
        results[cur] = {
          success: false,
          error: (err as any).message || String(err),
          address: new ethers.Wallet(pk).address, // 即使失败也记录地址
        };
      }

      // 小节流，防卡链
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  // 启动 concurrency 个 worker 并行执行
  await Promise.all(Array.from({ length: concurrency }, worker));

  return results;
}
