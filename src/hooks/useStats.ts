import { useState, useEffect, useCallback, useRef } from 'react';
import { getStats, syncSolves, StatsResponse } from '../api';

export function useStats(userId: number | undefined) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const fetchStats = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    getStats(userId)
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const sync = useCallback(async () => {
    if (!userId || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncSolves(userId);
      const res = await getStats(userId);
      setStats(res);
      setError(null);
    } catch (err: any) {
      console.warn('Stats sync warning:', err.message);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      setLoading(false);
    }
  }, [userId]);

  // Initial sync & fetch on mount
  useEffect(() => {
    if (!userId) return;
    sync();
  }, [userId, sync]);

  // Periodic background auto-sync every 20 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !syncingRef.current) {
        sync();
      }
    }, 20000);

    const onFocus = () => {
      if (!syncingRef.current) {
        sync();
      }
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, sync]);

  return { stats, loading, syncing, error, refetch: fetchStats, sync };
}
