import React, { useCallback, useEffect, useState } from 'react';
import { getContests, Contest } from '../api';
import { PageHeader, Section, Card, Chip, Button, Spinner, Empty } from './ui';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
}

function formatDate(time: number): string {
  return new Date(time * 1000).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function countdownParts(targetSec: number, nowMs: number) {
  const diff = (targetSec * 1000) - nowMs;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function countdown(targetSec: number, nowMs: number): string {
  const p = countdownParts(targetSec, nowMs);
  if (!p) return 'Starting';
  if (p.d > 0) return `${p.d}d ${p.h}h ${p.m}m`;
  return `${p.h}h ${p.m}m ${p.s}s`;
}

function relativeStr(secAgo: number): string {
  const abs = Math.abs(secAgo);
  const d = Math.floor(abs / 86400);
  const h = Math.floor((abs % 86400) / 3600);
  const m = Math.floor((abs % 3600) / 60);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `${Math.floor(abs)}s ago`;
}

const TYPE_COLORS: Record<string, string> = {
  CF: 'var(--color-accent-strong)',
  ICPC: 'var(--color-green)',
  IOI: 'var(--color-amber)',
};

const ContestTable: React.FC<{ rows: Contest[]; upcoming: boolean }> = ({ rows, upcoming }) => {
  const now = useNow(upcoming);
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full min-w-[680px] text-left border-collapse">
        <thead>
          <tr className="bg-[var(--color-surface-2)]">
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)] whitespace-nowrap">#</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)]">Name</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)] whitespace-nowrap">Type</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)] whitespace-nowrap">Start</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)] whitespace-nowrap">Length</th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase text-[var(--color-text-dim)] whitespace-nowrap">
              {upcoming ? 'Countdown' : 'When'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-hover)] transition-colors">
              <td className="px-4 py-3 font-mono text-[var(--color-text-faint)]">{i + 1}</td>
              <td className="px-4 py-3 max-w-[340px]">
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                   className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent-strong)] break-words"
                   title={c.name}>
                  {c.name}
                </a>
              </td>
              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: TYPE_COLORS[c.type] || 'var(--color-text-dim)' }}>
                {c.type}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-dim)] whitespace-nowrap">{formatDate(c.startTimeSeconds)}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-dim)] whitespace-nowrap">{formatDuration(c.durationSeconds)}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--color-accent-strong)] whitespace-nowrap">
                {upcoming
                  ? countdown(c.startTimeSeconds, now)
                  : relativeStr(c.relativeTimeSeconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const NextContestHero: React.FC<{ c: Contest }> = ({ c }) => {
  const now = useNow(true);
  const p = countdownParts(c.startTimeSeconds, now);
  const units = [
    { v: p?.d ?? 0, l: 'days' },
    { v: p?.h ?? 0, l: 'hrs' },
    { v: p?.m ?? 0, l: 'min' },
    { v: p?.s ?? 0, l: 'sec' },
  ];
  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-[var(--color-accent-strong)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          Next up
        </span>
        <span className="font-mono text-[11px] text-[var(--color-text-faint)]">{formatDate(c.startTimeSeconds)}</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-[var(--color-text)] break-words leading-snug">{c.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Chip color={TYPE_COLORS[c.type] || undefined}>{c.type}</Chip>
            <Chip>Length {formatDuration(c.durationSeconds)}</Chip>
          </div>
        </div>
        <div className="flex items-end gap-3 shrink-0">
          {units.map(u => (
            <div key={u.l} className="text-center min-w-[58px]">
              <div className="font-mono text-3xl font-bold text-[var(--color-text)] tabular-nums">{String(u.v).padStart(2, '0')}</div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-text-faint)]">{u.l}</div>
            </div>
          ))}
        </div>
      </div>
      <a href={c.url} target="_blank" rel="noopener noreferrer"
         className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-[var(--color-accent-strong)] hover:underline">
        Open on Codeforces ↗
      </a>
    </Card>
  );
};

export const ContestsPage: React.FC = () => {
  const [data, setData] = useState<{ upcoming: Contest[]; past: Contest[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const d = await getContests();
      setData({ upcoming: d.upcoming, past: d.past });
      setUpdatedAt(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 60000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) return (
    <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]">
      <Spinner /> Loading contests...
    </div>
  );
  if (error && !data) return (
    <div className="font-mono text-[var(--color-red)]">
      <div>Error: {error}</div>
      <Button onClick={() => load()} className="mt-3">Retry</Button>
    </div>
  );
  if (!data) return null;

  const next = data.upcoming[0];

  return (
    <div className="space-y-2 pb-8">
      <PageHeader
        title="Contests"
        subtitle="Upcoming rounds, live countdowns and recent Codeforces history."
        right={
          <span className="font-mono text-[11px] text-[var(--color-text-faint)] flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${refreshing ? 'bg-[var(--color-accent)] animate-pulse' : 'bg-[var(--color-green)]'}`} />
            Updated {updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '…'}
            {refreshing && ' · syncing'}
          </span>
        }
      />

      {error && (
        <div className="mb-3 font-mono text-xs text-[var(--color-red)] bg-[color-mix(in_srgb,var(--color-red)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-red)_25%,transparent)] rounded-lg px-4 py-2">
          Reconnected: {error}
        </div>
      )}

      {next && <NextContestHero c={next} />}

      <Section num="01" title="Upcoming Contests" right={<span className="font-mono text-[11px] text-[var(--color-text-faint)]">{data.upcoming.length} upcoming</span>}>
        {data.upcoming.length === 0 ? (
          <Card><Empty>No upcoming contests.</Empty></Card>
        ) : (
          <ContestTable rows={data.upcoming} upcoming />
        )}
      </Section>

      <Section num="02" title="Past Contests" right={<span className="font-mono text-[11px] text-[var(--color-text-faint)]">{data.past.length} recent</span>}>
        {data.past.length === 0 ? (
          <Card><Empty>No past contests.</Empty></Card>
        ) : (
          <ContestTable rows={data.past} upcoming={false} />
        )}
      </Section>
    </div>
  );
};
