import * as THREE from 'three';
// 이름표 색은 setTagColor 로 바꿀 수 있음 (월드 테마 색)
export const TAG = { rgb: '0,168,77' };
export const setTagColor = (hex) => { const c = parseInt(String(hex).replace('#', ''), 16); TAG.rgb = `${c >> 16 & 255},${c >> 8 & 255},${c & 255}`; };

// 캐릭터 스타일 — concept.json 의 avatar.style (mv-concept 의 캐릭터 단계에서 사용자와 함께 정함)
//  모든 스타일이 같은 뼈대(bodyPivot·hands·feet·top)를 써서 걷기·이모트·액세서리·멀티플레이가 그대로 동작한다.
//  새 스타일은 여기 말고 src/avatars/<id>.js 에 { label, icon, build(ch, M, kit) } 로 (아래 registerStyles). build 는 ch.bodyPivot 에 몸·얼굴을 붙이고
//  필요하면 ch.rig(손발 위치)·ch.accT(액세서리 위치·크기)·ch.float(떠 있기)·ch.top(흔들리는 머리 장식)을 바꾼다.
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
const glowM = (c) => new THREE.MeshBasicMaterial({ color: c });
const add = (parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); parent.add(o); return o; };
const sph = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
// 공통 얼굴: 눈(하이라이트)·볼터치·입. f = { y, z, dx, blush, mouth }
function face(ch, M, f = {}) {
  const { y = 0.55, z = 0.385, dx = 0.13, blush = true, mouth = true, eyeMat = M.dark } = f;
  for (const s of [-1, 1]) {
    add(ch.bodyPivot, sph(0.05, 14, 10), eyeMat, s * dx, y, z, 0.85, 1.1, 0.5);
    if (eyeMat === M.dark) add(ch.bodyPivot, sph(0.016, 8, 6), M.white, s * dx + 0.015, y + 0.025, z + 0.025);
    if (blush) { const b = add(ch.bodyPivot, new THREE.CircleGeometry(0.055, 16), M.pink, s * (dx + 0.12), y - 0.08, z - 0.035, 1, 0.6, 1); b.rotation.y = s * 0.55; }
  }
  if (mouth) { const m = add(ch.bodyPivot, new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI), M.dark, 0, y - 0.08, z + 0.01); m.rotation.z = Math.PI; }
}
const roundBody = (ch, M, sx = 1.05, sy = 0.95) => add(ch.bodyPivot, sph(0.42, 28, 20), M.skin, 0, 0.46, 0, sx, sy, 0.95);
const sprout = (ch, color = 0x3fbf6f) => {
  const leaf = lam(color), g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6), leaf, 0, 0.05, 0);
  const l1 = add(g, sph(0.06, 10, 8), leaf, -0.06, 0.1, 0, 1.4, 0.35, 0.8); l1.rotation.z = 0.4;
  const l2 = add(g, sph(0.06, 10, 8), leaf, 0.06, 0.1, 0, 1.4, 0.35, 0.8); l2.rotation.z = -0.4;
  g.position.y = 0.86; ch.top = g; ch.bodyPivot.add(g);
};

