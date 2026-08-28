import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDaily } from '../hooks/useDaily';
import { useStats } from '../hooks/useStats';
import { User, DailyProblem } from '../api';
import { ratingColor } from '../utils/colors';
import { Overdue } from './Overdue';
import { PageHeader, Card, Chip, Button, Spinner, Section } from './ui';

const LEVELS = Array.from({ length: 19 }, (_, i) => 800 + i * 100);

interface Props {
  userId: number;
  user: User | null;
}

export const DailyTargets: React.FC<Props> = ({ userId, user }) => {
  const { daily, loading, error, sync, syncing, refetch } = useDaily(userId);
  const { stats } = useStats(userId);
  const [dismissBanner, setDismissBanner] = React.useState(false);
  const [savingLevel, setSavingLevel] = React.useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = React.useState<number | null>(null);

  const savedRange = user ? { min: user.rating_min, max: user.rating_max } : null;
  const currentLevel = selectedLevel ?? (savedRange && savedRange.min === savedRange.max ? savedRange.min : null);

  const handleSync = async () => {
    await sync();
  };

  const handleSelectLevel = async (level: number) => {
    if (savingLevel !== null) return;
    setSavingLevel(level);
    setSelectedLevel(level);
    try {
      // Temporarily generate today's problems at this level WITHOUT changing
      // the saved Settings range, so the other in-range level chips stay active.
      refetch(true, level);
    } catch (err: any) {
      console.error('Failed to set level:', err);
    } finally {
      setSavingLevel(null);
    }
  };

  React.useEffect(() => {
    if (daily && daily.today) {
      const pending = daily.today.filter(p => !p.solved_at).length;
      if (pending > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (localStorage.getItem('notifications_enabled') === 'true') {
          const lastNotified = localStorage.getItem('last_notified_date');
          const todayStr = new Date().toISOString().split('T')[0];
          if (lastNotified !== todayStr) {
            new Notification('Codeforces Companion', {
              body: `You have ${pending} target problem${pending > 1 ? 's' : ''} left for today!`,
              icon: '/favicon.ico'
            });
            localStorage.setItem('last_notified_date', todayStr);
          }
        }
      }
    }
  }, [daily]);

  if (loading && !daily) {
    return <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]"><Spinner /> Loading targets...</div>;
  }
  if (error) {
    return <div className="text-[var(--color-red)] font-mono">Error: {error}</div>;
  }
  if (!daily) return null;

  const solvedCount = daily.today.filter(p => p.solved_at).length;
  const totalCount = daily.today.length;
  const progressPercent = totalCount === 0 ? 0 : (solvedCount / totalCount) * 100;

  return (
    <div className="space-y-2 pb-8">
      <PageHeader
        title={new Date(daily.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        subtitle={`${solvedCount}/${totalCount} target${totalCount === 1 ? '' : 's'} solved today`}
        right={
          <Button onClick={handleSync} disabled={syncing}>
            {syncing && <Spinner className="w-3.5 h-3.5" />}
            {syncing ? 'Syncing...' : 'Recheck solves'}
          </Button>
        }
      />

      <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[var(--color-green)] h-full transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {stats?.autoAdvance && !dismissBanner && (
        <div className="card-hover bg-[var(--color-accent-soft)] border border-[var(--color-accent)] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-3 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-accent-soft),0_12px_30px_-14px_var(--color-accent)]">
          <div className="min-w-0">
            <h3 className="text-[var(--color-accent)] font-mono font-bold uppercase mb-1 text-sm">Level Up Suggested</h3>
            <p className="text-sm text-[var(--color-text)] break-words">
              Consider bumping your rating range to {stats.autoAdvance.min}-{stats.autoAdvance.max} to keep the grind fresh.
            </p>
          </div>
          <button onClick={() => setDismissBanner(true)} className="text-[var(--color-accent)] hover:text-white font-mono text-xl leading-none shrink-0">&times;</button>
        </div>
      )}

      {/* Level selector */}
      <Section num="01" title="Practice Level" right={
        <span className="font-mono text-xs text-[var(--color-text-dim)]">
          {currentLevel ? `${currentLevel}-rated` : 'Mixed'}{user ? ` · first ${user.daily_target_count} unsolved` : ''}
        </span>
      }>
        <Card className="p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(level => {
              const active = currentLevel === level;
              const color = ratingColor(level);
              const outOfRange = !!user && (level < user.rating_min || level > user.rating_max);
              return (
                <button
                  key={level}
                  onClick={() => !outOfRange && handleSelectLevel(level)}
                  disabled={savingLevel !== null || outOfRange}
                  title={outOfRange ? `Outside your practice range (${user?.rating_min}-${user?.rating_max})` : undefined}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-sm transition-colors ${
                    outOfRange
                      ? 'opacity-40 cursor-not-allowed text-[var(--color-text-faint)] bg-[var(--color-input)] border-[var(--color-border)]'
                      : active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)] font-bold'
                        : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span style={active ? { color } : undefined}>{level}</span>
                  {savingLevel === level && <span className="ml-2 inline-block w-2.5 h-2.5 border-2 border-t-transparent border-[var(--color-accent)] rounded-full animate-spin align-middle"></span>}
                </button>
              );
            })}
          </div>
        </Card>
      </Section>

      <Section num="02" title="Today's Targets">
        <div className="space-y-3">
          {daily.today.map(p => <ProblemCard key={p.id} problem={p} />)}
        </div>
      </Section>

      {daily.overdue.length > 0 && <Overdue problems={daily.overdue} />}
    </div>
  );
};

const ProblemCard: React.FC<{ problem: DailyProblem }> = ({ problem }) => {
  const solved = !!problem.solved_at;
  const navigate = useNavigate();

  return (
    <div className={`card-hover bg-[var(--color-surface)] border ${solved ? 'border-[var(--color-green)]' : 'border-[var(--color-border)]'} rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-[var(--color-border-strong)] shadow-[var(--color-card-shadow)] hover:-translate-y-0.5 hover:shadow-[var(--color-card-shadow),0_0_0_1px_var(--color-accent-soft)]`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${solved ? 'bg-[var(--color-green)] shadow-[0_0_8px_var(--color-green)]' : 'bg-[var(--color-text-faint)]'}`}></div>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => navigate(`/arena?problem=${problem.contest_id}${problem.problem_index}`)}
              title={`Open ${problem.contest_id}${problem.problem_index} in Arena`}
              className="text-base md:text-lg font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors text-left break-words"
            >
              {problem.contest_id}{problem.problem_index} - {problem.name}
            </button>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className="font-mono text-[11px] px-2 py-0.5 rounded border border-[var(--color-border-strong)]"
                style={{ color: ratingColor(problem.rating) }}
              >
                {problem.rating || 'Unrated'}
              </span>
              {problem.tags.slice(0, 3).map(tag => (
                <Chip key={tag}>{tag}</Chip>
              ))}
              {problem.tags.length > 3 && (
                <span className="text-[11px] font-mono text-[var(--color-text-dim)]">+{problem.tags.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pl-6 flex items-center gap-2 font-mono text-sm">
        {solved ? (
          <>
            <span className="text-[var(--color-green)]">SOLVED</span>
            <span className="text-xs text-[var(--color-text-dim)]">{new Date(problem.solved_at!).toLocaleTimeString()}</span>
          </>
        ) : (
          <span className="text-[var(--color-text-faint)]">PENDING</span>
        )}
      </div>
    </div>
  );
};
