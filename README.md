# Batch Call Runner

一个用于批量调用智能合约的TypeScript工具，支持多条主网和测试网。

## 功能特性

- 🔗 支持多条主流区块链网络
- 📝 支持批量交易发送
- 👛 多钱包批量调用（从wallets.txt读取私钥）
- 🧪 Dry-run模式，预先估算Gas
- 💾 自动保存执行结果到JSON文件
- 🔒 安全的私钥输入处理
- 📊 详细的执行统计和日志
- 🎯 智能地址替换（自动提取inputData公共前缀，拼接对应钱包地址）

## 支持的网络

- Ethereum Mainnet
- Sepolia Testnet
- Polygon Mainnet
- BSC Mainnet
- Arbitrum Mainnet

## 安装和设置

### 1. 克隆仓库

```bash
git clone git@github.com:cssdao/batch-call-runner.git
cd batch-call-runner
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置钱包文件

创建 `wallets.txt` 文件，每行一个私钥：

```bash
# 复制示例文件
cp wallets.txt.example wallets.txt

# 编辑 wallets.txt 文件，添加您的私钥（每行一个）
```

**私钥格式要求：**
- 私钥必须是64位十六进制字符
- 可以有或没有 `0x` 前缀
- 每行一个私钥
- 空行和以 `#` 开头的行会被忽略

示例 `wallets.txt`：
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 4. 配置环境变量（可选）

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的RPC端点URL。如果不配置，将使用默认的公共RPC端点。

## 使用方法

### 启动程序

```bash
npm start
```

### 执行流程

1. **启动程序** - 显示欢迎信息
2. **选择网络** - 从支持的网络列表中选择
3. **输入参数**：
   - 合约地址
   - 交易数据 (inputData, 十六进制格式)
4. **选择模式**：
   - **Dry-run**: 仅预览交易，估算Gas消耗
   - **实际执行**: 发送真实交易到区块链
5. **批量执行**：
   - 程序自动从 `wallets.txt` 读取所有私钥
   - 为每个私钥生成对应的钱包地址
   - 智能提取inputData的公共前缀，拼接对应钱包地址
   - 依次为每个钱包发送交易
6. **执行结果**：
   - 显示详细执行日志
   - 保存结果到JSON文件

### 智能地址替换功能

本工具的核心特性是能够智能地处理需要替换地址的批量操作：

1. **地址提取**：自动提取inputData的公共前缀部分
2. **地址生成**：为每个私钥生成对应的钱包地址
3. **数据拼接**：将公共前缀与钱包地址拼接成完整的inputData
4. **批量执行**：为每个钱包使用对应的inputData进行交易

例如，如果原始inputData为：
```
0xa9059cbb000000000000000000000000placeholder_address_here000000000000000000000000000000000000000000000000000000000000000001
```

工具会自动提取前缀部分，并为每个钱包地址生成对应的完整inputData。

### 示例

#### Dry-run模式示例

```bash
# 启动程序
npm start

# 选择网络: Ethereum Mainnet
# 输入合约地址: 0x1234...abcd
# 输入inputData: 0xa9059cbb000000000000000000000000... (包含模板地址)
# 选择模式: Yes (dry-run)
# 程序自动读取 wallets.txt 中的所有私钥并预览
```

#### 实际执行示例

```bash
# 启动程序
npm start

# 选择网络: Sepolia Testnet
# 输入合约地址: 0x1234...abcd
# 输入inputData: 0xa9059cbb000000000000000000000000... (包含模板地址)
# 选择模式: No (实际执行)
# 程序使用 wallets.txt 中的所有私钥依次发送交易
```

## 输出文件格式

执行结果会自动保存到 `results-{timestamp}.json` 文件中：

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "chain": "Ethereum Mainnet",
  "contractAddress": "0x1234...abcd",
  "inputData": "0xa9059cbb...",
  "callCount": 3,
  "dryRun": false,
  "results": [
    {
      "hash": "0x...",
      "success": true,
      "gasEstimate": "50000",
      "actualGasUsed": "48765",
      "blockNumber": 18500000,
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9",
      "privateKey": "0x1234567890..."
    },
    {
      "hash": "0x...",
      "success": true,
      "gasEstimate": "50000",
      "actualGasUsed": "48912",
      "blockNumber": 18500001,
      "address": "0x8ba1f109551bD432803012645Hac136c82CbeA46",
      "privateKey": "0xabcdef1234..."
    },
    {
      "success": false,
      "error": "Insufficient funds for gas * price + value",
      "address": "0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed",
      "privateKey": "0x567890abcd..."
    }
  ]
}
```

## 安全注意事项

⚠️ **重要安全提醒**：

1. **测试先行**: 始终先在测试网（如Sepolia）上进行测试
2. **使用Dry-run**: 在主网执行前，务必使用dry-run模式验证交易
3. **私钥安全**:
   - 不要在公共计算机上使用
   - 确保私钥不会泄露
   - 建议使用专门的批处理钱包
   - wallets.txt 文件包含敏感信息，请妥善保管
   - 不要将 wallets.txt 文件提交到版本控制系统
   - 使用完成后建议删除或移动到安全位置
4. **Gas费用**: 批量交易会产生Gas费用，请确保账户余额充足
5. **合约交互**: 确保你了解与目标合约交互的后果

## 开发

### 构建项目

```bash
npm run build
```

### 开发模式

```bash
# 使用ts-node直接运行
npx ts-node src/index.ts
```

## 依赖项

- `ethers`: 以太坊库
- `inquirer`: 命令行交互
- `typescript`: TypeScript支持

## 许可证

ISC

## 贡献

欢迎提交Issue和Pull Request！

## 免责声明

本工具仅供学习和开发使用。用户需要自行承担使用本工具的风险，包括但不限于资金损失、交易失败等。开发者不对因使用本工具造成的任何损失承担责任。
