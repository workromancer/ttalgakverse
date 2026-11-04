// 메타버스 템플릿 엔진 — world.json(세계관·구역) + concept.json(색·분위기)만 바꾸면 다른 메타버스가 됨
//  · 구역(zone) 하나씩 그림. 포털로 걸어 들어가면 다른 구역으로 이동
//  · 조작: WASD/방향키·Shift(달리기)·Space(점프), 휴대폰은 조이스틱·화면 탭(그 자리로 걸어감)·드래그(시점)
//  · 멀티플레이: Supabase 설정(.env)이 있으면 같은 구역 사람끼리 보임 (없으면 혼자)
//  ※ 이 파일은 skills/mv-build 가 복사한 시작점. 구역 모양·소품은 buildProp / buildZone 을 고치면 됨
import * as THREE from 'three';
import world from '../world/world.json';     // 세계관·구역 (mv-worldview)
import concept from '../world/concept.json'; // 색·분위기 (mv-concept)
import { Character, setTagColor, registerStyles, STYLES } from './character.js';
import { createNet } from './net.js';
import { makeProps, byName, floorTexture, rugTexture, checkTexture } from './props.js';

// ---------- 프로젝트 전용 코드 (사용자 말을 듣고 Claude 가 새로 짓는 것) ----------
//  파일만 넣으면 자동으로 불러옴. 기본 소품·캐릭터는 메뉴가 아니라 예시 — 같은 이름이면 프로젝트 것이 이김
//  src/avatars/<id>.js  캐릭터 스타일   export default { label, icon, build(ch, M, kit) }      → concept.json avatar.style
//  src/props/<kind>.js  구조물·소품     export default (p, kit) => ({ group, solid })           → world.json props[].kind
//  src/scenes/<name>.js 구역 연출       export default (ctx) => ({ update?(dt, t), dispose?() })  → world.json zone.scene (또는 world.scene = 모든 구역)
//  이름이 _ 로 시작하는 파일은 무시 (초안·보관용)
registerStyles(byName(import.meta.glob(['./avatars/*.js', '!./avatars/_*.js'], { eager: true })));
const CUSTOM_PROPS = byName(import.meta.glob(['./props/*.js', '!./props/_*.js'], { eager: true }));
const SCENES = byName(import.meta.glob(['./scenes/*.js', '!./scenes/_*.js'], { eager: true }));

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
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
$('app').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);
function fit() { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 75 : 60; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener('resize', fit); fit();
scene.add(new THREE.HemisphereLight(C(concept.light?.sky || '#ffffff'), C(concept.light?.ground || '#888888'), concept.light?.ambient ?? 1.4));
const sun = new THREE.DirectionalLight(C(concept.light?.sun || '#ffffff'), concept.light?.intensity ?? 1.2);
sun.position.set(30, 60, 20); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });

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

function signTexture(text, bg = P.primary) {
  const c = document.createElement('canvas'); c.width = 720; c.height = 220; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, 720, 220, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.roundRect(14, 14, 692, 192, 30); g.fill();
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
// 소품: tree · bench · lamp · sign · box · rock · flowers · fountain · kiosk  + props.js (shop shelf books table lantern planter crate cat stage chair rug stringlights)
const EXTRA = makeProps({ P, concept, lam, glow, tex: { sign: signTexture, rug: rugTexture, check: checkTexture }, custom: CUSTOM_PROPS });
function buildProp(p, zone) {
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = ((p.rot || 0) * Math.PI) / 180;
  if (EXTRA[p.kind]) { // shop shelf books table lantern planter crate cat stage chair rug stringlights
    const r = EXTRA[p.kind](p); g.add(r.group);
    g.traverse((o) => { if (o.isMesh && o.castShadow === false && !o.material.isMeshBasicMaterial) o.castShadow = true; });
    return { group: g, solid: r.solid.map((sd) => ({ ...sd, ...rotOff(sd, p, g.rotation.y) })) };
  }
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
  g.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, solid: solid.map((s) => ({ ...s, x: p.x, z: p.z, rot: g.rotation.y })) };
}
// 소품 안에서 떨어진 부딪힘 영역(dx, dz)을 회전 반영해 월드 좌표로
function rotOff(sd, p, rot) {
  const dx = sd.dx || 0, dz = sd.dz || 0, c = Math.cos(rot), s = Math.sin(rot);
  return { x: p.x + dx * c + dz * s, z: p.z - dx * s + dz * c, rot };
}

