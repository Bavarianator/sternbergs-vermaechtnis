import * as THREE from 'three';
import { game } from '../game.js';
import * as ui from '../ui.js';
import { box, cyl, mat, mapMat, mesh, panel, onWall, tex, redraw, canvas, woodTex, wallpaperTex, shell, door, drawMoon } from '../builders.js';
import { N, press, start } from '../../../shared/lightsout.js';

const W = 10, D = 8, H = 3.4;
const NIGHTS = [2, 4, 1, 5]; // moon phases shown in the telescope

function drawPoster(g, w, h) {
  g.fillStyle = '#0e1426'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a85a'; g.lineWidth = 4; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#e9d9a6'; g.textAlign = 'center';
  g.font = `600 ${h * 0.09}px Cinzel, serif`;
  g.fillText('LUNARER ZYKLUS', w / 2, h * 0.17);
  const r = w / 22;
  g.font = `600 ${h * 0.07}px Cinzel, serif`;
  for (let k = 0; k < 8; k++) {
    drawMoon(g, w * (0.08 + k * 0.12), h * 0.46, r, k);
    g.fillText(k, w * (0.08 + k * 0.12), h * 0.7);
  }
  g.font = `italic ${h * 0.06}px "Special Elite", monospace`;
  g.fillText('Der Zyklus beginnt im Dunkeln.  Die Sterne zählen nur bis Sieben.', w / 2, h * 0.85);
}

function drawTelescope(g, w, h) {
  g.fillStyle = '#02030a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
    g.fillRect(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
  }
  g.fillStyle = '#9aa7c9'; g.textAlign = 'center'; g.font = `${h * 0.05}px "Special Elite", monospace`;
  NIGHTS.forEach((k, i) => {
    const x = w * (0.14 + i * 0.24);
    drawMoon(g, x, h * 0.48, w * 0.085, k);
    g.fillText(`Nacht ${['I', 'II', 'III', 'IV'][i]}`, x, h * 0.8);
  });
  const vig = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.6);
  vig.addColorStop(0, '#0000'); vig.addColorStop(1, '#000f');
  g.fillStyle = vig; g.fillRect(0, 0, w, h);
}

function drawPanel(g, w, h, grid) {
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, w, h);
  const s = w / (N + 1);
  grid.forEach((v, i) => {
    const x = s / 2 + (i % N) * s, y = s / 2 + Math.floor(i / N) * s;
    g.fillStyle = v ? '#ffb830' : '#1d222c';
    g.shadowColor = '#ffb830'; g.shadowBlur = v ? 20 : 0;
    g.fillRect(x + 6, y + 6, s - 12, s - 12);
  });
  g.shadowBlur = 0;
}

