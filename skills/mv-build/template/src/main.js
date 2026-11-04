// 메타버스 템플릿 엔진 — world.json(세계관·구역) + concept.json(색·분위기)만 바꾸면 다른 메타버스가 됨
//  · 구역(zone) 하나씩 그림. 포털로 걸어 들어가면 다른 구역으로 이동
//  · 조작: WASD/방향키·Shift(달리기)·Space(점프), 휴대폰은 조이스틱·화면 탭(그 자리로 걸어감)·드래그(시점)
//  · 멀티플레이: Supabase 설정(.env)이 있으면 같은 구역 사람끼리 보임 (없으면 혼자)
//  ※ 이 파일은 skills/mv-build 가 복사한 시작점. 구역 모양·소품은 buildProp / buildZone 을 고치면 됨
import * as THREE from 'three';
import world from '../world/world.json';     // 세계관·구역 (mv-worldview)
import concept from '../world/concept.json'; // 색·분위기 (mv-concept)
import { Character, setTagColor } from './character.js';
import { createNet } from './net.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const C = (h) => new THREE.Color(h);
const P = concept.palette;
document.documentElement.style.setProperty('--primary', P.primary);
document.documentElement.style.setProperty('--accent', P.accent);
document.title = `${world.title} — 메타버스`;
setTagColor(P.primary);
window.loader?.set(0.3, '세계를 짓고 있어요');

// ---------- 렌더러 / 씬 ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('app').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 800);
function fit() { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 75 : 60; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener('resize', fit); fit();
scene.add(new THREE.HemisphereLight(C(concept.light?.sky || '#ffffff'), C(concept.light?.ground || '#888888'), concept.light?.ambient ?? 1.4));
const sun = new THREE.DirectionalLight(C(concept.light?.sun || '#ffffff'), concept.light?.intensity ?? 1.2);
sun.position.set(30, 60, 20); scene.add(sun);

// 하늘: 위·아래 두 색 그라데이션
function skyTexture(top, bottom) {
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
scene.background = skyTexture(P.sky[0], P.sky[1]);
scene.fog = new THREE.Fog(C(P.fog || P.sky[1]), 40, 180);

// ---------- 재질 ----------
const mat = new Map();
const lam = (hex) => { if (!mat.has(hex)) mat.set(hex, new THREE.MeshLambertMaterial({ color: C(hex) })); return mat.get(hex); };
const glow = (hex) => new THREE.MeshBasicMaterial({ color: C(hex) });
function textSprite(text, { bg = 'rgba(0,0,0,.55)', fg = '#fff', h = 0.5 } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), F = '800 44px "Pretendard","Apple SD Gothic Neo",sans-serif';
  g.font = F; const w = Math.ceil(g.measureText(text).width) + 48; c.width = w; c.height = 72;
  g.font = F; g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, 72, 36); g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 38);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set((w / 72) * h, h, 1); s.renderOrder = 9; return s;
}

function signTexture(text) {
  const c = document.createElement('canvas'); c.width = 720; c.height = 220; const g = c.getContext('2d');
  g.fillStyle = P.primary; g.fillRect(0, 0, 720, 220); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(14, 14, 692, 192);
  let fs = 64; g.font = `800 ${fs}px "Pretendard","Apple SD Gothic Neo",sans-serif`;
  while (g.measureText(text).width > 660 && fs > 24) { fs -= 4; g.font = `800 ${fs}px "Pretendard","Apple SD Gothic Neo",sans-serif`; }
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 360, 114);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// 비어 있는 자리 찾기 (시작 위치가 소품 안이면 둘레로 밀어냄)
function freeSpot(x, z) {
  for (let r = 0; r < 12; r += 0.75) for (let a = 0; a < 6.28; a += 0.5) { const tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r; if (!blocked(tx, tz)) return [tx, tz]; }
  return [x, z];
}

