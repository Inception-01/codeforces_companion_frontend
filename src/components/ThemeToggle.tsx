import React from 'react';
import { ThemeMode } from '../hooks/useTheme';

interface Props {
  theme: ThemeMode;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative inline-flex items-center rounded-full cursor-pointer border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors"
      style={{ height: '26px', width: '52px' }}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center transition-transform duration-200 ${
          isDark ? 'translate-x-0' : 'translate-x-[28px]'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="4.9" y1="4.9" x2="7" y2="7" />
              <line x1="17" y1="17" x2="19.1" y2="19.1" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.9" y1="19.1" x2="7" y2="17" />
              <line x1="17" y1="7" x2="19.1" y2="4.9" />
            </>
          )}
        </svg>
      </span>
    </button>
  );
};
