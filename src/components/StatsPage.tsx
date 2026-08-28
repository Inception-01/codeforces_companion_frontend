import React from 'react';
import { useStats } from '../hooks/useStats';
import { Heatmap } from './Heatmap';
import { StreakBar } from './StreakBar';
import { PageHeader, Section, Card, StatCard, Spinner, Empty } from './ui';

function bandColor(band: string): string {
  let color = '#808080';
  if (band.includes('1200-1399')) color = '#1FA61F';
  if (band.includes('1400-1599')) color = '#03A89E';
  if (band.includes('1600-1899')) color = '#3366CC';
  if (band.includes('1900-2099')) color = '#AA00AA';
  if (band.includes('2100-2399')) color = '#FF8C00';
  if (band.includes('2400+')) color = '#FF3030';
  return color;
}

export const StatsPage: React.FC<{ userId: number }> = ({ userId }) => {
  const { stats, loading, error } = useStats(userId);

  if (loading && !stats) return (
    <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]"><Spinner /> Loading stats...</div>
  );
  if (error) return <div className="font-mono text-[var(--color-red)]">Error: {error}</div>;
  if (!stats) return null;

  const ratingEntries = Object.entries(stats.ratingDistribution);
  const ratingMax = ratingEntries.length ? Math.max(...Object.values(stats.ratingDistribution)) : 1;
  const tagEntries = Object.entries(stats.tagBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const tagMax = tagEntries.length ? Math.max(1, tagEntries[0][1]) : 1;

  return (
    <div className="space-y-2 pb-8">
      <PageHeader title="Stats" subtitle="Your practice activity, targets and strengths at a glance." />

      <Section num="01" title="Activity Heatmap">
        <Card className="p-4 md:p-5">
          <Heatmap heatmapData={stats.heatmap} />
          <StreakBar streaks={stats.streaks} />
        </Card>
      </Section>

      <Section num="02" title="Daily Target Completion">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard title="Targets Met" value={stats.dailyCompletion.met} color="var(--color-green)" />
          <StatCard title="Partial Completion" value={stats.dailyCompletion.partial} color="var(--color-accent)" />
          <StatCard title="Targets Missed" value={stats.dailyCompletion.missed} color="var(--color-red)" />
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section num="03" title="Rating Distribution">
          <Card className="p-5">
            {ratingEntries.length === 0 ? (
              <Empty>No rating data yet.</Empty>
            ) : (
              <div className="space-y-3">
                {ratingEntries.map(([band, count]) => {
                  const percent = ratingMax > 0 ? (count / ratingMax) * 100 : 0;
                  const color = bandColor(band);
                  return (
                    <div key={band} className="flex items-center gap-4">
                      <div className="w-24 shrink-0 text-right font-mono text-sm whitespace-nowrap" style={{ color }}>{band}</div>
                      <div className="flex-1 h-3 bg-[var(--color-input)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                      </div>
                      <div className="w-8 shrink-0 font-mono text-sm text-[var(--color-text-dim)]">{count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Section>

        <Section num="04" title="Top Tags">
          <Card className="p-5">
            {tagEntries.length === 0 ? (
              <Empty>No tag data yet.</Empty>
            ) : (
              <div className="space-y-3">
                {tagEntries.map(([tag, count]) => {
                  const percent = tagMax > 0 ? (count / tagMax) * 100 : 0;
                  return (
                    <div key={tag} className="flex items-center gap-4">
                      <div className="w-32 shrink-0 text-right font-mono text-sm text-[var(--color-text-dim)] truncate" title={tag}>{tag}</div>
                      <div className="flex-1 h-3 bg-[var(--color-input)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-accent)] rounded-full opacity-80" style={{ width: `${percent}%` }}></div>
                      </div>
                      <div className="w-8 shrink-0 font-mono text-sm text-[var(--color-text-dim)]">{count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Section>
      </div>
    </div>
  );
};
