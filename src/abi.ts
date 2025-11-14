import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

/**
 * 选择函数并填写参数
 * 自动从 ABI.json 中读取 ABI
 * @param defaultAddress 用来自动填充 address 参数
 */
export async function selectFunctionAndParams(): Promise<{
  functionName: string;
  params: any[];
}> {
  const abi = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../ABI.json"), "utf8"),
  );

  const iface = new ethers.Interface(abi);

  // 获取所有 function 名称
  const functions = iface.fragments
    .filter((f) => f.type === "function")
    .map((f) => (f as ethers.FunctionFragment).name)
    .sort();

  if (functions.length === 0) {
    throw new Error("ABI 中未找到函数");
  }

  // 第一步：让用户选择函数
  const { functionName } = await inquirer.prompt([
    {
      type: "list",
      name: "functionName",
      message: "请选择要调用的函数:",
      choices: functions,
    },
  ]);

  const fragment = iface.getFunction(functionName);
  if (!fragment) {
    throw new Error(`函数 ${functionName} 未找到`);
  }
  const params: any[] = [];

  // 第二步：输入该函数的参数
  for (const input of fragment.inputs) {
    let value: any;

    switch (input.type) {
      case "address":
      case "address[]":
        continue;

      case "uint256":
      case "uint":
      case "int256":
      case "int":
        const { numberInput } = await inquirer.prompt([
          {
            type: "input",
            name: "numberInput",
            message: `请输入参数 ${input.name} (${input.type}):`,
            validate: (v) => (!isNaN(Number(v)) ? true : "请输入有效数字"),
          },
        ]);
        value = BigInt(numberInput);
        break;

      case "string":
        const { stringInput } = await inquirer.prompt([
          {
            type: "input",
            name: "stringInput",
            message: `请输入参数 ${input.name} (string):`,
          },
        ]);
        value = stringInput;
        break;

      case "bool":
        const { boolInput } = await inquirer.prompt([
          {
            type: "confirm",
            name: "boolInput",
            message: `请输入参数 ${input.name} (bool):`,
            default: false,
          },
        ]);
        value = boolInput;
        break;

      default:
        console.warn(`⚠️ 不支持类型: ${input.type}, 参数将被跳过`);
        continue;
    }

    params.push(value);
  }

  return { functionName, params };
}

/**
 * 自动生成 inputData（encodeFunctionData）
 * - address 会自动填到 address / address[] 类型参数
 * - 其他参数从 fixedArgs 中按顺序填充
 */
export function generateInputData(
  address: string,
  functionName: string,
  fixedArgs: any[] = [],
): string {
  const abi = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../ABI.json"), "utf8"),
  );

  const iface = new ethers.Interface(abi);
  const fragment = iface.getFunction(functionName);

  if (!fragment) {
    throw new Error(`函数未找到: ${functionName}`);
  }

  const args: any[] = [];
  let argIndex = 0;

  // 遍历函数的参数
  for (let i = 0; i < fragment.inputs.length; i++) {
    const input = fragment.inputs[i];

    switch (input.type) {
      case "address":
        args.push(address); // 自动填充 address
        break;

      case "address[]":
        args.push([address]); // 自动填充数组 address[]
        break;

      default:
        // 使用用户提供的 fixedArgs
        if (argIndex < fixedArgs.length) {
          args.push(fixedArgs[argIndex]);
          argIndex++;
        } else {
          throw new Error(
            `参数不足: ${input.name} (${input.type})，请提供 fixedArgs`,
          );
        }
        break;
    }
  }

  return iface.encodeFunctionData(functionName, args);
}

/**
 * 生成 inputData (保持向后兼容)
 * @param address 当前钱包地址，自动填充 address 参数
 */
export async function getInputDataFromABI(address: string): Promise<string> {
  const { functionName, params } = await selectFunctionAndParams();
  return generateInputData(address, functionName, params);
}