let zone = null, zoneGroup = null, solids = [], portals = [], waters = [], zoneFx = [];
// 배경 건물 창문 무늬
const winTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) if (Math.random() < 0.45) { g.fillStyle = '#fff'; g.fillRect(x * 16 + 4, y * 8 + 2, 8, 4); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); return t; })();
function buildZone(z) {
  if (zoneGroup) scene.remove(zoneGroup);
  zoneGroup = new THREE.Group(); scene.add(zoneGroup);
  solids = []; portals = [];
  const [W, D] = z.size || [40, 40];
  // 바닥 (가장자리 테두리 + 바둑판 무늬 조금)
  // 바닥: pattern = cobble(돌길)·wood(마루)·tile·grass·plain. areas 로 구역 안 일부를 다른 무늬로 (예: 잔디 위 산책로)
  const fmat = (pat, color, w, d) => { if (!pat || pat === 'plain') return lam(color); const t = floorTexture(pat, color); t.repeat.set(w / 4, d / 4); return new THREE.MeshLambertMaterial({ map: t }); };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), fmat(z.pattern, z.floor || P.floor, W, D)); floor.rotation.x = -Math.PI / 2; floor.name = 'floor'; floor.receiveShadow = true;
  zoneGroup.add(floor);
  for (const a of z.areas || []) { // { x, z, w, d, pattern, color }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.d), fmat(a.pattern, a.color || P.floor, a.w, a.d)); m.rotation.x = -Math.PI / 2; m.position.set(a.x, 0.006, a.z); m.receiveShadow = true; zoneGroup.add(m);
  }
  // 물: { x, z, w, d } 또는 { x, z, r } — 들어갈 수 없음, 잔잔히 반짝임
  waters = (z.water || []).map((wv) => {
    const geo = wv.r ? new THREE.CircleGeometry(wv.r, 48) : new THREE.PlaneGeometry(wv.w, wv.d, 1, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: C(wv.color || concept.props?.water || '#6fb6e8'), specular: '#ffffff', shininess: 120, transparent: true, opacity: 0.9 }));
    m.rotation.x = -Math.PI / 2; m.position.set(wv.x, 0.09, wv.z); m.receiveShadow = true; zoneGroup.add(m);
    if (!wv.r) { const bank = new THREE.Mesh(new THREE.BoxGeometry(wv.w + 0.6, 0.12, wv.d + 0.6), lam('#bdb6a8')); bank.position.set(wv.x, 0.0, wv.z); zoneGroup.add(bank); }
    return { ...wv, mesh: m };
  });
  // 야외 구역 둘레에 도시 실루엣 (불 켜진 창), skyline: false 로 끔
  if (z.shape !== 'room' && z.skyline !== false) {
    const R = Math.max(W, D) * 0.9 + 30, rnd = (k) => ((Math.sin(k * 91.7) + 1) / 2);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, h = 10 + rnd(i) * 28, w = 8 + rnd(i + 3) * 10;
      let d = R + rnd(i + 7) * 20, bx, bz;
      const wet = () => waters.some((wv) => !wv.r && Math.abs(bx - wv.x) < wv.w / 2 + w && Math.abs(bz - wv.z) < wv.d / 2 + w);
      for (let k = 0; k < 40; k++) { bx = Math.cos(a) * d; bz = Math.sin(a) * d; if (!wet()) break; d += 8; } // 강 건너편으로 밀어냄
      if (wet()) continue;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: C(P.fog || P.sky[1]).lerp(C(P.sky[0]), 0.4), emissive: C('#ffe2a8'), emissiveMap: winTex, emissiveIntensity: 0.3 }));
      b.position.set(bx, h / 2 - 0.5, bz); zoneGroup.add(b);
    }
  }
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
  (z.props || []).forEach((p, i) => { const r = buildProp(p, z); r.group.userData.prop = { zone: z.id, index: i, kind: p.kind, text: p.text }; zoneGroup.add(r.group); solids.push(...r.solid); }); // userData.prop: 📝 구조물 콕 집기용
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
  // 구역 연출 (src/scenes/*.js): 지형·날씨·빛·움직이는 것 등 엔진 기본 그리기로 안 되는 것
  for (const fx of zoneFx) fx.dispose?.();
  zoneFx = [];
  for (const name of [...[].concat(world.scene || []), ...[].concat(z.scene || [])]) {
    const fn = SCENES[name]; if (!fn) { console.warn(`scene '${name}' 없음 → src/scenes/${name}.js`); continue; }
    try { zoneFx.push(fn({ THREE, group: zoneGroup, scene, camera, renderer, zone: z, world, P, concept, lam, glow, textSprite, solid: (sd) => solids.push(sd), player }) || {}); }
    catch (e) { console.error(`scene '${name}' 오류`, e); }
  }
  zone = z;
  scene.fog.near = z.fog?.[0] ?? 50; scene.fog.far = z.fog?.[1] ?? Math.max(180, Math.max(W, D) * 2.2 + 140); // 큰 구역·배경 타워가 안개에 안 묻히게
  $('zone').textContent = z.name;
  $('zone-sub').textContent = z.desc || world.tagline || '';
  net.setZone(`${world.slug}:${z.id}`);
}

