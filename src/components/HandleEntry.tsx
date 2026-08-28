import React, { useState, useEffect, useRef } from 'react';
import { requestVerification, verifyCodeforces, loginUser } from '../api';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  onLogin: (id: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const HandleEntry: React.FC<Props> = ({ onLogin, theme, onToggleTheme }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Signup verification states
  const [signupStep, setSignupStep] = useState<'enter' | 'challenge' | 'checking'>('enter');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [problemUrl, setProblemUrl] = useState('https://codeforces.com/problemset/problem/1000/A');
  const [checkAttempt, setCheckAttempt] = useState(1);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // --- LOGIN FLOW ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(handle.trim());
      localStorage.setItem('userId', res.user.id.toString());
      localStorage.setItem('handle', res.user.handle);
      onLogin(res.user.id);
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW: STEP 1 (Request Challenge) ---
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await requestVerification(handle.trim());
      setCodeSnippet(res.codeSnippet);
      if (res.problemUrl) setProblemUrl(res.problemUrl);
      setSignupStep('challenge');
    } catch (err: any) {
      setError(err.message || 'Failed to request verification');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW: STEP 2 (Verify Submission) ---
  const triggerVerifyCheck = async () => {
    try {
      const res = await verifyCodeforces(handle.trim());
      cleanup();
      localStorage.setItem('userId', res.user.id.toString());
      localStorage.setItem('handle', res.user.handle);
      onLogin(res.user.id);
      return true;
    } catch (err: any) {
      return false;
    }
  };

  const handleVerifyStart = async () => {
    setLoading(true);
    setError(null);
    setSignupStep('checking');
    setCheckAttempt(1);

    // 1. Immediate initial check
    const verified = await triggerVerifyCheck();
    if (verified) return;

    // 2. Poll every 2.5 seconds up to 10 attempts (25s total)
    let attempt = 1;
    const interval = setInterval(async () => {
      attempt++;
      setCheckAttempt(attempt);

      const ok = await triggerVerifyCheck();
      if (ok) {
        clearInterval(interval);
      } else if (attempt >= 10) {
        clearInterval(interval);
        setSignupStep('challenge');
        setLoading(false);
        setError(
          `Could not detect compilation error submission on ${problemUrl.split('/').slice(-2).join('')} yet. Make sure you submitted to Codeforces and click 'Verify Submission' again.`
        );
      }
    }, 2500);

    pollIntervalRef.current = interval;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy code to clipboard');
    }
  };

  const problemId = problemUrl.split('/').slice(-2).join('') || '1000A';

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
            Daily practice tracker, heatmap & competitive streak stats
          </p>
        </div>

        <div className="glass p-8 rounded-2xl">
          {/* TABS: LOGIN vs SIGNUP */}
          <div className="flex border-b border-[var(--color-border)] mb-6">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
                cleanup();
                setSignupStep('enter');
              }}
              className={`flex-1 pb-3 text-center font-mono text-sm font-semibold transition-colors relative ${
                tab === 'login'
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError(null);
                cleanup();
                setSignupStep('enter');
              }}
              className={`flex-1 pb-3 text-center font-mono text-sm font-semibold transition-colors relative ${
                tab === 'signup'
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">
                  Codeforces Handle
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  placeholder="e.g. tourist"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="text-[var(--color-red)] text-sm font-mono bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--color-red)_30%,transparent)]">
                  <p>{error}</p>
                  {error.includes('Sign Up') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signup');
                        setError(null);
                      }}
                      className="mt-2 text-xs font-mono text-[var(--color-accent)] underline hover:text-[var(--color-accent-strong)]"
                    >
                      Click here to switch to Sign Up →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-accent)] text-white font-bold font-mono uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-accent-strong)] transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          )}

          {/* TAB 2: SIGNUP */}
          {tab === 'signup' && (
            <>
              {signupStep === 'enter' && (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">
                      Enter Your Codeforces Handle
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      placeholder="e.g. tourist"
                      autoFocus
                      required
                    />
                    <p className="text-xs text-[var(--color-text-dim)] font-mono mt-1.5">
                      To verify you own this handle, you will be given a small code snippet to submit with a deliberate compilation error.
                    </p>
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
                    {loading ? 'Generating Challenge...' : 'Get Verification Challenge'}
                  </button>
                </form>
              )}

              {signupStep === 'challenge' && (
                <div className="space-y-4">
                  <div className="text-center mb-3">
                    <p className="text-xs font-mono text-[var(--color-text-dim)] uppercase">
                      Verifying Handle
                    </p>
                    <p className="text-lg font-mono font-bold text-[var(--color-text)]">
                      {handle}
                    </p>
                  </div>

                  <div className="bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--color-text-dim)]">Verification Snippet</span>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] transition-colors"
                      >
                        {copied ? '✓ Copied!' : 'Copy Snippet'}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap overflow-x-auto max-h-36 bg-[color-mix(in_srgb,var(--color-bg)_50%,transparent)] p-2 rounded">
                      {codeSnippet}
                    </pre>
                  </div>

                  <div className="text-xs font-mono text-[var(--color-text-dim)] space-y-1.5 bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]">
                    <p className="font-bold text-[var(--color-text)]">Instructions:</p>
                    <p>1. Open <a href={problemUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline font-bold">Codeforces Problem {problemId} ↗</a></p>
                    <p>2. Paste snippet in Codeforces submit box (any language, e.g. GNU G++)</p>
                    <p>3. Submit — Codeforces will give <strong>Compilation Error</strong></p>
                    <p>4. Click button below to complete verification</p>
                  </div>

                  {error && (
                    <div className="text-[var(--color-red)] text-xs font-mono bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] p-2.5 rounded border border-[color-mix(in_srgb,var(--color-red)_30%,transparent)]">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        cleanup();
                        setSignupStep('enter');
                        setError(null);
                      }}
                      className="px-4 py-3 border border-[var(--color-border)] text-[var(--color-text-dim)] font-mono text-xs rounded-lg hover:bg-[var(--color-input)] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyStart}
                      className="flex-1 bg-[var(--color-accent)] text-white font-bold font-mono uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-accent-strong)] transition-colors"
                    >
                      I've Submitted — Verify
                    </button>
                  </div>
                </div>
              )}

              {signupStep === 'checking' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="text-[var(--color-text)] font-mono font-bold">
                      Checking Codeforces Submissions...
                    </p>
                    <p className="text-[var(--color-text-dim)] text-xs font-mono mt-1">
                      Querying Codeforces API for your compilation error on Problem {problemId}
                    </p>
                    <p className="text-[var(--color-accent)] text-xs font-mono mt-2">
                      Attempt {checkAttempt} of 10
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        cleanup();
                        setSignupStep('challenge');
                        setLoading(false);
                      }}
                      className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-dim)] font-mono text-xs rounded-lg hover:bg-[var(--color-input)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={triggerVerifyCheck}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white font-mono text-xs rounded-lg hover:bg-[var(--color-accent-strong)] transition-colors"
                    >
                      Check Now ↻
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};