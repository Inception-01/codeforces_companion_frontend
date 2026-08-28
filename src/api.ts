// API base URL.
// - Local dev: left as '/api' (the Vite dev proxy forwards /api -> the backend).
// - Vercel/Render split deploy: set VITE_API_BASE to the hosted backend URL,
//   e.g. VITE_API_BASE=https://cf-companion-api.onrender.com
const API_ORIGIN = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');
const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export interface User {
  id: number;
  handle: string;
  daily_target_count: number;
  rating_min: number;
  rating_max: number;
  selected_tags: string[];
}

export interface UserSettings {
  handle: string;
  daily_target_count: number;
  rating_min: number;
  rating_max: number;
  selected_tags: string[];
}

export interface Problem {
  id: number;
  contest_id: number;
  problem_index: string;
  name: string;
  rating: number;
  tags: string[];
  solved_count: number;
  solved?: number;
}

export type DailyProblem = Problem & { solved_at: string | null; assigned_date: string };

export interface DailyResponse {
  today: DailyProblem[];
  overdue: DailyProblem[];
  date: string;
}

export interface DailyHistoryItem {
  date: string;
  solved: number;
  total: number;
}

export interface ProblemQuery {
  ratingMin?: number;
  ratingMax?: number;
  tags?: string[];
  page?: number;
  order?: 'asc' | 'desc';
  userId?: number;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
}

export interface StatsResponse {
  heatmap: Record<string, number>;
  streaks: { current: number; longest: number; average: number };
  dailyCompletion: { met: number; partial: number; missed: number };
  ratingDistribution: Record<string, number>;
  tagBreakdown: Record<string, number>;
  autoAdvance?: { min: number; max: number };
}

export interface SyncResponse {
  synced: number;
  newlySolved: number;
}

export interface RatingPoint {
  rating: number;
  oldRating: number;
  contestName: string;
  rank: number;
  time: number;
}

export interface ProfileResponse {
  handle: string;
  totalSolved: number;
  rating: number | null;
  maxRating: number | null;
  ratingHistory: RatingPoint[];
}

export const createUser = (handle: string) => apiFetch<User>('/user', { method: 'POST', body: JSON.stringify({ handle }) });
export const getUser = (id: number) => apiFetch<User>(`/user/${id}`);
export const updateUser = (id: number, data: Partial<UserSettings>) => apiFetch<User>(`/user/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const getMe = () => apiFetch<{ user: User | null }>('/auth/me');
export const logout = () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' });

export const getProblems = (params: ProblemQuery) => {
  const sp = new URLSearchParams();
  if (params.ratingMin) sp.append('ratingMin', params.ratingMin.toString());
  if (params.ratingMax) sp.append('ratingMax', params.ratingMax.toString());
  if (params.page) sp.append('page', params.page.toString());
  if (params.order) sp.append('order', params.order);
  if (params.userId) sp.append('userId', params.userId.toString());
  if (params.tags) params.tags.forEach(t => sp.append('tags', t));
  return apiFetch<ProblemListResponse>(`/problems?${sp.toString()}`);
};
export const refreshProblems = () => apiFetch<{count: number}>('/problems/refresh', { method: 'POST' });
export const setProblemStatus = (id: string, userId: number, solved: boolean) =>
  apiFetch<{ id: string; solved: number }>(`/problems/${id}/status`, { method: 'POST', body: JSON.stringify({ userId, solved }) });

export const getDaily = (userId: number, force = false, level?: number) => {
  const params: string[] = [];
  if (force) params.push('force=1');
  if (level) params.push(`level=${level}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return apiFetch<DailyResponse>(`/daily/${userId}${qs}`);
};
export const getDailyHistory = (userId: number) => apiFetch<DailyHistoryItem[]>(`/daily/${userId}/history`);

export const syncSolves = (userId: number) => apiFetch<SyncResponse>(`/sync/${userId}`, { method: 'POST' });

export const getStats = (userId: number) => apiFetch<StatsResponse>(`/stats/${userId}`);

