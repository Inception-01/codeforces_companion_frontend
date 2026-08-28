import React, { useState } from 'react';
import { createUser } from '../api';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  onLogin: (id: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const HandleEntry: React.FC<Props> = ({ onLogin, theme, onToggleTheme }) => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const user = await createUser(handle.trim());
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('handle', user.handle);
      onLogin(user.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative items-center justify-center bg-[var(--color-bg)] p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-accent)] opacity-[0.12] blur-[100px]"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#8b5cf6] opacity-[0.12] blur-[100px]"></div>
      </div>

      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[#8b5cf6] text-white text-lg font-bold font-mono shadow-lg mb-4">
            CC
          </span>
          <h1 className="text-2xl font-mono tracking-wider font-bold text-[var(--color-text)] uppercase">
            Codeforces Companion
          </h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-2 font-mono">
            Track daily Codeforces practice, streaks &amp; progress
          </p>
        </div>

        <div className="glass p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">
                Codeforces Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                placeholder="tourist"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="text-[var(--color-red)] text-sm font-mono bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] p-2.5 rounded border border-[color-mix(in_srgb,var(--color-red)_30%,transparent)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-accent)] text-white font-bold font-mono uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-accent-strong)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Start Grinding'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
