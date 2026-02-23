'use client';
import { useState, useEffect } from 'react';
import { api, PayrollRun, TxResult, TxFailed } from '@/lib/api';

interface Props {
  canRun: boolean;
  employeeCount: number;
  totalAmount: number;
  onComplete: (run: PayrollRun) => void;
}

type Stage = 'idle' | 'running' | 'done' | 'error';

interface LogLine {
  id: number;
  text: string;
  type: 'info' | 'success' | 'fail' | 'summary';
}

export default function RunPayrollCard({ canRun, employeeCount, totalAmount, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [log, setLog] = useState<LogLine[]>([]);
  const [lastRun, setLastRun] = useState<PayrollRun | null>(null);
  const [error, setError] = useState('');

  const addLog = (text: string, type: LogLine['type'] = 'info') => {
    setLog(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  // simulate live log display from results
  const animateResults = async (run: PayrollRun) => {
    addLog(`🚀 Payroll started — ${run.totalEmployees} employees`, 'info');
    await delay(300);

    for (const tx of run.successful) {
      await delay(400);
      addLog(`✓ ${tx.name}  •  ${tx.amount} USDC`, 'success');
    }
    for (const tx of run.failed) {
      await delay(300);
      addLog(`✗ ${tx.name}  •  ${tx.error}`, 'fail');
    }
    await delay(500);
    addLog(
      `Completed — ${run.successful.length}/${run.totalEmployees} paid • ${run.successAmount} USDC`,
      'summary',
    );
  };

  const handleRun = async () => {
    setStage('running');
    setLog([]);
    setError('');
    setLastRun(null);

    try {
      addLog('Connecting to agent wallet...', 'info');
      const res = await api.runPayroll();
      setLastRun(res.results);
      await animateResults(res.results);
      setStage('done');
      onComplete(res.results);
    } catch (e) {
      setError((e as Error).message);
      setStage('error');
    }
  };

  const explorerBase = 'https://sepolia.basescan.org/tx';

  const successTxs: TxResult[] = lastRun?.successful ?? [];
  const failedTxs: TxFailed[] = lastRun?.failed ?? [];

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center gap-2">
        <BoltIcon />
        <h2 className="font-semibold text-white">Execute Payroll</h2>
        {stage === 'done' && <span className="badge-green ml-auto">Done</span>}
        {stage === 'error' && <span className="badge-red ml-auto">Failed</span>}
      </div>

      {/* run button */}
      {(stage === 'idle' || stage === 'error') && (
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="btn-primary py-4 text-base"
        >
          <PlayIcon />
          Run Payroll Now
        </button>
      )}

      {stage === 'running' && (
        <div className="flex items-center justify-center gap-3 py-4 rounded-lg bg-[#161b22] border border-[#21262d]">
          <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-emerald-400 font-medium">Executing transactions...</span>
        </div>
      )}

      {/* preview info when idle */}
      {stage === 'idle' && canRun && (
        <div className="rounded-lg bg-[#161b22] border border-[#21262d] px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Will send</span>
          <div className="text-right">
            <span className="text-white font-semibold">{totalAmount.toLocaleString()} USDC</span>
            <span className="text-gray-500 text-xs ml-2">to {employeeCount} addresses</span>
          </div>
        </div>
      )}

      {!canRun && stage === 'idle' && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
          <p className="text-xs text-yellow-400">
            {employeeCount === 0
              ? '⚠ Upload a CSV first.'
              : '⚠ Create & fund the Session Key first.'}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={handleRun} className="text-xs text-red-300 underline mt-1">Retry</button>
        </div>
      )}

      {/* live log */}
      {log.length > 0 && (
        <div className="rounded-lg bg-[#0d1117] border border-[#21262d] overflow-hidden">
          <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] flex items-center gap-2">
            <TerminalIcon />
            <span className="text-xs text-gray-400 font-medium">Execution Log</span>
          </div>
          <div className="p-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto font-mono text-xs">
            {log.map((line) => (
              <div
                key={line.id}
                className={`animate-fade-in flex items-start gap-2 ${
                  line.type === 'success' ? 'text-emerald-400' :
                  line.type === 'fail' ? 'text-red-400' :
                  line.type === 'summary' ? 'text-white font-semibold border-t border-[#21262d] pt-1.5 mt-0.5' :
                  'text-gray-400'
                }`}
              >
                <span className="shrink-0 mt-px">{
                  line.type === 'success' ? '›' :
                  line.type === 'fail' ? '×' :
                  line.type === 'summary' ? '✓' : '$'
                }</span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* tx results with links */}
      {stage === 'done' && successTxs.length > 0 && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="text-xs font-medium text-gray-400">Transaction Hashes</p>
          {successTxs.map((tx) => (
            <div key={tx.txHash} className="flex items-center justify-between rounded-lg bg-[#161b22] border border-[#21262d] px-3 py-2">
              <span className="text-xs text-gray-300">{tx.name}</span>
              <a
                href={`${explorerBase}/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
              >
                {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                <ExternalIcon />
              </a>
            </div>
          ))}
          {failedTxs.length > 0 && failedTxs.map((tx) => (
            <div key={tx.name} className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
              <span className="text-xs text-gray-300">{tx.name}</span>
              <span className="text-xs text-red-400">{tx.error}</span>
            </div>
          ))}
          <button
            onClick={() => { setStage('idle'); setLog([]); }}
            className="btn-ghost text-sm mt-1"
          >
            Run Again
          </button>
        </div>
      )}
    </div>
  );
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Icons ──────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (
    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
