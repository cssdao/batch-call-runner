interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
}

const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    name: "Ethereum Mainnet",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    explorerUrl: "https://etherscan.io",
  },
  {
    name: "Base Mainnet",
    rpcUrl: "https://mainnet.base.org",
    chainId: 8453,
    explorerUrl: "https://basescan.org",
  },
  {
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    chainId: 137,
    explorerUrl: "",
  },
  {
    name: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    chainId: 56,
    explorerUrl: "",
  },
  {
    name: "Arbitrum Mainnet",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    explorerUrl: "",
  },
  {
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    chainId: 11155111,
    explorerUrl: "",
  },
];

export { SUPPORTED_CHAINS, ChainConfig };
