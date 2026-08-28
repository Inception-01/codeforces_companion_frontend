import React from 'react';

interface Props {
  streaks: {
    current: number;
    longest: number;
    average: number;
  };
}

export const StreakBar: React.FC<Props> = ({ streaks }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
      <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center justify-between gap-2 min-w-0">
        <span className="font-mono text-xs text-[var(--color-text-dim)] uppercase">Current Streak</span>
        <span className="font-mono text-xl text-[var(--color-accent)] font-bold whitespace-nowrap">{streaks.current} days</span>
      </div>
      <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center justify-between gap-2 min-w-0">
        <span className="font-mono text-xs text-[var(--color-text-dim)] uppercase">Longest Streak</span>
        <span className="font-mono text-xl text-[var(--color-text)] font-bold whitespace-nowrap">{streaks.longest} days</span>
      </div>
      <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center justify-between gap-2 min-w-0">
        <span className="font-mono text-xs text-[var(--color-text-dim)] uppercase">Avg / Day</span>
        <span className="font-mono text-xl text-[var(--color-green)] font-bold whitespace-nowrap">{streaks.average.toFixed(1)}</span>
      </div>
    </div>
  );
};
