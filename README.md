# Batch Call Runner

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Ethers.js](https://img.shields.io/badge/Ethers.js-3C3C3D?logo=ethereum&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

**智能合约批量调用工具** - 支持多链、多钱包、并发执行的高效批量交易工具

</div>

## ✨ 功能特性

- 🌐 **多链支持** - 支持 Ethereum、Base、Polygon、BSC、Arbitrum 等主流网络
- 🚀 **并发执行** - 支持 1-10 个并发，大幅提升批量操作效率
- 🔑 **智能地址填充** - 自动识别并填充合约函数中的 address 参数
- 📋 **ABI 驱动** - 通过 ABI.json 自动解析合约函数，无需手动构造交易数据
- 🔍 **交易数据模式** - 支持解析成功的交易 input data，无需 ABI 也能批量执行
- 👛 **多钱包管理** - 从 wallets.txt 批量读取私钥，支持大规模操作
- 💾 **结果持久化** - 自动保存执行结果到带时间戳的 JSON 文件
- 🛡️ **安全验证** - 完整的余额检查、Gas 估算、私钥格式验证
- 🎯 **实时监控** - 详细的执行日志，包含交易哈希、Gas 使用量、区块号等

## 🌍 支持的网络

| 网络 | Chain ID | RPC 端点 | 浏览器 |
|------|----------|----------|--------|
| Ethereum Mainnet | 1 | publicnode.com | etherscan.io |
| Base Mainnet | 8453 | mainnet.base.org | basescan.org |
| Monad Mainnet | 143 | rpc.monad.xyz | monadvision.com |
| Polygon Mainnet | 137 | polygon-rpc.com | polygonscan.com |
| BSC Mainnet | 56 | bsc-dataseed1.binance.org | bscscan.com |
| Arbitrum Mainnet | 42161 | arb1.arbitrum.io/rpc | arbiscan.io |

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm 或 yarn
- 基本的智能合约交互知识

### 1. 安装项目

```bash
# 克隆仓库
git clone https://github.com/cssdao/batch-call-runner.git
cd batch-call-runner

# 安装依赖
npm install
```

### 2. 配置钱包

创建 `wallets.txt` 文件：

```bash
# 示例 wallets.txt
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
5678901234567890567890123456789056789012345678905678901234567890
```

**私钥格式要求：**
- 必须是64位十六进制字符
- 支持有无 `0x` 前缀
- 每行一个私钥
- 空行自动过滤

### 3. 配置合约 ABI

确保 `ABI.json` 文件存在，包含目标合约的 ABI 定义：

```json
[
  {
    "name": "pledge",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "name": "has_pledged",
    "inputs": [{"name": "who", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### 4. 运行工具

```bash
# 启动主程序
npm start

# 生成地址列表
npm run address

# 生成地址列表（包含余额）
npm run address-balance
```

## 📖 使用指南

### 主要工作流程

1. **选择网络** - 从支持的网络列表中选择目标链
2. **输入合约地址** - 提供目标智能合约地址
3. **设置并发数** - 选择 1-10 个并发执行线程
4. **选择输入方式** - ABI 文件模式或交易数据模式
5. **填写参数或输入交易数据** - 根据选择的模式进行相应操作
6. **批量执行** - 工具自动处理所有钱包并发送交易
7. **查看结果** - 控制台显示执行进度和结果

### 🔍 交易数据模式（无 ABI 时使用）

当合约未验证或没有 ABI 时，可以使用成功的交易数据进行批量操作：

1. **获取交易数据** - 从 Etherscan 等浏览器复制成功交易的 Input Data
2. **选择输入方式** - 在工具中选择"使用交易数据"选项
3. **输入交易数据** - 粘贴复制的 Input Data
4. **确认解析结果** - 工具会自动识别地址参数并显示解析结果
5. **批量执行** - 工具为每个钱包自动替换地址参数

**示例 Input Data:**
```
0x40c10f19000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000001
```

工具会自动识别为 `mint(address,uint256)` 函数，并为每个钱包替换第一个地址参数。

详细使用说明请参考：[TRANSACTION_DATA_USAGE.md](./TRANSACTION_DATA_USAGE.md)

### 智能地址填充机制

工具会自动识别合约函数中的 `address` 和 `address[]` 类型参数：

```solidity
// 合约函数示例
function pledge(address user, uint256 amount) public;
function batchTransfer(address[] recipients, uint256 amount) public;
```

- `address` 类型：自动填充当前钱包地址
- `address[]` 类型：自动填充包含当前钱包地址的数组
- 其他类型：通过交互式界面输入

### 地址生成工具

```bash
# 基础地址生成
npm run address

# 包含余额查询的地址生成
npm run address-balance
```

输出示例：
```
0x822b52eCD838C1072cb7Fa14Ded7e407f0A99b8e
0xC73cE72b70566Ef7Ff940542AF6cc8e453bdfC70
0xbd0cF90D06237cd28072AAFdFeDCE647527F4E10
```

或带余额格式：
```
0x822b52eCD838C1072cb7Fa14Ded7e407f0A99b8e-1.234567
0xC73cE72b70566Ef7Ff940542AF6cc8e453bdfC70-0.987654
```

## 📊 输出格式

执行结果自动保存为 `results-{timestamp}.json`：

```json
{
  "timestamp": "2025-11-14T09:59:40.452Z",
  "chain": "Ethereum Mainnet",
  "results": [
    {
      "hash": "0xe158c53e902e33caa6bc4fef832336b6035e13ad2fedfeae7930092207865776",
      "success": true,
      "actualGasUsed": "49839",
      "address": "0x822b52eCD838C1072cb7Fa14Ded7e407f0A99b8e"
    },
    {
      "success": false,
      "error": "Insufficient balance. Need 0.001 more ETH for gas fees",
      "address": "0x75864aA990C6292B39E68080De4B81c633568Ab1"
    }
  ]
}
```

## 🛡️ 安全特性

### 余额验证
- 自动检查每个钱包的 ETH 余额
- 预估 Gas 费用（包含 20% 缓冲）
- 余额不足时跳过执行并记录错误

### Gas 优化
- 自动 Gas 价格估算
- 智能Gas限制设置（预估 + 20% 缓冲）
- 失败重试机制

### 私钥保护
- 本地文件读取，不上传云端
- 严格的私钥格式验证
- 内存中安全处理

## ⚙️ 配置选项

### 网络配置
网络配置存储在 `src/config.ts` 中，支持自定义：
- RPC 端点
- Chain ID
- 区块链浏览器 URL

### 并发控制
- 支持 1-10 个并发线程
- 自动节流（500ms 延迟）
- 防止 RPC 限制

## 🔧 开发指南

### 项目结构
```
batch-call-runner/
├── src/
│   ├── main.ts          # 主程序入口
│   ├── cli.ts           # 命令行交互界面
│   ├── config.ts        # 网络配置
│   ├── wallet.ts        # 钱包管理
│   ├── transaction.ts   # 交易执行
│   ├── abi.ts           # ABI 处理
│   ├── addresses.ts     # 地址生成工具
│   └── types.ts         # 类型定义
├── ABI.json             # 合约 ABI 定义
├── wallets.txt          # 私钥列表
└── package.json         # 项目配置
```

### 核心技术栈
- **ethers.js v6** - 以太坊交互库
- **inquirer** - 交互式命令行界面
- **TypeScript** - 类型安全的开发体验
- **ts-node** - 直接运行 TypeScript 代码

### 执行流程图
```
启动程序 → 选择网络 → 输入合约地址 → 选择并发数
    ↓
解析 ABI → 选择函数 → 输入参数 → 验证私钥
    ↓
并发执行 → 实时监控 → 结果保存 → 完成报告
```

## ⚠️ 安全注意事项

### 🚨 重要提醒

1. **测试先行**
   - ✅ 必须先在测试网充分测试
   - ✅ 验证合约地址和 ABI 的正确性
   - ✅ 确认交易逻辑符合预期

2. **资金安全**
   - 💰 使用专门的批处理钱包，避免使用主钱包
   - 💰 确保每个钱包有足够的 ETH 余额
   - 💰 了解目标合约的功能和风险
   - 💰 建议从少量钱包开始测试

3. **私钥保护**
   - 🔒 `wallets.txt` 包含敏感信息，妥善保管
   - 🔒 不要提交到版本控制系统
   - 🔒 使用后及时删除或移动到安全位置
   - 🔒 定期轮换批处理钱包

4. **网络风险**
   - 🌐 注意 RPC 稳定性和限制
   - 🌐 监控网络拥堵情况
   - 🌐 考虑使用私有 RPC 端点

## 📋 故障排除

### 常见问题

<details>
<summary><strong>Q: 私钥格式错误</strong></summary>

A: 确保私钥为64位十六进制字符，支持有无 0x 前缀：
```
✅ 正确: 0x1234567890abcdef...
✅ 正确: 1234567890abcdef...
❌ 错误: 0x123 (长度不足)
```
</details>

<details>
<summary><strong>Q: 余额不足错误</strong></summary>

A: 检查钱包余额是否足够支付 Gas 费用，可以使用 `npm run address-balance` 查询所有钱包余额。
</details>

<details>
<summary><strong>Q: 合约函数未找到</strong></summary>

A: 确保 ABI.json 文件包含目标合约的完整 ABI，且函数名称完全匹配。
</details>

<details>
<summary><strong>Q: 并发执行失败</strong></summary>

A: 降低并发数，或检查 RPC 端点的稳定性。建议从并发数 1 开始测试。
</details>

## 📝 更新日志

### v1.0.0
- ✨ 支持多链批量交易
- ✨ 智能地址填充机制
- ✨ 并发执行控制
- ✨ 实时余额检查
- ✨ 结果持久化存储

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [ISC 许可证](LICENSE)。

## ⚠️ 免责声明

<div align="center" style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">

**重要声明**

本工具仅供学习和开发使用。使用者需要：

- 🔄 自行承担使用风险
- 💰 负责资金安全管理
- 🔍 了解智能合约交互后果
- ⚖️ 遵守相关法律法规

开发者不对因使用本工具造成的任何损失承担责任。

</div>

---

<div align="center">

**如果这个项目对您有帮助，请考虑给一个 ⭐**

Made with ❤️ by [CSS DAO](https://github.com/cssdao)

</div>
