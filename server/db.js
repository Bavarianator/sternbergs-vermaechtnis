import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../data/', import.meta.url));
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(process.env.DB_PATH ?? dir + 'escape.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    started INTEGER NOT NULL,
    finished INTEGER,
    penalty INTEGER NOT NULL DEFAULT 0,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS solves (
    run_id TEXT NOT NULL REFERENCES runs(id),
    puzzle_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (run_id, puzzle_id)
  );
  CREATE TABLE IF NOT EXISTS hints (
    run_id TEXT NOT NULL REFERENCES runs(id),
    puzzle_id TEXT NOT NULL,
    used INTEGER NOT NULL,
    PRIMARY KEY (run_id, puzzle_id)
  );
`);

export function createRun() {
  const id = randomUUID();
  db.prepare('INSERT INTO runs (id, started) VALUES (?, ?)').run(id, Date.now());
  return id;
}

export const getRun = (id) =>
  typeof id === 'string' ? db.prepare('SELECT * FROM runs WHERE id = ?').get(id) : undefined;

export const markSolved = (runId, puzzleId) =>
  db.prepare('INSERT OR IGNORE INTO solves VALUES (?, ?, ?)').run(runId, puzzleId, Date.now());

export const solvedIds = (runId) =>
  db.prepare('SELECT puzzle_id FROM solves WHERE run_id = ?').all(runId).map((r) => r.puzzle_id);

export const finish = (runId) =>
  db.prepare('UPDATE runs SET finished = ? WHERE id = ? AND finished IS NULL').run(Date.now(), runId);

export const hintsUsed = (runId, puzzleId) =>
  db.prepare('SELECT used FROM hints WHERE run_id = ? AND puzzle_id = ?').get(runId, puzzleId)?.used ?? 0;

export function useHint(runId, puzzleId, used, penaltyMs) {
  db.prepare('INSERT INTO hints VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET used = excluded.used').run(runId, puzzleId, used);
  db.prepare('UPDATE runs SET penalty = penalty + ? WHERE id = ?').run(penaltyMs, runId);
}

export const setName = (runId, name) =>
  db.prepare('UPDATE runs SET name = ? WHERE id = ? AND finished IS NOT NULL AND name IS NULL').run(name, runId).changes > 0;

export const leaderboard = () =>
  db.prepare(`
    SELECT name, finished - started + penalty AS ms, penalty
    FROM runs WHERE finished IS NOT NULL AND name IS NOT NULL
    ORDER BY ms LIMIT 10
  `).all();