// ---------- 플레이어 ----------
const player = { x: 0, z: 0, yaw: 0, speed: 0, jumpH: 0, vy: 0 };
// 캐릭터: concept.json avatar.style (기본), avatar.styles 를 여러 개 두면 방문자가 🎭 로 골라 씀
const AV = concept.avatar || {};
const STY = (AV.styles?.length ? AV.styles : [AV.style || 'bunny']).filter((id) => STYLES[id]);
if (!STY.length) STY.push('bunny');
let avatar = new Character(C(AV.me || '#fff3dc'), '나', STY[0]); scene.add(avatar);
const R = 0.45;
function blocked(x, z) {
  const [W, D] = zone.size || [40, 40];
  if (Math.abs(x) > W / 2 - R || Math.abs(z) > D / 2 - R) return true;
  for (const wv of waters) { if (wv.r ? Math.hypot(x - wv.x, z - wv.z) < wv.r + 0.2 : Math.abs(x - wv.x) < wv.w / 2 + 0.2 && Math.abs(z - wv.z) < wv.d / 2 + 0.2) return true; }
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
addEventListener('keydown', (e) => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return; keys.add(e.code); if (e.code === 'Space' && player.jumpH === 0) player.vy = 6; });
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
    if (!r || r.name !== m.n || r.k !== m.k) { if (r) scene.remove(r.ch); const ch = new Character(C(m.c ?? '#fff3dc'), m.n, m.k || STY[0]); scene.add(ch); r = { ch, name: m.n, k: m.k, pos: r?.pos || new THREE.Vector3(m.p[0], 0, m.p[1]), yaw: m.r }; remotes.set(m.id, r); }
    r.tgt = m; r.last = performance.now();
  },
  onLeave(id) { if (id === '*') { for (const r of remotes.values()) scene.remove(r.ch); remotes.clear(); return; } const r = remotes.get(id); if (r) { scene.remove(r.ch); remotes.delete(id); } },
  onCount(n) { $('peers').textContent = `👥 ${n}명`; },
});
const r2 = (v) => Math.round(v * 100) / 100;
let activity = null, actUntil = 0;
function sendState() { net.send({ p: [r2(player.x), r2(player.z)], r: r2(player.yaw), mv: player.speed > 0 ? 1 : 0, a: activity || 0, j: r2(player.jumpH), k: avatar.style }); }
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
function setStyle(id) {
  const old = avatar; avatar = new Character(C(AV.me || '#fff3dc'), null, id); avatar.setName(net.me.name);
  avatar.position.copy(old.position); avatar.rotation.y = old.rotation.y; scene.remove(old); scene.add(avatar);
  net.me.style = id; net.save();
}
if (STY.includes(net.me.style) && net.me.style !== avatar.style) setStyle(net.me.style);
if (STY.length > 1) { // 🎭 캐릭터 바꾸기 (월드 주인이 여러 스타일을 열어 둔 경우)
  const b = document.createElement('button'); b.title = '캐릭터 바꾸기'; b.textContent = '🎭'; $('dock').insertBefore(b, $('btn-name'));
  b.addEventListener('click', () => { const id = STY[(STY.indexOf(avatar.style) + 1) % STY.length]; setStyle(id); toast(`${STYLES[id].icon || '🎭'} ${STYLES[id].label || id}`); });
}

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
  camera.position.set(cx, Math.max(cy, 0.35), cz); // 땅 밑으로 안 내려감 (올려다보기)
  camera.lookAt(player.x, 1 + player.jumpH * 0.8, player.z);
  sun.position.set(player.x + 30, 60, player.z + 20); sun.target.position.set(player.x, 0, player.z); // 그림자가 늘 내 주변에
  for (const fx of zoneFx) fx.update?.(dt, clock.elapsedTime);
  sendState(); updateRemotes(dt);
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('on');
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__mv = { player, cam, world, get zone() { return zone; }, enterZone, net, remotes, get avatar() { return avatar; }, setStyle };
// 📝 고칠 점 남기기 버튼 — 개발 서버에서만 (배포 빌드에서는 이 줄이 통째로 빠짐)
if (import.meta.env.DEV) import('./feedback.js').then((m) => m.mountFeedback({ renderer, scene, camera, player, cam, toast, get zone() { return zone; }, get zoneGroup() { return zoneGroup; } }));
