import React, { useCallback, useEffect, useState } from 'react';
import {
  getLearnProgress, setArticleProgress, LearnModule, LearnSummary, LearnArticle, LearnSubmodule,
} from '../api';
import { PageHeader, Section, Card, Spinner } from './ui';

function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--color-track)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color || 'var(--color-accent)' }}
      />
    </div>
  );
}

const ArticleRow: React.FC<{ article: LearnArticle; done: boolean; onToggle: (a: LearnArticle, done: boolean) => void }> =
  ({ article, done, onToggle }) => (
    <li className="flex items-start gap-3 py-2 group">
      <button
        type="button"
        onClick={() => onToggle(article, !done)}
        aria-pressed={done}
        className={`mt-0.5 shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
          done
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)] bg-transparent'
        }`}
      >
        {done && (
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`min-w-0 text-sm leading-snug transition-colors ${
          done
            ? 'text-[var(--color-text-faint)] line-through'
            : 'text-[var(--color-text)] hover:text-[var(--color-accent-strong)] group-hover:opacity-90'
        }`}
      >
        {article.title}
      </a>
    </li>
  );

const SubmoduleBlock: React.FC<{
  sub: LearnSubmodule;
  done: Set<string>;
  toggle: (a: LearnArticle, done: boolean) => void;
}> = ({ sub, done, toggle }) => {
  const completed = sub.articles.filter(a => done.has(a.key)).length;
  const percent = Math.round((completed / sub.articles.length) * 100);
  return (
    <div className="border-t border-[var(--color-border)] px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="font-mono text-sm font-semibold text-[var(--color-text)]">{sub.name}</h4>
        <span className="font-mono text-xs text-[var(--color-text-dim)] shrink-0">{completed}/{sub.articles.length}</span>
      </div>
      <ProgressBar percent={percent} />
      <ul className="mt-3 space-y-0.5">
        {sub.articles.map(a => (
          <ArticleRow key={a.key} article={a} done={done.has(a.key)} onToggle={toggle} />
        ))}
      </ul>
    </div>
  );
};

const ModuleCard: React.FC<{
  module: LearnModule;
  summary: LearnSummary['modules'][number];
  done: Set<string>;
  toggle: (a: LearnArticle, done: boolean) => void;
}> = ({ module, summary, done, toggle }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[var(--color-hover)] transition-colors"
      >
        <span
          className={`shrink-0 h-6 w-6 rounded flex items-center justify-center font-mono text-xs transition-transform ${open ? 'rotate-90' : ''} ${
            summary.percent === 100 ? 'text-[var(--color-green)]' : 'text-[var(--color-text-dim)]'
          }`}
        >
          ▶
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-mono font-semibold text-[var(--color-text)]">{module.name}</span>
        </span>
        <span className="shrink-0 w-40 hidden sm:block">
          <ProgressBar percent={summary.percent} color={summary.percent === 100 ? 'var(--color-green)' : undefined} />
        </span>
        <span className="shrink-0 font-mono text-xs text-[var(--color-text-dim)] w-16 text-right">
          {summary.completed}/{summary.total}
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)]">
          {module.submodules.length === 0 && module.articles.length === 0 && (
            <div className="px-5 py-4 font-mono text-sm text-[var(--color-text-dim)]">No articles.</div>
          )}
          {module.articles.map(a => (
            <div key={a.key} className="border-t border-[var(--color-border)] px-5 py-1.5">
              <ArticleRow article={a} done={done.has(a.key)} onToggle={toggle} />
            </div>
          ))}
          {module.submodules.map(s => (
            <SubmoduleBlock key={s.id} sub={s} done={done} toggle={toggle} />
          ))}
        </div>
      )}
    </Card>
  );
};

export const LearnPage: React.FC<{ userId: number }> = ({ userId }) => {
  const [modules, setModules] = useState<LearnModule[] | null>(null);
  const [summary, setSummary] = useState<LearnSummary | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getLearnProgress(userId)
      .then(res => {
        setModules(res.modules);
        setSummary(res.summary);
        setDone(new Set(res.completedKeys));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(load, [load]);

  const toggle = useCallback((article: LearnArticle, nowDone: boolean) => {
    setLoading(true);
    setDone(prev => {
      const next = new Set(prev);
      if (nowDone) next.add(article.key);
      else next.delete(article.key);
      return next;
    });
    setArticleProgress(userId, article.key, nowDone)
      .then(res => {
        setDone(new Set(res.completedKeys));
        setSummary(res.summary);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    getLearnProgress(userId)
      .then(res => {
        setModules(res.modules);
        setSummary(res.summary);
        setDone(new Set(res.completedKeys));
      })
      .catch(err => setError(err.message))
      .finally(() => setRefreshing(false));
  }, [userId]);

  if (loading && !modules) return (
    <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]"><Spinner /> Loading curriculum...</div>
  );
  if (error) return <div className="font-mono text-[var(--color-red)]">Error: {error}</div>;
  if (!modules || !summary) return null;

  const summaryMap = new Map(summary.modules.map(m => [m.id, m]));

  return (
    <div className="space-y-2 pb-8">
      <PageHeader
        title="Learn"
        subtitle="A structured curriculum — algorithms for competitive programming."
        right={
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="font-mono text-xs text-[var(--color-text-dim)] hover:text-[var(--color-accent-strong)] transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        }
      />

      <Section num="01" title="Learning">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="font-mono text-sm text-[var(--color-text-dim)] uppercase">Overall Progress</h3>
            <span className="font-mono text-sm whitespace-nowrap" style={{ color: summary.overallPercent === 100 ? 'var(--color-green)' : 'var(--color-accent-strong)' }}>
              {summary.totalCompleted} / {summary.totalArticles} ({summary.overallPercent}%)
            </span>
          </div>
          <ProgressBar percent={summary.overallPercent} color={summary.overallPercent === 100 ? 'var(--color-green)' : undefined} />
          <p className="mt-3 font-mono text-xs text-[var(--color-text-faint)]">
            cp-algorithms.com · {summary.modules.length} modules
          </p>
        </Card>
      </Section>

      <Section num="02" title={`Modules (${modules.length})`}>
        <div className="space-y-3">
          {modules.map(m => (
            <ModuleCard key={m.id} module={m} summary={summaryMap.get(m.id)!} done={done} toggle={toggle} />
          ))}
        </div>
      </Section>
    </div>
  );
};
