'use client';
import { useState } from 'react';
import { PayrollRun } from '@/lib/api';

interface Props {
  runs: PayrollRun[];
}

const EXPLORER = 'https://sepolia.basescan.org/tx';

export default function HistoryTable({ runs }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  if (runs.length === 0) {
    return (
      <div className="card p-10 flex flex-col items-center gap-3 text-center">
        <HistoryIcon />
        <p className="text-gray-400 font-medium">No payroll runs yet</p>
        <p className="text-gray-600 text-sm">Run payroll to see results here</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* table header */}
      <div className="grid grid-cols-5 px-4 py-3 bg-[#161b22] border-b border-[#21262d] text-xs font-medium text-gray-400">
        <span>Date</span>
        <span>Status</span>
        <span className="text-center">Paid</span>
        <span className="text-right">Total</span>
        <span className="text-right">Details</span>
      </div>

      <div className="divide-y divide-[#21262d]">
        {runs.map((run) => {
          const isOpen = expanded === run.runId;
          const allOk = run.failed.length === 0;
          const partial = run.successful.length > 0 && run.failed.length > 0;

          return (
            <div key={run.runId} className="animate-fade-in">
              {/* row */}
              <button
                onClick={() => toggle(run.runId)}
                className="grid grid-cols-5 w-full px-4 py-3.5 text-left items-center
                           hover:bg-[#161b22] transition-colors"
              >
                <span className="text-sm text-gray-300">{formatDate(run.timestamp)}</span>

                <span>
                  {allOk
                    ? <span className="badge-green">Completed</span>
                    : partial
                    ? <span className="badge-yellow">Partial</span>
                    : <span className="badge-red">Failed</span>
                  }
                </span>

                <span className="text-center text-sm text-white font-medium">
                  {run.successful.length}/{run.totalEmployees}
                </span>

                <span className="text-right text-sm text-emerald-400 font-semibold">
                  {run.successAmount.toLocaleString()} USDC
                </span>

                <span className="text-right">
                  <ChevronIcon open={isOpen} />
                </span>
              </button>

              {/* expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 animate-slide-up">
                  <div className="rounded-lg border border-[#21262d] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#161b22]">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Employee</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Amount</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Tx Hash</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21262d]">
                        {run.successful.map((tx) => (
                          <tr key={tx.txHash} className="hover:bg-[#161b22]">
                            <td className="px-3 py-2 text-white">{tx.name}</td>
                            <td className="px-3 py-2 text-emerald-400 font-medium">{tx.amount} USDC</td>
                            <td className="px-3 py-2">
                              <a
                                href={`${EXPLORER}/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mono text-blue-400 hover:text-blue-300 flex items-center gap-1 w-fit transition-colors"
                              >
                                {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                                <ExternalIcon />
                              </a>
                            </td>
                            <td className="px-3 py-2">
                              <span className="badge-green">✓ Paid</span>
                            </td>
                          </tr>
                        ))}
                        {run.failed.map((tx, i) => (
                          <tr key={i} className="hover:bg-[#161b22]">
                            <td className="px-3 py-2 text-white">{tx.name}</td>
                            <td className="px-3 py-2 text-red-400">{tx.amount} USDC</td>
                            <td className="px-3 py-2 text-gray-500">—</td>
                            <td className="px-3 py-2">
                              <span className="badge-red">✗ Failed</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* run meta */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>Run ID: <span className="mono text-gray-400">{run.runId}</span></span>
                    <span>•</span>
                    <span>{new Date(run.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ml-auto ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <div className="w-14 h-14 rounded-xl bg-[#161b22] border border-[#21262d] flex items-center justify-center">
      <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    </div>
  );
}
