import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const EYE = 1.65, RADIUS = 0.3, REACH = 3.2;

export class Engine {
  constructor(el) {
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    el.append(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 100);
    this.camera.rotation.order = 'YXZ';
    this.controls = new PointerLockControls(this.camera, r.domElement);
    this.ray = new THREE.Raycaster(undefined, undefined, 0, REACH);
    this.clock = new THREE.Clock();
    this.keys = new Set();
    this.hovered = null;
    this.onHover = () => {};

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      r.setSize(innerWidth, innerHeight);
    });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.controls.isLocked && this.hovered) this.hovered.userData.use();
    });
    this.controls.addEventListener('unlock', () => this.keys.clear());
    r.setAnimationLoop(() => this.tick());
  }

  lock() {
    try { this.renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {}
  }

  load(build) {
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material].flat()) {
          if (!m) continue;
          for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
          m.dispose();
        }
      });
    }
    const group = (this.group = new THREE.Group());
    this.scene.add(group);
    this.interactables = [];
    this.colliders = [];
    this.updaters = [];
    this.bounds = { x1: -5, x2: 5, z1: -4, z2: 4 };

    const api = {
      scene: this.scene,
      camera: this.camera,
      add: (...objs) => (group.add(...objs), objs[0]),
      solid: (obj, pad = 0) => {
        const b = new THREE.Box3().setFromObject(obj);
        this.colliders.push({ x1: b.min.x - pad, x2: b.max.x + pad, z1: b.min.z - pad, z2: b.max.z + pad });
        return obj;
      },
      interact: (obj, label, use) => {
        obj.userData.label = label;
        obj.userData.use = use;
        this.interactables.push(obj);
        return obj;
      },
      onUpdate: (fn) => this.updaters.push(fn),
      setBounds: (b) => (this.bounds = b),
    };
    const info = build(api);
    this.camera.position.set(info.spawn[0], EYE, info.spawn[1]);
    this.camera.rotation.set(0, info.yaw ?? 0, 0);
    return info;
  }

  blocked(x, z) {
    const b = this.bounds;
    if (x < b.x1 + RADIUS || x > b.x2 - RADIUS || z < b.z1 + RADIUS || z > b.z2 - RADIUS) return true;
    return this.colliders.some((c) => x > c.x1 - RADIUS && x < c.x2 + RADIUS && z > c.z1 - RADIUS && z < c.z2 + RADIUS);
  }

  move(dt) {
    const k = this.keys;
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (!f && !s) return;
    const speed = (k.has('ShiftLeft') ? 4.2 : 2.4) * dt / Math.hypot(f, s);
    const yaw = this.camera.rotation.y;
    const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * s) * speed;
    const dz = (-Math.cos(yaw) * f - Math.sin(yaw) * s) * speed;
    const p = this.camera.position;
    if (!this.blocked(p.x + dx, p.z)) p.x += dx;
    if (!this.blocked(p.x, p.z + dz)) p.z += dz;
  }

  pick() {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    for (const hit of this.ray.intersectObjects(this.interactables, true)) {
      let o = hit.object, visible = true;
      for (let p = o; p; p = p.parent) visible &&= p.visible;
      if (!visible) continue;
      while (o && !o.userData.use) o = o.parent;
      return o;
    }
    return null;
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    if (this.group) {
      if (this.controls.isLocked) this.move(dt);
      const hov = this.controls.isLocked ? this.pick() : null;
      if (hov !== this.hovered || hov) {
        this.hovered = hov;
        const l = hov?.userData.label;
        this.onHover(typeof l === 'function' ? l() : l);
      }
      for (const fn of this.updaters) fn(dt, t);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
