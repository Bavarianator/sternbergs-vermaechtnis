import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../server/puzzles.js';
import { start, START_PRESSES } from '../shared/lightsout.js';
import { checkAnswer } from '../client/src/offline.js';

const shift = (s, k) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65));

test('Uhr 5:34 ergibt kleinen Winkel 37°', () => {
  const hour = 5 * 30 + 34 * 0.5, minute = 34 * 6;
  assert.equal(Math.min(Math.abs(hour - minute), 360 - Math.abs(hour - minute)), 37);
});

test('Bücher in Spektralreihenfolge ergeben GALILEI', () => {
  const shelf = { blue: 'L', brown: 'K', violet: 'I', red: 'G', yellow: 'L', black: 'O', indigo: 'E', orange: 'A', white: 'P', green: 'I', gray: 'R' };
  const word = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'].map((c) => shelf[c]).join('');
  assert.ok(PUZZLES.r1_safe.check(word));
});

test('Farb-Logikrätsel hat genau eine Lösung', () => {
  const perms = (a) => (a.length ? a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])) : [[]]);
  const valid = perms(['RED', 'BLUE', 'GREEN', 'YELLOW', 'VIOLET']).filter((p) => {
    const pos = (c) => p.indexOf(c) + 1;
    return pos('BLUE') === pos('RED') + 1
      && pos('GREEN') !== 1 && pos('GREEN') !== 3 && Math.abs(pos('GREEN') - pos('YELLOW')) !== 1
      && pos('VIOLET') % 2 === 0
      && pos('YELLOW') < pos('VIOLET')
      && pos('BLUE') % 2 === 1;
  });
  assert.equal(valid.length, 1);
  assert.ok(PUZZLES.r2_cabinet.check(valid[0].join(',')));
});

test('Caesar +5 an der UV-Wand', () => {
  assert.equal(shift('VIER NEUN EINS SECHS', 5), 'ANJW SJZS JNSX XJHMX');
  assert.ok(PUZZLES.r2_door.check('4916'));
});

test('Mondphasen oktal 2415 = 1293', () => {
  assert.equal(parseInt('2415', 8), 1293);
  assert.ok(PUZZLES.r3_chart.check('1293'));
});

test('Vigenère FREIHEIT mit GALILEI', () => {
  const key = 'GALILEI';
  const enc = [...'FREIHEIT'].map((c, i) => shift(c, key.charCodeAt(i % key.length) - 65)).join('');
  assert.equal(enc, 'LRPQSIQZ');
});

test('Lights Out: Start ist nicht gelöst, Rückspielen löst es', () => {
  assert.ok(start().some(Boolean));
  assert.ok(PUZZLES.r3_panel.check(START_PRESSES));
  assert.ok(!PUZZLES.r3_panel.check([0]));
  assert.ok(!PUZZLES.r3_panel.check(['x']));
});

test('Antworten werden normalisiert', () => {
  assert.ok(PUZZLES.r1_safe.check(' galilei '));
  assert.ok(PUZZLES.r2_terminal.check('Ar-Se-N'));
  assert.ok(!PUZZLES.r1_door.check('3781'));
});

test('Statischer Modus akzeptiert dieselben Antworten wie der Server', async () => {
  const answers = { r1_safe: 'galilei', r1_door: '3782', r2_terminal: 'ARSEN', r2_cabinet: 'YELLOW,RED,BLUE,VIOLET,GREEN', r2_door: '4916', r3_chart: '1293', r3_door: 'Freiheit', r3_panel: START_PRESSES };
  for (const [id, a] of Object.entries(answers)) {
    assert.ok(await checkAnswer(id, a), id);
    assert.equal(await checkAnswer(id, a), PUZZLES[id].check(a), id);
  }
  assert.ok(!(await checkAnswer('r1_door', '0000')));
});
