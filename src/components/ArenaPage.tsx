import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getArena, startArena, toggleArenaPause, finishArena, resetArena, clearArenaLog,
  searchArenaProblems, ArenaSession, ArenaLogEntry, ArenaStats, ArenaSearchItem,
} from '../api';
import { PageHeader, Section, Card, StatCard, Chip, Button, Spinner, Empty } from './ui';

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

function fmtShort(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const DIFF_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Med', hard: 'Hard' };
const DIFF_COLOR: Record<string, string> = { easy: 'var(--color-green)', medium: 'var(--color-amber)', hard: 'var(--color-red)' };
const DIFF_ORDER = ['easy', 'medium', 'hard'];

export const ArenaPage: React.FC<{ userId: number }> = ({ userId }) => {
  const [searchParams] = useSearchParams();
  const incoming = searchParams.get('problem');

  const [session, setSession] = useState<ArenaSession | null>(null);
  const [log, setLog] = useState<ArenaLogEntry[]>([]);
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [display, setDisplay] = useState('00:00:00');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArenaSearchItem[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingStarted = useRef(false);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!session || session.state !== 'running') {
      if (session) setDisplay(fmtClock(session.elapsedMs));
      return;
    }
    const id = setInterval(() => {
      setSession(s => {
        if (!s || s.state !== 'running') return s;
        const elapsed = s.elapsedMs + (Date.now() - s.serverTime);
        setDisplay(fmtClock(elapsed));
        return s;
      });
    }, 500);
    return () => clearInterval(id);
  }, [session?.state]);

  const elapsedOf = (s: ArenaSession): number =>
    s.state === 'running' ? s.elapsedMs + (Date.now() - s.serverTime) : s.elapsedMs;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getArena(userId);
      setSession(d.session);
      setLog(d.log);
      setStats(d.stats);
      setDisplay(fmtClock(elapsedOf(d.session)));
      setDifficulty(d.session.difficulty);
      setError(null);
      if (incoming && !incomingStarted.current && d.session.state === 'idle') {
        incomingStarted.current = true;
        await startArena(userId, { problemId: incoming });
        const fresh = await getArena(userId);
        setSession(fresh.session);
        setDifficulty(fresh.session.difficulty);
        setDisplay(fmtClock(elapsedOf(fresh.session)));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, incoming]);

  useEffect(() => { load(); }, [load]);

  const applySession = (s: ArenaSession) => {
    setSession(s);
    setDisplay(fmtClock(elapsedOf(s)));
    if (s.state === 'idle') setDifficulty(s.difficulty);
  };

  const handleStart = async () => {
    const problemId = query.trim();
    if (!problemId) { setError('Enter a problem ID like 800A or search below.'); return; }
    setError(null);
    try {
      const r = await startArena(userId, { problemId, problemName: problemId, difficulty: difficulty || undefined });
      applySession(r.session);
    } catch (e) { setError((e as Error).message); }
  };

  const handleStartSelected = async (p: ArenaSearchItem) => {
    setError(null);
    setQuery(p.id);
    try {
      const r = await startArena(userId, { problemId: p.id, difficulty: difficulty || undefined });
      applySession(r.session);
    } catch (e) { setError((e as Error).message); }
  };

  const handlePause = async () => {
    try { const r = await toggleArenaPause(userId); applySession(r.session); } catch (e) { setError((e as Error).message); }
  };

  const handleFinish = async (solved: boolean) => {
    try {
      const r = await finishArena(userId, solved, difficulty || undefined);
      setSession(r.session);
      setLog(r.log);
      setStats(r.stats);
      setDisplay('00:00:00');
      setDifficulty(null);
    } catch (e) { setError((e as Error).message); }
  };

  const handleReset = async () => {
    try { const r = await resetArena(userId); applySession(r.session); } catch (e) { setError((e as Error).message); }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all arena log data?')) return;
    try { const r = await clearArenaLog(userId); setLog([]); setStats(r.stats); } catch (e) { setError((e as Error).message); }
  };

  const onSearchChange = (v: string) => {
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!v.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await searchArenaProblems(userId, v.trim());
        setResults(r.problems.slice(0, 8));
      } catch { /* ignore */ }
    }, 250);
  };

  const running = session?.state === 'running';
  const paused = session?.state === 'paused';
  const active = running || paused;
  const problemUrl = session?.problem_id
    ? `https://codeforces.com/problemset/problem/${session.problem_id.replace(/^(\d+)([A-Z0-9]+)$/, '$1/$2')}`
    : null;

  if (loading && !session) return (
    <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]"><Spinner /> Loading arena...</div>
  );
  if (error && !session) return (
    <div className="font-mono text-[var(--color-red)]">
      <div>Error: {error}</div>
      <Button onClick={load} className="mt-3">Retry</Button>
    </div>
  );

  return (
    <div className="space-y-2 pb-8">
      <PageHeader
        title="Arena"
        subtitle="Start a timer on any problem and track your solving speed."
        right={
          <span className="font-mono text-[11px] text-[var(--color-text-faint)] flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${running ? 'bg-[var(--color-green)] animate-pulse' : paused ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-text-faint)]'}`} />
            {running ? 'Running' : paused ? 'Paused' : 'Idle'}
          </span>
        }
      />

      {error && (
        <div className="mb-3 font-mono text-xs text-[var(--color-red)] bg-[color-mix(in_srgb,var(--color-red)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-red)_25%,transparent)] rounded-lg px-4 py-2 break-words">
          {error}
        </div>
      )}

      {/* Current problem / timer */}
      <Section num="01" title="Current Problem">
        <Card className="glass p-6 md:p-8">
          <div className={`font-mono text-5xl md:text-7xl font-bold text-center tracking-widest tabular-nums transition-colors ${
            running ? 'text-[var(--color-accent-strong)]' : paused ? 'text-[var(--color-amber)]' : 'text-[var(--color-text)]'
          }`}>
            {display}
          </div>

          {active && session?.problem_name ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="font-mono text-lg font-semibold text-[var(--color-text)] text-center break-words max-w-full">
                {session.problem_name}
              </div>
              {session.difficulty && (
                <Chip color={DIFF_COLOR[session.difficulty]}>{DIFF_LABEL[session.difficulty]}</Chip>
              )}
              {problemUrl && (
                <a href={problemUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-soft)] border border-[var(--color-accent)] text-[var(--color-accent-strong)] text-sm font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors">
                  Open on Codeforces ↗
                </a>
              )}
            </div>
          ) : (
            <div className="mt-6 mx-auto max-w-xl space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleStart(); }}
                  placeholder="Problem ID (e.g. 800A) or search by name…"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] px-3 py-2.5 rounded-lg font-mono text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] shadow-[var(--color-card-shadow)] divide-y divide-[var(--color-border)]">
                    {results.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleStartSelected(p)}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--color-hover)] transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="font-mono text-sm text-[var(--color-text)] min-w-0 truncate">{p.id} · {p.name}</span>
                        <span className="font-mono text-xs text-[var(--color-text-dim)] shrink-0">{p.rating || '—'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">Difficulty</span>
                {DIFF_ORDER.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(difficulty === d ? null : d)}
                    className={`px-3 py-1 rounded-md border font-mono text-xs transition-colors ${
                      difficulty === d
                        ? 'border-[var(--color-border-strong)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-strong)]'
                    }`}
                    style={difficulty === d ? { color: DIFF_COLOR[d], borderColor: `color-mix(in_srgb, ${DIFF_COLOR[d]} 50%, transparent)`, backgroundColor: `color-mix(in_srgb, ${DIFF_COLOR[d]} 12%, transparent)` } : undefined}
                  >
                    {DIFF_LABEL[d]}
                  </button>
                ))}
              </div>
              <Button variant="primary" onClick={handleStart} className="w-full py-3">
                ▶ Start Timer
              </Button>
            </div>
          )}

          {active && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={handlePause} variant="ghost" className={running ? '' : 'font-semibold'}>
                {running ? '⏸ Pause' : '▶ Resume'}
              </Button>
              <Button onClick={() => handleFinish(true)} variant="success">✓ Solved</Button>
              <Button onClick={() => handleFinish(false)} variant="danger">✕ DNF</Button>
              <Button onClick={handleReset} variant="ghost" className="col-span-2 md:col-span-1 text-xs">
                Reset (discard)
              </Button>
            </div>
          )}
        </Card>
      </Section>

      {/* Stats */}
      <Section num="02" title="Session Stats">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard title="Solved" value={stats?.solved ?? 0} color="var(--color-green)" hint={stats?.totalDays ? `across ${stats.totalDays}d` : undefined} />
          <StatCard title="Attempted" value={stats?.attempted ?? 0} />
          <StatCard title="Avg time" value={stats?.avgMs != null ? fmtShort(stats.avgMs) : '—'} color="var(--color-accent-strong)" hint="per solve" />
          <StatCard title="Fastest" value={stats?.fastestMs != null ? fmtShort(stats.fastestMs) : '—'} color="var(--color-accent-strong)" hint="all time" />
          <StatCard title="Practice days" value={stats?.totalDays ?? 0} color="var(--color-amber)" hint={stats?.streakDays ? `${stats.streakDays}d streak` : undefined} />
        </div>
      </Section>

      {/* Log */}
      <Section num="03" title="Problem Log" right={
        <button onClick={handleClear} className="font-mono text-[11px] text-[var(--color-text-faint)] hover:text-[var(--color-red)] transition-colors">
          Clear log
        </button>
      }>
        <Card className="overflow-hidden">
          {log.length === 0 ? (
            <Empty>No problems yet — start your first timer above.</Empty>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {log.map(e => (
                <div key={e.id} className="px-4 md:px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 hover:bg-[var(--color-hover)] transition-colors">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${e.solved ? 'bg-[var(--color-green)]' : 'bg-[var(--color-text-faint)]'}`} />
                  <span className="min-w-0 flex-1 basis-40 font-mono text-sm text-[var(--color-text)] truncate" title={e.problem_name ?? undefined}>{e.problem_name}</span>
                  {e.difficulty && (
                    <Chip color={DIFF_COLOR[e.difficulty]}>{DIFF_LABEL[e.difficulty]}</Chip>
                  )}
                  <span className="font-mono text-sm text-[var(--color-accent-strong)] shrink-0 tabular-nums">{fmtShort(e.time_ms)}</span>
                  <span className="font-mono text-xs text-[var(--color-text-faint)] shrink-0 hidden sm:inline">
                    {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
};
