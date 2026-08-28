import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyProblem } from '../api';
import { ratingColor } from '../utils/colors';
import { Section, Chip } from './ui';

export const Overdue: React.FC<{ problems: DailyProblem[] }> = ({ problems }) => {
  const navigate = useNavigate();
  return (
    <Section num="03" title="Overdue from previous days">
      <div className="space-y-3">
        {problems.map(problem => (
          <div key={problem.id} className="card-hover bg-[var(--color-surface)] border-l-4 border-l-[var(--color-accent)] border-y border-r border-[var(--color-border)] rounded-r-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[var(--color-card-shadow)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
            <div className="flex-1 min-w-0">
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
                <Chip>Assigned: {new Date(problem.assigned_date).toLocaleDateString()}</Chip>
              </div>
            </div>

            <div className="shrink-0 font-mono text-sm text-[var(--color-accent)]">
              PENDING
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
