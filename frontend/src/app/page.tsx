'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, Employee, SessionStatus, PayrollRun, BalanceResponse } from '@/lib/api';
import SessionKeyCard from '@/components/SessionKeyCard';
import CsvUploadCard from '@/components/CsvUploadCard';
import RunPayrollCard from '@/components/RunPayrollCard';
import HistoryTable from '@/components/HistoryTable';

export default function Dashboard() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [history, setHistory] = useState<PayrollRun[]>([]);
  const [walletAddr, setWalletAddr] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [health, sess, hist] = await Promise.allSettled([
        api.health(),
        api.getSessionStatus(),
        api.getHistory(),
      ]);

      if (health.status === 'fulfilled') setWalletAddr(health.value.wallet);
      if (sess.status === 'fulfilled') setSession(sess.value);
      if (hist.status === 'fulfilled') setHistory(hist.value.history);
    } catch (_) { /* swallow */ }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      const b = await api.getBalance();
      setBalance(b);
    } catch (_) {
      setBalance(null);
    }
  }, []);

  const fetchCurrentPayroll = useCallback(async () => {
    try {
      const p = await api.getCurrentPayroll();
      setEmployees(p.employees);
      setTotalAmount(p.totalAmount);
    } catch (_) {
      // no payroll yet
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAll(), fetchBalance(), fetchCurrentPayroll()]);
      setLoading(false);
    };
    init();

    // poll balance every 20s
    const balanceTimer = setInterval(fetchBalance, 20_000);
    return () => clearInterval(balanceTimer);
  }, [fetchAll, fetchBalance, fetchCurrentPayroll]);

  const handleUploaded = (emps: Employee[], total: number) => {
    setEmployees(emps);
    setTotalAmount(total);
  };

  const handleSessionCreated = () => {
    fetchAll();
    fetchBalance();
  };

  const handleRevoke = () => {
    setSession(null);
    fetchAll();
  };

  const handleRunComplete = (run: PayrollRun) => {
    setHistory(prev => [run, ...prev]);
    fetchBalance();
    fetchAll();
  };

  const sessionActive = session?.exists && session.status === 'active' && !session.isExpired;
  const canRun = Boolean(sessionActive && employees && employees.length > 0);
  const walletInitialized = walletAddr !== 'not initialized' && walletAddr !== '';

  const balanceNum = parseFloat(balance?.balance ?? '0');
  const balanceSufficient = balanceNum >= (totalAmount ?? 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#21262d] bg-[#080b12]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍳</span>
            <span className="font-bold text-white text-lg tracking-tight">paychef</span>
            <span className="badge-blue text-[10px]">BETA</span>
          </div>

          {/* center: network */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Base Sepolia</span>
          </div>

          {/* right: wallet + balance */}
          <div className="flex items-center gap-3">
            {walletInitialized ? (
              <>
                {balance && (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                    <CoinIcon />
                    <span className="text-sm font-semibold text-emerald-400">
                      {parseFloat(balance.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-lg bg-[#161b22] border border-[#21262d] px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="mono text-xs text-gray-300">
                    {walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}
                  </span>
                </div>
              </>
            ) : (
              <span className="badge-yellow">Wallet not initialized</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Stat bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Agent Balance"
            value={balance ? `${parseFloat(balance.balance).toFixed(2)} USDC` : '—'}
            sub={!balanceSufficient && totalAmount ? `Need ${(totalAmount - balanceNum).toFixed(0)} more` : 'Sufficient'}
            color={balanceSufficient ? 'green' : 'yellow'}
            loading={loading}
          />
          <StatCard
            label="Session Key"
            value={sessionActive ? 'Active' : (session?.exists ? session.status ?? 'None' : 'None')}
            sub={sessionActive ? `${session?.remaining} USDC left` : 'Create one first'}
            color={sessionActive ? 'green' : 'yellow'}
            loading={loading}
          />
          <StatCard
            label="Employees"
            value={employees ? String(employees.length) : '—'}
            sub={totalAmount ? `${totalAmount.toLocaleString()} USDC total` : 'Upload CSV'}
            color="blue"
            loading={loading}
          />
          <StatCard
            label="Total Runs"
            value={String(history.length)}
            sub={history.length > 0 ? `Last: ${formatTimeAgo(history[0].timestamp)}` : 'No runs yet'}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Insufficient balance warning */}
        {!balanceSufficient && totalAmount && totalAmount > 0 && walletInitialized && (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-5 py-4 flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-400">Insufficient USDC balance</p>
              <p className="text-xs text-yellow-300/70 mt-0.5">
                Need <strong>{totalAmount.toLocaleString()} USDC</strong> — current balance is{' '}
                <strong>{balanceNum.toFixed(2)} USDC</strong>.
                Get testnet USDC at{' '}
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-yellow-300">faucet.circle.com</a>
              </p>
            </div>
          </div>
        )}

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* col 1: session key */}
          <div>
            <SessionKeyCard
              session={session}
              onRevoke={handleRevoke}
              onCreated={handleSessionCreated}
              hasPayroll={Boolean(employees && employees.length > 0)}
            />
          </div>

          {/* col 2: CSV upload */}
          <div>
            <CsvUploadCard
              onUploaded={handleUploaded}
              currentEmployees={employees}
              currentTotal={totalAmount}
            />
          </div>

          {/* col 3: run payroll */}
          <div>
            <RunPayrollCard
              canRun={canRun}
              employeeCount={employees?.length ?? 0}
              totalAmount={totalAmount ?? 0}
              onComplete={handleRunComplete}
            />
          </div>
        </div>

        {/* ── History ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon />
              <h2 className="font-semibold text-white">Payroll History</h2>
            </div>
            {history.length > 0 && (
              <span className="text-xs text-gray-500">{history.length} run{history.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <HistoryTable runs={history} />
        </div>

        {/* ── How the Agent works ───────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <RobotIcon />
            <h2 className="font-semibold text-white">How the Agent Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🔐', title: 'Session Key Pattern',
                desc: 'You authorize once. The agent holds a bounded wallet — only USDC, only to your whitelist, hard spending cap. Never your master key.',
              },
              {
                icon: '⚡', title: 'Autonomous Execution',
                desc: 'Once triggered (manually or via monthly cron), the agent executes all transactions without you being online.',
              },
              {
                icon: '🛡️', title: 'Immutable Rules',
                desc: 'Spending limits and whitelist are enforced on-chain. Even if this server is breached, funds cannot leave the whitelist.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-[#161b22] border border-[#21262d] p-4 flex flex-col gap-2">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#21262d] py-4 text-center text-xs text-gray-600">
        Paychef · Built on Base Sepolia · Testnet only · Agent Wallet Hackathon
      </footer>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, loading,
}: {
  label: string; value: string; sub: string;
  color: 'green' | 'yellow' | 'blue' | 'purple';
  loading: boolean;
}) {
  const accent = {
    green: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    yellow: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
  }[color];

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${accent}`}>
      <span className="text-xs text-gray-500">{label}</span>
      {loading
        ? <div className="h-6 w-20 bg-[#21262d] rounded animate-pulse" />
        : <span className="text-lg font-bold">{value}</span>
      }
      <span className="text-xs text-gray-500">{sub}</span>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Icons ─────────────────────────────────────────────────────────────────

function CoinIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
function RobotIcon() {
  return (
    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  );
}
