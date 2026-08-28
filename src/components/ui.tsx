import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <span className={`inline-block ${className} border-2 border-t-transparent border-[var(--color-accent)] rounded-full animate-spin align-middle`} />
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div className="min-w-0">
      <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-[var(--color-text)] break-words">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--color-text-dim)] break-words">{subtitle}</p>
      )}
    </div>
    {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
  </div>
);

export const Section: React.FC<{
  num?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ num, title, right, children }) => (
  <section className="mb-7">
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        {num && (
          <span className="shrink-0 inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] font-mono text-[11px] font-bold">
            {num}
          </span>
        )}
        <h2 className="font-mono uppercase tracking-wide text-sm text-[var(--color-text)] truncate">{title}</h2>
      </div>
      <div className="flex-1 section-divider min-w-4" />
      {right && <div className="flex items-center gap-2 shrink-0 ml-2">{right}</div>}
    </div>
    {children}
  </section>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`card-hover bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[var(--color-card-shadow)] ${className}`}>
    {children}
  </div>
);

export const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  color?: string;
  hint?: string;
}> = ({ title, value, color, hint }) => (
  <div className="card-hover bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-[var(--color-card-shadow)]">
    <h3 className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-dim)] mb-2 truncate" title={title}>
      {title}
    </h3>
    <div className="font-mono text-3xl font-bold break-words" style={{ color: color || 'var(--color-text)' }}>
      {value}
    </div>
    {hint && <div className="mt-1 font-mono text-[11px] text-[var(--color-text-faint)] truncate" title={hint}>{hint}</div>}
  </div>
);

export const Chip: React.FC<{ color?: string; children: React.ReactNode; title?: string; className?: string }> = ({
  color, children, title, className = '',
}) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-dim)] truncate max-w-full ${className}`}
    style={color ? { color, borderColor: `color-mix(in_srgb, ${color} 40%, transparent)`, backgroundColor: `color-mix(in_srgb, ${color} 10%, transparent)` } : undefined}
  >
    {children}
  </span>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({
  children, onClick, variant = 'outline', disabled, className = '', type = 'button',
}) => {
  const styles: Record<string, string> = {
    primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] border-transparent',
    outline: 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)] bg-[var(--color-surface)]',
    ghost: 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]',
    danger: 'border-transparent bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] text-[var(--color-red)] hover:bg-[color-mix(in_srgb,var(--color-red)_20%,transparent)]',
    success: 'border-transparent bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] text-[var(--color-green)] hover:bg-[color-mix(in_srgb,var(--color-green)_20%,transparent)]',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-lift inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="py-10 text-center font-mono text-sm text-[var(--color-text-dim)]">{children}</div>
);
