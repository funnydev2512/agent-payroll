const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message || err.error || 'Request failed');
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  wallet: string;
}

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

export interface UploadResult {
  success: boolean;
  data: { employeeCount: number; totalAmount: number; employees: Employee[] };
}

export interface SessionStatus {
  exists: boolean;
  address?: string;
  status?: 'active' | 'revoked' | 'expired';
  isExpired?: boolean;
  createdAt?: string;
  expiresAt?: string;
  spendingLimit?: number;
  totalSpent?: number;
  remaining?: number;
  whitelistCount?: number;
  message?: string;
}

export interface BalanceResponse {
  address: string;
  balance: string;
  token: string;
  network: string;
}

export interface CreateSessionResult {
  success: boolean;
  sessionKey: { address: string; expiresAt: string; whitelist: string[]; spendingLimit: number };
  instructions: { privateKey: string; step1: string; step2: string; step3: string };
}

export interface TxResult {
  name: string;
  address: string;
  amount: number;
  txHash: string;
  status: 'success';
}

export interface TxFailed {
  name: string;
  address: string;
  amount: number;
  error: string;
  status: 'failed';
}

export interface PayrollRun {
  runId: string;
  timestamp: string;
  totalEmployees: number;
  successful: TxResult[];
  failed: TxFailed[];
  totalAmount: number;
  successAmount: number;
}

export interface HistoryResponse {
  success: boolean;
  count: number;
  history: PayrollRun[];
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
  health: () => request<HealthResponse>('/health'),

  uploadCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UploadResult>('/payroll/upload', { method: 'POST', body: fd });
  },

  getCurrentPayroll: () => request<PayrollData>('/payroll/current'),

  runPayroll: () => request<{ success: boolean; results: PayrollRun }>('/payroll/run', { method: 'POST' }),

  getSessionStatus: () => request<SessionStatus>('/session/status'),

  createSession: () => request<CreateSessionResult>('/session/create', { method: 'POST' }),

  revokeSession: () => request<{ success: boolean; message: string }>('/session/revoke', { method: 'POST' }),

  getBalance: () => request<BalanceResponse>('/session/balance'),

  getHistory: () => request<HistoryResponse>('/history'),
};
