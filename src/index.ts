import inquirer from "inquirer";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { SUPPORTED_CHAINS, ChainConfig } from "./config";

interface CallResult {
  hash?: string;
  success: boolean;
  error?: string;
  gasEstimate?: string;
  actualGasUsed?: string;
  blockNumber?: number;
  address?: string;
  privateKey?: string;
}

interface Results {
  timestamp: string;
  chain: string;
  contractAddress: string;
  inputData: string;
  callCount: number;
  results: CallResult[];
}

async function displayWelcome() {
  console.log("\n🚀 批量合约调用工具");
  console.log("=".repeat(40));
  console.log("作者: CSS DAO");
  console.log("版本: 1.0.0");
  console.log("=".repeat(40) + "\n");
}

async function selectChain(): Promise<ChainConfig> {
  const { chainIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "chainIndex",
      message: "请选择网络:",
      choices: SUPPORTED_CHAINS.map((chain, index) => ({
        name: `${index + 1}.${chain.name} (Chain ID: ${chain.chainId})`,
        value: index,
      })),
    },
  ]);

  return SUPPORTED_CHAINS[chainIndex as number];
}

async function getUserInput() {
  return await inquirer.prompt([
    {
      type: "input",
      name: "contractAddress",
      message: "请输入合约地址:",
      validate: (input: string) => {
        if (!ethers.isAddress(input)) {
          return "请输入有效的以太坊地址";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "inputData",
      message: "请输入交易数据 (inputData, 十六进制格式):",
      validate: (input: string) => {
        if (!input.startsWith("0x") || !/^[0-9a-fA-F]+$/.test(input.slice(2))) {
          return "请输入有效的十六进制数据，以0x开头";
        }
        return true;
      },
    },
  ]);
}

async function createProvider(
  chain: ChainConfig,
): Promise<ethers.JsonRpcProvider> {
  return new ethers.JsonRpcProvider(chain.rpcUrl);
}

async function getPrivateKeys(): Promise<string[]> {
  try {
    const walletsPath = path.join(process.cwd(), "wallets.txt");
    if (!fs.existsSync(walletsPath)) {
      throw new Error(
        "wallets.txt 文件不存在，请在项目根目录创建该文件并添加私钥（每行一个）",
      );
    }

    const privateKeysContent = fs.readFileSync(walletsPath, "utf8");
    const privateKeys = privateKeysContent
      .split("\n")
      .map((key) => key.trim())
      .filter((key) => key.length > 0)
      .map((key) => (key.startsWith("0x") ? key : `0x${key}`));

    if (privateKeys.length === 0) {
      throw new Error("wallets.txt 文件中没有找到有效的私钥");
    }

    // 验证私钥格式
    for (const key of privateKeys) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error(
          `无效的私钥格式: ${key.substring(0, 10)}... (必须是64位十六进制字符)`,
        );
      }
    }

    console.log(`从 wallets.txt 文件中读取了 ${privateKeys.length} 个私钥`);
    return privateKeys;
  } catch (error: any) {
    throw new Error(`读取私钥文件失败: ${error.message}`);
  }
}

function extractCommonPrefix(inputData: string): string {
  // 移除0x前缀
  const data = inputData.startsWith("0x") ? inputData.slice(2) : inputData;

  // 函数选择器通常是前4字节（8个十六进制字符）
  if (data.length < 8) {
    return inputData; // 如果数据太短，无法提取，返回原数据
  }

  // 提取函数选择器和可能的参数前缀
  // 假设地址是参数的最后一部分（32字节 = 64个十六进制字符）
  if (data.length > 72) {
    // 8 (函数选择器) + 64 (地址参数)
    return `0x${data.slice(0, -64)}`;
  }

  return inputData;
}

function generateInputDataWithAddress(
  originalInputData: string,
  address: string,
): string {
  const commonPrefix = extractCommonPrefix(originalInputData);

  // 确保地址是正确的格式（42字符，包含0x前缀）
  const formattedAddress = address.startsWith("0x") ? address : `0x${address}`;
  if (!ethers.isAddress(formattedAddress)) {
    throw new Error(`无效的地址格式: ${address}`);
  }

  // 移除地址的0x前缀，只保留40个十六进制字符
  const addressHex = formattedAddress.slice(2);

  // 确保地址是40个字符
  if (addressHex.length !== 40) {
    throw new Error(`地址长度不正确: ${address}`);
  }

  // 在以太坊ABI编码中，地址需要填充到32字节（64个十六进制字符）
  const paddedAddress = addressHex.padStart(64, "0");

  return `${commonPrefix}${paddedAddress}`;
}

