'use client';
import { useState } from 'react';
import { api, SessionStatus } from '@/lib/api';

interface Props {
  session: SessionStatus | null;
  onRevoke: () => void;
  onCreated: () => void;
  hasPayroll: boolean;
}

function truncate(addr: string) {
  return addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';
}

export default function SessionKeyCard({ session, onRevoke, onCreated, hasPayroll }: Props) {
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const spentPct = session?.spendingLimit
    ? Math.min(100, ((session.totalSpent ?? 0) / session.spendingLimit) * 100)
    : 0;

  const statusBadge = () => {
    if (!session?.exists) return <span className="badge-yellow"><Dot />No Key</span>;
    if (session.isExpired) return <span className="badge-red"><Dot />Expired</span>;
    if (session.status === 'revoked') return <span className="badge-red"><Dot />Revoked</span>;
    return <span className="badge-green"><Dot />Active</span>;
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await api.createSession();
      setNewKey(res.instructions.privateKey);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await api.revokeSession();
      onRevoke();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon />
          <h2 className="font-semibold text-white">Session Key</h2>
        </div>
        {statusBadge()}
      </div>

      {session?.exists && session.status === 'active' && !session.isExpired ? (
        <>
          {/* address */}
          <div className="flex items-center justify-between rounded-lg bg-[#161b22] px-3 py-2 border border-[#21262d]">
            <span className="mono text-gray-300">{truncate(session.address!)}</span>
            <button
              onClick={() => navigator.clipboard.writeText(session.address!)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Copy address"
            >
              <CopyIcon />
            </button>
          </div>

          {/* spending progress */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Spending</span>
              <span>
                <span className="text-white font-medium">{session.totalSpent ?? 0}</span>
                <span> / {session.spendingLimit} USDC</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${spentPct}%`,
                  background: spentPct > 80 ? '#f97316' : '#10b981',
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Remaining: <span className="text-emerald-400 font-medium">{session.remaining} USDC</span>
            </div>
          </div>

          {/* info grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoRow label="Whitelist" value={`${session.whitelistCount} addresses`} />
            <InfoRow label="Expires" value={formatDate(session.expiresAt!)} />
          </div>

          {/* revoke */}
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="btn-danger self-start mt-auto"
          >
            {revoking ? <Spinner /> : <TrashIcon />}
            {revoking ? 'Revoking...' : 'Revoke Key'}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            {!hasPayroll
              ? 'Upload a payroll CSV first, then create a Session Key.'
              : 'Create a Session Key to authorize the agent to run payroll.'}
          </p>

          {newKey ? (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-yellow-400">⚠ Copy this key to your .env — shown once!</p>
              <code className="mono text-yellow-300 text-xs break-all">{newKey}</code>
              <p className="text-xs text-gray-400 mt-1">
                Add <code className="text-yellow-300">AGENT_PRIVATE_KEY={newKey.slice(0, 10)}...</code> to <code>.env</code>,
                then restart the backend.
              </p>
            </div>
          ) : (
            <button onClick={handleCreate} disabled={creating || !hasPayroll} className="btn-primary">
              {creating ? <Spinner /> : <KeyIcon />}
              {creating ? 'Creating...' : 'Create Session Key'}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#161b22] px-3 py-2 border border-[#21262d]">
      <p className="text-gray-500">{label}</p>
      <p className="text-white font-medium mt-0.5">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />;
}
function Spinner() {
  return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />;
}
function ShieldIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
