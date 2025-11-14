import fs from "fs";
import path from "path";
import { ethers } from "ethers";

export async function getPrivateKeys(): Promise<string[]> {
  const walletsPath = path.join(process.cwd(), "wallets.txt");
  if (!fs.existsSync(walletsPath)) throw new Error("wallets.txt 不存在");

  const keys = fs
    .readFileSync(walletsPath, "utf8")
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => (k.startsWith("0x") ? k : `0x${k}`));

  keys.forEach((key) => {
    if (!/^0x[0-9a-fA-F]{64}$/.test(key))
      throw new Error(`无效私钥: ${key.slice(0, 10)}...`);
  });

  console.log(`读取 ${keys.length} 个私钥`);
  return keys;
}
