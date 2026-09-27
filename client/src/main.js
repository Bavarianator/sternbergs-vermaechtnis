import './style.css';
import { Engine } from './engine.js';
import { game } from './game.js';
import * as ui from './ui.js';
import * as api from './api.js';
import room1 from './rooms/room1.js';
import room2 from './rooms/room2.js';
import room3 from './rooms/room3.js';

const ROOMS = [room1, room2, room3];
const $ = (id) => document.getElementById(id);

const fmt = (ms) => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

const engine = new Engine($('app'));
let playing = false;

ui.hooks.unlock = () => engine.controls.unlock();
ui.hooks.lock = () => playing && engine.lock();

engine.controls.addEventListener('lock', () => ($('pause').hidden = true));
engine.controls.addEventListener('unlock', () => {
  // Opening a modal also unlocks; only show the pause screen for a real pause.
  setTimeout(() => ($('pause').hidden = !playing || ui.isOpen() || engine.controls.isLocked), 0);
});
$('pause').addEventListener('click', () => engine.lock());
document.addEventListener('pointerlockerror', () => ($('pause').hidden = !playing || ui.isOpen()));

engine.onHover = (label) => {
  $('hover-label').textContent = label ?? '';
  $('crosshair').classList.toggle('active', !!label);
};

addEventListener('keydown', (e) => {
  if (playing && e.code === 'KeyN' && !ui.isOpen() && document.activeElement.tagName !== 'INPUT') ui.notebook();
});
$('btn-notes').addEventListener('click', () => ui.notebook());

function renderInventory() {
  $('inventory').replaceChildren(...game.state.items.map((it) =>
    ui.h('div', { class: 'item', title: it.name, onclick: () => ui.modal(it.name, ui.h('p', {}, it.desc)) }, it.icon)));
}
game.onChange = () => game.state && renderInventory();
game.onError = (e) => {
  ui.toast(e.status === 404 ? 'Spielstand auf dem Server nicht gefunden – bitte neu starten.' : 'Verbindung zum Server fehlgeschlagen.', true);
};

setInterval(() => {
  if (playing) $('timer').textContent = fmt(game.state.finishedMs ?? game.elapsed());
}, 250);

function enterRoom(i) {
  game.state.room = i;
  game.save();
  const info = engine.load(ROOMS[i]);
  $('room-name').textContent = info.name;
  ui.toast(info.name);
}

game.nextRoom = () => {
  if (game.state.room >= ROOMS.length - 1) return;
  $('fade').classList.add('on');
  setTimeout(() => {
    enterRoom(game.state.room + 1);
    $('fade').classList.remove('on');
  }, 800);
};

function play() {
  playing = true;
  $('start').hidden = $('end').hidden = true;
  $('hud').hidden = false;
  renderInventory();
  enterRoom(game.state.room);
  engine.lock();
}

async function renderBoard(el) {
  const rows = await api.leaderboard().catch(() => []);
  el.replaceChildren(...(rows.length
    ? rows.map((r) => ui.h('li', {}, ui.h('span', {}, r.name), ui.h('span', {}, fmt(r.ms))))
    : [ui.h('p', { class: 'muted' }, 'Noch niemand ist entkommen.')]));
}

game.onFinish = (ms) => {
  setTimeout(() => {
    playing = false;
    ui.close(false);
    engine.controls.unlock();
    $('hud').hidden = $('pause').hidden = true;
    $('end').hidden = false;
    $('end-time').textContent = fmt(ms);
    $('score-form').hidden = !!game.state.scored;
    renderBoard($('end-leaderboard'));
  }, 2200);
};

$('score-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.post('/api/score', { runId: game.state.runId, name: $('score-name').value });
    game.state.scored = true;
    game.save();
    $('score-form').hidden = true;
    renderBoard($('end-leaderboard'));
  } catch (err) {
    ui.toast(err.message, true);
  }
});

$('btn-new').addEventListener('click', async () => {
  try {
    await game.newRun();
    play();
  } catch {
    ui.toast('Server nicht erreichbar. Läuft „npm run dev“?', true);
  }
});
$('btn-continue').addEventListener('click', () => {
  game.resume(game.saved());
  if (game.state.finishedMs) return game.onFinish(game.state.finishedMs);
  play();
});
$('btn-again').addEventListener('click', () => {
  game.clear();
  location.reload();
});

$('btn-continue').hidden = !game.saved();
if (api.STATIC) document.querySelectorAll('.card h3').forEach((el) => (el.textContent = 'Bestenliste (dieses Geräts)'));
renderBoard($('leaderboard'));

if (new URLSearchParams(location.search).has('debug')) Object.assign(window, { engine, game, enterRoom });