export const STYLES = {
  bunny: { label: '말랑 토끼', icon: '🐰', build(ch, M) {
    roundBody(ch, M);
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      add(ear, new THREE.CapsuleGeometry(0.1, 0.14, 6, 12), M.skin);
      add(ear, new THREE.CapsuleGeometry(0.055, 0.1, 4, 10), lam(0xffc2cf), 0, 0, 0.055, 1, 1, 0.5);
      ear.position.set(s * 0.22, 0.86, -0.02); ear.rotation.z = -s * 0.35; ch.bodyPivot.add(ear);
    }
    sprout(ch); face(ch, M);
  } },
  cat: { label: '골목 고양이', icon: '🐱', build(ch, M) {
    roundBody(ch, M, 1.08, 0.92);
    for (const s of [-1, 1]) {
      const e = add(ch.bodyPivot, new THREE.ConeGeometry(0.12, 0.22, 4), M.skin, s * 0.22, 0.86, 0); e.rotation.set(0, Math.PI / 4, -s * 0.3);
      const ie = add(ch.bodyPivot, new THREE.ConeGeometry(0.065, 0.13, 4), lam(0xffc2cf), s * 0.22, 0.85, 0.05); ie.rotation.set(0, Math.PI / 4, -s * 0.3);
      for (const k of [-1, 1]) { const w = add(ch.bodyPivot, new THREE.BoxGeometry(0.16, 0.008, 0.008), M.dark, s * 0.3, 0.47 + k * 0.025, 0.36); w.rotation.z = s * k * 0.12; }
    }
    face(ch, M, { blush: false, mouth: false });
    for (const s of [-1, 1]) { const m = add(ch.bodyPivot, new THREE.TorusGeometry(0.022, 0.008, 6, 10, Math.PI), M.dark, s * 0.022, 0.47, 0.395); m.rotation.z = Math.PI; } // ω 입
    add(ch.bodyPivot, sph(0.022, 8, 6), lam(0xff8fa8), 0, 0.5, 0.405);
    const tail = add(ch.bodyPivot, new THREE.TorusGeometry(0.16, 0.04, 8, 16, Math.PI * 1.2), M.skin, 0, 0.42, -0.42); tail.rotation.set(0, Math.PI / 2, 0.6);
    ch.top = tail;
  } },
  bear: { label: '포근 곰', icon: '🐻', build(ch, M) {
    roundBody(ch, M);
    for (const s of [-1, 1]) { add(ch.bodyPivot, sph(0.11, 14, 10), M.skin, s * 0.27, 0.8, -0.02, 1, 1, 0.7); add(ch.bodyPivot, sph(0.06, 10, 8), lam(0x8b6a4e), s * 0.27, 0.8, 0.04, 1, 1, 0.4); }
    add(ch.bodyPivot, sph(0.13, 16, 12), lam(0xf4e2c8), 0, 0.46, 0.33, 1.2, 0.85, 0.7); // 주둥이
    add(ch.bodyPivot, sph(0.035, 10, 8), M.dark, 0, 0.5, 0.42, 1.3, 0.9, 0.8);
    face(ch, M, { y: 0.6, dx: 0.14, mouth: false });
    ch.top = new THREE.Group(); ch.bodyPivot.add(ch.top);
  } },
  chick: { label: '삐약 병아리', icon: '🐥', build(ch, M) {
    roundBody(ch, M, 1, 1);
    const beak = add(ch.bodyPivot, new THREE.ConeGeometry(0.06, 0.12, 8), lam(0xff9f1c), 0, 0.47, 0.43); beak.rotation.x = Math.PI / 2;
    face(ch, M, { mouth: false });
    const tuft = new THREE.Group();
    for (const k of [-1, 0, 1]) { const f = add(tuft, new THREE.CapsuleGeometry(0.025, 0.1, 4, 8), M.skin, k * 0.04, 0.05, 0); f.rotation.z = -k * 0.5; }
    tuft.position.y = 0.86; ch.top = tuft; ch.bodyPivot.add(tuft);
    ch.handShape = [1.4, 0.6, 0.8]; ch.footColor = 0xff9f1c; // 날개 손, 주황 발
  } },
  ghost: { label: '둥실 유령', icon: '👻', build(ch, M) {
    add(ch.bodyPivot, new THREE.CapsuleGeometry(0.36, 0.3, 10, 20), M.skin, 0, 0.55, 0, 1.05, 1, 0.95);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; add(ch.bodyPivot, sph(0.11, 10, 8), M.skin, Math.sin(a) * 0.28, 0.2, Math.cos(a) * 0.28); }
    face(ch, M, { y: 0.66, z: 0.35, dx: 0.12 });
    ch.top = new THREE.Group(); ch.bodyPivot.add(ch.top);
    ch.float = 0.18; ch.noFeet = true; ch.accT = { y: 0.12, s: 0.95 };
  } },
  robot: { label: '반짝 로봇', icon: '🤖', build(ch, M) {
    add(ch.bodyPivot, new THREE.BoxGeometry(0.7, 0.66, 0.6), M.skin, 0, 0.48, 0);
    add(ch.bodyPivot, new THREE.BoxGeometry(0.54, 0.32, 0.02), M.dark, 0, 0.55, 0.305);
    const eye = glowM(0x5fe0ff);
    for (const s of [-1, 1]) add(ch.bodyPivot, new THREE.BoxGeometry(0.08, 0.1, 0.01), eye, s * 0.12, 0.57, 0.318);
    add(ch.bodyPivot, new THREE.BoxGeometry(0.14, 0.025, 0.01), eye, 0, 0.47, 0.318);
    for (const s of [-1, 1]) add(ch.bodyPivot, new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), lam(0x9aa3ad), s * 0.37, 0.55, 0).rotation.z = Math.PI / 2;
    const ant = new THREE.Group();
    add(ant, new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), lam(0x9aa3ad), 0, 0.08, 0);
    add(ant, sph(0.04, 10, 8), glowM(0xff5d73), 0, 0.17, 0);
    ant.position.y = 0.81; ch.top = ant; ch.bodyPivot.add(ant);
    ch.handBox = true; ch.footColor = 0x6b7480; ch.accT = { y: 0.02, s: 1 };
  } },
  kid: { label: '꼬마 사람', icon: '🧒', build(ch, M) {
    // 몸(옷) = 플레이어 색, 얼굴은 살구색, 머리카락
    const skin = lam(0xf6d2b0);
    add(ch.bodyPivot, new THREE.CapsuleGeometry(0.2, 0.18, 8, 16), M.skin, 0, 0.36, 0, 1.15, 1, 0.95);
    add(ch.bodyPivot, sph(0.3, 24, 18), skin, 0, 0.8, 0);
    const hair = lam(0x3a2a22);
    add(ch.bodyPivot, new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.82, -0.02).rotation.x = -0.35;
    face(ch, M, { y: 0.78, z: 0.275, dx: 0.1 });
    ch.top = add(ch.bodyPivot, sph(0.06, 10, 8), hair, 0.08, 1.1, -0.05); // 삐친 머리
    ch.handMat = skin; ch.footColor = 0x3a3f47; ch.rig = { hx: 0.3, hy: 0.36, fx: 0.11 };
    ch.accT = { y: 0.47, s: 0.72 }; // 액세서리를 작은 머리 위치로
  } },
};
// 캐릭터를 짓는 도구 묶음 — 프로젝트 전용 스타일(src/avatars/<id>.js)이 import 없이 쓴다
export const KIT = { THREE, lam, glow: glowM, add, sph, face, roundBody, sprout };
// 프로젝트 전용 스타일 등록: src/avatars/<id>.js 가 export default { label, icon, build(ch, M, kit) }
//  사용자가 말한 캐릭터를 Claude 가 새로 짓는 곳. 위 STYLES 는 메뉴가 아니라 "이렇게 지으면 된다" 는 예시
export function registerStyles(map = {}) { for (const [id, def] of Object.entries(map)) if (def?.build) STYLES[id] = def; return STYLES; }