// ---------- 구역 만들기 ----------
// 소품: tree · bench · lamp · sign · box · rock · flowers · fountain · kiosk  (새 종류는 여기에 추가)
function buildProp(p, zone) {
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = ((p.rot || 0) * Math.PI) / 180;
  const col = p.color || P.accent, solid = []; // solid: 부딪히는 반지름(원) 또는 상자
  switch (p.kind) {
    case 'tree': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6, 8), lam(concept.props?.trunk || '#8b6a4e')); trunk.position.y = 0.8;
      const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 * (p.scale || 1), 0), lam(p.color || concept.props?.leaf || '#5fbf86')); top.position.y = 2.3;
      g.add(trunk, top); solid.push({ r: 0.5 }); break;
    }
    case 'bench': {
      const m = lam(p.color || concept.props?.wood || '#b98b5e');
      for (const [w, h, d, y, z] of [[2, 0.1, 0.5, 0.45, 0], [2, 0.5, 0.08, 0.75, -0.22]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(0, y, z); g.add(b); }
      for (const x of [-0.85, 0.85]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.45), lam('#555')); l.position.set(x, 0.22, 0); g.add(l); }
      solid.push({ box: [1.05, 0.35] }); break;
    }
    case 'lamp': {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), lam('#444')); pole.position.y = 1.6;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), glow(p.color || concept.props?.light || '#fff3c4')); bulb.position.y = 3.3;
      const pl = new THREE.PointLight(C(p.color || concept.props?.light || '#fff3c4'), 6, 9); pl.position.y = 3.2;
      g.add(pole, bulb, pl); solid.push({ r: 0.25 }); break;
    }
    case 'sign': {
      // 앞뒤 양면에 글씨
      const face = new THREE.MeshBasicMaterial({ map: signTexture(p.text || zone.name) }), side = lam(P.primary);
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 0.12), [side, side, side, side, face, face]); board.position.y = 2.1;
      for (const x of [-1.6, 1.6]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 6), lam('#555')); l.position.set(x, 1.05, 0); g.add(l); }
      g.add(board); solid.push({ box: [1.8, 0.2] }); break;
    }
    case 'rock': { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 * (p.scale || 1), 0), lam(p.color || '#9aa0a6')); r.position.y = 0.4; r.scale.y = 0.7; g.add(r); solid.push({ r: 0.7 * (p.scale || 1) }); break; }
    case 'flowers': {
      for (let k = 0; k < 14; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), glow([P.accent, P.primary, '#ffffff'][k % 3])); f.position.set((Math.random() - 0.5) * 2.4, 0.15, (Math.random() - 0.5) * 2.4); g.add(f); }
      break;
    }
    case 'fountain': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 24), lam('#d8d8d8')); base.position.y = 0.3;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.05, 24), new THREE.MeshPhongMaterial({ color: C(concept.props?.water || '#7cc6ff'), shininess: 90 })); water.position.y = 0.6;
      const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 12), lam('#e6e6e6')); mid.position.y = 1.2;
      g.add(base, water, mid); solid.push({ r: 2.6 }); break;
    }
    case 'kiosk': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 1.8), lam(p.color || P.accent)); body.position.y = 1.2;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1, 4), lam(P.primary)); roof.position.y = 2.9; roof.rotation.y = Math.PI / 4;
      g.add(body, roof); solid.push({ box: [1.3, 1.0] });
      if (p.text) { const t = textSprite(p.text, { h: 0.42 }); t.position.y = 3.8; g.add(t); }
      break;
    }
    default: { // box
      const [w, h, d] = p.size || [1, 1, 1];
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(col)); b.position.y = h / 2; g.add(b); solid.push({ box: [w / 2, d / 2] });
    }
  }
  return { group: g, solid: solid.map((s) => ({ ...s, x: p.x, z: p.z, rot: g.rotation.y })) };
}

