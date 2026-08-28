import { useState, useEffect } from 'react';
import { getUser, User } from '../api';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      getUser(parseInt(id, 10))
        .then(setUser)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('handle');
    setUser(null);
  };

  return { user, setUser, loading, error, logout };
}
