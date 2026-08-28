import { useState, useEffect, useCallback } from 'react';
import { getProblems, Problem, ProblemQuery } from '../api';

export function useProblems(params: ProblemQuery) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(() => {
    setLoading(true);
    getProblems(params)
      .then(res => {
        setProblems(res.problems);
        setTotal(res.total);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, total, loading, error };
}