let zone = null, zoneGroup = null, solids = [], portals = [];
function buildZone(z) {
  if (zoneGroup) scene.remove(zoneGroup);
  zoneGroup = new THREE.Group(); scene.add(zoneGroup);
  solids = []; portals = [];
  const [W, D] = z.size || [40, 40];
  // 바닥 (가장자리 테두리 + 바둑판 무늬 조금)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lam(z.floor || P.floor)); floor.rotation.x = -Math.PI / 2; floor.name = 'floor';
  zoneGroup.add(floor);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 0.3, D + 1), lam(z.edge || P.wall)); edge.position.y = -0.16; zoneGroup.add(edge);
  if (z.shape === 'room') { // 벽 (포털 자리는 뚫림)
    const H = z.height || 5, wm = lam(z.wall || P.wall);
    const sides = [[0, -D / 2, W, 0], [0, D / 2, W, 0], [-W / 2, 0, D, 1], [W / 2, 0, D, 1]];
    for (const [cx, cz, len, alongZ] of sides) {
      const gaps = (z.portals || []).filter((p) => (alongZ ? Math.abs(p.x - cx) < 1 : Math.abs(p.z - cz) < 1)).map((p) => (alongZ ? p.z : p.x)).sort((a, b) => a - b);
      let a = -len / 2;
      for (const gp of [...gaps, len / 2 + 2]) {
        const b2 = Math.min(len / 2, gp - 1.6);
        if (b2 > a) {
          const seg = new THREE.Mesh(new THREE.BoxGeometry(alongZ ? 0.3 : b2 - a, H, alongZ ? b2 - a : 0.3), wm);
          seg.position.set(alongZ ? cx : (a + b2) / 2, H / 2, alongZ ? (a + b2) / 2 : cz); zoneGroup.add(seg);
        }
        a = gp + 1.6;
      }
    }
  }
  for (const p of z.props || []) { const r = buildProp(p, z); zoneGroup.add(r.group); solids.push(...r.solid); }
  // 포털: 빛나는 문 + 이름표
  for (const pt of z.portals || []) {
    const to = world.zones.find((x) => x.id === pt.to); if (!to) continue;
    const g = new THREE.Group(); g.position.set(pt.x, 0, pt.z);
    g.rotation.y = Math.atan2(-pt.x, -pt.z); // 구역 가운데를 바라봄
    const frame = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 32, Math.PI), lam(P.primary)); frame.position.y = 1.3;
    for (const x of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 10), lam(P.primary)); post.position.set(x, 0.65, 0); g.add(post); }
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.6), new THREE.MeshBasicMaterial({ color: C(P.accent), transparent: true, opacity: 0.55, side: THREE.DoubleSide })); face.position.y = 1.3;
    const label = textSprite(`→ ${pt.label || to.name}`, { h: 0.5 }); label.position.y = 3.4;
    g.add(frame, face, label); zoneGroup.add(g);
    portals.push({ ...pt, face, toZone: to });
  }
  zone = z;
  $('zone').textContent = z.name;
  $('zone-sub').textContent = z.desc || world.tagline || '';
  net.setZone(`${world.slug}:${z.id}`);
}

// ---------- 플레이어 ----------
const player = { x: 0, z: 0, yaw: 0, speed: 0, jumpH: 0, vy: 0 };
const avatar = new Character(C(concept.avatar?.me || '#fff3dc'), '나'); scene.add(avatar);
const R = 0.45;
function blocked(x, z) {
  const [W, D] = zone.size || [40, 40];
  if (Math.abs(x) > W / 2 - R || Math.abs(z) > D / 2 - R) return true;
  for (const s of solids) {
    if (s.r) { if (Math.hypot(x - s.x, z - s.z) < s.r + R) return true; continue; }
    const dx = x - s.x, dz = z - s.z, c = Math.cos(-s.rot), sn = Math.sin(-s.rot);
    const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
    if (Math.abs(lx) < s.box[0] + R && Math.abs(lz) < s.box[1] + R) return true;
  }
  return false;
}

