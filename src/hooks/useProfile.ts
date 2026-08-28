import { useState, useEffect, useCallback } from 'react';
import { getProfile, ProfileResponse } from '../api';

export function useProfile(userId: number | undefined) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    getProfile(userId)
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
