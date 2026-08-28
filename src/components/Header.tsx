import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  handle: string;
}

const NAV = [
  { to: '/daily', label: 'Daily' },
  { to: '/stats', label: 'Stats' },
  { to: '/arena', label: 'Arena' },
  { to: '/feed', label: 'Feed' },
  { to: '/contests', label: 'Contests' },
  { to: '/learn', label: 'Learn' },
  { to: '/settings', label: 'Settings' },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `font-mono uppercase text-[13px] font-medium px-3 py-2 rounded-lg transition-colors text-center ${
    isActive
      ? 'text-[var(--color-accent-strong)] bg-[var(--color-accent-soft)]'
      : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
  }`;

export const Header: React.FC<Props> = ({ theme, onToggleTheme, handle }) => {
  const displayHandle = handle || 'User';
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 min-w-0 shrink-0" onClick={close}>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white text-xs font-bold font-mono shadow-md shrink-0">
              CC
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="font-mono font-bold tracking-tight text-[var(--color-text)] leading-none block truncate">
                Codeforces Companion
              </span>
              <span className="font-mono text-[11px] text-[var(--color-text-faint)]">Daily practice companion</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 lg:gap-1.5 min-w-0">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={navClass}>{n.label}</NavLink>
            ))}
          </nav>
          {/* Spacer for right side on desktop-hide (keeps layout) */}
          <div className="lg:hidden flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto min-w-0">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Link
              to="/profile"
              className="flex items-center gap-2 min-w-0 sm:max-w-[180px] max-w-[110px] bg-[var(--color-surface)] border border-[var(--color-border)] pl-1 pr-3 py-1 rounded-full text-xs font-mono text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-colors shadow-sm"
              title={displayHandle}
            >
              <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 shrink-0 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] font-semibold">
                {displayHandle.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate">{displayHandle}</span>
            </Link>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
              className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <>
                    <path d="M3 6h18M3 12h18M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-[78%] max-w-xs glass flex flex-col"
          >
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white text-xs font-bold font-mono shrink-0">
                  CC
                </span>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-sm text-[var(--color-text)] truncate">{displayHandle}</div>
                  <Link to="/profile" onClick={close} className="text-[11px] font-mono text-[var(--color-accent-strong)]">View profile</Link>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {NAV.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={close}
                  className={({ isActive }) =>
                    `font-mono uppercase tracking-wide text-sm px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'text-[var(--color-accent-strong)] bg-[var(--color-accent-soft)] font-semibold'
                        : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between px-2">
                <span className="font-mono text-xs text-[var(--color-text-faint)]">Theme</span>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
