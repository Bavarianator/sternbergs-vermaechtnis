import * as THREE from 'three';
import { game } from '../game.js';
import * as ui from '../ui.js';
import { box, cyl, mat, mapMat, mesh, panel, onWall, tex, redraw, canvas, paperTex, tileTex, shell, door } from '../builders.js';

const W = 10, D = 8, H = 3.2;

const ELEMENTS = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(' ');

function cell(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  return [5, z - 36];
}

function drawTable(g, w, h) {
  g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#222'; g.font = `700 ${w * 0.03}px Inter, sans-serif`; g.textAlign = 'center';
  g.fillText('PERIODENSYSTEM DER ELEMENTE', w / 2, h * 0.08);
  const cw = w / 19.5, ch = h / 6.6, ox = w * 0.02, oy = h * 0.13;
  ELEMENTS.forEach((sym, i) => {
    const z = i + 1, [p, gr] = cell(z), x = ox + (gr - 1) * cw * 1.05, y = oy + (p - 1) * ch * 1.05;
    const hue = gr <= 2 ? '#f2c38b' : gr >= 13 ? (gr === 18 ? '#b9d4f2' : '#bfe3b4') : '#f0e08e';
    g.fillStyle = hue; g.fillRect(x, y, cw, ch);
    g.strokeStyle = '#555'; g.lineWidth = 1; g.strokeRect(x, y, cw, ch);
    g.fillStyle = '#222';
    g.font = `${cw * 0.24}px Inter, sans-serif`; g.textAlign = 'left'; g.fillText(z, x + 3, y + cw * 0.26);
    g.font = `700 ${cw * 0.42}px Inter, sans-serif`; g.textAlign = 'center'; g.fillText(sym, x + cw / 2, y + ch * 0.72);
  });
}

