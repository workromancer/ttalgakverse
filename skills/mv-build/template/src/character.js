import * as THREE from 'three';
// 이름표 색은 setTagColor 로 바꿀 수 있음 (월드 테마 색)
export const TAG = { rgb: '0,168,77' };
export const setTagColor = (hex) => { const c = parseInt(String(hex).replace('#', ''), 16); TAG.rgb = `${c >> 16 & 255},${c >> 8 & 255},${c & 255}`; };

// 동글동글한 마스코트 캐릭터 (모든 캐릭터 공통 모양)
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });

export class Character extends THREE.Group {
  constructor(color = 0xfff3dc, name = null) {
    super();
    const skin = lam(color);
    const dark = new THREE.MeshBasicMaterial({ color: 0x2a2320 });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pink = new THREE.MeshBasicMaterial({ color: 0xff9db5, transparent: true, opacity: 0.85 });
    const innerEar = lam(0xffc2cf);
    const leaf = lam(0x3fbf6f);
    const foot = lam(0xf4cf9a);

    // 몸 전체 피벗 (통통 튀기 / 찌그러지기)
    this.bodyPivot = new THREE.Group();
    this.add(this.bodyPivot);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), skin);
    body.scale.set(1.05, 0.95, 0.95); body.position.y = 0.46;
    this.bodyPivot.add(body);

    // 귀
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.14, 6, 12), skin);
      const ie = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.1, 4, 10), innerEar);
      ie.position.z = 0.055; ie.scale.z = 0.5;
      ear.add(e, ie);
      ear.position.set(s * 0.22, 0.86, -0.02); ear.rotation.z = -s * 0.35;
      this.bodyPivot.add(ear);
    }
    // 머리 위 새싹 (2호선 초록)
    const sprout = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6), leaf); stem.position.y = 0.05;
    const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leaf); l1.scale.set(1.4, 0.35, 0.8); l1.position.set(-0.06, 0.1, 0); l1.rotation.z = 0.4;
    const l2 = l1.clone(); l2.position.x = 0.06; l2.rotation.z = -0.4;
    sprout.add(stem, l1, l2); sprout.position.y = 0.86;
    this.sprout = sprout;
    this.bodyPivot.add(sprout);

    // 얼굴
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), dark);
      eye.scale.set(0.85, 1.1, 0.5); eye.position.set(s * 0.13, 0.55, 0.385);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), white);
      hl.position.set(s * 0.13 + 0.015, 0.575, 0.41);
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), pink);
      blush.position.set(s * 0.25, 0.47, 0.35); blush.rotation.y = s * 0.55; blush.scale.y = 0.6;
      this.bodyPivot.add(eye, hl, blush);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI), dark);
    mouth.position.set(0, 0.47, 0.395); mouth.rotation.z = Math.PI;
    this.bodyPivot.add(mouth);

    // 작은 손 / 발
    this.hands = [-1, 1].map((s) => {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), skin);
      h.scale.set(0.8, 1, 0.8); h.position.set(s * 0.44, 0.38, 0.05);
      this.bodyPivot.add(h); return h;
    });
    this.feet = [-1, 1].map((s) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), foot);
      f.scale.set(1, 0.55, 1.3); f.position.set(s * 0.17, 0.05, 0.05);
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
    for (const slot of ACC_SLOTS) { const id = acc[slot]; const def = ACC[slot]?.find((a) => a.id === id); if (def?.build) this.accGroup.add(def.build()); }
    this.sprout.visible = !['cap', 'beanie', 'crown'].includes(acc.head);
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
    if (sitting) {
      bp.position.set(0, 0, -0.02); bp.rotation.set(-0.08, 0, 0);
      bp.scale.set(1, 1 + Math.sin(this.t * 2) * 0.015, 1);
      this.feet.forEach((f, i) => f.position.set((i ? 1 : -1) * 0.17, 0.1, 0.36));
      this.hands.forEach((h, i) => h.position.set((i ? 1 : -1) * 0.38, 0.3, 0.2));
      this.shadow.visible = false;
      return;
    }
    this.shadow.visible = true;
    const hop = Math.abs(Math.sin(w)) * 0.09 * a;
    const squash = 1 - Math.cos(w * 2) * 0.05 * a + Math.sin(this.t * 2.4) * 0.02 * (1 - a);
    bp.position.set(0, hop, 0);
    bp.scale.set(1 + (1 - squash) * 0.6, squash, 1 + (1 - squash) * 0.6);
    bp.rotation.set(0.06 * a, 0, Math.sin(w) * 0.1 * a);
    this.feet.forEach((f, i) => {
      const ph = w + (i ? Math.PI : 0);
      f.position.set((i ? 1 : -1) * 0.17, 0.05 + Math.max(0, Math.sin(ph)) * 0.07 * a, 0.05 + Math.cos(ph) * 0.14 * a);
    });
    this.hands.forEach((h, i) => {
      const ph = w + (i ? 0 : Math.PI);
      h.position.set((i ? 1 : -1) * 0.44, 0.38 + Math.sin(this.t * 2.4) * 0.01, 0.05 + Math.cos(ph) * 0.1 * a);
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
