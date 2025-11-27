import inquirer from "inquirer";
import { ethers } from "ethers";
import { SUPPORTED_CHAINS, ChainConfig } from "./config";
import { selectFunctionAndParams } from "./abi";
import {
  getTransactionInputData,
  parseAndReplaceAddress,
  confirmParsedData,
} from "./input-data-parser";

export async function displayWelcome() {
  console.log("\n🚀 批量合约调用工具");
  console.log("=".repeat(40));
  console.log("作者: CSS DAO");
  console.log("版本: 1.0.0");
  console.log("=".repeat(40) + "\n");
}

export async function selectChain(): Promise<ChainConfig> {
  const { chainIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "chainIndex",
      message: "请选择网络:",
      choices: SUPPORTED_CHAINS.map((chain, index) => ({
        name: `${index + 1}. ${chain.name} (Chain ID: ${chain.chainId})`,
        value: index,
      })),
    },
  ]);

  return SUPPORTED_CHAINS[chainIndex as number];
}

async function selectInputMethod(): Promise<"abi" | "transaction"> {
  const { method } = await inquirer.prompt([
    {
      type: "list",
      name: "method",
      message: "请选择输入方式:",
      choices: [
        {
          name: "📋 使用 ABI 文件 (推荐)",
          value: "abi",
        },
        {
          name: "🔍 使用交易数据 (无 ABI 时使用)",
          value: "transaction",
        },
      ],
    },
  ]);

  return method;
}

export async function getUserInput() {
  // 选择输入方式
  const inputMethod = await selectInputMethod();

  const basic = await inquirer.prompt([
    {
      type: "input",
      name: "contractAddress",
      message: "请输入合约地址:",
      validate: (input: string) =>
        ethers.isAddress(input) ? true : "请输入有效以太坊地址",
    },
    {
      type: "input",
      name: "concurrency",
      message: "请输入并发执行数量 (1-10):",
      default: "1",
      validate: (input: string) => {
        const n = parseInt(input);
        return n >= 1 && n <= 10 ? true : "请输入 1-10 之间的数字";
      },
    },
    {
      type: "input",
      name: "executionCount",
      message: "请输入每个地址的执行次数 (默认1次):",
      default: "1",
      validate: (input: string) => {
        const n = parseInt(input);
        return n >= 1 ? true : "请输入大于0的数字";
      },
    },
  ]);

  // 只有当执行次数大于1时，才询问间隔配置
  let delayConfig = { minDelay: "0", maxDelay: "0" };
  if (parseInt(basic.executionCount) > 1) {
    const delayInput = await inquirer.prompt([
      {
        type: "input",
        name: "minDelay",
        message: "请输入交易间隔最小时间(秒) (默认1秒):",
        default: "1",
        validate: (input: string) => {
          const n = parseInt(input);
          return n >= 0 ? true : "请输入大于等于0的数字";
        },
      },
      {
        type: "input",
        name: "maxDelay",
        message: "请输入交易间隔最大时间(秒) (默认5秒):",
        default: "5",
        validate: (input: string) => {
          const n = parseInt(input);
          return n >= 0 ? true : "请输入大于等于0的数字";
        },
      },
    ]);

    // 验证最大延迟不小于最小延迟
    if (parseInt(delayInput.maxDelay) < parseInt(delayInput.minDelay)) {
      throw new Error("最大延迟时间不能小于最小延迟时间");
    }

    delayConfig = delayInput;
  }

  const valueInput = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message: "请输入要发送的代币数量 (例如 1 代表 1 个代币, 0 代表不发送):",
      default: "0",
      validate: (input: string) => {
        try {
          ethers.parseEther(input);
          return true;
        } catch {
          return "请输入有效的数字";
        }
      },
    },
  ]);

  // 根据选择的输入方式获取函数信息
  let functionName: string;
  let params: any[];
  let transactionData: string | undefined;

  if (inputMethod === "abi") {
    // 使用 ABI 文件
    const fnInfo = await selectFunctionAndParams();
    functionName = fnInfo.functionName;
    params = fnInfo.params;
  } else {
    // 使用交易数据
    const originalInputData = await getTransactionInputData();

    // 为了测试解析，我们使用一个示例地址
    const sampleAddress = "0x1234567890123456789012345678901234567890";
    const parsedInputData = parseAndReplaceAddress(
      originalInputData,
      sampleAddress,
    );

    // 显示解析结果并确认
    const confirmed = await confirmParsedData(parsedInputData);

    if (!confirmed) {
      throw new Error("用户取消了操作");
    }

    functionName = "parsed_function"; // 临时函数名
    params = []; // 参数已经编码在 transactionData 中
    transactionData = originalInputData;
  }

  return {
    ...basic,
    ...delayConfig,
    functionName,
    params,
    value: valueInput.value,
    inputMethod,
    transactionData,
  };
}