function flask(color, pos, filled = true) {
  const g = new THREE.Group();
  g.position.set(...pos);
  const pts = [[0, 0], [0.09, 0], [0.095, 0.01], [0.09, 0.03], [0.03, 0.17], [0.025, 0.26], [0.03, 0.27]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.MeshStandardMaterial({ color: '#dff4ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.25, depthWrite: false });
  g.add(mesh(new THREE.LatheGeometry(pts, 24), glass));
  if (filled) {
    const lp = [[0, 0.005], [0.085, 0.005], [0.085, 0.03], [0.055, 0.1], [0, 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(mesh(new THREE.LatheGeometry(lp, 24), mat(color, { emissive: color, emissiveIntensity: 0.5, roughness: 0.2 })));
  }
  return g;
}

function screen(g, w, h, lines, color = '#5dff8b') {
  g.fillStyle = '#021006'; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.font = '28px monospace'; g.shadowColor = color; g.shadowBlur = 8;
  lines.forEach((l, i) => g.fillText(l, 24, 50 + i * 40));
}

export default function build(api) {
  api.scene.background = new THREE.Color('#030506');
  api.scene.environmentIntensity = 0.3;

  shell(api, {
    W, D, H,
    wall: mapMat(tileTex('#dfe6e4', '#aab5b3', 8), { roughness: 0.4 }),
    floor: mapMat(tileTex('#5b6266', '#3a3f42', 4), { roughness: 0.5 }),
    ceiling: mat('#cfd6d6'),
  });

  api.add(new THREE.HemisphereLight('#e6f4ff', '#20282a', 0.3));
  for (const [x, z, shadow] of [[-2, 0, true], [2.2, 0, false]]) {
    const l = new THREE.PointLight('#e8f6ff', 7, 12, 1.6);
    l.position.set(x, 2.9, z);
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; }
    api.add(l, box(1.4, 0.05, 0.3, mat('#fff', { emissive: '#e8f6ff', emissiveIntensity: 0.8 }), [x, H - 0.03, z]));
  }

  // ---------- Lab bench with five flasks ----------
  const bench = new THREE.Group();
  bench.position.set(0, 0, 0.7);
  bench.add(box(3.0, 0.06, 1.0, mat('#2e3438', { roughness: 0.3 }), [0, 0.9, 0]), box(2.9, 0.85, 0.9, mat('#8a959b', { metalness: 0.3 }), [0, 0.43, 0]));
  api.add(bench);
  api.solid(bench);
  [['#2f9a3f', -1.1], ['#9c3fd0', -0.55], ['#d0282e', 0], ['#f0cf30', 0.55], ['#2766d4', 1.1]].forEach(([c, x]) => {
    const f = flask(c, [x, 0.93, 0.55]);
    api.add(f);
    api.interact(f, 'Erlenmeyerkolben', () => ui.toast('Ein Kolben mit einer leuchtenden Flüssigkeit.'));
  });
  // Bunsen burner + rack for atmosphere
  api.add(cyl(0.05, 0.07, 0.04, mat('#333', { metalness: 0.7 }), [1.2, 0.95, 0.95]), cyl(0.015, 0.015, 0.18, mat('#888', { metalness: 1 }), [1.2, 1.05, 0.95]));

  const note = panel(paperTex(4), 0.21, 0.3);
  note.rotation.set(-Math.PI / 2, 0, 0.15);
  note.position.set(-0.4, 0.935, 1.0);
  api.add(note);
  api.interact(note, 'Zettel', () => ui.note('Zettel am Labortisch', `
    Terminal-Zugang, falls ich ihn wieder vergesse:<br>
    <div class="cipher">18 · 34 · 7</div>
    Die Natur buchstabiert in Ordnungszahlen.
    <p class="sig">– A. S.</p>`));

  // ---------- Periodic table (west wall) ----------
  const pt = panel(tex(1024, 560, drawTable), 2.6, 1.42);
  onWall(pt, 'w', 0.4, 1.75, W, D, 0.02);
  api.add(pt);
  api.interact(pt, 'Periodensystem', () => ui.image('Periodensystem', canvas(1400, 766, drawTable)));

  // ---------- Decoy shelf with empty flasks (west wall) ----------
  const shelf = box(0.3, 0.04, 1.4, mat('#555'), [-W / 2 + 0.16, 1.2, -2.3]);
  api.add(shelf, flask('#fff', [-W / 2 + 0.16, 1.22, -2.7], false), flask('#fff', [-W / 2 + 0.16, 1.22, -2.35], false),
    cyl(0.05, 0.05, 0.22, mat('#6b3a1a', { roughness: 0.3 }), [-W / 2 + 0.16, 1.33, -1.9]));

  // ---------- Terminal (east wall) ----------
  const desk = new THREE.Group();
  desk.position.set(W / 2 - 0.45, 0, -2.3);
  desk.add(box(0.8, 0.05, 1.4, mat('#2a2d31'), [0, 0.76, 0]), box(0.75, 0.74, 0.05, mat('#3a3e44'), [0, 0.37, -0.65]), box(0.75, 0.74, 0.05, mat('#3a3e44'), [0, 0.37, 0.65]));
  const monitor = box(0.08, 0.45, 0.65, mat('#1b1b1d'), [0.1, 1.12, 0]);
  desk.add(monitor, box(0.05, 0.25, 0.05, mat('#1b1b1d'), [0.15, 0.9, 0]), box(0.25, 0.02, 0.5, mat('#222'), [-0.15, 0.79, 0]));
  api.add(desk);
  api.solid(desk);
  const screenTex = tex(512, 340, (g, w, h) => screen(g, w, h, ['STERNBERG-LABOR v3.1', '', 'PASSWORT: _']));
  const scr = panel(screenTex, 0.58, 0.39, { emissive: '#fff', emissiveMap: screenTex, emissiveIntensity: 0.8 });
  scr.position.set(W / 2 - 0.45 + 0.055, 1.12, -2.3);
  scr.rotation.y = -Math.PI / 2;
  api.add(scr);
  const unlockScreen = () => redraw(screenTex, (g, w, h) => screen(g, w, h, ['ZUGANG GEWÄHRT', '', '> MISCHPROTOKOLL 7-B', '> geöffnet']));
  if (game.solved('r2_terminal')) unlockScreen();
  const protocol = () => ui.note('Terminal: Mischprotokoll 7-B', `MISCHPROTOKOLL 7-B
Die Gießreihenfolge der fünf Reagenzien öffnet den Reagenzschrank.

 1. Blau wird unmittelbar nach Rot gegossen.
 2. Grün ist weder das erste noch das mittlere Reagenz
    und steht niemals neben Gelb.
 3. Violett wird an einer geraden Position gegossen.
 4. Gelb wird irgendwann vor Violett gegossen.
 5. Blau steht an einer ungeraden Position.

Jede Farbe genau einmal. Fehler werden protokolliert.`, { terminal: true });
  api.interact(scr, 'Terminal', () => {
    if (game.solved('r2_terminal')) return protocol();
    ui.textLock({ title: 'Terminal', puzzleId: 'r2_terminal', intro: '<div class="terminal">STERNBERG-LABOR v3.1\nBitte Passwort eingeben.</div>', onSolved: () => { unlockScreen(); protocol(); } });
  });

  // ---------- Reagent cabinet (north wall, west) ----------
  const cab = new THREE.Group();
  cab.position.set(-3.5, 0, -D / 2 + 0.3);
  const metal = mat('#8b969c', { metalness: 0.6, roughness: 0.4 });
  cab.add(box(1.2, 2.0, 0.03, metal, [0, 1.0, -0.26]), box(0.03, 2.0, 0.55, metal, [-0.585, 1.0, 0]), box(0.03, 2.0, 0.55, metal, [0.585, 1.0, 0]),
    box(1.2, 0.03, 0.55, metal, [0, 1.985, 0]), box(1.2, 0.03, 0.55, metal, [0, 0.015, 0]), box(1.14, 0.02, 0.5, metal, [0, 0.95, 0]));
  const doors = [-1, 1].map((side) => {
    const p = new THREE.Group();
    p.position.set(side * 0.6, 0, 0.28);
    p.add(box(0.58, 1.9, 0.03, mat('#9aa6ac', { metalness: 0.6, roughness: 0.35 }), [-side * 0.29, 1.0, 0]));
    cab.add(p);
    return [p, side];
  });
  const lock = box(0.36, 0.1, 0.03, mat('#111'), [0, 1.25, 0.3]);
  ui.COLORS.forEach((c, i) => lock.add(mesh(new THREE.SphereGeometry(0.018), mat(c.css, { emissive: c.css, emissiveIntensity: 0.6 }), [-0.13 + i * 0.065, 0, 0.02])));
  cab.add(lock);
  api.add(cab);
  api.solid(cab);
  const uvLamp = cyl(0.03, 0.03, 0.2, mat('#3a1a5a', { emissive: '#8a3cff', emissiveIntensity: 0.6 }), [-3.5, 1.0, -D / 2 + 0.35]);
  uvLamp.rotation.z = Math.PI / 2;
  api.add(uvLamp);
  const openCab = () => { doors.forEach(([p, side]) => (p.rotation.y = side * 1.7)); lock.visible = false; };
  if (game.solved('r2_cabinet')) openCab();
  api.onUpdate(() => (uvLamp.visible = game.solved('r2_cabinet') && !game.has('uv')));
  api.interact(cab, () => (game.solved('r2_cabinet') ? 'Reagenzschrank (offen)' : 'Reagenzschrank mit Farbschloss'), () => {
    if (game.solved('r2_cabinet')) {
      if (!game.has('uv')) {
        game.give('uv', 'UV-Lampe', '🔦', 'Eine Handlampe mit violett schimmerndem Glas. λ = 365 nm.');
        ui.toast('Du nimmst die UV-Lampe.');
      } else ui.toast('Leere Regalböden. Es riecht nach Schwefel.');
      return;
    }
    ui.colorLock({ title: 'Reagenzschrank', puzzleId: 'r2_cabinet', intro: 'Fünf farbige Tasten. Das Schloss erwartet eine Reihenfolge.', onSolved: () => { openCab(); ui.toast('Im Schrank liegt eine UV-Lampe.'); } });
  });

  // ---------- Whiteboard (east wall) ----------
  const wb = panel(tex(768, 440, (g, w, h) => {
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#999'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    g.fillStyle = '#1a3a8a'; g.font = '34px "Special Elite", monospace';
    ['2 H₂ + O₂ → 2 H₂O', 'Fe + S → FeS', '', 'Manches zeigt sich nur', 'im richtigen Licht.', '', 'λ < 400 nm !!'].forEach((l, i) => g.fillText(l, 40, 70 + i * 52));
    g.strokeStyle = '#b22'; g.lineWidth = 3; g.beginPath(); g.ellipse(210, 300, 200, 70, -0.05, 0, Math.PI * 2); g.stroke();
  }), 1.9, 1.1);
  onWall(wb, 'e', 1.6, 1.6, W, D, 0.02);
  api.add(wb);
  api.interact(wb, 'Whiteboard', () => ui.note('Whiteboard', '2 H₂ + O₂ → 2 H₂O<br>Fe + S → FeS<br><br><b>Manches zeigt sich nur im richtigen Licht.</b><br><br>λ &lt; 400 nm !!'));

  // ---------- Hidden UV writing (south wall) ----------
  const uvTex = tex(1024, 300, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#c98bff'; g.shadowColor = '#b060ff'; g.shadowBlur = 18;
    g.font = '700 74px monospace'; g.textAlign = 'center';
    g.fillText('ANJW SJZS JNSX XJHMX', w / 2, 120);
    g.font = '32px "Special Elite", monospace';
    g.fillText('Jeder Buchstabe ist so viele Schritte vorgerückt,', w / 2, 200);
    g.fillText('wie Kolben auf dem Tisch stehen.', w / 2, 245);
  });
  const uv = panel(uvTex, 3.0, 0.88, { basic: true });
  onWall(uv, 's', 1.5, 1.7, W, D, 0.02);
  api.add(uv);
  api.onUpdate(() => (uv.visible = game.has('uv')));
  api.interact(uv, 'Leuchtende Schrift', () => ui.note('UV-Schrift an der Südwand', `
    Im violetten Licht der Lampe erscheint:
    <div class="cipher">ANJW SJZS JNSX XJHMX</div>
    <i>Jeder Buchstabe ist so viele Schritte vorgerückt, wie Kolben auf dem Tisch stehen.</i>`));
  const uvGlow = new THREE.PointLight('#8a3cff', 0, 4);
  uvGlow.position.set(1.5, 1.7, D / 2 - 0.8);
  api.add(uvGlow);
  api.onUpdate((dt, t) => (uvGlow.intensity = game.has('uv') ? 1.5 + Math.sin(t * 3) * 0.3 : 0));

  // Safety shower sign / decor
  const sign = panel(tex(256, 256, (g, w, h) => {
    g.fillStyle = '#f5c400'; g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w - 20, h - 30); g.lineTo(20, h - 30); g.closePath(); g.fill();
    g.fillStyle = '#111'; g.font = '700 130px Inter'; g.textAlign = 'center'; g.fillText('!', w / 2, h - 60);
  }), 0.4, 0.4, { transparent: true });
  onWall(sign, 'n', 2.2, 1.8, W, D, 0.02);
  api.add(sign);

  // ---------- Door ----------
  const d = door(api, {
    D, color: '#56606a',
    label: () => (game.solved('r2_door') ? 'Weiter zur Sternwarte →' : 'Labortür (Zahlenschloss)'),
    onUse: () => {
      if (game.solved('r2_door')) return game.nextRoom();
      ui.keypad({ title: 'Labortür', puzzleId: 'r2_door', intro: 'Vier Ziffern. Die Tastatur riecht nach Desinfektionsmittel.', onSolved: () => d.open() });
    },
  });
  if (game.solved('r2_door')) d.openNow();

  return { name: 'II · Das Labor', spawn: [0, 3], yaw: 0 };
}