// ---------- 입력 ----------
const keys = new Set();
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; keys.add(e.code); if (e.code === 'Space' && player.jumpH === 0) player.vy = 6; });
addEventListener('keyup', (e) => keys.delete(e.code));
const cam = { yaw: Math.PI, pitch: 0.35, dist: 7, manualAt: -1e9 };
const joy = { x: 0, y: 0, id: null, cx: 0, cy: 0 };
const joyEl = $('joy'), knob = $('knob');
joyEl.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); const r = joyEl.getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; moveJoy(e); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) moveJoy(e); });
const endJoy = (e) => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', endJoy); joyEl.addEventListener('pointercancel', endJoy);
function moveJoy(e) {
  let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy; const m = 46, l = Math.hypot(dx, dy);
  if (l > m) { dx *= m / l; dy *= m / l; }
  joy.x = dx / m; joy.y = -dy / m; knob.style.transform = `translate(${dx}px, ${dy}px)`;
}
// 화면 드래그 = 시점, 두 손가락 = 확대, 짧게 탭 = 그 자리로 걸어감
const cvs = renderer.domElement, ptrs = new Map();
let tap = null, pinch0 = 0, dist0 = 7, target = null;
cvs.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) tap = { t: performance.now(), moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = cam.dist; } });
cvs.addEventListener('pointermove', (e) => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1) { cam.yaw -= dx * 0.006; cam.pitch = clamp(cam.pitch + dy * 0.005, -0.2, 1.2); cam.manualAt = performance.now(); if (tap) tap.moved += Math.abs(dx) + Math.abs(dy); }
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; cam.dist = clamp(dist0 * (pinch0 / Math.hypot(a.x - b.x, a.y - b.y)), 2.5, 16); }
});
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const endPtr = (e) => {
  ptrs.delete(e.pointerId);
  if (tap && !ptrs.size && tap.moved < 10 && performance.now() - tap.t < 350) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(zoneGroup.getObjectByName('floor'))[0];
    if (hit) target = { x: hit.point.x, z: hit.point.z };
  }
  if (!ptrs.size) tap = null;
};
cvs.addEventListener('pointerup', endPtr); cvs.addEventListener('pointercancel', endPtr);
cvs.addEventListener('wheel', (e) => { cam.dist = clamp(cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 2.5, 16); }, { passive: true });

// ---------- 멀티플레이 ----------
const remotes = new Map();
const net = createNet({
  onState(m) {
    let r = remotes.get(m.id);
    if (!r || r.name !== m.n) { if (r) scene.remove(r.ch); const ch = new Character(C(m.c ?? '#fff3dc'), m.n); scene.add(ch); r = { ch, name: m.n, pos: new THREE.Vector3(m.p[0], 0, m.p[1]), yaw: m.r }; remotes.set(m.id, r); }
    r.tgt = m; r.last = performance.now();
  },
  onLeave(id) { if (id === '*') { for (const r of remotes.values()) scene.remove(r.ch); remotes.clear(); return; } const r = remotes.get(id); if (r) { scene.remove(r.ch); remotes.delete(id); } },
  onCount(n) { $('peers').textContent = `👥 ${n}명`; },
});
const r2 = (v) => Math.round(v * 100) / 100;
let activity = null, actUntil = 0;
function sendState() { net.send({ p: [r2(player.x), r2(player.z)], r: r2(player.yaw), mv: player.speed > 0 ? 1 : 0, a: activity || 0, j: r2(player.jumpH) }); }
function updateRemotes(dt) {
  const now = performance.now();
  for (const [id, r] of remotes) {
    if (now - r.last > 20000) { scene.remove(r.ch); remotes.delete(id); continue; }
    const m = r.tgt, tgt = new THREE.Vector3(m.p[0], m.j || 0, m.p[1]);
    if (r.pos.distanceTo(tgt) > 8) r.pos.copy(tgt); else r.pos.lerp(tgt, Math.min(1, dt * 8));
    let d = m.r - r.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); r.yaw += d * Math.min(1, dt * 14);
    r.ch.position.copy(r.pos); r.ch.rotation.y = r.yaw; r.ch.setActivity(m.a || null); r.ch.update(dt, m.mv ? 3 : 0, false);
  }
}

// ---------- 이동 / 포털 ----------
let fading = false;
function enterZone(id, fromId) {
  const z = world.zones.find((x) => x.id === id) || world.zones[0];
  buildZone(z);
  const back = (z.portals || []).find((p) => p.to === fromId); // 들어온 문 앞에서 시작
  if (back) { const l = Math.hypot(back.x, back.z) || 1; player.x = back.x - (back.x / l) * 5; player.z = back.z - (back.z / l) * 5; player.yaw = Math.atan2(-back.x, -back.z); }
  else { [player.x, player.z] = freeSpot(z.spawn?.[0] ?? 0, z.spawn?.[1] ?? 4); player.yaw = Math.PI; }
  cam.yaw = player.yaw + Math.PI; target = null;
  localStorage.setItem(`${world.slug}.at`, JSON.stringify({ zone: z.id, x: player.x, z: player.z }));
  toast(`📍 ${z.name}`);
}
function goPortal(p) {
  if (fading) return; fading = true;
  const fx = $('fade'); fx.classList.add('on');
  setTimeout(() => { enterZone(p.to, zone.id); setTimeout(() => { fx.classList.remove('on'); fading = false; }, 200); }, 380);
}

