'use client';
import { useState, useRef, DragEvent } from 'react';
import { api, Employee, UploadResult } from '@/lib/api';

interface Props {
  onUploaded: (employees: Employee[], total: number) => void;
  currentEmployees: Employee[] | null;
  currentTotal: number | null;
}

export default function CsvUploadCard({ onUploaded, currentEmployees, currentTotal }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ row: number; name?: string; error: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files allowed');
      return;
    }
    setUploading(true);
    setError('');
    setErrors([]);
    try {
      const res: UploadResult = await api.uploadCsv(file);
      onUploaded(res.data.employees, res.data.totalAmount);
    } catch (e: unknown) {
      const msg = (e as Error).message;
      try {
        const parsed = JSON.parse(msg);
        if (parsed.errors) {
          setErrors(parsed.errors);
        } else {
          setError(msg);
        }
      } catch {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon />
          <h2 className="font-semibold text-white">Payroll CSV</h2>
        </div>
        {currentEmployees && (
          <span className="badge-blue">{currentEmployees.length} employees</span>
        )}
      </div>

      {/* drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200 py-8
          ${dragging
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-[#30363d] hover:border-[#484f58] hover:bg-[#161b22]'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={onInputChange} className="hidden" />
        {uploading ? (
          <>
            <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Uploading...</p>
          </>
        ) : (
          <>
            <UploadIcon dragging={dragging} />
            <div className="text-center">
              <p className="text-sm text-gray-300">
                {dragging ? 'Drop to upload' : 'Drop your CSV here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            </div>
            <span className="text-xs text-gray-500 font-mono bg-[#161b22] px-2 py-1 rounded">
              name, wallet_address, usdc_amount
            </span>
          </>
        )}
      </div>

      {/* validation errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-red-400">Validation failed — fix these rows:</p>
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-300">
              Row {e.row}{e.name ? ` (${e.name})` : ''}: {e.error}
            </p>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* preview table */}
      {currentEmployees && currentEmployees.length > 0 && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="rounded-lg overflow-hidden border border-[#21262d]">
            <table className="w-full text-xs">
              <thead className="bg-[#161b22]">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Name</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Wallet</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-medium">USDC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {currentEmployees.map((emp, i) => (
                  <tr key={i} className="hover:bg-[#161b22] transition-colors">
                    <td className="px-3 py-2 text-white font-medium">{emp.name}</td>
                    <td className="px-3 py-2">
                      <span className="mono text-gray-400">
                        {emp.wallet_address.slice(0, 8)}...{emp.wallet_address.slice(-4)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-medium">{emp.usdc_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* total */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <span className="text-sm text-gray-300">Total required</span>
            <span className="text-lg font-bold text-emerald-400">{currentTotal?.toLocaleString()} USDC</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function TableIcon() {
  return (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75H21.75m0 0h-.375m0 0a1.125 1.125 0 0 1 1.125 1.125v1.5" />
    </svg>
  );
}

function UploadIcon({ dragging }: { dragging: boolean }) {
  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
      ${dragging ? 'bg-emerald-500/20' : 'bg-[#21262d]'}`}>
      <svg className={`w-6 h-6 transition-colors ${dragging ? 'text-emerald-400' : 'text-gray-400'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    </div>
  );
}
