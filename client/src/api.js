import * as offline from './offline.js';

// GitHub Pages build has no server: VITE_STATIC=1 swaps in the localStorage backend.
export const STATIC = import.meta.env.VITE_STATIC === '1';

export async function post(url, body = {}) {
  if (STATIC) return offline.post(url, body);
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `HTTP ${res.status}`), { status: res.status });
  return data;
}

export const leaderboard = () => STATIC ? offline.leaderboard() : fetch('/api/leaderboard').then((r) => (r.ok ? r.json() : []));
