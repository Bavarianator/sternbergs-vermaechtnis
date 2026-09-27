import * as THREE from 'three';

// ---------- textures ----------
export function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

export function tex(w, h, draw, repeat) {
  const t = new THREE.CanvasTexture(canvas(w, h, draw));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function redraw(t, draw) {
  const c = t.image, g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  draw(g, c.width, c.height);
  t.needsUpdate = true;
}

const rand = (a, b) => a + Math.random() * (b - a);

export const woodTex = (base = '#5a3a22') => tex(512, 512, (g, w, h) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) {
    g.fillStyle = `hsla(25, 40%, ${rand(12, 30)}%, .35)`;
    g.fillRect(0, y, w, 64);
    for (let i = 0; i < 30; i++) {
      g.strokeStyle = `rgba(0,0,0,${rand(0.05, 0.18)})`;
      g.beginPath();
      const yy = y + rand(4, 60);
      g.moveTo(0, yy);
      g.bezierCurveTo(w / 3, yy + rand(-6, 6), (2 * w) / 3, yy + rand(-6, 6), w, yy);
      g.stroke();
    }
    g.fillStyle = '#0006';
    g.fillRect(0, y, w, 2);
    g.fillRect(rand(0, w), y, 2, 64);
  }
}, true);

export const wallpaperTex = (base, accent) => tex(256, 256, (g, w, h) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  g.fillStyle = accent;
  for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 6, h);
  for (let y = 32; y < h; y += 64) for (let x = 32; x < w; x += 64) {
    g.beginPath();
    g.ellipse(x, y, 10, 16, 0, 0, Math.PI * 2);
    g.fill();
  }
}, true);

export const tileTex = (base, grout, n = 4) => tex(256, 256, (g, w, h) => {
  g.fillStyle = grout;
  g.fillRect(0, 0, w, h);
  const s = w / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = base;
    g.globalAlpha = rand(0.85, 1);
    g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
  }
  g.globalAlpha = 1;
}, true);

export function paperTex(lines = 9) {
  return tex(256, 360, (g, w, h) => {
    g.fillStyle = '#efe6cf';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a2d1f99';
    g.lineWidth = 3;
    for (let i = 0; i < lines; i++) {
      g.beginPath();
      g.moveTo(24, 50 + i * 32);
      g.lineTo(rand(140, 230), 50 + i * 32);
      g.stroke();
    }
  });
}

export function textTex(w, h, draw) {
  return tex(w, h, draw);
}

// ---------- materials & meshes ----------
export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
export const mapMat = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...o });

export function mesh(geo, material, [x, y, z] = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
export const box = (w, h, d, material, pos) => mesh(new THREE.BoxGeometry(w, h, d), material, pos);
export const cyl = (rt, rb, h, material, pos, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, pos);

// Scale UVs so a repeating texture tiles every `unit` meters.
function worldUV(geo, w, h, unit) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / unit, (uv.getY(i) * h) / unit);
  return geo;
}

// Position an object flat against a wall, facing into the room.
// wall: n/s/e/w; along = x for n/s, z for e/w.
export function onWall(obj, wall, along, y, W, D, off = 0.01) {
  const p = { n: [along, -D / 2 + off, 0], s: [along, D / 2 - off, Math.PI], w: [-W / 2 + off, along, Math.PI / 2], e: [W / 2 - off, along, -Math.PI / 2] }[wall];
  obj.position.set(p[0], y, p[1]);
  obj.rotation.y = p[2];
  return obj;
}

export function panel(map, w, h, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.basic ? new THREE.MeshBasicMaterial({ map, transparent: true }) : mapMat(map, o));
  m.receiveShadow = true;
  return m;
}

// ---------- room shell with a doorway in the north wall ----------
export const DOOR_W = 1.2, DOOR_H = 2.3;

export function shell(api, { W, D, H, wall, floor, ceiling, doorX = 0 }) {
  const add = (geo, material, pos, rot) => {
    const m = mesh(geo, material, pos);
    m.castShadow = false;
    m.rotation.set(...rot);
    return api.add(m);
  };
  add(worldUV(new THREE.PlaneGeometry(W, D), W, D, 2), floor, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  add(worldUV(new THREE.PlaneGeometry(W, D), W, D, 2), ceiling, [0, H, 0], [Math.PI / 2, 0, 0]);
  add(worldUV(new THREE.PlaneGeometry(W, H), W, H, 2), wall, [0, H / 2, D / 2], [0, Math.PI, 0]);
  add(worldUV(new THREE.PlaneGeometry(D, H), D, H, 2), wall, [-W / 2, H / 2, 0], [0, Math.PI / 2, 0]);
  add(worldUV(new THREE.PlaneGeometry(D, H), D, H, 2), wall, [W / 2, H / 2, 0], [0, -Math.PI / 2, 0]);
  // north wall in three pieces around the doorway
  const l = doorX - DOOR_W / 2 + W / 2, r = W / 2 - (doorX + DOOR_W / 2);
  add(worldUV(new THREE.PlaneGeometry(l, H), l, H, 2), wall, [-W / 2 + l / 2, H / 2, -D / 2], [0, 0, 0]);
  add(worldUV(new THREE.PlaneGeometry(r, H), r, H, 2), wall, [W / 2 - r / 2, H / 2, -D / 2], [0, 0, 0]);
  add(worldUV(new THREE.PlaneGeometry(DOOR_W, H - DOOR_H), DOOR_W, H - DOOR_H, 2), wall, [doorX, (H + DOOR_H) / 2, -D / 2], [0, 0, 0]);

  // baseboards
  const bb = mat('#2a1c12');
  api.add(box(W, 0.12, 0.03, bb, [0, 0.06, D / 2 - 0.015]), box(0.03, 0.12, D, bb, [-W / 2 + 0.015, 0.06, 0]), box(0.03, 0.12, D, bb, [W / 2 - 0.015, 0.06, 0]));

  // dark corridor behind the door
  const corr = mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 4), mat('#15110e', { side: THREE.BackSide }), [doorX, DOOR_H / 2, -D / 2 - 2]);
  api.add(corr);
  const glow = new THREE.PointLight('#ffd9a0', 3, 5);
  glow.position.set(doorX, 1.8, -D / 2 - 3.5);
  api.add(glow);

  api.setBounds({ x1: -W / 2, x2: W / 2, z1: -D / 2, z2: D / 2 });
}

