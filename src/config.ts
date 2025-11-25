interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  symbol: string;
}

const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    name: "Ethereum Mainnet",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    explorerUrl: "https://etherscan.io",
    symbol: "ETH",
  },
  {
    name: "Base Mainnet",
    rpcUrl: "https://mainnet.base.org",
    chainId: 8453,
    explorerUrl: "https://basescan.org",
    symbol: "ETH",
  },
  {
    name: "Monad",
    rpcUrl: "https://rpc.monad.xyz",
    chainId: 143,
    explorerUrl: "https://monadvision.com",
    symbol: "MON",
  },
  {
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    chainId: 137,
    explorerUrl: "",
    symbol: "MATIC",
  },
  {
    name: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    chainId: 56,
    explorerUrl: "",
    symbol: "BNB",
  },
  {
    name: "Arbitrum Mainnet",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    explorerUrl: "",
    symbol: "ETH",
  },
  {
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    chainId: 11155111,
    explorerUrl: "",
    symbol: "ETH",
  },
];

export { SUPPORTED_CHAINS, ChainConfig };