export class Character extends THREE.Group {
  constructor(color = 0xfff3dc, name = null, style = 'bunny') {
    super();
    this.style = STYLES[style] ? style : 'bunny';
    const M = { skin: lam(color), dark: new THREE.MeshBasicMaterial({ color: 0x2a2320 }), white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      pink: new THREE.MeshBasicMaterial({ color: 0xff9db5, transparent: true, opacity: 0.85 }) };
    // 몸 전체 피벗 (통통 튀기 / 찌그러지기)
    this.bodyPivot = new THREE.Group();
    this.add(this.bodyPivot);
    this.rig = { hx: 0.44, hy: 0.38, fx: 0.17 }; this.accT = { y: 0, s: 1 }; this.float = 0;
    STYLES[this.style].build(this, M, KIT);
    this.sprout = this.top || new THREE.Group(); // (예전 이름 호환) 걸을 때 흔들리는 머리 장식

    // 작은 손 / 발
    const r = this.rig;
    this.hands = [-1, 1].map((s) => {
      const h = this.handBox ? new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.13), lam(0x9aa3ad)) : new THREE.Mesh(sph(0.09, 12, 10), this.handMat || M.skin);
      h.scale.set(...(this.handShape || [0.8, 1, 0.8])); h.position.set(s * r.hx, r.hy, 0.05);
      this.bodyPivot.add(h); return h;
    });
    this.feet = [-1, 1].map((s) => {
      const f = this.handBox ? new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.26), lam(this.footColor)) : new THREE.Mesh(sph(0.11, 12, 10), lam(this.footColor ?? 0xf4cf9a));
      if (!this.handBox) f.scale.set(1, 0.55, 1.3);
      f.position.set(s * r.fx, 0.05, 0.05); f.visible = !this.noFeet;
      this.add(f); return f;
    });

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.2, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012;
    this.shadow = shadow; this.add(shadow);
    if (name) this.add(nameTag(name));
    this.t = 0; this.walk = 0; this.amt = 0;
    this.activity = null; this.actT = 0;
  }
  // 액세서리: { head, face, neck, back } (부위마다 하나)
  setAccessories(acc = {}) {
    const key = ACC_SLOTS.map((k) => acc[k] || '').join('|');
    if (key === this.accKey) return;
    this.accKey = key;
    if (this.accGroup) this.bodyPivot.remove(this.accGroup);
    this.accGroup = new THREE.Group();
    this.accGroup.position.y = this.accT.y; this.accGroup.scale.setScalar(this.accT.s);
    for (const slot of ACC_SLOTS) { const id = acc[slot]; const def = ACC[slot]?.find((a) => a.id === id); if (def?.build) this.accGroup.add(def.build()); }
    this.sprout.visible = this.style === 'cat' || !['cap', 'beanie', 'crown'].includes(acc.head);
    this.bodyPivot.add(this.accGroup);
  }
  setName(name) {
    const old = this.getObjectByName('tag');
    if (old) this.remove(old);
    this.add(nameTag(name));
  }
  // HUD 행동(지도 보기, 이모트 등) → 머리 위 말풍선 + 소품/동작. 다른 유저에게도 그대로 보임
  setActivity(a) {
    a = ACTS[a] ? a : null;
    if (a === this.activity) return;
    this.activity = a; this.actT = 0;
    if (this.bubble) { this.remove(this.bubble); this.bubble = null; }
    // 이전 행동의 소품·자세는 먼저 모두 정리 (행동이 끝났을 때도)
    if (this.mapProp) this.mapProp.visible = false;
    if (this.phoneProp) this.phoneProp.visible = false;
    this.bodyPivot.rotation.set(0, 0, 0);
    this.bodyPivot.scale.set(1, 1, 1);
    if (!a) return;
    this.bubble = bubbleSprite(ACTS[a].emoji);
    this.add(this.bubble);
    if (a === 'map') {
      if (!this.mapProp) { this.mapProp = mapProp(); this.bodyPivot.add(this.mapProp); }
      this.mapProp.visible = true;
    }
    if (a === 'phone') {
      if (!this.phoneProp) { this.phoneProp = phoneProp(); this.bodyPivot.add(this.phoneProp); }
      this.phoneProp.visible = true;
    }
  }
  update(dt, speed, sitting) {
    this.baseUpdate(dt, speed, sitting);
    const a = this.activity; if (!a) return;
    this.actT += dt;
    const t = this.actT, bp = this.bodyPivot, [hl, hr] = this.hands;
    if (this.bubble) { const k = Math.min(1, t * 6); this.bubble.scale.set(0.42 * k, 0.42 * k, 1); this.bubble.position.y = 1.72 + Math.sin(t * 3) * 0.03; }
    if (a === 'map') { hl.position.set(-0.24, 0.42, 0.42); hr.position.set(0.24, 0.42, 0.42); bp.rotation.x = 0.12; }
    else if (a === 'wave') { hr.position.set(0.4, 0.82 + Math.sin(t * 10) * 0.04, 0.12); hr.position.x = 0.4 + Math.sin(t * 10) * 0.08; }
    else if (a === 'heart') { const s = 1 + Math.max(0, Math.sin(t * 9)) * 0.06; bp.scale.set(s, s, s); hl.position.set(-0.2, 0.5, 0.36); hr.position.set(0.2, 0.5, 0.36); }
    else if (a === 'laugh') { bp.rotation.z = Math.sin(t * 22) * 0.08; hl.position.set(-0.3, 0.5, 0.3); hr.position.set(0.3, 0.5, 0.3); }
    else if (a === 'party') { bp.rotation.y = t * 9; bp.position.y += Math.abs(Math.sin(t * 9)) * 0.15; hl.position.y = 0.8; hr.position.y = 0.8; }
    else if (a === 'look') { bp.rotation.y = Math.sin(t * 1.5) * 0.5; hr.position.set(0.25, 0.62, 0.36); }
    else if (a === 'phone') {
      // 두 손으로 폰을 들고 고개를 숙여 들여다봄 (가끔 화면을 톡톡)
      hl.position.set(-0.13, 0.4, 0.4); hr.position.set(0.13, 0.4 + Math.max(0, Math.sin(t * 6)) * 0.03, 0.42);
      bp.rotation.x = 0.16;
      this.phoneProp.children[1].material.color.setHSL(0.38, 0.6, 0.55 + Math.sin(t * 2) * 0.05);
    }
    else if (a === 'name' || a === 'info') { hl.position.set(-0.15, 0.4, 0.42); hr.position.set(0.15, 0.4, 0.42); }
  }
  baseUpdate(dt, speed, sitting) {
    this.t += dt;
    this.amt += (Math.min(1, speed / 3) - this.amt) * Math.min(1, dt * 10);
    if (this.amt > 0.02) this.walk += dt * (6 + speed * 2.5);
    const a = this.amt, w = this.walk, bp = this.bodyPivot;
    this.sprout.rotation.z = Math.sin(this.t * 3 + w) * 0.15;
    const r = this.rig, fl = this.float ? this.float + Math.sin(this.t * 2.2) * 0.05 : 0; // 유령은 둥실
    if (sitting) {
      bp.position.set(0, 0, -0.02); bp.rotation.set(-0.08, 0, 0);
      bp.scale.set(1, 1 + Math.sin(this.t * 2) * 0.015, 1);
      this.feet.forEach((f, i) => f.position.set((i ? 1 : -1) * r.fx, 0.1, 0.36));
      this.hands.forEach((h, i) => h.position.set((i ? 1 : -1) * (r.hx - 0.06), r.hy - 0.08, 0.2));
      this.shadow.visible = false;
      return;
    }
    this.shadow.visible = true;
    const hop = Math.abs(Math.sin(w)) * 0.09 * a;
    const squash = 1 - Math.cos(w * 2) * 0.05 * a + Math.sin(this.t * 2.4) * 0.02 * (1 - a);
    bp.position.set(0, hop + fl, 0);
    bp.scale.set(1 + (1 - squash) * 0.6, squash, 1 + (1 - squash) * 0.6);
    bp.rotation.set(0.06 * a, 0, Math.sin(w) * 0.1 * a);
    this.feet.forEach((f, i) => {
      const ph = w + (i ? Math.PI : 0);
      f.position.set((i ? 1 : -1) * r.fx, 0.05 + Math.max(0, Math.sin(ph)) * 0.07 * a, 0.05 + Math.cos(ph) * 0.14 * a);
    });
    this.hands.forEach((h, i) => {
      const ph = w + (i ? 0 : Math.PI);
      h.position.set((i ? 1 : -1) * r.hx, r.hy + fl + Math.sin(this.t * 2.4) * 0.01, 0.05 + Math.cos(ph) * 0.1 * a);
    });
  }
}