// ---------- door with keypad ----------
export function door(api, { D, x = 0, color = '#4a2e1a', label, onUse }) {
  const g = new THREE.Group();
  g.position.set(x, 0, -D / 2);
  const frameM = mat('#2b1a0e');
  g.add(box(0.1, DOOR_H + 0.1, 0.14, frameM, [-DOOR_W / 2 - 0.05, DOOR_H / 2, 0]),
    box(0.1, DOOR_H + 0.1, 0.14, frameM, [DOOR_W / 2 + 0.05, DOOR_H / 2, 0]),
    box(DOOR_W + 0.2, 0.1, 0.14, frameM, [0, DOOR_H + 0.05, 0]));
  const pivot = new THREE.Group();
  pivot.position.x = -DOOR_W / 2;
  const leaf = box(DOOR_W, DOOR_H, 0.06, mat(color, { roughness: 0.6 }), [DOOR_W / 2, DOOR_H / 2, 0]);
  const panelM = mat(color, { roughness: 0.5, color: new THREE.Color(color).multiplyScalar(0.8) });
  leaf.add(box(0.8, 0.8, 0.02, panelM, [0, 0.5, 0.035]), box(0.8, 0.8, 0.02, panelM, [0, -0.5, 0.035]));
  leaf.add(mesh(new THREE.SphereGeometry(0.04), mat('#c9a24a', { metalness: 1, roughness: 0.3 }), [0.45, 0, 0.07]));
  pivot.add(leaf);
  g.add(pivot);
  // keypad on the wall
  const pad = box(0.18, 0.26, 0.04, mat('#1a1a1a', { metalness: 0.6 }), [DOOR_W / 2 + 0.35, 1.3, 0.03]);
  pad.add(box(0.13, 0.05, 0.01, mat('#113', { emissive: '#2f6', emissiveIntensity: 0.6 }), [0, 0.08, 0.025]));
  g.add(pad);
  api.add(g);
  let target = 0;
  api.onUpdate((dt) => (pivot.rotation.y += (target - pivot.rotation.y) * Math.min(1, dt * 2)));
  api.interact(g, label, onUse);
  // Once open, the doorway itself is clickable and walking into it passes through.
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W, DOOR_H), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  gap.position.set(0, DOOR_H / 2, -0.05);
  gap.visible = false;
  g.add(gap);
  api.interact(gap, label, onUse);
  let passed = false;
  api.onUpdate(() => {
    const p = api.camera.position;
    if (gap.visible && !passed && p.z < -D / 2 + 0.45 && Math.abs(p.x - x) < DOOR_W / 2) {
      passed = true;
      onUse();
    }
  });
  const open = () => (target = 1.5, gap.visible = true);
  return { open, openNow: () => (open(), pivot.rotation.y = 1.5) };
}

// ---------- drawings shared by 3D textures and close-ups ----------
export function drawMoon(g, cx, cy, r, k) {
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = '#1c2030';
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = '#3b4258';
  g.stroke();
  if (k !== 0) {
    const T = Math.PI / 2, rx = r * Math.abs(Math.cos((k * Math.PI) / 4));
    const crescent = k === 1 || k === 7;
    g.beginPath();
    if (k === 4) g.arc(cx, cy, r, 0, Math.PI * 2);
    else if (k < 4) {
      g.arc(cx, cy, r, -T, T);
      crescent ? g.ellipse(cx, cy, rx, r, 0, T, -T, true) : g.ellipse(cx, cy, rx, r, 0, T, 3 * T);
    } else {
      g.arc(cx, cy, r, T, 3 * T);
      crescent ? g.ellipse(cx, cy, rx, r, 0, 3 * T, T, true) : g.ellipse(cx, cy, rx, r, 0, -T, T);
    }
    const grad = g.createRadialGradient(cx - r / 3, cy - r / 3, r / 5, cx, cy, r);
    grad.addColorStop(0, '#fffbe6');
    grad.addColorStop(1, '#cfc6a4');
    g.fillStyle = grad;
    g.fill();
  }
  g.restore();
}
