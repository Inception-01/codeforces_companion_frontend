import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HandleEntry } from './components/HandleEntry';
import { Header } from './components/Header';
import { DailyTargets } from './components/DailyTargets';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
import { ProblemFeed } from './components/ProblemFeed';
import { Settings } from './components/Settings';
import { ContestsPage } from './components/ContestsPage';
import { LearnPage } from './components/LearnPage';
import { ArenaPage } from './components/ArenaPage';
import { useTheme } from './hooks/useTheme';
import { getMe, getUser, logout, User } from './api';

function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Try session /me first
      try {
        const { user: me } = await getMe();
        if (!cancelled && me) {
          setUserId(me.id);
          setUser(me);
          localStorage.setItem('userId', String(me.id));
          localStorage.setItem('handle', me.handle);
          setChecking(false);
          return;
        }
      } catch (_) {
        // me failed or returned null
      }

      // 2. Try stored userId in localStorage
      const stored = localStorage.getItem('userId');
      if (stored) {
        const id = parseInt(stored, 10);
        if (!isNaN(id)) {
          try {
            const fresh = await getUser(id);
            if (!cancelled && fresh && fresh.id) {
              setUserId(fresh.id);
              setUser(fresh);
              localStorage.setItem('handle', fresh.handle);
              setChecking(false);
              return;
            }
          } catch (_) {
            // Stale user in localStorage — clear it
            localStorage.removeItem('userId');
            localStorage.removeItem('handle');
          }
        }
      }

      if (!cancelled) {
        setUserId(null);
        setUser(null);
        setChecking(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = (id: number) => {
    setUserId(id);
    getUser(id).then(u => {
      setUser(u);
      localStorage.setItem('handle', u.handle);
    }).catch(() => {});
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      // ignore network errors on logout
    }
    localStorage.removeItem('userId');
    localStorage.removeItem('handle');
    setUserId(null);
    setUser(null);
    navigate('/');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <span className="w-6 h-6 border-2 border-t-[var(--color-accent)] rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!userId) {
    return <HandleEntry onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header theme={theme} onToggleTheme={toggleTheme} handle={user?.handle || ''} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 page-bg">
        <Routes>
          <Route path="/" element={<Navigate to="/daily" replace />} />
          <Route path="/daily" element={<DailyTargets userId={userId} user={user} />} />
          <Route path="/stats" element={<StatsPage userId={userId} />} />
          <Route path="/profile" element={<ProfilePage userId={userId} />} />
          <Route path="/feed" element={<ProblemFeed userId={userId} />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/learn" element={<LearnPage userId={userId} />} />
          <Route path="/arena" element={<ArenaPage userId={userId} />} />
          <Route path="/settings" element={<Settings userId={userId} user={user} onUserChange={setUser} onLogout={handleLogout} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
