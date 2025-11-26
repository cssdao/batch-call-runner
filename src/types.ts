interface CallResult {
  hash?: string;
  success: boolean;
  error?: string;
  gasEstimate?: string;
  actualGasUsed?: string;
  blockNumber?: number;
  address?: string;
  privateKey?: string;
  executionIndex?: number;  // 当前执行的次数（第几次）
  totalExecutions?: number; // 总执行次数
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
