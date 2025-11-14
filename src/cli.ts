import inquirer from "inquirer";
import { SUPPORTED_CHAINS, ChainConfig } from "./config";
import { ethers } from "ethers";

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
        name: `${index + 1}.${chain.name} (Chain ID: ${chain.chainId})`,
        value: index,
      })),
    },
  ]);

  return SUPPORTED_CHAINS[chainIndex as number];
}

export async function getUserInput() {
  return await inquirer.prompt([
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
        const num = parseInt(input);
        return num >= 1 && num <= 10 ? true : "请输入1-10之间的数字";
      },
    },
  ]);
}