// ---------- 액세서리 ----------
const M_ = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const P_ = (c) => new THREE.MeshPhongMaterial({ color: c, shininess: 80, specular: 0x666666 });
const mesh = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); return o;
};
const grp = (...c) => { const g = new THREE.Group(); g.add(...c); return g; };
export const ACC_SLOTS = ['head', 'face', 'neck', 'back'];
export const ACC = {
  head: [
    { id: '', label: '없음', icon: '✖️' },
    { id: 'cap', label: '야구모자', icon: '🧢', build: () => { const m = M_(0xe0443e); return grp(
      mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 0.74, -0.02, -0.12, 0, 0, 1.08, 0.7, 1.08),
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 20), m, 0, 0.76, 0.28, 0.1, 0, 0, 1, 1, 1.3),
      mesh(new THREE.SphereGeometry(0.03, 8, 6), M_(0xffffff), 0, 0.95, -0.03)); } },
    { id: 'beanie', label: '털모자', icon: '🧶', build: () => grp(
      mesh(new THREE.SphereGeometry(0.33, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M_(0x3b7dd8), 0, 0.7, 0, 0, 0, 0, 1.05, 0.85, 1.05),
      mesh(new THREE.TorusGeometry(0.33, 0.05, 8, 24), M_(0xf1f1f1), 0, 0.71, 0, Math.PI / 2, 0, 0, 1.05, 1.05, 1),
      mesh(new THREE.SphereGeometry(0.075, 10, 8), M_(0xffffff), 0, 1.0, 0)) },
    { id: 'crown', label: '왕관', icon: '👑', build: () => { const m = P_(0xf6c443); const g = grp(mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.09, 16, 1, true), m, 0, 0.9, 0));
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.045, 0.1, 6), m, Math.sin(a) * 0.17, 0.99, Math.cos(a) * 0.17)); }
      g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), P_(0xe84a6f), 0, 0.9, 0.19)); return g; } },
    { id: 'bow', label: '리본', icon: '🎀', build: () => { const m = M_(0xff7eb6); return grp(
      mesh(new THREE.SphereGeometry(0.08, 10, 8), m, 0.1, 0.9, 0.08, 0, 0, 0.5, 1.2, 0.7, 0.5),
      mesh(new THREE.SphereGeometry(0.08, 10, 8), m, 0.26, 0.86, 0.08, 0, 0, -0.5, 1.2, 0.7, 0.5),
      mesh(new THREE.SphereGeometry(0.04, 8, 6), M_(0xe2559a), 0.18, 0.88, 0.1)); } },
    { id: 'phones', label: '헤드폰', icon: '🎧', build: () => { const m = P_(0x2c2f36); return grp(
      mesh(new THREE.TorusGeometry(0.43, 0.03, 8, 28, Math.PI), m, 0, 0.5, -0.02),
      mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), m, -0.43, 0.5, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), m, 0.43, 0.5, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), M_(0x00a84d), -0.45, 0.5, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), M_(0x00a84d), 0.45, 0.5, 0, 0, 0, Math.PI / 2)); } },
  ],
  face: [
    { id: '', label: '없음', icon: '✖️' },
    { id: 'glasses', label: '안경', icon: '👓', build: () => { const m = M_(0x222222); return grp(
      mesh(new THREE.TorusGeometry(0.072, 0.012, 6, 20), m, -0.13, 0.56, 0.405),
      mesh(new THREE.TorusGeometry(0.072, 0.012, 6, 20), m, 0.13, 0.56, 0.405),
      mesh(new THREE.BoxGeometry(0.11, 0.015, 0.015), m, 0, 0.57, 0.415)); } },
    { id: 'shades', label: '선글라스', icon: '🕶️', build: () => { const m = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100, specular: 0xffffff }); return grp(
      mesh(new THREE.CircleGeometry(0.085, 20), m, -0.13, 0.56, 0.415, 0, -0.2), mesh(new THREE.CircleGeometry(0.085, 20), m, 0.13, 0.56, 0.415, 0, 0.2),
      mesh(new THREE.BoxGeometry(0.12, 0.02, 0.015), m, 0, 0.58, 0.42)); } },
  ],
  neck: [
    { id: '', label: '없음', icon: '✖️' },
    { id: 'scarf', label: '목도리', icon: '🧣', build: () => { const m = M_(0x00a84d); return grp(
      mesh(new THREE.TorusGeometry(0.34, 0.07, 10, 28), m, 0, 0.3, 0, Math.PI / 2, 0, 0, 1.05, 1.0, 1),
      mesh(new THREE.BoxGeometry(0.12, 0.26, 0.05), m, 0.16, 0.18, 0.36, 0.25, 0, 0.15)); } },
    { id: 'bowtie', label: '나비넥타이', icon: "<svg viewBox=\"0 0 32 20\" width=\"30\" height=\"20\"><path d=\"M2 2 L14 8 L14 12 L2 18 Z M30 2 L18 8 L18 12 L30 18 Z\" fill=\"#d8343f\"/><rect x=\"13\" y=\"6.5\" width=\"6\" height=\"7\" rx=\"2\" fill=\"#a8202a\"/></svg>", build: () => { const m = M_(0xd8343f); return grp(
      mesh(new THREE.ConeGeometry(0.07, 0.12, 4), m, -0.07, 0.3, 0.39, 0, 0, Math.PI / 2),
      mesh(new THREE.ConeGeometry(0.07, 0.12, 4), m, 0.07, 0.3, 0.39, 0, 0, -Math.PI / 2),
      mesh(new THREE.SphereGeometry(0.035, 8, 6), m, 0, 0.3, 0.405)); } },
  ],
  back: [
    { id: '', label: '없음', icon: '✖️' },
    { id: 'bag', label: '백팩', icon: '🎒', build: () => { const m = M_(0xf2b632), d = M_(0xc98f1c); return grp(
      mesh(new THREE.BoxGeometry(0.42, 0.42, 0.18), m, 0, 0.47, -0.42),
      mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), d, 0, 0.38, -0.53),
      mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI), d, -0.17, 0.5, -0.1, 0, Math.PI / 2, 0),
      mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI), d, 0.17, 0.5, -0.1, 0, Math.PI / 2, 0)); } },
  ],
};
export const accToStr = (acc = {}) => ACC_SLOTS.map((k) => acc[k] || '').join('.');
export const accFromStr = (s = '') => { const p = String(s).split('.'); return Object.fromEntries(ACC_SLOTS.map((k, i) => [k, p[i] || ''])); };

