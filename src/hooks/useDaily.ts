import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getDaily, syncSolves, DailyResponse } from '../api';

export function useDaily(userId: number | undefined) {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const location = useLocation();

  const fetchDaily = useCallback((force = false, level?: number) => {
    if (!userId) return;
    setLoading(true);
    getDaily(userId, force, level)
      .then(setDaily)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  const sync = async (force = false, level?: number) => {
    if (!userId) return;
    setSyncing(true);
    setLoading(true);
    try {
      await syncSolves(userId);
      await fetchDaily(force, level);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } finally {
      setSyncing(false);
    }
  };

  // Auto-refresh daily targets so they always reflect current settings
  // (target count, rating level) and the latest solve history. Runs on mount
  // and every time the user navigates back to this page (location.key changes
  // on each navigation). Passes force=true so today's set is regenerated from
  // the latest solve history instead of showing a stale assignment.
  useEffect(() => {
    if (!userId) return;
    syncSolves(userId)
      .then(() => fetchDaily(true))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, location.pathname, location.key]);

  return { daily, loading, error, refetch: fetchDaily, sync, syncing };
}
