import { game } from './game.js';
import { N, press, start } from '../../shared/lightsout.js';

export const hooks = { unlock() {}, lock() {} };

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v);
  }
  el.append(...kids.flat().filter((x) => x != null && x !== false));
  return el;
}

const root = document.getElementById('modal-root');
let current = null;

export const isOpen = () => !!current;

export function modal(title, body, { wide = false, onClose } = {}) {
  close(false);
  hooks.unlock();
  const content = h('div', { class: 'body' }, body);
  const box = h('div', { class: 'modal' + (wide ? ' wide' : '') },
    h('header', {}, h('h2', {}, title), h('button', { onclick: () => close() }, '✕')),
    content);
  const back = h('div', { class: 'back', onmousedown: (e) => e.target === back && close() }, box);
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  root.append(back);
  current = { back, box, onClose, onKey };
  return { box, content, close };
}

export function close(relock = true) {
  if (!current) return;
  const { back, onClose, onKey } = current;
  current = null;
  document.removeEventListener('keydown', onKey);
  back.remove();
  onClose?.();
  if (relock) hooks.lock();
}

export function toast(msg, bad = false) {
  const el = h('div', { class: 'toast' + (bad ? ' bad' : '') }, msg);
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3200);
}

function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

// Shows a note and stores it in the notebook.
export function note(title, html, { terminal = false } = {}) {
  game.addNote(title, html);
  modal(title, h('div', { class: terminal ? 'terminal' : 'paper', html }));
}

export function notebook() {
  const notes = game.state.notes;
  modal('Notizbuch', notes.length
    ? notes.map((n) => h('details', { style: 'margin-bottom:10px' },
        h('summary', { style: 'cursor:pointer;color:var(--gold)' }, n.title),
        h('div', { class: 'paper', style: 'margin-top:8px', html: n.html })))
    : h('p', { class: 'muted' }, 'Noch keine Notizen. Untersuche den Raum!'), { wide: true });
}

function hintBox(puzzleId) {
  const list = h('ol');
  const render = (hints = []) => list.replaceChildren(...hints.map((t) => h('li', {}, t)));
  render(game.state.hints[puzzleId]);
  const btn = h('button', {
    onclick: async () => {
      const r = await game.hint(puzzleId);
      if (!r) return;
      render(r.hints);
      if (!r.left) btn.disabled = true;
    },
  }, 'Hinweis anfordern (+60 s)');
  if ((game.state.hints[puzzleId]?.length ?? 0) >= 2) btn.disabled = true;
  return h('div', { class: 'hintbox' }, btn, list);
}

async function attempt(puzzleId, answer, box, onSolved) {
  if (await game.solve(puzzleId, answer)) {
    toast('✔ Richtig!');
    close();
    onSolved?.();
    return true;
  }
  shake(box);
  toast('Falsch.', true);
  return false;
}

export function keypad({ title, puzzleId, length = 4, intro, onSolved }) {
  let code = '';
  const display = h('div', { class: 'display' });
  const render = () => (display.textContent = code.padEnd(length, '·'));
  const add = (d) => { if (code.length < length) code += d; render(); };
  const submit = async () => {
    if (code.length !== length) return;
    const ok = await attempt(puzzleId, code, m.box, onSolved);
    if (!ok) { code = ''; render(); }
  };
  const keys = h('div', { class: 'keys' },
    ...'123456789'.split('').map((d) => h('button', { onclick: () => add(d) }, d)),
    h('button', { onclick: () => { code = ''; render(); } }, 'C'),
    h('button', { onclick: () => add('0') }, '0'),
    h('button', { class: 'primary', onclick: submit }, '⏎'));
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) add(e.key);
    else if (e.key === 'Backspace') { code = code.slice(0, -1); render(); }
    else if (e.key === 'Enter') submit();
  };
  document.addEventListener('keydown', onKey);
  const m = modal(title, [intro && h('p', {}, intro), display, keys, hintBox(puzzleId)], {
    onClose: () => document.removeEventListener('keydown', onKey),
  });
  render();
}

export function textLock({ title, puzzleId, intro, placeholder = '', maxLength = 20, onSolved }) {
  const input = h('input', { placeholder, maxlength: maxLength, autocomplete: 'off', spellcheck: 'false' });
  const form = h('form', {
    class: 'textlock',
    onsubmit: async (e) => {
      e.preventDefault();
      if (!(await attempt(puzzleId, input.value, m.box, onSolved))) input.select();
    },
  }, input, h('button', { class: 'primary' }, 'Prüfen'));
  const m = modal(title, [intro && h('div', { style: 'margin-bottom:12px', html: intro }), form, hintBox(puzzleId)]);
  input.focus();
}

export const COLORS = [
  { key: 'RED', css: '#d0282e' },
  { key: 'BLUE', css: '#2766d4' },
  { key: 'GREEN', css: '#2f9a3f' },
  { key: 'YELLOW', css: '#f0cf30' },
  { key: 'VIOLET', css: '#9c3fd0' },
];

export function colorLock({ title, puzzleId, intro, onSolved }) {
  let seq = [];
  const seqEl = h('div', { class: 'seq' });
  const render = () => seqEl.replaceChildren(...seq.map((c) => h('span', { style: `background:${c.css}` })));
  const pick = async (c) => {
    if (seq.includes(c)) return;
    seq.push(c);
    render();
    if (seq.length === COLORS.length) {
      const ok = await attempt(puzzleId, seq.map((s) => s.key).join(','), m.box, onSolved);
      if (!ok) { seq = []; render(); }
    }
  };
  const m = modal(title, [
    intro && h('p', {}, intro),
    h('div', { class: 'colors' }, COLORS.map((c) => h('button', { style: `background:${c.css}`, onclick: () => pick(c) }))),
    seqEl,
    h('div', { class: 'buttons' }, h('button', { onclick: () => { seq = []; render(); } }, 'Zurücksetzen')),
    hintBox(puzzleId),
  ]);
}

export function lightsOut({ onChange, onSolved }) {
  const s = game.state;
  s.lightPresses ??= [];
  const grid = () => s.lightPresses.reduce(press, start());
  const cells = Array.from({ length: N * N }, (_, i) => h('button', { onclick: () => tap(i) }));
  const counter = h('span', { class: 'muted' });
  const render = () => {
    const g = grid();
    cells.forEach((c, i) => c.classList.toggle('on', !!g[i]));
    counter.textContent = `Schaltvorgänge: ${s.lightPresses.length}`;
    onChange?.(g);
    return g;
  };
  const tap = async (i) => {
    s.lightPresses.push(i);
    game.save();
    if (render().every((v) => !v)) await attempt('r3_panel', s.lightPresses, m.box, onSolved);
  };
  const m = modal('Steuerkonsole – Energieverteilung', [
    h('p', {}, 'Alle 25 Relais müssen dunkel sein, damit der Strom zum Teleskop fließt. Jeder Schalter kippt sich selbst und seine direkten Nachbarn.'),
    h('div', { class: 'grid5' }, cells),
    h('div', { class: 'buttons' }, counter, h('button', { onclick: () => { s.lightPresses = []; game.save(); render(); } }, 'Neustart')),
    hintBox('r3_panel'),
  ]);
  render();
}

export function image(title, canvas, caption) {
  modal(title, [canvas, caption && h('p', { class: 'muted', style: 'text-align:center', html: caption })], { wide: true });
}
