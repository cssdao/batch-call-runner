interface CallResult {
  hash?: string;
  success: boolean;
  error?: string;
  gasEstimate?: string;
  actualGasUsed?: string;
  blockNumber?: number;
  address?: string;
  privateKey?: string;
}

interface Results {
  timestamp: string;
  chain: string;
  contractAddress: string;
  inputData: string;
  callCount: number;
  concurrency: number;
  results: CallResult[];
}

export { CallResult, Results };