export const getProfile = (userId: number) => apiFetch<ProfileResponse>(`/profile/${userId}`);

export interface Contest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
  relativeTimeSeconds: number;
  url: string;
}

export interface ContestsResponse {
  upcoming: Contest[];
  past: Contest[];
  serverTime: number;
}

export interface LearnArticle {
  title: string;
  key: string;
  url: string;
}

export interface LearnSubmodule {
  id: string;
  name: string;
  articles: LearnArticle[];
}

export interface LearnModule {
  id: string;
  name: string;
  articles: LearnArticle[];
  submodules: LearnSubmodule[];
}

export interface LearnSummarySubmodule {
  id: string;
  name: string;
  total: number;
  completed: number;
  percent: number;
}

export interface LearnSummaryModule {
  id: string;
  name: string;
  submodules: LearnSummarySubmodule[];
  total: number;
  completed: number;
  percent: number;
}

export interface LearnSummary {
  modules: LearnSummaryModule[];
  totalArticles: number;
  totalCompleted: number;
  overallPercent: number;
}

export interface LearnProgressResponse {
  modules: LearnModule[];
  completedKeys: string[];
  summary: LearnSummary;
}

export const getContests = () => apiFetch<ContestsResponse>('/contests');
export const getCurriculum = () => apiFetch<{ modules: LearnModule[] }>('/learn/curriculum');
export const getLearnProgress = (userId: number) => apiFetch<LearnProgressResponse>(`/learn/progress/${userId}`);
export const setArticleProgress = (userId: number, articleKey: string, completed: boolean) =>
  apiFetch<{ completedKeys: string[]; summary: LearnSummary }>(`/learn/progress/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ articleKey, completed }),
  });

export const getExportUrl = (userId: number, format: 'json' | 'csv') => `${BASE}/export/${userId}?format=${format}`;

// --- Arena ---
export type ArenaSessionState = 'idle' | 'running' | 'paused';

export interface ArenaSession {
  problem_id: string | null;
  problem_name: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  state: ArenaSessionState;
  elapsedMs: number;
  startedAt: number | null;
  serverTime: number;
}

export interface ArenaLogEntry {
  id: number;
  problem_id: string | null;
  problem_name: string | null;
  difficulty: string | null;
  solved: boolean;
  time_ms: number;
  created_at: string;
}

export interface ArenaStats {
  solved: number;
  attempted: number;
  avgMs: number | null;
  fastestMs: number | null;
  streakDays: number;
  totalDays: number;
}

export interface ArenaResponse {
  session: ArenaSession;
  log: ArenaLogEntry[];
  stats: ArenaStats;
}

export interface ArenaSearchItem {
  id: string;
  contest_id: number;
  problem_index: string;
  name: string;
  rating: number | null;
  tags: string[];
}

export const getArena = (userId: number) => apiFetch<ArenaResponse>(`/arena/${userId}`);
export const startArena = (userId: number, opts: { problemId?: string; problemName?: string; difficulty?: string }) =>
  apiFetch<{ session: ArenaSession }>(`/arena/${userId}/start`, { method: 'POST', body: JSON.stringify(opts) });
export const toggleArenaPause = (userId: number) =>
  apiFetch<{ session: ArenaSession }>(`/arena/${userId}/pause`, { method: 'POST' });
export const finishArena = (userId: number, solved: boolean, difficulty?: string) =>
  apiFetch<ArenaResponse>(`/arena/${userId}/finish`, { method: 'POST', body: JSON.stringify({ solved, difficulty }) });
export const resetArena = (userId: number) =>
  apiFetch<{ session: ArenaSession }>(`/arena/${userId}/reset`, { method: 'POST' });
export const clearArenaLog = (userId: number) =>
  apiFetch<{ ok: boolean; stats: ArenaStats }>(`/arena/${userId}/log`, { method: 'DELETE' });
export const searchArenaProblems = (userId: number, q: string, limit = 15) =>
  apiFetch<{ problems: ArenaSearchItem[] }>(`/arena/${userId}/search?q=${encodeURIComponent(q)}&limit=${limit}`);