export const ACTS = {
  map: { emoji: '🗺️', label: '지도' }, phone: { emoji: '📱', label: '폰 보는 중' }, whistle: { emoji: '📢', label: '호루라기' }, chased: { emoji: '💦', label: '도망 중' }, info: { emoji: '📱', label: '내 정보' }, look: { emoji: '👀', label: '구경' }, name: { emoji: '✏️', label: '이름 짓는 중' },
  youtube: { emoji: '📺', label: '유튜브 보는 중' },
  wave: { emoji: '👋', label: '안녕' }, heart: { emoji: '❤️', label: '좋아요' }, laugh: { emoji: '😂', label: '웃음' }, party: { emoji: '🎉', label: '축하' },
};
const bubbleCache = {};
function bubbleSprite(emoji) {
  if (!bubbleCache[emoji]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath(); ctx.arc(64, 58, 50, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(52, 100); ctx.lineTo(64, 124); ctx.lineTo(76, 100); ctx.fill();
    ctx.font = '62px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 62);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    bubbleCache[emoji] = new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true });
  }
  const s = new THREE.Sprite(bubbleCache[emoji]);
  s.scale.set(0.01, 0.01, 1); s.position.y = 1.72; s.renderOrder = 11;
  return s;
}
// 손에 든 스마트폰 (화면이 빛남)
function phoneProp() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.3, 0.025), new THREE.MeshPhongMaterial({ color: 0x1b1f22, shininess: 90, specular: 0x777777 })));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.145, 0.265), new THREE.MeshBasicMaterial({ color: 0x5fe0a0 }));
  scr.position.z = 0.0135; scr.rotation.y = Math.PI; scr.position.z = -0.0135; // 캐릭터 얼굴 쪽을 향함
  g.add(scr);
  g.position.set(0, 0.47, 0.44); g.rotation.x = 0.75; // 화면이 위·얼굴 쪽을 향하게
  return g;
}
let mapMat = null;
function mapProp() {
  if (!mapMat) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 180;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f7f3e8'; ctx.fillRect(0, 0, 256, 180);
    ctx.strokeStyle = '#00A84D'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(128, 90, 96, 64, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(200, 120, 9, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(85, 0); ctx.lineTo(85, 180); ctx.moveTo(171, 0); ctx.lineTo(171, 180); ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    mapMat = new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), mapMat);
  m.position.set(0, 0.5, 0.48); m.rotation.x = -0.5; m.rotation.y = Math.PI;
  return m;
}

// 닉네임 풍선: 글자 폭을 재서 풍선(과 스프라이트) 폭을 맞춤
function nameTag(text) {
  const H = 96, FONT = '800 44px "Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif', PAD = 30;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = FONT;
  const tw = Math.ceil(probe.measureText(text).width);
  const pw = Math.max(tw + PAD * 2, 96);             // 풍선 폭 (짧아도 동그랗게)
  const W = pw + 16;                                   // 그림자·안티앨리어싱 여유
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgba(${TAG.rgb},0.92)`;
  ctx.beginPath(); ctx.roundRect((W - pw) / 2, 12, pw, 64, 32); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, 46);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  const k = 0.19 / H;                                  // 1px 당 월드 크기 (높이는 예전과 같음)
  s.scale.set(W * k, H * k, 1); s.position.y = 1.4; s.name = 'tag'; s.renderOrder = 10;
  return s;
}
