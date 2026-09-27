import { start, press, N } from '../shared/lightsout.js';
import { HINTS, norm } from '../shared/hints.js';

// Solutions live only here, never in the client bundle.
const eq = (solution) => (a) => norm(a) === solution;

export const HINT_PENALTY_MS = 60_000;

export const PUZZLES = {
  r1_safe: {
    check: eq('GALILEI'),
  },
  r1_door: {
    check: eq('3782'),
  },
  r2_terminal: {
    check: eq('ARSEN'),
  },
  r2_cabinet: {
    check: eq('YELLOW,RED,BLUE,VIOLET,GREEN'),
  },
  r2_door: {
    check: eq('4916'),
  },
  r3_panel: {
    // Answer is the full press history; replay it from the start state.
    check: (a) =>
      Array.isArray(a) &&
      a.length < 5000 &&
      a.every((i) => Number.isInteger(i) && i >= 0 && i < N * N) &&
      a.reduce(press, start()).every((v) => v === 0),
  },
  r3_chart: {
    check: eq('1293'),
  },
  r3_door: {
    check: eq('FREIHEIT'),
  },
};

for (const [id, p] of Object.entries(PUZZLES)) p.hints = HINTS[id];
