import * as THREE from 'three';
import { game } from '../game.js';
import * as ui from '../ui.js';
import { box, cyl, mat, mapMat, mesh, panel, onWall, tex, canvas, paperTex, woodTex, wallpaperTex, shell, door } from '../builders.js';

const W = 10, D = 8, H = 3.2;

// Shelf order (left to right as seen from the room). Decoys are non-spectral colors.
const BOOKS = [
  ['#2563c9', 'L', 'Blau'], ['#6b4226', 'K', 'Braun'], ['#9b3fc9', 'I', 'Violett'], ['#c0262d', 'G', 'Rot'],
  ['#e8c832', 'L', 'Gelb'], ['#1a1a1a', 'O', 'Schwarz'], ['#3a2a8c', 'E', 'Indigo'], ['#e8781e', 'A', 'Orange'],
  ['#e8e4da', 'P', 'Weiß'], ['#2f8f3a', 'I', 'Grün'], ['#7a7a7a', 'R', 'Grau'],
];
const ink = (c) => (['#e8c832', '#e8e4da', '#e8781e'].includes(c) ? '#2a1d10' : '#f1e2b5');

function drawClock(g, s) {
  const c = s / 2, r = s * 0.46;
  g.fillStyle = '#6d5323';
  g.beginPath(); g.arc(c, c, r + s * 0.03, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2ead3';
  g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#222';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, l = i % 5 ? 0.04 : 0.1;
    g.lineWidth = i % 5 ? s * 0.004 : s * 0.01;
    g.beginPath();
    g.moveTo(c + Math.sin(a) * r * 0.96, c - Math.cos(a) * r * 0.96);
    g.lineTo(c + Math.sin(a) * r * (0.96 - l), c - Math.cos(a) * r * (0.96 - l));
    g.stroke();
  }
  g.fillStyle = '#222';
  g.font = `600 ${s * 0.075}px Cinzel, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => {
    const a = (i / 12) * Math.PI * 2;
    g.fillText(n, c + Math.sin(a) * r * 0.74, c - Math.cos(a) * r * 0.74);
  });
  const hand = (deg, len, w) => {
    const a = (deg * Math.PI) / 180;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(c - Math.sin(a) * len * 0.15, c + Math.cos(a) * len * 0.15);
    g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len);
    g.stroke();
  };
  g.strokeStyle = '#111';
  hand(5 * 30 + 34 * 0.5, r * 0.5, s * 0.025); // 5:34, stopped
  hand(34 * 6, r * 0.82, s * 0.014);
  g.beginPath(); g.arc(c, c, s * 0.02, 0, Math.PI * 2); g.fill();
}

function drawLandscape(g, w, h) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2c3f66'); sky.addColorStop(0.6, '#d98b4e'); sky.addColorStop(1, '#6b3b22');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f7d27a'; g.beginPath(); g.arc(w * 0.7, h * 0.55, h * 0.1, 0, Math.PI * 2); g.fill();
  [['#3b2a3f', 0.55], ['#2a1f2a', 0.68], ['#1a1418', 0.8]].forEach(([c, y], i) => {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) g.lineTo(x, h * y - Math.sin(x / (60 + i * 30) + i) * h * 0.08 - Math.sin(x / 23) * 6);
    g.lineTo(w, h); g.fill();
  });
}

export default function build(api) {
  const s = game.state.flags;
  api.scene.background = new THREE.Color('#050404');
  api.scene.environmentIntensity = 0.25;

  shell(api, {
    W, D, H,
    wall: mapMat(wallpaperTex('#3d4a3a', '#46553f')),
    floor: mapMat(woodTex('#5c3b22'), { roughness: 0.6 }),
    ceiling: mat('#d8cfbf'),
  });

  // Lights
  api.add(new THREE.HemisphereLight('#ffe8c7', '#2a1d14', 0.35));
  const lamp = new THREE.PointLight('#ffcf8a', 22, 14, 1.6);
  lamp.position.set(0, 2.75, 0.3);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.bias = -0.002;
  api.add(lamp);
  api.add(cyl(0.02, 0.02, 0.4, mat('#222'), [0, 3.0, 0.3]), mesh(new THREE.SphereGeometry(0.18, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e7c98a', { emissive: '#ffcf8a', emissiveIntensity: 0.6, side: THREE.DoubleSide }), [0, 2.78, 0.3]));

  // Rug
  const rug = panel(tex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a1a1d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c99a4a'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.lineWidth = 2; g.strokeRect(30, 30, w - 60, h - 60);
    g.fillStyle = '#c99a4a'; g.beginPath(); g.ellipse(w / 2, h / 2, 50, 30, 0, 0, Math.PI * 2); g.fill();
  }), 3.2, 2.2);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, 0.8);
  api.add(rug);

  // ---------- Bookshelf (west wall) ----------
  const wood = mat('#3b2414', { roughness: 0.7 });
  const shelf = new THREE.Group();
  shelf.position.set(-W / 2 + 0.22, 0, -0.8);
  shelf.add(box(0.42, 2.3, 0.04, wood, [0, 1.15, -1.22]), box(0.42, 2.3, 0.04, wood, [0, 1.15, 1.22]), box(0.02, 2.3, 2.44, wood, [-0.2, 1.15, 0]));
  for (const y of [0.08, 0.6, 1.12, 1.64, 2.16, 2.28]) shelf.add(box(0.42, 0.04, 2.44, wood, [0, y, 0]));
  // letter books on eye-level shelf
  let z = 0.95; // books run toward -z = left-to-right when facing the shelf
  for (const [color, letter] of BOOKS) {
    const t = 0.1 + Math.random() * 0.04, hgt = 0.34 + Math.random() * 0.08;
    const spine = tex(64, 256, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0003'; g.fillRect(0, 20, w, 6); g.fillRect(0, h - 26, w, 6);
      g.fillStyle = ink(color); g.font = '700 46px Cinzel, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(letter, w / 2, h / 2);
    });
    const m = mat(color);
    const b = mesh(new THREE.BoxGeometry(0.26, hgt, t), [mapMat(spine), m, m, m, m, m], [0.06, 1.14 + hgt / 2, z - t / 2]);
    shelf.add(b);
    z -= t + 0.012;
  }
  // filler books on other shelves
  for (const y of [0.1, 0.62, 1.66]) {
    let zz = -1.15;
    while (zz < 1.1) {
      const t = 0.06 + Math.random() * 0.07, hgt = 0.26 + Math.random() * 0.16;
      const c = new THREE.Color().setHSL(0.05 + Math.random() * 0.08, 0.4, 0.12 + Math.random() * 0.12);
      if (Math.random() > 0.12) shelf.add(box(0.24, hgt, t, mat(c), [0.05, y + 0.02 + hgt / 2, zz + t / 2]));
      zz += t + 0.01;
    }
  }
  api.add(shelf);
  api.solid(shelf);
  api.interact(shelf, 'Bücherregal', () => {
    ui.modal('Bücherregal – mittleres Fach', [
      ui.h('div', { class: 'shelf' }, BOOKS.map(([c, l, name]) => ui.h('div', { style: 'text-align:center' },
        ui.h('div', { class: 'book', style: `background:${c};color:${ink(c)};height:${150 + (l.charCodeAt(0) % 5) * 12}px` }, l),
        ui.h('div', { class: 'muted', style: 'font-size:.7rem;margin-top:14px' }, name)))),
      ui.h('p', { class: 'muted', style: 'margin-top:12px' }, 'Elf Bücher, jedes mit einem einzelnen goldgeprägten Buchstaben auf dem Rücken. Keine Titel, keine Autoren.'),
    ], { wide: true });
  });

  // ---------- Safe ----------
  const safe = new THREE.Group();
  safe.position.set(-W / 2 + 0.45, 0, 2.7);
  const steel = mat('#2c3036', { metalness: 0.8, roughness: 0.35 });
  safe.add(box(0.7, 0.8, 0.7, steel, [0, 0.4, 0]));
  const safeDoor = new THREE.Group();
  safeDoor.position.set(0.36, 0, -0.3);
  const sd = box(0.04, 0.66, 0.6, mat('#383d45', { metalness: 0.8, roughness: 0.3 }), [0, 0.4, 0.3]);
  const dial = cyl(0.08, 0.08, 0.04, mat('#b89a4e', { metalness: 1, roughness: 0.3 }), [0.03, 0.45, 0.3]);
  dial.rotation.z = Math.PI / 2;
  safeDoor.add(sd, dial);
  safe.add(safeDoor);
  api.add(safe);
  api.solid(safe);
  const openSafe = () => (safeDoor.rotation.y = 1.9);
  if (game.solved('r1_safe')) openSafe();
  api.interact(safe, () => (game.solved('r1_safe') ? 'Tresor (offen)' : 'Tresor mit Buchstabenschloss'), () => {
    if (game.solved('r1_safe')) return ui.toast('Der Tresor ist leer.');
    ui.textLock({
      title: 'Tresor',
      puzzleId: 'r1_safe',
      intro: 'Ein Kombinationsschloss mit <b>sieben</b> Buchstabenrädern.',
      placeholder: '_ _ _ _ _ _ _',
      maxLength: 7,
      onSolved: () => {
        openSafe();
        game.addNote('Tresor geöffnet', 'Das Wort, das den Tresor öffnete: <b>GALILEI</b>');
        game.give('key', 'Messingschlüssel', '🗝️', 'Ein kleiner, verzierter Messingschlüssel. Passt zu einem Möbelschloss.');
        ui.toast('Du findest einen kleinen Messingschlüssel.');
      },
    });
  });

  // ---------- Desk ----------
  const desk = new THREE.Group();
  desk.position.set(W / 2 - 0.65, 0, 0.2);
  const deskWood = mapMat(woodTex('#4a2a16'), { roughness: 0.5 });
  desk.add(box(0.9, 0.06, 1.8, deskWood, [0, 0.76, 0]));
  for (const [x, zz] of [[-0.4, -0.85], [0.4, -0.85], [-0.4, 0.85], [0.4, 0.85]]) desk.add(box(0.06, 0.73, 0.06, wood, [x, 0.365, zz]));
  desk.add(box(0.8, 0.2, 0.05, wood, [0, 0.62, -0.85]), box(0.8, 0.2, 0.05, wood, [0, 0.62, 0.85]));
  api.add(desk);
  api.solid(desk);

  const drawer = box(0.7, 0.16, 0.6, deskWood, [W / 2 - 0.75, 0.63, 0.2]);
  drawer.add(mesh(new THREE.SphereGeometry(0.025), mat('#c9a24a', { metalness: 1 }), [-0.36, 0, 0]));
  api.add(drawer);
  let drawerTarget = drawer.position.x;
  const openDrawer = () => (drawerTarget = W / 2 - 1.15);
  if (game.flag('drawer')) { openDrawer(); drawer.position.x = drawerTarget; }
  api.onUpdate((dt) => (drawer.position.x += (drawerTarget - drawer.position.x) * Math.min(1, dt * 4)));
  const drawerNote = () => ui.note('Notiz aus der Schublade', `
    Die Zeiger schweigen seit jener Nacht.<br><br>
    Der <b>kleinere Winkel</b> zwischen ihnen – in ganzen Grad – ist die erste Hälfte des Türcodes.<br>
    <small>(Der große Zeiger wandert 6° pro Minute. Vergiss nicht: Auch der kleine bleibt nicht stehen – 30° pro Stunde, also ½° pro Minute.)</small><br><br>
    Die zweite Hälfte habe ich hinter der Landschaft versteckt.
    <p class="sig">– A. S.</p>`);
  api.interact(drawer, () => (game.flag('drawer') ? 'Schublade (Notiz lesen)' : 'Schublade'), () => {
    if (game.flag('drawer')) return drawerNote();
    if (!game.has('key')) return ui.toast('Verschlossen. Ein kleines Messingschloss.', true);
    game.set('drawer');
    openDrawer();
    drawerNote();
  });

  const note = panel(paperTex(7), 0.21, 0.3);
  note.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + 0.2);
  note.position.set(W / 2 - 0.7, 0.795, -0.35);
  api.add(note);
  api.interact(note, 'Zettel', () => ui.note('Zettel auf dem Schreibtisch', `
    Newton zerlegte das Licht in sieben Teile – die Farben des Regenbogens.<br><br>
    Folge seinem Weg – von der <b>längsten</b> Welle (Rot) zur <b>kürzesten</b> (Violett) –<br>
    und die Bücher nennen dir einen Namen. Farben, die nicht im Regenbogen vorkommen, lügen.<br><br>
    Der Name öffnet mehr als nur eine Tür.
    <p class="sig">– A. S.</p>`));

  // desk lamp + inkwell
  api.add(cyl(0.08, 0.1, 0.03, mat('#1d3b2a', { metalness: 0.6 }), [W / 2 - 0.55, 0.805, 0.8]), cyl(0.012, 0.012, 0.35, mat('#b89a4e', { metalness: 1 }), [W / 2 - 0.55, 0.97, 0.8]));
  const shade = cyl(0.06, 0.14, 0.12, mat('#1f5a3a', { emissive: '#3a2', emissiveIntensity: 0.15, side: THREE.DoubleSide }), [W / 2 - 0.55, 1.15, 0.8], 20);
  shade.geometry = new THREE.CylinderGeometry(0.06, 0.14, 0.12, 20, 1, true);
  api.add(shade);
  const deskLight = new THREE.PointLight('#ffd08a', 3, 3);
  deskLight.position.set(W / 2 - 0.55, 1.05, 0.8);
  api.add(deskLight);

  // chair
  const chair = new THREE.Group();
  chair.position.set(W / 2 - 1.45, 0, 0.1);
  chair.add(box(0.5, 0.05, 0.5, wood, [0, 0.46, 0]), box(0.05, 0.55, 0.5, wood, [-0.23, 0.75, 0]));
  for (const [x, zz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) chair.add(box(0.04, 0.46, 0.04, wood, [x, 0.23, zz]));
  api.add(chair);
  api.solid(chair);

  // ---------- Clock (east wall, above desk) ----------
  const clockTex = tex(512, 512, (g, s) => drawClock(g, s));
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), mapMat(clockTex, { roughness: 0.4 }));
  onWall(clock, 'e', 0.2, 2.15, W, D, 0.055);
  api.add(clock);
  const rim = api.add(cyl(0.37, 0.37, 0.05, mat('#4a3518', { metalness: 0.5 }), [W / 2 - 0.025, 2.15, 0.2], 48));
  rim.rotation.z = Math.PI / 2;
  api.interact(clock, 'Wanduhr', () =>
    ui.image('Wanduhr', canvas(520, 520, (g, s) => drawClock(g, s)), 'Das Pendel hängt still. Die Uhr ist stehen geblieben.'));

  // ---------- Painting (south wall) with Morse behind ----------
  const painting = new THREE.Group();
  onWall(painting, 's', -1.5, 2.2, W, D, 0.03);
  const pivot = new THREE.Group();
  painting.add(pivot);
  pivot.add(box(1.5, 1.1, 0.05, mat('#6e4d1f', { metalness: 0.4, roughness: 0.5 }), [0, -0.55, 0]));
  const pic = panel(tex(512, 360, drawLandscape), 1.36, 0.96);
  pic.position.set(0, -0.55, 0.03);
  pivot.add(pic);
  const morse = panel(tex(512, 128, (g, w, h) => {
    g.fillStyle = '#0000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1510'; g.font = '700 60px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('— — — · ·   · · — — —', w / 2, h / 2);
  }), 0.9, 0.22, { transparent: true });
  morse.position.set(0, -0.55, -0.02);
  painting.add(morse);
  api.add(painting);
  // Lifting the painting slides it aside and tilts it, revealing the Morse code.
  let aside = 0;
  if (game.flag('painting')) aside = 1;
  api.onUpdate((dt) => {
    pivot.position.x += (aside * 1.2 - pivot.position.x) * Math.min(1, dt * 3);
    pivot.rotation.z += (aside * -0.12 - pivot.rotation.z) * Math.min(1, dt * 3);
  });
  api.interact(painting, 'Gemälde', () => {
    aside = 1;
    game.set('painting');
    ui.note('Hinter dem Gemälde', `
      Du hebst den Rahmen an. In den Putz ist etwas eingeritzt:<br>
      <div class="cipher">— — — · ·&nbsp;&nbsp;&nbsp;· · — — —</div>`);
  });

  // ---------- Morse chart (north wall) ----------
  const MORSE = ['— — — — —', '· — — — —', '· · — — —', '· · · — —', '· · · · —', '· · · · ·', '— · · · ·', '— — · · ·', '— — — · ·', '— — — — ·'];
  const drawMorse = (g, w, h) => {
    g.fillStyle = '#e9dfc4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6e4d1f'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    g.fillStyle = '#2b2217'; g.textAlign = 'center'; g.font = `600 ${h * 0.07}px Cinzel, serif`;
    g.fillText('MORSEZEICHEN', w / 2, h * 0.1);
    g.font = `${h * 0.06}px monospace`; g.textAlign = 'left';
    MORSE.forEach((m, i) => g.fillText(`${i}   ${m}`, w * 0.2, h * (0.2 + i * 0.075)));
  };
  const morseChart = panel(tex(400, 560, drawMorse), 0.5, 0.7);
  onWall(morseChart, 'n', -2.6, 1.6, W, D, 0.02);
  api.add(morseChart);
  api.interact(morseChart, 'Tafel mit Morsezeichen', () => ui.image('Morsezeichen', canvas(400, 560, drawMorse)));

  // ---------- Intro letter on side table ----------
  const table = new THREE.Group();
  table.position.set(2.2, 0, D / 2 - 0.5);
  table.add(box(0.7, 0.04, 0.5, wood, [0, 0.7, 0]), cyl(0.04, 0.06, 0.68, wood, [0, 0.34, 0]), cyl(0.2, 0.22, 0.03, wood, [0, 0.015, 0]));
  api.add(table);
  api.solid(table);
  const letter = panel(paperTex(10), 0.22, 0.3);
  letter.rotation.set(-Math.PI / 2, 0, 0.3);
  letter.position.set(2.15, 0.725, D / 2 - 0.5);
  api.add(letter);
  const candle = cyl(0.03, 0.03, 0.15, mat('#efe8d6'), [2.45, 0.795, D / 2 - 0.4]);
  const flame = mesh(new THREE.SphereGeometry(0.015), new THREE.MeshBasicMaterial({ color: '#ffb54a' }), [2.45, 0.89, D / 2 - 0.4]);
  const candleLight = new THREE.PointLight('#ff9d3a', 1.5, 3);
  candleLight.position.set(2.45, 0.95, D / 2 - 0.4);
  api.add(candle, flame, candleLight);
  api.onUpdate((dt, t) => (candleLight.intensity = 1.3 + Math.sin(t * 13) * 0.15 + Math.sin(t * 7.3) * 0.15));
  api.interact(letter, 'Brief', () => ui.note('Ein Brief an den Finder', `
    Wer dies liest, hat den ersten Schritt getan.<br><br>
    Ich habe mein Lebenswerk hinter drei Türen verschlossen. Jede verlangt,
    dass du genauer hinsiehst als die anderen vor dir. Nichts in diesen Räumen ist Zufall –
    und nicht alles, was du siehst, ist von Bedeutung.<br><br>
    Merke dir, was du findest. Manches wirst du später wieder brauchen.
    <p class="sig">– Prof. Albrecht Sternberg</p>`));

  // Globe (decor)
  const globe = mesh(new THREE.SphereGeometry(0.22, 32, 16), mat('#2c5d7a', { roughness: 0.5 }), [-3.2, 1.05, 3.2]);
  api.add(globe, cyl(0.03, 0.12, 0.8, wood, [-3.2, 0.4, 3.2]));
  api.solid(globe, 0.1);
  api.onUpdate((dt) => (globe.rotation.y += dt * 0.2));

  // ---------- Door ----------
  const d = door(api, {
    D,
    label: () => (game.solved('r1_door') ? 'Weiter ins Labor →' : 'Tür (Zahlenschloss)'),
    onUse: () => {
      if (game.solved('r1_door')) return game.nextRoom();
      ui.keypad({ title: 'Türschloss', puzzleId: 'r1_door', intro: 'Ein vierstelliges Zahlenschloss.', onSolved: () => d.open() });
    },
  });
  if (game.solved('r1_door')) d.openNow();

  return { name: 'I · Das Arbeitszimmer', spawn: [0, 2.6], yaw: 0 };
}
