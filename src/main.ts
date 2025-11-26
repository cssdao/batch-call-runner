import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { displayWelcome, selectChain, getUserInput } from "./cli";
import { getPrivateKeys } from "./wallet";
import { executeTransactions } from "./transaction";

async function main() {
  await displayWelcome();
  const chain = await selectChain();
  const { contractAddress, concurrency, executionCount, minDelay, maxDelay, functionName, params, value } =
    await getUserInput();
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const privateKeys = await getPrivateKeys();

  const results = await executeTransactions(
    provider,
    privateKeys,
    contractAddress,
    functionName,
    params,
    chain.chainId,
    parseInt(concurrency),
    value,
    parseInt(executionCount),
    parseInt(minDelay) * 1000, // 转换为毫秒
    parseInt(maxDelay) * 1000, // 转换为毫秒
  );

  const filePath = path.join(process.cwd(), `results-${Date.now()}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      { timestamp: new Date(), chain: chain.name, results },
      null,
      2,
    ),
  );
  console.log(`结果已保存到: ${filePath}`);
}

if (require.main === module) {
  main().catch((error) => {
    if (error.name === 'ExitPromptError') {
      console.log('\n\n👋 操作已取消');
      process.exit(0);
    } else {
      console.error('\n❌ 发生错误:', error.message);
      process.exit(1);
    }
  });
}
