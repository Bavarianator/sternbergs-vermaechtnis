// Serverless backend for the static GitHub Pages build.
// Answers are only stored as salted SHA-256 hashes; runs and leaderboard live in localStorage.
import { HINTS, norm } from '../../shared/hints.js';
import { start, press, N } from '../../shared/lightsout.js';

const HINT_PENALTY_MS = 60_000;
const HASHES = {
  r1_safe: 'f50ae48ca3ee10ef83ba5649f9465cd1ee180d065d91c8e43e927d94bada6633',
  r1_door: '652cbcd4938a63c02a3ab7f7a5b5513078fbf608984ebd92529f6f5e07990982',
  r2_terminal: 'fa44e0bd8f34544c9eb9d78c58eaa14ce491460d1e869627c16a91e067ada898',
  r2_cabinet: 'b07ce2693d634ff15dbbb9b643f5b10b01ddb6fbedbae65a21938ec53a05c44d',
  r2_door: '763e4102d412bd7375a38dac0f7a39edda7f739b0d50c993141f7dc0b1fc6823',
  r3_chart: '4d83d396456b5d86f79d6eb966ee2fbe31a7b89914fda68652902d91fee676b8',
  r3_door: '4ae2ed462f402031e09591b5819597dbe6c566e820bee4a8cb54b74293610ca7',
};
const PUZZLE_IDS = Object.keys(HINTS);

async function sha(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sternberg:' + s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAnswer(puzzleId, answer) {
  if (puzzleId === 'r3_panel')
    return Array.isArray(answer) && answer.every((i) => Number.isInteger(i) && i >= 0 && i < N * N) && answer.reduce(press, start()).every((v) => !v);
  return Object.hasOwn(HASHES, puzzleId) && (await sha(norm(answer))) === HASHES[puzzleId];
}

const KEY = 'sternberg-offline-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? { runs: {} }; } catch { return { runs: {} }; } };
const store = (db) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
const fail = (status, error) => { throw Object.assign(new Error(error), { status }); };

export async function post(url, body = {}) {
  const db = load();
  if (url === '/api/run') {
    const id = crypto.randomUUID();
    db.runs[id] = { started: Date.now(), penalty: 0, solved: [], hints: {} };
    store(db);
    return { runId: id };
  }
  const run = db.runs[body.runId] ?? fail(404, 'Unbekannter Durchlauf');
  if (url === '/api/solve') {
    if (!PUZZLE_IDS.includes(body.puzzleId)) fail(400, 'Unbekanntes Rätsel');
    if (!(await checkAnswer(body.puzzleId, body.answer))) return { ok: false };
    if (!run.solved.includes(body.puzzleId)) run.solved.push(body.puzzleId);
    const finished = PUZZLE_IDS.every((id) => run.solved.includes(id));
    if (finished) run.finished ??= Date.now();
    store(db);
    return finished ? { ok: true, finished, timeMs: run.finished - run.started + run.penalty } : { ok: true };
  }
  if (url === '/api/hint') {
    const hints = HINTS[body.puzzleId] ?? fail(400, 'Unbekanntes Rätsel');
    let used = run.hints[body.puzzleId] ?? 0;
    if (used < hints.length) { run.hints[body.puzzleId] = ++used; run.penalty += HINT_PENALTY_MS; }
    store(db);
    return { hints: hints.slice(0, used), penalty: run.penalty, left: hints.length - used };
  }
  if (url === '/api/score') {
    const name = String(body.name ?? '').trim().slice(0, 20) || fail(400, 'Name fehlt');
    if (!run.finished || run.name) fail(409, 'Durchlauf nicht beendet oder schon eingetragen');
    run.name = name;
    store(db);
    return { ok: true };
  }
  fail(404, 'Unbekannter Endpunkt');
}

export const leaderboard = async () =>
  Object.values(load().runs)
    .filter((r) => r.finished && r.name)
    .map((r) => ({ name: r.name, ms: r.finished - r.started + r.penalty }))
    .sort((a, b) => a.ms - b.ms)
    .slice(0, 10);