export default function build(api) {
  api.scene.background = new THREE.Color('#010208');
  api.scene.environmentIntensity = 0.35;

  shell(api, {
    W, D, H,
    wall: mapMat(wallpaperTex('#26304f', '#2e3a60'), { roughness: 0.9 }),
    floor: mapMat(woodTex('#6a4428'), { roughness: 0.55 }),
    ceiling: mat('#05070f'),
  });

  // Star ceiling
  const pos = [];
  for (let i = 0; i < 900; i++) pos.push((Math.random() - 0.5) * W, H - 0.02, (Math.random() - 0.5) * D);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: '#fff', size: 0.025, sizeAttenuation: true }));
  api.add(stars);

  api.add(new THREE.HemisphereLight('#8a9ee0', '#1a1424', 1.2));
  const main = new THREE.PointLight('#c7d2ff', 18, 14, 1.4);
  main.position.set(0, 3.0, 1.5);
  main.castShadow = true;
  main.shadow.mapSize.set(1024, 1024);
  main.shadow.bias = -0.002;
  api.add(main);

  // ---------- Telescope ----------
  const scope = new THREE.Group();
  scope.position.set(0, 0, 0.2);
  const brass = mat('#b58a3a', { metalness: 0.9, roughness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, leg = cyl(0.025, 0.025, 1.3, mat('#2b2b2b', { metalness: 0.5 }), [Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.3]);
    leg.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25);
    scope.add(leg);
  }
  const tube = new THREE.Group();
  tube.position.y = 1.25;
  tube.rotation.x = 0.7;
  tube.add(cyl(0.12, 0.09, 1.5, brass, [0, 0.25, 0]), cyl(0.14, 0.14, 0.12, mat('#222'), [0, 1.0, 0]), cyl(0.03, 0.03, 0.2, mat('#222'), [0, -0.6, 0]));
  scope.add(tube);
  api.add(scope);
  api.solid(scope);
  const spot = new THREE.SpotLight('#ffe1a8', 0, 6, 0.5, 0.6);
  spot.position.set(0, H - 0.1, 0.2);
  spot.target = scope;
  api.add(spot);
  api.onUpdate(() => (spot.intensity = game.solved('r3_panel') ? 25 : 0));
  api.interact(scope, 'Teleskop', () => {
    if (!game.solved('r3_panel')) return ui.toast('Das Teleskop ist ohne Strom. Die Nachführung reagiert nicht.', true);
    game.addNote('Blick durch das Teleskop', 'Vier Nächte, vier Monde (von links nach rechts): Nacht I – IV.<br><i>Öffne das Teleskop erneut, um sie anzusehen.</i>');
    ui.image('Blick durch das Okular', canvas(1200, 560, drawTelescope), 'Das Okular zeigt vier Aufnahmen – beschriftet mit Nacht I bis IV.');
  });

  // ---------- Control panel (west wall): lights out ----------
  const desk = new THREE.Group();
  desk.position.set(-W / 2 + 0.25, 0, -0.2);
  desk.add(box(0.5, 1.0, 1.2, mat('#2a2f3a', { metalness: 0.5, roughness: 0.4 }), [0, 0.5, 0]));
  const top = box(0.5, 0.05, 1.2, mat('#1b1f27', { metalness: 0.5 }), [0.05, 1.02, 0]);
  desk.add(top);
  const panelTex = tex(360, 360, (g, w, h) => drawPanel(g, w, h, (game.state.lightPresses ?? []).reduce(press, start())));
  const screen = panel(panelTex, 0.8, 0.8, { emissive: '#fff', emissiveMap: panelTex, emissiveIntensity: 1 });
  screen.position.set(-W / 2 + 0.02, 1.6, -0.2);
  screen.rotation.y = Math.PI / 2;
  api.add(desk, screen);
  api.solid(desk);
  const glow = new THREE.PointLight('#ffb830', 1.2, 3);
  glow.position.set(-W / 2 + 0.6, 1.6, -0.2);
  api.add(glow);
  const usePanel = () => {
    if (game.solved('r3_panel')) return ui.toast('Alle Relais sind dunkel. Strom fließt zum Teleskop.');
    ui.lightsOut({
      onChange: (g) => redraw(panelTex, (c, w, h) => drawPanel(c, w, h, g)),
      onSolved: () => ui.toast('Ein tiefes Summen – das Teleskop fährt hoch!'),
    });
  };
  api.interact(desk, 'Steuerkonsole', usePanel);
  api.interact(screen, 'Relaisanzeige', usePanel);

  // ---------- Moon poster (east wall) ----------
  const posterTex = tex(1400, 460, drawPoster);
  const poster = panel(posterTex, 3.0, 0.98, { emissive: '#fff', emissiveMap: posterTex, emissiveIntensity: 0.5 });
  onWall(poster, 'e', 0.3, 1.75, W, D, 0.02);
  api.add(poster);
  api.interact(poster, 'Mondposter', () => ui.image('Lunarer Zyklus', canvas(1400, 460, drawPoster)));

  // ---------- Map cabinet (south-east) ----------
  const cab = new THREE.Group();
  cab.position.set(3.6, 0, D / 2 - 0.45);
  const cabWood = mapMat(woodTex('#4a2c18'), { roughness: 0.5 });
  cab.add(box(1.6, 0.95, 0.8, cabWood, [0, 0.475, 0]));
  for (let i = 0; i < 4; i++) {
    const dr = box(1.5, 0.19, 0.02, cabWood, [0, 0.14 + i * 0.22, -0.41]);
    dr.add(box(0.2, 0.03, 0.03, brass, [0, 0, -0.02]));
    cab.add(dr);
  }
  cab.add(box(0.2, 0.26, 0.04, mat('#111', { metalness: 0.6 }), [0.55, 1.08, 0.2]));
  api.add(cab);
  api.solid(cab);
  const chartNote = () => ui.note('Sternkarte', `
    Eine handgezeichnete Himmelskarte. Am Rand, in Sternbergs Handschrift:
    <div class="cipher">L R P Q S I Q Z</div>
    „Der Name, den dir das Licht im Arbeitszimmer nannte, ist der Schlüssel.
    Jeder seiner Buchstaben hat die Botschaft ein Stück weitergeschoben.“<br><br>
    <small>Unter die Botschaft hat er den Schlüssel Buchstabe für Buchstabe geschrieben und notiert:
    „A schiebt 0, B schiebt 1, C schiebt 2 … – zieh die Schritte wieder ab.“</small><div class="cipher" style="font-size:1rem">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</div>`);
  api.interact(cab, () => (game.solved('r3_chart') ? 'Kartenschrank (offen)' : 'Kartenschrank (Zahlenschloss)'), () => {
    if (game.solved('r3_chart')) return chartNote();
    ui.keypad({
      title: 'Kartenschrank', puzzleId: 'r3_chart', intro: 'Ein Messingschloss mit vier Zahlenrädern. Eingraviert: „Was die Nacht zeigt – gezählt wie die Sterne: I × 512 + II × 64 + III × 8 + IV“',
      onSolved: () => { game.give('chart', 'Sternkarte', '🗺️', 'L R P Q S I Q Z'); chartNote(); },
    });
  });

  // ---------- Orrery (decor) ----------
  const orr = new THREE.Group();
  orr.position.set(-3.6, 0, 3.0);
  orr.add(cyl(0.35, 0.4, 0.8, cabWood, [0, 0.4, 0]), mesh(new THREE.SphereGeometry(0.08, 24, 12), new THREE.MeshBasicMaterial({ color: '#ffcc55' }), [0, 1.05, 0]));
  const planets = [0.18, 0.28, 0.38].map((r, i) => {
    const arm = new THREE.Group();
    arm.position.y = 1.05;
    arm.add(box(r, 0.005, 0.005, brass, [r / 2, 0, 0]), mesh(new THREE.SphereGeometry(0.025 + i * 0.01, 16, 8), mat(['#c77', '#6ac', '#ca8'][i]), [r, 0, 0]));
    orr.add(arm);
    return arm;
  });
  const sunLight = new THREE.PointLight('#ffcc55', 1, 2.5);
  sunLight.position.set(-3.6, 1.05, 3.0);
  api.add(orr, sunLight);
  api.solid(orr);
  api.onUpdate((dt) => planets.forEach((p, i) => (p.rotation.y += dt * (0.9 / (i + 1)))));

  // ---------- Final door ----------
  const d = door(api, {
    D, color: '#1d2440',
    label: () => (game.solved('r3_door') ? 'Hinaus ins Freie →' : 'Letzte Tür (Buchstabenschloss)'),
    onUse: () => {
      if (game.solved('r3_door')) return game.onFinish(game.state.finishedMs);
      ui.textLock({
        title: 'Die letzte Tür', puzzleId: 'r3_door', maxLength: 8, placeholder: '_ _ _ _ _ _ _ _',
        intro: 'Acht Buchstabenräder aus Messing. Darüber eingraviert: <i>„Was ich dir hinterlasse.“</i>',
        onSolved: () => d.open(),
      });
    },
  });
  if (game.solved('r3_door')) d.openNow();

  return { name: 'III · Die Sternwarte', spawn: [0, 3], yaw: 0 };
}
