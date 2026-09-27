import * as api from './api.js';

const KEY = 'sternberg-save-v1';

// Client-side progress. The server is the authority for answers and time.
export const game = {
  state: null,
  onChange: () => {},
  onFinish: () => {},
  onError: () => {},
  nextRoom: () => {},

  saved() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  },
  async newRun() {
    const { runId } = await api.post('/api/run');
    this.state = { runId, startedAt: Date.now(), room: 0, items: [], flags: {}, notes: [], hints: {}, penalty: 0 };
    this.save();
  },
  resume(s) { this.state = s; this.onChange(); },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {}
    this.onChange();
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch {}
  },

  has: (id) => game.state.items.some((i) => i.id === id),
  give(id, name, icon, desc) {
    if (!this.has(id)) this.state.items.push({ id, name, icon, desc });
    this.save();
  },
  flag: (k) => !!game.state.flags[k],
  set(k) { this.state.flags[k] = true; this.save(); },

  addNote(title, html) {
    if (!this.state.notes.some((n) => n.title === title)) this.state.notes.push({ title, html });
    this.save();
  },

  elapsed() { return Date.now() - this.state.startedAt + this.state.penalty; },

  async solve(puzzleId, answer) {
    try {
      const r = await api.post('/api/solve', { runId: this.state.runId, puzzleId, answer });
      if (r.ok) this.set('solved:' + puzzleId);
      if (r.finished) {
        this.state.finishedMs = r.timeMs;
        this.save();
        this.onFinish(r.timeMs);
      }
      return r.ok;
    } catch (e) {
      this.onError(e);
      return false;
    }
  },
  solved: (puzzleId) => game.flag('solved:' + puzzleId),

  async hint(puzzleId) {
    try {
      const r = await api.post('/api/hint', { runId: this.state.runId, puzzleId });
      this.state.hints[puzzleId] = r.hints;
      this.state.penalty = r.penalty;
      this.save();
      return r;
    } catch (e) {
      this.onError(e);
    }
  },
};
