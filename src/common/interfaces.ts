export interface Employee {
  name: string;
  wallet_address: string;
  usdc_amount: number;
}

export interface PayrollData {
  employees: Employee[];
  totalAmount: number;
  uploadedAt: string;
  status: string;
}

export interface SessionKeyRules {
  address: string;
  privateKey: string;
  whitelist: string[];
  spendingLimit: number;
  totalSpent: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  revokedAt?: string;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  amount: number;
}

export interface PayrollRunResult {
  runId: string;
  timestamp: string;
  totalEmployees: number;
  successful: Array<{
    name: string;
    address: string;
    amount: number;
    txHash: string;
    status: 'success';
  }>;
  failed: Array<{
    name: string;
    address: string;
    amount: number;
    error: string;
    status: 'failed';
  }>;
  totalAmount: number;
  successAmount: number;
}

export interface ScheduleConfig {
  dayOfMonth: number;
  hour: number;
  minute: number;
  cronExpression: string;
  enabled: boolean;
  createdAt: string;
}
