import { useState, useEffect, useCallback } from 'react';
import { getStats, StatsResponse } from '../api';

export function useStats(userId: number | undefined) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    getStats(userId)
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
