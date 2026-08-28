import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProblems } from '../hooks/useProblems';
import { ratingColor } from '../utils/colors';
import { setProblemStatus, ProblemQuery } from '../api';
import { PageHeader, Card, Chip, Button, Spinner, Empty } from './ui';

export const ProblemFeed: React.FC<{ userId: number }> = ({ userId }) => {
  const navigate = useNavigate();
  const [params, setParams] = useState<ProblemQuery>({ page: 1, order: 'desc', userId });
  const [tagInput, setTagInput] = useState('');
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  
  const { problems, total, loading, error } = useProblems(params);

  const isSolved = (p: { id: string | number; solved?: number }) => {
    const key = String(p.id);
    if (key in solvedMap) return solvedMap[key];
    return !!p.solved;
  };

  const handleToggle = async (id: string | number, checked: boolean) => {
    const key = String(id);
    setSolvedMap(prev => ({ ...prev, [key]: checked }));
    setToggling(prev => ({ ...prev, [key]: true }));
    try {
      await setProblemStatus(String(id), userId, checked);
    } catch (err) {
      setSolvedMap(prev => ({ ...prev, [key]: !checked }));
      console.error('Failed to update status:', err);
    } finally {
      setToggling(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTags = [...(params.tags || []), tagInput.trim()];
      setParams({ ...params, tags: newTags, page: 1 });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = (params.tags || []).filter(t => t !== tag);
    setParams({ ...params, tags: newTags, page: 1 });
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Problem Feed" subtitle="Browse, filter and mark solved problems from the entire Codeforces archive." />

      <Card className="p-5 flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Rating Range</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              className="w-24 bg-[var(--color-input)] border border-[var(--color-border)] px-2 py-1.5 rounded-md font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none"
              value={params.ratingMin || ''}
              onChange={(e) => setParams({ ...params, ratingMin: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
            />
            <span className="text-[var(--color-text-dim)]">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-24 bg-[var(--color-input)] border border-[var(--color-border)] px-2 py-1.5 rounded-md font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none"
              value={params.ratingMax || ''}
              onChange={(e) => setParams({ ...params, ratingMax: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
            />
          </div>
        </div>

        <div className="flex-[1.5] min-w-0">
          <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Tags (Enter to add)</label>
          <input
            type="text"
            className="w-full bg-[var(--color-input)] border border-[var(--color-border)] px-2 py-1.5 rounded-md font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none mb-2"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder="e.g. dp, graphs"
          />
          <div className="flex flex-wrap gap-2">
            {(params.tags || []).map(t => (
              <span key={t} className="bg-[var(--color-border)] text-xs font-mono px-2 py-1 rounded-md flex items-center gap-1">
                {t}
                <button onClick={() => removeTag(t)} className="text-[var(--color-text-dim)] hover:text-white">&times;</button>
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Order</label>
          <select
            className="w-full bg-[var(--color-input)] border border-[var(--color-border)] px-2 py-1.5 rounded-md font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none"
            value={params.order || 'desc'}
            onChange={(e) => setParams({ ...params, order: e.target.value as 'asc' | 'desc', page: 1 })}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading && <div className="p-8 text-center font-mono text-[var(--color-text-dim)]"><Spinner /></div>}
        {error && <div className="p-8 text-center font-mono text-[var(--color-red)]">Error: {error}</div>}

        {!loading && !error && problems.length === 0 && (
          <Empty>No problems found.</Empty>
        )}

        {!loading && !error && problems.length > 0 && (
          <div className="flex items-center px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] font-mono text-xs uppercase tracking-widest text-[var(--color-text-dim)]">
            <div className="w-24 shrink-0">Solved</div>
            <div className="flex-1 min-w-0">Problem</div>
          </div>
        )}

        <div className="divide-y divide-[var(--color-border)]">
          {problems.map(p => {
            const solved = isSolved(p);
            return (
            <div key={p.id} className="p-4 flex items-start gap-4 hover:bg-[var(--color-hover)] transition-colors">
              <div className="w-24 shrink-0">
                <button
                  onClick={() => handleToggle(p.id, !solved)}
                  disabled={toggling[p.id]}
                  className={`inline-flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-full border transition-colors ${
                    solved
                      ? 'border-[var(--color-green)] bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] text-[var(--color-green)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      solved ? 'bg-[var(--color-green)] border-[var(--color-green)]' : 'border-[var(--color-border-strong)]'
                    }`}
                  >
                    {solved && (
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {solved ? 'Solved' : 'Unsolved'}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <button
                    onClick={() => navigate(`/arena?problem=${p.contest_id}${p.problem_index}`)}
                    title={`Open ${p.contest_id}${p.problem_index} in Arena`}
                    className="font-mono font-bold text-base md:text-lg text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors shrink-0"
                  >
                    {p.contest_id}{p.problem_index}
                  </button>
                  <button
                    onClick={() => navigate(`/arena?problem=${p.contest_id}${p.problem_index}`)}
                    title={`${p.name} — open in Arena`}
                    className="text-[var(--color-text)] hover:text-[var(--color-accent)] hover:underline transition-colors text-left min-w-0 flex-1 break-words"
                  >
                    {p.name}
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[var(--color-border-strong)]" style={{ color: ratingColor(p.rating) }}>
                    {p.rating || 'Unrated'}
                  </span>
                  {p.tags.slice(0, 3).map(tag => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                  {p.tags.length > 3 && (
                    <span className="text-[11px] font-mono text-[var(--color-text-dim)]">+{p.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 font-mono text-sm">
        <span className="text-[var(--color-text-dim)]">Showing {problems.length} of {total}</span>
        <div className="flex gap-2 items-center">
          <Button
            disabled={!params.page || params.page === 1 || loading}
            onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
            variant="outline"
          >
            PREV
          </Button>
          <span className="px-3 py-1">Page {params.page || 1}</span>
          <Button
            disabled={problems.length === 0 || loading}
            onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
            variant="outline"
          >
            NEXT
          </Button>
        </div>
      </div>
    </div>
  );
};