// ---------- HUD ----------
let toastT = 0;
function toast(msg) { $('toast').textContent = msg; $('toast').classList.add('on'); toastT = 2.2; }
$('title').textContent = world.title;
for (const b of document.querySelectorAll('[data-emote]')) b.addEventListener('click', () => { activity = b.dataset.emote; actUntil = performance.now() + 3000; });
$('btn-name').addEventListener('click', () => {
  const v = prompt('닉네임 (12자)', net.me.name)?.trim();
  if (v) { net.setName(v); avatar.setName(net.me.name); toast(`닉네임: ${net.me.name}`); }
});
avatar.setName(net.me.name);

// ---------- 시작 ----------
const saved = (() => { try { return JSON.parse(localStorage.getItem(`${world.slug}.at`)); } catch { return null; } })();
enterZone(saved?.zone || world.spawn, null);
if (saved?.zone === zone.id) [player.x, player.z] = freeSpot(saved.x, saved.z);
window.loader?.done();

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.1, clock.getDelta());
  // 이동 입력 (카메라 기준)
  let mx = 0, mz = 0, run = keys.has('ShiftLeft');
  if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (Math.hypot(joy.x, joy.y) > 0.15) { mx = joy.x; mz = joy.y; run = Math.hypot(joy.x, joy.y) > 0.92; }
  let dir = null;
  if (mx || mz) {
    target = null;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
    const dx = fx * mz - fz * mx, dz = fz * mz + fx * mx, l = Math.hypot(dx, dz);
    dir = [dx / l, dz / l]; player.speed = run ? 6 : 3.2;
  } else if (target) {
    const dx = target.x - player.x, dz = target.z - player.z, l = Math.hypot(dx, dz);
    if (l < 0.15) target = null; else { dir = [dx / l, dz / l]; player.speed = 3.6; }
  } else player.speed = 0;
  if (dir) {
    const step = player.speed * dt, nx = player.x + dir[0] * step, nz = player.z + dir[1] * step;
    let moved = false;
    if (!blocked(nx, player.z)) { player.x = nx; moved = true; }
    if (!blocked(player.x, nz)) { player.z = nz; moved = true; }
    if (!moved) target = null;
    let d = Math.atan2(dir[0], dir[1]) - player.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); player.yaw += d * Math.min(1, dt * 12);
    if (performance.now() - cam.manualAt > 2000) { let c = player.yaw + Math.PI - cam.yaw; c = Math.atan2(Math.sin(c), Math.cos(c)); cam.yaw += c * Math.min(1, dt * 1.6); }
  }
  // 점프
  if (player.jumpH > 0 || player.vy > 0) { player.vy -= 18 * dt; player.jumpH = Math.max(0, player.jumpH + player.vy * dt); if (!player.jumpH) player.vy = 0; }
  // 포털: 가까이 가면 이동
  for (const p of portals) {
    p.face.material.opacity = 0.4 + Math.sin(performance.now() / 300) * 0.15;
    if (Math.hypot(player.x - p.x, player.z - p.z) < 1.4) goPortal(p);
  }
  if (activity && performance.now() > actUntil) activity = null;
  avatar.position.set(player.x, player.jumpH, player.z); avatar.rotation.y = player.yaw;
  avatar.setActivity(activity); avatar.update(dt, dir ? player.speed : 0, false);
  // 카메라
  const cp = Math.cos(cam.pitch);
  let cx = player.x + Math.sin(cam.yaw) * cp * cam.dist, cz = player.z + Math.cos(cam.yaw) * cp * cam.dist, cy = 1.2 + player.jumpH * 0.8 + Math.sin(cam.pitch) * cam.dist;
  if (zone.shape === 'room') { const [W, D] = zone.size; cx = clamp(cx, -W / 2 + 0.6, W / 2 - 0.6); cz = clamp(cz, -D / 2 + 0.6, D / 2 - 0.6); cy = Math.min(cy, (zone.height || 5) - 0.3); } // 방 안에서는 벽 밖으로 안 나감
  camera.position.set(cx, cy, cz);
  camera.lookAt(player.x, 1 + player.jumpH * 0.8, player.z);
  sendState(); updateRemotes(dt);
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('on');
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__mv = { player, cam, world, get zone() { return zone; }, enterZone, net };
