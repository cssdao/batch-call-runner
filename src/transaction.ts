import { ethers } from "ethers";
import { CallResult } from "./types";
import { processInputData } from "./utils";
import { getInputDataFromABI } from "./abi";

export async function executeSingleTransaction(
  provider: ethers.JsonRpcProvider,
  privateKey: string,
  contractAddress: string,
): Promise<CallResult> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = wallet.address;
  const balance = await provider.getBalance(address);
  const inputData = await getInputDataFromABI(address);

  console.log(
    `\n📤 钱包: ${address}，当前余额: ${ethers.formatEther(balance)} ETH`,
  );

  try {
    const txData = processInputData(inputData, wallet.address);
    const gasEstimate = await provider.estimateGas({
      to: contractAddress,
      data: txData,
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

    console.log(`   准备发送交易...`);
    const tx = await wallet.sendTransaction({
      to: contractAddress,
      data: txData,
      value: 0,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    });
    console.log(`   交易哈希: ${tx.hash}`);
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null.");
    }
    console.log(`   ✅ 交易成功! 区块号: ${receipt.blockNumber}`);
    return {
      hash: tx.hash,
      success: true,
      actualGasUsed: receipt.gasUsed.toString(),
      address: wallet.address,
    };
  } catch (e: any) {
    return { success: false, error: e.message, address: wallet.address };
  }
}

export async function executeTransactions(
  provider: ethers.JsonRpcProvider,
  privateKeys: string[],
  contractAddress: string,
  concurrency = 1,
): Promise<CallResult[]> {
  const results: CallResult[] = [];
  for (let i = 0; i < privateKeys.length; i += concurrency) {
    const chunk = privateKeys.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((pk) =>
        executeSingleTransaction(provider, pk, contractAddress),
      ),
    );
    results.push(...chunkResults);
    if (i + concurrency < privateKeys.length)
      await new Promise((r) => setTimeout(r, 3000));
  }
  return results;
}
