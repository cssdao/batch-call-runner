import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

/**
 * 生成 inputData
 * @param address 当前钱包地址，自动填充 address 参数
 */
export async function getInputDataFromABI(address: string): Promise<string> {
  const abi = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../ABI.json"), "utf8"),
  );

  const iface = new ethers.Interface(abi);

  // 获取可调用函数列表
  const functions = iface.fragments
    .filter((f) => f.type === "function")
    .map((f) => (f as ethers.FunctionFragment).name)
    .sort();

  if (functions.length === 0) throw new Error("ABI 中未找到函数");

  // 让用户选择要调用的函数
  const { functionName } = await inquirer.prompt([
    {
      type: "list",
      name: "functionName",
      message: "请选择要调用的函数:",
      choices: functions,
    },
  ]);

  const fragment = iface.getFunction(functionName);
  if (!fragment) throw new Error(`函数未找到: ${functionName}`);

  const args: any[] = [];

  // 遍历函数参数
  for (let i = 0; i < fragment.inputs.length; i++) {
    const input = fragment.inputs[i];
    let value: any;

    switch (input.type) {
      case "address":
        value = address; // 自动使用传入的 address
        break;

      case "address[]":
        value = [address]; // 自动填充数组
        break;

      case "uint256":
      case "uint":
      case "int256":
      case "int":
        const { numberValue } = await inquirer.prompt([
          {
            type: "input",
            name: "numberValue",
            message: `请输入参数 ${input.name || ""} (${input.type})`,
            validate: (v) => (!isNaN(Number(v)) ? true : "请输入有效数字"),
          },
        ]);
        value = BigInt(numberValue);
        break;

      case "string":
        const { stringValue } = await inquirer.prompt([
          {
            type: "input",
            name: "stringValue",
            message: `请输入参数 ${input.name || ""} (string)`,
          },
        ]);
        value = stringValue;
        break;

      case "bool":
        const { boolValue } = await inquirer.prompt([
          {
            type: "confirm",
            name: "boolValue",
            message: `请输入参数 ${input.name || ""} (bool)`,
            default: false,
          },
        ]);
        value = boolValue;
        break;

      default:
        console.warn(`⚠️ 不支持参数类型: ${input.type}, 跳过`);
        continue;
    }

    args.push(value);
  }

  return iface.encodeFunctionData(functionName, args);
}
