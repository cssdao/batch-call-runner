interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
}

const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    name: "Ethereum Mainnet",
    rpcUrl:
      process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
    chainId: 1,
  },
  {
    name: "Base Mainnet",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    chainId: 8453,
  },
  {
    name: "Polygon Mainnet",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    chainId: 137,
  },
  {
    name: "BSC Mainnet",
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
    chainId: 56,
  },
  {
    name: "Arbitrum Mainnet",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
  },
  {
    name: "Sepolia Testnet",
    rpcUrl:
      process.env.SEPOLIA_RPC_URL ||
      "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    chainId: 11155111,
  },
];

export { SUPPORTED_CHAINS, ChainConfig };
