import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getDaily, syncSolves, DailyResponse } from '../api';

export function useDaily(userId: number | undefined) {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const location = useLocation();
  const syncingRef = useRef(false);

  const fetchDaily = useCallback((force = false, level?: number) => {
    if (!userId) return;
    setLoading(true);
    getDaily(userId, force, level)
      .then(setDaily)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const sync = useCallback(async (force = false, level?: number) => {
    if (!userId || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncSolves(userId);
      const res = await getDaily(userId, force, level);
      setDaily(res);
      setError(null);
    } catch (err: any) {
      console.warn('Sync warning:', err.message);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and sync on mount / route change
  useEffect(() => {
    if (!userId) return;
    sync(false);
  }, [userId, location.pathname, location.key, sync]);

  // Periodic background auto-sync every 20 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !syncingRef.current) {
        sync(false);
      }
    }, 20000);

    const onFocus = () => {
      if (!syncingRef.current) {
        sync(false);
      }
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, sync]);

  return { daily, loading, error, refetch: fetchDaily, sync, syncing };
}
