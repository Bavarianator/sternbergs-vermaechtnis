import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PUZZLES, HINT_PENALTY_MS } from './puzzles.js';
import * as db from './db.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

function loadRun(req, res) {
  const run = db.getRun(req.body?.runId);
  if (!run) res.status(404).json({ error: 'Unbekannter Durchlauf' });
  return run;
}

function loadPuzzle(req, res) {
  const puzzle = Object.hasOwn(PUZZLES, req.body?.puzzleId) && PUZZLES[req.body.puzzleId];
  if (!puzzle) res.status(400).json({ error: 'Unbekanntes Rätsel' });
  return puzzle;
}

app.post('/api/run', (req, res) => res.json({ runId: db.createRun() }));

app.post('/api/solve', (req, res) => {
  const run = loadRun(req, res);
  const puzzle = run && loadPuzzle(req, res);
  if (!puzzle) return;
  if (!puzzle.check(req.body.answer)) return res.json({ ok: false });

  db.markSolved(run.id, req.body.puzzleId);
  const solved = db.solvedIds(run.id);
  const finished = Object.keys(PUZZLES).every((id) => solved.includes(id));
  if (!finished) return res.json({ ok: true });

  db.finish(run.id);
  const r = db.getRun(run.id);
  res.json({ ok: true, finished: true, timeMs: r.finished - r.started + r.penalty });
});

app.post('/api/hint', (req, res) => {
  const run = loadRun(req, res);
  const puzzle = run && loadPuzzle(req, res);
  if (!puzzle) return;
  let used = db.hintsUsed(run.id, req.body.puzzleId);
  if (used < puzzle.hints.length) db.useHint(run.id, req.body.puzzleId, ++used, HINT_PENALTY_MS);
  res.json({ hints: puzzle.hints.slice(0, used), penalty: db.getRun(run.id).penalty, left: puzzle.hints.length - used });
});

app.post('/api/score', (req, res) => {
  const run = loadRun(req, res);
  if (!run) return;
  const name = String(req.body.name ?? '').trim().slice(0, 20);
  if (!name) return res.status(400).json({ error: 'Name fehlt' });
  if (!db.setName(run.id, name)) return res.status(409).json({ error: 'Durchlauf nicht beendet oder schon eingetragen' });
  res.json({ ok: true });
});

app.get('/api/leaderboard', (req, res) => res.json(db.leaderboard()));

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (existsSync(dist)) app.use(express.static(dist));

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API läuft auf http://localhost:${port}`));
