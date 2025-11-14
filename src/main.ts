import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { displayWelcome, selectChain, getUserInput } from "./cli";
import { getPrivateKeys } from "./wallet";
import { executeTransactions } from "./transaction";

async function main() {
  await displayWelcome();
  const chain = await selectChain();
  const { contractAddress, concurrency, functionName, params } =
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

if (require.main === module) main();
