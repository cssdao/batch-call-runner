import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// 检查是否包含 --balance 参数
const includeBalance = process.argv.includes("--balance");

// 创建 provider 连接到以太坊网络 (使用主网)
const provider = new ethers.JsonRpcProvider(
  "https://ethereum-rpc.publicnode.com",
);

/**
 * 获取地址的ETH余额
 */
async function getAddressBalance(address: string): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    // 将 wei 转换为 ETH
    const ethBalance = ethers.formatEther(balance);
    return parseFloat(ethBalance).toFixed(6);
  } catch (error) {
    console.error(`获取地址 ${address} 余额失败:`, error);
    return "0.000000";
  }
}

/**
 * 从 wallets.txt 读取私钥并生成对应的地址
 * 将生成的地址写入到 address.txt 文件中
 * 如果包含 --balance 参数，则生成地址-金额格式
 */
async function generateAddresses(): Promise<void> {
  try {
    // 读取私钥文件
    const walletsPath = path.join(__dirname, "../wallets.txt");
    if (!fs.existsSync(walletsPath)) {
      throw new Error("wallets.txt 文件不存在");
    }

    console.log("正在读取私钥文件...");

    // 读取并处理私钥
    const privateKeys = fs
      .readFileSync(walletsPath, "utf8")
      .split("\n")
      .map((key) => key.trim())
      .filter(Boolean) // 过滤空行
      .map((key) => (key.startsWith("0x") ? key : `0x${key}`)); // 添加 0x 前缀

    console.log(`找到 ${privateKeys.length} 个私钥`);

    // 验证私钥格式
    const validKeys: string[] = [];
    for (const key of privateKeys) {
      if (/^0x[0-9a-fA-F]{64}$/.test(key)) {
        validKeys.push(key);
      } else {
        console.warn(`跳过无效私钥: ${key.slice(0, 10)}...`);
      }
    }

    if (validKeys.length === 0) {
      throw new Error("没有找到有效的私钥");
    }

    console.log(`验证通过 ${validKeys.length} 个私钥`);

    // 生成地址
    console.log("正在生成地址...");
    const addresses: string[] = [];

    for (let i = 0; i < validKeys.length; i++) {
      try {
        const wallet = new ethers.Wallet(validKeys[i]);

        if (includeBalance) {
          // 获取地址余额
          const balance = await getAddressBalance(wallet.address);
          const addressWithBalance = `${wallet.address}-${balance}`;
          addresses.push(addressWithBalance);
        } else {
          addresses.push(wallet.address);
        }

        // 显示进度
        if ((i + 1) % 10 === 0 || i === validKeys.length - 1) {
          console.log(`已生成 ${i + 1}/${validKeys.length} 个地址`);
        }
      } catch (error) {
        console.error(`生成地址失败 (私钥 ${i + 1}):`, error);
      }
    }

    // 写入地址文件
    const addressPath = path.join(process.cwd(), "address.txt");
    const addressContent = addresses.join("\n") + "\n";

    fs.writeFileSync(addressPath, addressContent, "utf8");

    console.log("✅ 地址生成完成！");
    console.log(`📄 已生成 ${addresses.length} 个地址，保存到: address.txt`);
  } catch (error) {
    console.error("❌ 生成地址时发生错误:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
generateAddresses()
  .then(() => {
    console.log("\n🎉 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
