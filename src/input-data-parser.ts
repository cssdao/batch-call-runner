import inquirer from "inquirer";

/**
 * 解析交易 input data，自动替换地址参数
 * @param inputData 原始交易 input data (0x...)
 * @param newAddress 要替换的新地址
 * @returns 替换后的 input data
 */
export function parseAndReplaceAddress(
  inputData: string,
  newAddress: string,
  isLog = true,
): string {
  // 移除 0x 前缀
  const cleanHex = inputData.replace("0x", "");

  // 函数签名是前4个字节（8个十六进制字符）
  const functionSignature = cleanHex.slice(0, 8);
  const argumentsHex = cleanHex.slice(8);

  isLog && console.log(`🔍 函数签名: 0x${functionSignature}`);

  // 分割参数（每个参数32字节，64个十六进制字符）
  const paramChunks: string[] = [];
  for (let i = 0; i < argumentsHex.length; i += 64) {
    paramChunks.push(argumentsHex.slice(i, i + 64));
  }

  isLog && console.log(`📋 检测到 ${paramChunks.length} 个参数`);

  // 解析每个参数，识别并替换地址
  const newParamChunks = paramChunks.map((chunk, index) => {
    const isAddress = isAddressParameter(chunk);

    if (isAddress) {
      isLog &&
        console.log(`  参数 ${index + 1}: 检测到地址类型，将替换为新地址`);
      return replaceAddressInChunk(chunk, newAddress);
    } else {
      const paramType = guessParameterType(chunk);
      isLog && console.log(`  参数 ${index + 1}: ${paramType}`);
      return chunk;
    }
  });

  // 重新组合 input data
  const newArgumentsHex = newParamChunks.join("");
  const newInputData = `0x${functionSignature}${newArgumentsHex}`;
  return newInputData;
}

/**
 * 检查一个32字节的参数块是否包含地址
 */
function isAddressParameter(chunk: string): boolean {
  // 地址是20字节，在32字节参数中，通常存储在后20字节
  // 前12字节应该是0填充

  if (chunk.length !== 64) return false;

  // 检查前12字节是否全为0（24个十六进制字符）
  const prefix = chunk.slice(0, 24);
  const isAllZeros = prefix.split("").every((char) => char === "0");

  // 检查后20字节是否不全是0（40个十六进制字符）
  const addressPart = chunk.slice(24);
  const isAllZerosAddress = addressPart.split("").every((char) => char === "0");

  return isAllZeros && !isAllZerosAddress;
}

/**
 * 替换参数块中的地址部分
 */
function replaceAddressInChunk(chunk: string, newAddress: string): string {
  // 移除地址的 0x 前缀
  const cleanAddress = newAddress.replace("0x", "");

  // 确保地址是40个十六进制字符
  if (cleanAddress.length !== 40) {
    throw new Error(`无效的地址格式: ${newAddress}`);
  }

  // 前12字节保持为0，后20字节替换为新地址
  const prefix = "0".repeat(24);
  return prefix + cleanAddress;
}

/**
 * 猜测参数类型（用于显示）
 */
function guessParameterType(chunk: string): string {
  if (chunk.length !== 64) return "unknown";

  // 检查是否是地址
  if (isAddressParameter(chunk)) {
    return "address";
  }

  // 检查是否是0
  if (chunk === "0".repeat(64)) {
    return "uint256 (0)";
  }

  // 检查是否是较小的数字（前16字节有大量0）
  const firstHalf = chunk.slice(0, 32);
  const zeroCount = firstHalf.split("").filter((char) => char === "0").length;

  if (zeroCount > 20) {
    try {
      const value = BigInt("0x" + chunk);
      return `uint256 (${value.toString()})`;
    } catch {
      return "uint256 (large)";
    }
  }

  return "bytes32";
}

/**
 * 从用户获取交易数据并解析
 */
export async function getTransactionInputData(): Promise<string> {
  console.log("\n📝 请提供成功的交易数据:");

  const { inputData } = await inquirer.prompt([
    {
      type: "input",
      name: "inputData",
      message: "请输入交易 input data (0x...):",
      validate: (input: string) => {
        const cleanInput = input.trim();
        if (!cleanInput.startsWith("0x")) {
          return "Input data 必须以 0x 开头";
        }
        if (cleanInput.length < 10) {
          // 至少要有函数签名
          return "Input data 长度不足";
        }
        // 检查是否是有效的十六进制
        const hexPart = cleanInput.slice(2);
        if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
          return "Input data 包含无效的十六进制字符";
        }
        return true;
      },
    },
  ]);

  return inputData.trim();
}

/**
 * 显示解析结果给用户确认
 */
export async function confirmParsedData(
  newInputData: string,
): Promise<boolean> {
  console.log(`\n📊 数据解析结果: ${newInputData}`);

  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: "确认使用解析后的数据进行批量交易?",
      default: true,
    },
  ]);

  return confirmed;
}