async function executeTransactions(
  provider: ethers.JsonRpcProvider,
  privateKeys: string[],
  contractAddress: string,
  inputData: string,
): Promise<CallResult[]> {
  console.log("\n🔄 执行交易");
  console.log("=".repeat(40));

  const results: CallResult[] = [];
  let totalGasUsed = 0n;

  for (let i = 0; i < privateKeys.length; i++) {
    const privateKey = privateKeys[i];
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;

    console.log(`\n📤 钱包 ${i + 1}/${privateKeys.length}: ${address}`);

    const balance = await provider.getBalance(address);
    console.log(`   当前余额: ${ethers.formatEther(balance)} ETH`);

    try {
      // 为每个私钥生成对应的input data
      const inputDataWithAddress = generateInputDataWithAddress(
        inputData,
        address,
      );

      console.log(`   准备发送交易...`);

      const gasEstimate = await provider.estimateGas({
        to: contractAddress,
        data: inputDataWithAddress,
        value: 0,
      });

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");

      const tx = await wallet.sendTransaction({
        to: contractAddress,
        data: inputDataWithAddress,
        value: 0,
        gasLimit: gasEstimate + (gasEstimate * 20n) / 100n, // 增加20%的gas限制
        gasPrice: gasPrice,
      });

      console.log(`   交易哈希: ${tx.hash}`);
      console.log(`   等待确认...`);

      const receipt = await tx.wait();

      if (receipt) {
        totalGasUsed += receipt.gasUsed;
        const result: CallResult = {
          hash: tx.hash,
          success: true,
          gasEstimate: gasEstimate.toString(),
          actualGasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
          address: address,
          privateKey: privateKey.substring(0, 10) + "...",
        };

        console.log(`   ✅ 确认成功!`);
        console.log(`   区块号: ${result.blockNumber}`);

        results.push(result);
      }
    } catch (error: any) {
      const result: CallResult = {
        success: false,
        error: error.message,
        address: address,
        privateKey: privateKey.substring(0, 10) + "...",
      };

      console.log(`   ❌ 交易失败: ${error.message}`);
      results.push(result);
    }

    // 添加延迟避免nonce冲突
    if (i < privateKeys.length - 1) {
      console.log("等待3秒后处理下一个钱包...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return results;
}

function saveResults(results: Results) {
  const fileName = `results-${Date.now()}.json`;
  const filePath = path.join(process.cwd(), fileName);

  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`\n💾 结果已保存到: ${filePath}`);
}

async function displaySummary(results: Results) {
  console.log("\n📊 执行总结");
  console.log("=".repeat(40));
  console.log(`网络: ${results.chain}`);
  console.log(`合约地址: ${results.contractAddress}`);
  console.log(`钱包数量: ${results.callCount}`);
  console.log(
    `成功: ${results.results.filter((r) => r.success).length}/${results.results.length}`,
  );

  // 显示每个钱包的结果
  console.log("\n📋 钱包详情:");
  results.results.forEach((result, index) => {
    const status = result.success ? "✅ 成功" : "❌ 失败";
    console.log(`   ${index + 1}. ${result.address} - ${status}`);
    if (!result.success && result.error) {
      console.log(`      错误: ${result.error}`);
    }
  });

  const successfulTxs = results.results.filter((r) => r.success);
  if (successfulTxs.length > 0) {
    const totalGas = successfulTxs.reduce(
      (sum, r) => sum + BigInt(r.actualGasUsed || "0"),
      0n,
    );
    console.log(`\n总Gas消耗: ${totalGas.toString()}`);
  }
}

async function main() {
  try {
    await displayWelcome();

    const chain = await selectChain();
    const { contractAddress, inputData } = await getUserInput();

    console.log(`\n选择的网络: ${chain.name}`);
    console.log(`RPC URL: ${chain.rpcUrl}`);

    const provider = await createProvider(chain);

    // 读取私钥文件
    const privateKeys = await getPrivateKeys();

    // 直接执行交易，不再进行干运行
    const results = await executeTransactions(
      provider,
      privateKeys,
      contractAddress,
      inputData,
    );

    const resultsData: Results = {
      timestamp: new Date().toISOString(),
      chain: chain.name,
      contractAddress,
      inputData,
      callCount: privateKeys.length,
      results,
    };

    // await displaySummary(resultsData);
    saveResults(resultsData);

    console.log("\n✨ 程序执行完成!\n");
  } catch (error: any) {
    console.error("\n❌ 程序执行出错:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
