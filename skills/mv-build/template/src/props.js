// 소품 라이브러리 — world.json 의 props[].kind 로 씀. 모두 three.js 기본 도형 조합 (외부 모델 파일 없음)
//  공통 필드: x, z, rot(도), color, scale, text
//  반환: { group, solid: [{ r } | { box: [반폭x, 반폭z] }] }  ← 부딪히는 영역
import * as THREE from 'three';

export function makeProps({ P, concept, lam, glow, tex, custom = {} }) {
  const C = (h) => new THREE.Color(h);
  const wood = concept.props?.wood || '#b98b5e', leaf = concept.props?.leaf || '#5fbf86', trunk = concept.props?.trunk || '#8b6a4e';
  const light = concept.props?.light || '#fff1b8';
  const BOOK = ['#c0563f', '#3f6fb5', '#e0b04a', '#4c9a6a', '#8e5aa8', '#d97a5f', '#2f4b5e', '#f1e3c6'];
  const pick = (a, i) => a[Math.abs(i) % a.length];
  const box = (g, w, h, d, m, x = 0, y = h / 2, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const cyl = (g, r1, r2, h, m, x = 0, y = h / 2, z = 0, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // 책 한 줄 (선반 위)
  const bookRow = (g, x0, x1, y, z, depth, seed) => {
    let x = x0, k = seed;
    while (x < x1 - 0.05) { const w = 0.06 + ((k * 37) % 5) * 0.012, h = 0.26 + ((k * 13) % 4) * 0.04; if (x + w > x1) break; box(g, w, h, depth, lam(pick(BOOK, k)), x + w / 2, y + h / 2, z); x += w + 0.008; k++; }
  };
  // 책장: 앞면이 +z
  const shelf = (g, w, h, d, seed, x = 0, z = 0) => {
    const m = lam(wood), rows = Math.max(2, Math.round(h / 0.45));
    box(g, w, 0.06, d, m, x, h, z); box(g, 0.06, h, d, m, x - w / 2, h / 2, z); box(g, 0.06, h, d, m, x + w / 2, h / 2, z); box(g, w, h, 0.04, lam('#6b4f3a'), x, h / 2, z - d / 2);
    for (let r = 0; r < rows; r++) { const y = 0.05 + r * (h / rows); box(g, w, 0.04, d, m, x, y, z); bookRow(g, x - w / 2 + 0.06, x + w / 2 - 0.06, y + 0.02, z + 0.02, d * 0.8, seed + r * 7); }
  };
  // 가게 건물: 앞면(+z)에 큰 창·문·차양·간판
  const shop = (p) => {
    const g = new THREE.Group(), W = p.w || 6, D = p.d || 5, H = p.h || 4.2, body = p.color || pick(['#e9d8c0', '#d9c2a8', '#c9d6c4', '#e3cfc9', '#d4d8e6'], p.seed || 0);
    const trim = P.primary, aw = p.awning || pick([P.primary, P.accent, '#4c9a6a', '#3f6fb5'], (p.seed || 0) + 1);
    box(g, W, H, D, lam(body), 0, H / 2, -D / 2);
    box(g, W + 0.3, 0.35, D + 0.3, lam(trim), 0, H + 0.17, -D / 2); // 처마
    // 지붕: 기와처럼 경사
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, (Math.max(W, D) / 2) * 1.12, 1.4, 4, 1), lam(p.roof || '#7a4b3a')); roof.rotation.y = Math.PI / 4; roof.scale.set(W / Math.max(W, D), 1, D / Math.max(W, D)); roof.position.set(0, H + 1.05, -D / 2); roof.castShadow = true; g.add(roof);
    // 쇼윈도 (안이 따뜻하게 빛남) + 안쪽 책장
    const win = new THREE.MeshBasicMaterial({ color: C(light) }); win.color.multiplyScalar(0.85);
    box(g, W * 0.55, 1.6, 0.05, win, -W * 0.18, 1.45, 0.02);
    box(g, W * 0.6, 0.12, 0.12, lam(trim), -W * 0.18, 2.3, 0.06); box(g, W * 0.6, 0.12, 0.12, lam(trim), -W * 0.18, 0.6, 0.06);
    shelf(g, W * 0.5, 1.3, 0.3, (p.seed || 0) * 11, -W * 0.18, -0.3);
    // 문
    box(g, 1.0, 2.1, 0.08, lam('#5a3d2b'), W * 0.3, 1.05, 0.04); box(g, 0.08, 0.08, 0.06, glow('#ffd166'), W * 0.3 + 0.35, 1.05, 0.1);
    // 차양 (줄무늬)
    for (let k = 0; k < 6; k++) { const s = box(g, W / 6, 0.06, 1.3, lam(k % 2 ? '#fffaf0' : aw), -W / 2 + W / 12 + (k * W) / 6, 2.75, 0.6); s.rotation.x = 0.35; }
    // 간판
    if (p.text) { const t = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.7), new THREE.MeshBasicMaterial({ map: tex.sign(p.text, trim), transparent: true })); t.position.set(0, 3.45, 0.04); g.add(t); }
    // 2층 창
    for (const x of [-W * 0.25, W * 0.25]) box(g, 0.9, 0.8, 0.05, glow(p.night === false ? '#9fb7c9' : '#ffe6a8'), x, H - 0.8, 0.02);
    // 가게 앞 책 수레
    if (p.cart !== false) { const c = new THREE.Group(); c.position.set(-W * 0.18, 0, 1.2); box(c, 1.4, 0.08, 0.6, lam(wood), 0, 0.75); for (const s of [-1, 1]) cyl(c, 0.05, 0.05, 0.75, lam('#444'), s * 0.6, 0.37, 0); bookRow(c, -0.65, 0.65, 0.8, 0, 0.45, (p.seed || 0) * 5); g.add(c); }
    return { group: g, solid: [{ box: [W / 2, D / 2], dz: -D / 2 }, ...(p.cart !== false ? [{ box: [0.75, 0.35], dx: -W * 0.18, dz: 1.2 }] : [])] };
  };

  // 한옥 지붕: 가운데가 낮고 네 귀가 올라간 겹 지붕 (상자 여러 장 + 처마 끝 올림)
  const roof = (g, W, D, y, H) => {
    const m = lam('#3b3f45'), n = 5;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), w = W * (1 - t * 0.55), d = D * (1 - t * 0.6), o = box(g, w, H / n + 0.05, d, m, 0, y + (H / n) * i + H / n / 2); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 4), m); c.position.set(sx * W / 2, y + 0.35, sz * D / 2); c.rotation.set(sz * 0.9, 0, -sx * 0.9); g.add(c); }
    box(g, W * 0.48, 0.3, 0.4, lam('#e8e4dc'), 0, y + H + 0.1);
  };
  // ---- 랜드마크용 텍스처 (캔버스로 그림, 한 번만 만듦) ----
  const TX = {};
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  const tileTex = () => TX.tile ||= canvasTex(64, 16, (g) => { g.fillStyle = '#5d636a'; g.fillRect(0, 0, 64, 16); for (let x = 0; x < 64; x += 8) { g.fillStyle = '#41464c'; g.fillRect(x, 0, 2, 16); g.fillStyle = '#737a81'; g.fillRect(x + 3, 0, 3, 16); } });
  const danTex = () => TX.dan ||= canvasTex(128, 32, (g) => { g.fillStyle = '#2f7a64'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#1d4f43'; g.fillRect(0, 25, 128, 7); for (let x = 0; x < 128; x += 32) { g.fillStyle = '#c23b2e'; g.beginPath(); g.arc(x + 16, 13, 8, 0, 7); g.fill(); g.fillStyle = '#f2e6c8'; g.beginPath(); g.arc(x + 16, 13, 4, 0, 7); g.fill(); g.fillStyle = '#2d4f9a'; g.fillRect(x + 2, 4, 4, 17); g.fillRect(x + 26, 4, 4, 17); } g.fillStyle = '#e8c25a'; g.fillRect(0, 0, 128, 2); });
  const stoneTex = () => TX.stone ||= canvasTex(128, 64, (g) => { g.fillStyle = '#e6e1d5'; g.fillRect(0, 0, 128, 64); g.strokeStyle = 'rgba(110,100,85,.4)'; g.lineWidth = 1.5; for (let r = 0; r < 4; r++) { const y = r * 16; g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); for (let x = (r % 2) * 16; x < 128; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } });
  const glassTex = () => TX.glass ||= canvasTex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9fb3c3'); gr.addColorStop(0.5, '#e6eef4'); gr.addColorStop(1, '#a5b8c7'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,80,100,.4)'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h); });
  const gridTex = () => TX.grid ||= canvasTex(64, 64, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#4d7f79'; for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 2, 64); g.fillRect(0, i, 64, 2); } });
  const streakTex = () => TX.streak ||= canvasTex(128, 64, (g) => { g.clearRect(0, 0, 128, 64); for (let i = 0; i < 90; i++) { const x = Math.random() * 128, a = 0.25 + Math.random() * 0.75; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, 0, 1 + Math.random() * 1.5, 64); } });
  const stoneMat = (rx = 0.25, ry = 0.5, color = '#ffffff') => { const t = stoneTex().clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshLambertMaterial({ map: t, color: C(color) }); };
  const danMat = (rx) => { const t = danTex().clone(); t.needsUpdate = true; t.repeat.set(rx, 1); return new THREE.MeshLambertMaterial({ map: t }); };
  // 현판: 검은 바탕 + 금빛 글씨, 옛 현판처럼 오른쪽→왼쪽으로 씀 (rtl)
  const plaqueTex = (text, rtl = true) => canvasTex(512, 170, (g, w, h) => { g.fillStyle = '#1b1916'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a97d2c'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#e7b54c'; let fs = 120; g.font = `900 ${fs}px "Noto Serif KR","Noto Serif CJK KR","AppleMyungjo",serif`; const s = rtl ? [...text].reverse().join('') : text; while (g.measureText(s).width > w - 60 && fs > 30) { fs -= 6; g.font = `900 ${fs}px "Noto Serif KR","AppleMyungjo",serif`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2 + 6); });
  // 기와지붕: 처마는 완만하고 위로 갈수록 가팔라지는(오목한) 곡면, 네 귀가 들려 올라감, 회색 기와골 + 흰 마루.
  //  (W,D) 처마 크기 → (tw,td) 맨 위 크기. td 가 작으면 용마루로 닫힘(우진각), 크면 아래층 지붕(위층 몸체가 올라앉음)
  const giwa = (g, W, D, tw, td, y, H, lift = H * 0.4) => {
    const N = 12, R = 10, pos = [], uv = [], idx = [], ridge = td < 1;
    const sideLen = [W, D, W, D];
    const corner = [[], [], [], []];
    for (let j = 0; j <= R; j++) {
      const t = j / R, a = W / 2 + (tw / 2 - W / 2) * t, b = D / 2 + (td / 2 - D / 2) * t, yy = y + H * Math.pow(t, 1.7);
      const cs = [[-a, b], [a, b], [a, -b], [-a, -b]]; let cum = 0;
      for (let s = 0; s < 4; s++) {
        const [x0, z0] = cs[s], [x1, z1] = cs[(s + 1) % 4];
        for (let i = 0; i < N + (s === 3 ? 1 : 0); i++) {
          const u = i / N, c = Math.pow(Math.abs(2 * u - 1), 3), out = 1 + 0.07 * c * (1 - t);
          const x = (x0 + (x1 - x0) * u) * out, z = (z0 + (z1 - z0) * u) * out, yv = yy + lift * Math.pow(1 - t, 2) * c * c;
          pos.push(x, yv, z); uv.push((cum + sideLen[s] * u) / 2, t * 2);
          if (i === 0) corner[s].push(new THREE.Vector3(x, yv + 0.06, z));
        }
        cum += sideLen[s];
      }
    }
    const row = 4 * N + 1;
    for (let j = 0; j < R; j++) for (let i = 0; i < row - 1; i++) { const a = j * row + i, b = a + row; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const roofM = new THREE.MeshLambertMaterial({ map: tileTex(), side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, roofM); m.castShadow = m.receiveShadow = true; g.add(m);
    const white = lam('#ddd8cc');
    for (const pts of corner) { const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.13, 5), white); tube.castShadow = true; g.add(tube); } // 추녀마루
    if (ridge) { box(g, tw + 0.3, 0.5, 0.55, white, 0, y + H + 0.2); for (const sx of [-1, 1]) box(g, 0.5, 0.9, 0.6, lam('#3a3d40'), sx * (tw / 2 + 0.2), y + H + 0.45); } // 용마루 + 취두
  };
  // 붉은 기둥 + 몸체 + 단청 띠 한 층 (누각·전각)
  const storey = (g, W, D, y, H, cols = 6) => {
    const red = lam('#9a2e27');
    for (let i = 0; i < cols; i++) for (const zz of [-D / 2, D / 2]) cyl(g, 0.2, 0.22, H, red, -W / 2 + (i * W) / (cols - 1), y + H / 2, zz, 10);
    for (const xx of [-W / 2, W / 2]) cyl(g, 0.2, 0.22, H, red, xx, y + H / 2, 0, 10);
    box(g, W - 0.5, H, D - 0.5, lam('#5e2621'), 0, y + H / 2);
    box(g, W + 0.5, 0.9, D + 0.5, danMat(W / 4), 0, y + H + 0.45);
  };
  // 물줄기 (분수·무지개분수): onBeforeRender 로 흐르게
  const flow = (mesh, speed = 0.6) => { const t0 = performance.now(); mesh.onBeforeRender = () => { mesh.material.map.offset.y = -((performance.now() - t0) / 1000) * speed; }; return mesh; };
  const lib = {
    shop,
    shelf: (p) => { const g = new THREE.Group(), w = p.w || 3, h = p.h || 2.2; shelf(g, w, h, 0.4, (p.seed || 3) * 7); return { group: g, solid: [{ box: [w / 2 + 0.05, 0.25] }] }; },
    books: (p) => { const g = new THREE.Group(); for (let s = 0; s < (p.n || 3); s++) { let y = 0; for (let k = 0; k < 5 + s; k++) { const h = 0.08; box(g, 0.5, h, 0.36, lam(pick(BOOK, k + s * 3)), s * 0.55 - 0.5, y + h / 2, 0).rotation.y = (k % 3) * 0.12; y += h; } } return { group: g, solid: [{ r: 0.6 }] }; },
    table: (p) => { // 카페 테이블 + 의자 2 + 파라솔
      const g = new THREE.Group(), m = lam(wood);
      cyl(g, 0.55, 0.55, 0.06, m, 0, 0.75, 0, 20); cyl(g, 0.06, 0.08, 0.75, lam('#444'));
      for (const s of [-1, 1]) { box(g, 0.45, 0.06, 0.45, m, s * 0.95, 0.45, 0); box(g, 0.06, 0.5, 0.45, m, s * 1.17, 0.72, 0); }
      if (p.umbrella !== false) { cyl(g, 0.03, 0.03, 2.4, lam('#ddd'), 0, 1.2); const u = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8, 1, true), new THREE.MeshLambertMaterial({ color: C(p.color || P.accent), side: THREE.DoubleSide })); u.position.y = 2.45; u.castShadow = true; g.add(u); }
      g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lam('#fff')), { position: new THREE.Vector3(0.15, 0.85, 0) }));
      return { group: g, solid: [{ r: 1.2 }] };
    },
    lantern: (p) => { const g = new THREE.Group(); cyl(g, 0.05, 0.07, 2.6, lam('#3b3b3b')); const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), glow(light)); l.position.y = 2.75; g.add(l); box(g, 0.5, 0.06, 0.5, lam('#3b3b3b'), 0, 3.03); const pl = new THREE.PointLight(C(light), 5, 8, 1.6); pl.position.y = 2.7; g.add(pl); return { group: g, solid: [{ r: 0.25 }] }; },
    planter: (p) => { const g = new THREE.Group(); box(g, 1.2, 0.6, 0.6, lam(wood)); for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + (k % 2) * 0.08, 0), lam(k % 2 ? leaf : '#7fae6a')); s.position.set(-0.45 + k * 0.22, 0.75, (k % 2) * 0.1 - 0.05); s.castShadow = true; g.add(s); } for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), glow(pick([P.accent, '#ff9db5', '#fff'], k))); f.position.set(-0.4 + k * 0.27, 0.95, 0.15); g.add(f); } return { group: g, solid: [{ box: [0.65, 0.35] }] }; },
    crate: (p) => { const g = new THREE.Group(); box(g, 0.8, 0.6, 0.6, lam(wood)); bookRow(g, -0.35, 0.35, 0.6, 0, 0.45, (p.seed || 1) * 3); return { group: g, solid: [{ box: [0.45, 0.35] }] }; },
    cat: (p) => { // 골목 고양이
      const g = new THREE.Group(), m = lam(p.color || '#f2a65a');
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), m); b.scale.set(1.2, 0.8, 0.9); b.position.y = 0.24; g.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), m); h.position.set(0.3, 0.42, 0); g.add(h);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), m); e.position.set(0.32, 0.6, s * 0.08); g.add(e); }
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), m); t.position.set(-0.38, 0.38, 0); t.rotation.z = -0.8; g.add(t);
      g.traverse((o) => { o.castShadow = true; });
      return { group: g, solid: [{ r: 0.35 }] };
    },
    stage: (p) => { const g = new THREE.Group(), w = p.w || 8, d = p.d || 3.5; box(g, w, 0.5, d, lam(wood)); box(g, w, 0.08, 0.1, lam(P.primary), 0, 0.5, d / 2); cyl(g, 0.04, 0.06, 1.3, lam('#333'), 0, 1.15, 0.6); const mic = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lam('#222')); mic.position.set(0, 1.85, 0.6); g.add(mic); box(g, 0.6, 0.9, 0.5, lam('#6b4f3a'), w / 2 - 1, 0.95, -0.6); return { group: g, solid: [{ box: [w / 2, d / 2] }] }; },
    chair: (p) => { const g = new THREE.Group(), m = lam(p.color || wood); box(g, 0.5, 0.06, 0.5, m, 0, 0.45); box(g, 0.5, 0.55, 0.06, m, 0, 0.75, -0.22); for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) box(g, 0.05, 0.45, 0.05, lam('#444'), x, 0.22, z); return { group: g, solid: [{ r: 0.35 }] }; },
    rug: (p) => { const g = new THREE.Group(), [w, d] = p.size || [6, 4]; const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex.rug(p.color || P.primary) })); r.rotation.x = -Math.PI / 2; r.position.y = 0.012; r.receiveShadow = true; g.add(r); return { group: g, solid: [] }; },
    // ---- 랜드마크·자연 (서울 산책 예시에 쓰임, 다른 세계에도 재사용) ----
    cherry: (p) => { const g = new THREE.Group(), k = p.scale || 1; cyl(g, 0.16 * k, 0.24 * k, 1.8 * k, lam(trunk)); for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((0.75 + (i % 3) * 0.2) * k, 1), lam(pick(['#f7c6d9', '#f4b3cc', '#fbd9e6'], i))); b.position.set(Math.cos(i * 1.1) * 0.8 * k, (2.2 + (i % 2) * 0.5) * k, Math.sin(i * 1.1) * 0.8 * k); b.castShadow = true; g.add(b); } return { group: g, solid: [{ r: 0.45 * k }] }; },
    pine: (p) => { const g = new THREE.Group(), k = p.scale || 1; cyl(g, 0.15 * k, 0.22 * k, 1.6 * k, lam('#6b4a35')); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.3 - i * 0.3) * k, 1.4 * k, 7), lam(p.color || '#3f7a55')); c.position.y = (1.7 + i * 0.75) * k; c.castShadow = true; g.add(c); } return { group: g, solid: [{ r: 0.45 * k }] }; },
    hanok: (p) => { // 궁궐 전각 (근정전 느낌): 월대 + 붉은 기둥 + 단청 + 겹처마 기와지붕
      const g = new THREE.Group(), W = p.w || 14, D = p.d || 8, H = p.h || 3.6;
      box(g, W + 6, 0.8, D + 6, stoneMat(0.25, 0.5)); box(g, W + 2.4, 0.7, D + 2.4, stoneMat(0.25, 0.5), 0, 1.15);
      storey(g, W, D, 1.5, H, 7);
      giwa(g, W + 4.6, D + 4.4, W * 0.62, 0.4, 1.5 + H + 0.9, 3.4, 1.1);
      return { group: g, solid: [{ box: [W / 2 + 3, D / 2 + 3] }] };
    },
    gate: (p) => { // 광화문: 화강암 석축에 홍예문 3칸 + 2층 누각(우진각 겹지붕) + 검은 현판(금빛 글씨) + 좌우 궁장
      const g = new THREE.Group(), W = p.w || 20, D = p.d || 8, BH = 6.2;
      const arches = [[-4.7, 1.35, 3.0], [0, 1.7, 3.3], [4.7, 1.35, 3.0]]; // [가운데 x, 반폭, 아치 시작 높이]
      const s = new THREE.Shape(); s.moveTo(-W / 2, 0);
      for (const [cx, hw, sh] of arches) { s.lineTo(cx - hw, 0); s.lineTo(cx - hw, sh); s.absarc(cx, sh, hw, Math.PI, 0, true); s.lineTo(cx + hw, 0); }
      s.lineTo(W / 2, 0); s.lineTo(W / 2, BH); s.lineTo(-W / 2, BH); s.lineTo(-W / 2, 0);
      const geo = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 16 }); geo.translate(0, 0, -D / 2);
      const base = new THREE.Mesh(geo, stoneMat(0.25, 0.5)); base.castShadow = base.receiveShadow = true; g.add(base);
      for (const [cx, hw, sh] of arches) { const r = new THREE.Mesh(new THREE.TorusGeometry(hw + 0.18, 0.16, 6, 20, Math.PI), lam('#cfc8b8')); r.position.set(cx, sh, D / 2 + 0.02); g.add(r); const r2 = r.clone(); r2.position.z = -D / 2 - 0.02; g.add(r2); }
      // 석축 위 여장: 낮은 담 + 작은 구멍 + 기와 덮개
      box(g, W + 0.2, 0.9, D + 0.2, lam('#dcd6ca'), 0, BH + 0.45);
      for (let x = -W / 2 + 1; x < W / 2 - 0.5; x += 1.5) for (const zz of [D / 2 + 0.11, -D / 2 - 0.11]) box(g, 0.5, 0.35, 0.02, lam('#2e2e30'), x, BH + 0.5, zz);
      box(g, W + 0.6, 0.18, D + 0.6, lam('#50565c'), 0, BH + 0.99);
      // 누각 1층 → 아래 지붕 → 2층(현판) → 위 지붕
      const W1 = W * 0.7, D1 = D * 0.72, y1 = BH + 1.08, H1 = 2.3;
      storey(g, W1, D1, y1, H1, 6);
      const W2 = W1 * 0.8, D2 = D1 * 0.76, yr1 = y1 + H1 + 0.9;
      giwa(g, W1 + 4.6, D1 + 4.4, W2 + 0.4, D2 + 0.4, yr1, 1.3, 0.8);
      const y2 = yr1 + 1.2, H2 = 1.8;
      storey(g, W2, D2, y2, H2, 5);
      if (p.text) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.1), new THREE.MeshBasicMaterial({ map: plaqueTex(p.text, p.rtl !== false) })); pl.position.set(0, y2 + H2 * 0.62, D2 / 2 + 0.06); g.add(pl); }
      giwa(g, W2 + 5, D2 + 4.6, W2 * 0.52, 0.4, y2 + H2 + 0.9, 3.0, 1.1);
      // 좌우 궁장 (돌담 + 기와 덮개)
      const wl = p.walls ?? 12, solid = [];
      if (wl > 0) for (const sx of [-1, 1]) {
        const cx = sx * (W / 2 + wl / 2); box(g, wl, 3.4, 1.4, stoneMat(0.25, 0.5), cx, 1.7); box(g, wl + 0.1, 0.3, 2.1, lam('#50565c'), cx, 3.5); box(g, wl + 0.1, 0.25, 0.3, lam('#ddd8cc'), cx, 3.75);
        solid.push({ box: [wl / 2, 0.7], dx: cx });
      }
      // 앞쪽 월대 난간 (흰 돌기둥 + 난간대)
      const wd = p.wolldae ?? 12;
      if (wd > 0) { box(g, 7, 0.12, wd, stoneMat(0.5, 0.25), 0, 0.06, D / 2 + wd / 2);
        for (const sx of [-3.4, 3.4]) { for (let z = D / 2 + 0.6; z <= D / 2 + wd; z += 1.4) { cyl(g, 0.13, 0.15, 1.0, lam('#ebe6da'), sx, 0.5, z, 8); const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), lam('#ebe6da')); k.position.set(sx, 1.08, z); g.add(k); } box(g, 0.14, 0.14, wd, lam('#ebe6da'), sx, 0.75, D / 2 + wd / 2); solid.push({ box: [0.12, wd / 2], dx: sx, dz: D / 2 + wd / 2 }); } }
      // 홍예문 사이 석축만 막힘 → 세 문 모두 걸어서 지나갈 수 있음
      const piers = [[-W / 2, -6.05], [-3.35, -1.7], [1.7, 3.35], [6.05, W / 2]];
      for (const [a, b] of piers) solid.push({ box: [(b - a) / 2, D / 2], dx: (a + b) / 2 });
      return { group: g, solid };
    },
    statue: (p) => { // 동상 — pose: 'sit'(세종대왕형 금빛 좌상, 기본) | 'stand'(이순신형 청동 입상, 칼, ship: 거북선)
      const g = new THREE.Group(), k = p.scale || 1, stand = p.pose === 'stand';
      const metal = new THREE.MeshPhongMaterial({ color: C(p.color || (stand ? '#4e4b43' : '#c99b3c')), specular: C(stand ? '#8d8a80' : '#fff1c2'), shininess: stand ? 25 : 70, flatShading: true });
      const M = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0, m = metal) => { const o = new THREE.Mesh(geo, m); o.position.set(x * k, y * k, z * k); o.scale.set(sx, sy, sz); o.rotation.set(rx, 0, rz); o.castShadow = true; g.add(o); return o; };
      let top;
      if (!stand) {
        box(g, 6.2 * k, 0.5 * k, 4.8 * k, stoneMat(0.25, 0.5, '#cfcabe')); box(g, 4.6 * k, 2.6 * k, 3.4 * k, stoneMat(0.25, 0.5), 0, 1.8 * k); box(g, 5 * k, 0.35 * k, 3.8 * k, lam('#cdc7ba'), 0, 3.27 * k);
        for (const zz of [1.71, -1.71]) box(g, 3.2 * k, 1.6 * k, 0.06 * k, lam('#a59d8c'), 0, 1.8 * k, zz * k);
        top = 3.45;
        M(new THREE.BoxGeometry(2.6, 1.2, 1.9), 0, top + 0.6, -0.1); M(new THREE.BoxGeometry(2.7, 1.7, 0.3), 0, top + 1.9, -1.0); // 어좌
        M(new THREE.BoxGeometry(2.1, 0.6, 1.7), 0, top + 1.45, 0.35); M(new THREE.BoxGeometry(2.0, 1.25, 0.6), 0, top + 0.75, 1.05); // 무릎·도포 자락
        M(new THREE.CylinderGeometry(0.72, 1.0, 1.6, 10), 0, top + 2.4, -0.25, 1, 1, 0.72); // 몸통
        M(new THREE.SphereGeometry(0.78, 10, 8), 0, top + 3.1, -0.25, 1.3, 0.55, 0.85); // 어깨
        for (const sx of [-1, 1]) { M(new THREE.CapsuleGeometry(0.26, 0.9, 4, 8), sx * 0.95, top + 2.55, -0.05, 1, 1, 1, 0.5, sx * 0.15); M(new THREE.CapsuleGeometry(0.22, 0.7, 4, 8), sx * 0.6, top + 1.95, 0.55, 1, 1, 1, 1.35, 0); }
        M(new THREE.BoxGeometry(1.1, 0.1, 0.7), 0, top + 2.05, 0.95, 1, 1, 1, -0.5, 0); // 펼친 책
        M(new THREE.SphereGeometry(0.42, 12, 10), 0, top + 3.62, -0.2); M(new THREE.ConeGeometry(0.18, 0.45, 8), 0, top + 3.25, 0.12, 1, 1, 1, Math.PI, 0); // 머리·수염
        M(new THREE.CylinderGeometry(0.36, 0.41, 0.5, 12), 0, top + 4.0, -0.22); for (const sx of [-1, 1]) M(new THREE.SphereGeometry(0.2, 8, 6), sx * 0.2, top + 4.32, -0.45, 1, 1.3, 0.5); // 익선관
      } else {
        box(g, 4.4 * k, 0.6 * k, 4.4 * k, stoneMat(0.25, 0.5, '#cfcabe'));
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.15 * k, 1.5 * k, 6 * k, 4), stoneMat(0.25, 0.5)); col.rotation.y = Math.PI / 4; col.position.y = 3.6 * k; col.castShadow = true; g.add(col);
        box(g, 2 * k, 0.35 * k, 2 * k, lam('#cdc7ba'), 0, 6.75 * k); top = 6.9;
        M(new THREE.CylinderGeometry(0.5, 0.85, 1.9, 10), 0, top + 0.95, 0); // 하체·전포
        M(new THREE.CylinderGeometry(0.62, 0.52, 1.2, 10), 0, top + 2.5, 0); M(new THREE.SphereGeometry(0.7, 10, 8), 0, top + 3.0, 0, 1.25, 0.5, 0.85);
        M(new THREE.BoxGeometry(1.3, 2.4, 0.12), 0, top + 1.9, -0.55, 1, 1, 1, 0.12, 0); // 망토
        M(new THREE.SphereGeometry(0.37, 12, 10), 0, top + 3.48, 0.02); M(new THREE.ConeGeometry(0.42, 0.55, 10), 0, top + 3.92, 0); M(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12), 0, top + 3.68, 0); // 투구
        for (const sx of [-1, 1]) M(new THREE.CapsuleGeometry(0.22, 0.85, 4, 8), sx * 0.72, top + 2.45, 0.2, 1, 1, 1, 0.6, sx * 0.25);
        M(new THREE.BoxGeometry(0.12, 2.9, 0.07), 0.15, top + 1.55, 0.75); M(new THREE.BoxGeometry(0.5, 0.08, 0.14), 0.15, top + 3.0, 0.75); // 장검 (칼끝이 아래)
        if (p.ship !== false) { const sg = new THREE.Group(); sg.position.set(0, 0.6 * k, 2.9 * k); g.add(sg); // 거북선 모형
          const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), metal); hull.scale.set(1.5 * k, 0.45 * k, 0.75 * k); hull.position.y = 0.3 * k; sg.add(hull);
          const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal); shell.scale.set(1.3 * k, 0.6 * k, 0.65 * k); shell.position.y = 0.45 * k; sg.add(shell);
          const head = new THREE.Mesh(new THREE.BoxGeometry(0.5 * k, 0.35 * k, 0.3 * k), metal); head.position.set(1.6 * k, 0.75 * k, 0); sg.add(head); }
      }
      if (p.text) { const t = new THREE.Mesh(new THREE.PlaneGeometry(2.4 * k, 0.55 * k), new THREE.MeshBasicMaterial({ map: tex.sign(p.text, '#3a3530') })); t.position.set(0, (stand ? 2.6 : 1.8) * k, (stand ? 1.5 : 1.74) * k); g.add(t); }
      return { group: g, solid: [{ box: stand ? [2.2 * k, 2.2 * k] : [3.1 * k, 2.4 * k] }] };
    },
    jets: (p) => { // 바닥분수 물줄기 (광화문 12·23 분수 같은): w×d 안에 솟는 물줄기들, 젖은 바닥
      const g = new THREE.Group(), w = p.w || 12, d = p.d || 6;
      const wet = new THREE.Mesh(new THREE.PlaneGeometry(w + 1, d + 1), new THREE.MeshPhongMaterial({ color: C('#8f979c'), specular: '#ffffff', shininess: 80, transparent: true, opacity: 0.55 })); wet.rotation.x = -Math.PI / 2; wet.position.y = 0.02; g.add(wet);
      const st = streakTex().clone(); st.needsUpdate = true; st.repeat.set(1, 2);
      const mat = new THREE.MeshBasicMaterial({ map: st, color: C('#eaf6ff'), transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
      let n = 0; for (let x = -w / 2 + 0.6; x <= w / 2 - 0.5; x += 1.2) for (let z = -d / 2 + 0.6; z <= d / 2 - 0.5; z += 1.2) {
        const h = 1.2 + ((n * 37) % 7) * 0.25, j = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, h, 6, 1, true), mat); j.position.set(x, h / 2, z); g.add(j);
        const t0 = n * 0.7; j.onBeforeRender = () => { const s = 0.75 + 0.25 * Math.sin(performance.now() / 380 + t0); j.scale.y = s; j.position.y = (h * s) / 2; }; n++; }
      flow(g.children[1] || wet, 0.8);
      return { group: g, solid: [] };
    },
    tower: (p) => { // 롯데월드타워: 둥근 사각 단면이 위로 갈수록 부드럽게 가늘어지는 은빛 유리탑 + 면 가운데 세로 이음선 + 열린 꼭대기. mall: true 면 옆 몰
      const g = new THREE.Group(), H = p.h || 120, R0 = p.r || H * 0.068, M = 48, NY = 40, pos = [], uv = [], idx = [], top = H * 0.93;
      const rad = (y) => R0 * (1 - 0.84 * Math.pow(y / H, 2.1));
      const sec = (a, r, t) => { const n = 4 - 2 * t, c = Math.cos(a), s = Math.sin(a), k = r / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n); return [c * k, s * k]; };
      for (let j = 0; j <= NY; j++) { const t = j / NY, y = t * top, r = rad(y); for (let i = 0; i <= M; i++) { const [x, z] = sec((i / M) * Math.PI * 2, r, t); pos.push(x, y, z); uv.push((i / M) * 10, t * 24); } }
      for (let j = 0; j < NY; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const body = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: glassTex(), specular: C('#ffffff'), shininess: 90, emissive: C('#1d2b38'), emissiveIntensity: 0.25 })); body.castShadow = true; g.add(body);
      const seamM = new THREE.LineBasicMaterial({ color: '#56677a' });
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const pts = []; for (let j = 0; j <= 30; j++) { const y = H * 0.3 + (top - H * 0.3) * (j / 30), [x, z] = sec(a, rad(y) * 1.004, y / top); pts.push(new THREE.Vector3(x, y, z)); } g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), seamM)); }
      const rib = lam('#d6dee5'); // 꼭대기: 열린 격자 왕관
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, [x0, z0] = sec(a, rad(top), 1), tip = new THREE.Vector3(0, H, 0), from = new THREE.Vector3(x0, top, z0); const len = from.distanceTo(tip); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, len, 5), rib); c.position.copy(from).add(tip).multiplyScalar(0.5); c.lookAt(tip); c.rotateX(Math.PI / 2); g.add(c); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad(top) * 0.98, 0.15, 5, 24), rib); ring.rotation.x = Math.PI / 2; ring.position.y = top; g.add(ring);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), glow('#ffffff')); lamp.position.y = H + 0.4; g.add(lamp);
      if (p.mall) { const mall = new THREE.Group(); mall.position.set(R0 + 14, 0, 4); g.add(mall); box(mall, 26, 7, 16, lam('#e2e5e8'), 0, 3.5); const roof = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 26, 20, 1, false, 0, Math.PI), new THREE.MeshPhongMaterial({ color: C('#e9edf0'), shininess: 60 })); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.45); roof.position.y = 7; mall.add(roof); }
      return { group: g, solid: [{ r: R0 }] };
    },
    bridge: (p) => { // 반포대교: 길게 이어진 상판 + 쌍기둥 교각 + 아래층 잠수교 + 양옆 달빛무지개분수 (fountain: false 로 끔). 길이 방향 = x
      const g = new THREE.Group(), L = p.len || 160, Hd = p.h || 7, m = lam('#a9afb5'), dk = lam('#8a9096');
      box(g, L, 1.1, 7, m, 0, Hd); for (const z of [-3.45, 3.45]) box(g, L, 0.55, 0.25, lam('#cfd4d8'), 0, Hd + 0.82, z);
      for (let x = -L / 2 + 7; x < L / 2; x += 14) { for (const z of [-2.1, 2.1]) cyl(g, 0.65, 0.75, Hd, dk, x, Hd / 2, z, 10); box(g, 1.6, 0.8, 6.4, dk, x, Hd - 0.6); }
      if (p.lower !== false) { box(g, L, 0.6, 5, lam('#9ea4aa'), 0, 1.0); for (let x = -L / 2 + 3.5; x < L / 2; x += 7) box(g, 1, 0.8, 4, dk, x, 0.4); }
      for (let x = -L / 2 + 1.5; x < L / 2; x += 3) for (const z of [-3.45, 3.45]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), glow('#fff2c0')); b.position.set(x, Hd + 1.2, z); g.add(b); }
      if (p.fountain !== false) for (const side of [-1, 1]) { // 상판 옆에서 바깥으로 휘어 강에 떨어지는 무지개 물줄기
        const NX = Math.round(L / 1.2), NS = 14, pos = [], col = [], uv = [], idx = [], c = new THREE.Color();
        for (let i = 0; i <= NX; i++) { const x = -L / 2 + (i / NX) * L; c.setHSL(((x / 46) % 1 + 1) % 1, 0.9, 0.58);
          for (let j = 0; j <= NS; j++) { const s = j / NS; pos.push(x, (Hd + 0.4) + 3 * s - (Hd + 3.3) * s * s, side * (3.6 + 7 * s)); col.push(c.r, c.g, c.b); uv.push(x / 6, s); } }
        for (let i = 0; i < NX; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
        const st = streakTex().clone(); st.needsUpdate = true;
        g.add(flow(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: st, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })), 0.9));
      }
      return { group: g, solid: [] };
    },
    sevit: (p) => { // 세빛섬: 물 위 바지선 + 꽃잎처럼 바깥으로 기운 초록빛 유리층을 겹겹이 + 흰 격자. variant: ga(가빛·큼) cha(채빛) sol(솔빛) ye(예빛·흰 철골 구)
      const g = new THREE.Group(), v = p.variant || 'ga', k = p.scale || 1, [w0, d0, tiers] = { ga: [15, 10, 3], cha: [11, 8, 3], sol: [8, 7, 2], ye: [7, 7, 1] }[v] || [12, 8, 3];
      box(g, w0 * k + 1.4, 0.8, d0 * k + 1.4, lam('#3b4045'), 0, 0.1); box(g, w0 * k + 1, 0.15, d0 * k + 1, lam('#cfd5da'), 0, 0.55);
      const gt = gridTex().clone(); gt.needsUpdate = true; gt.repeat.set(10, 2);
      const glass = new THREE.MeshPhongMaterial({ map: gt, color: C(p.color || '#7cc2b9'), emissive: C(p.glow || '#2b8a80'), emissiveIntensity: 0.35, specular: C('#ffffff'), shininess: 110, transparent: true, opacity: 0.88 });
      const edge = new THREE.LineBasicMaterial({ color: '#eef6f5' });
      if (v === 'ye') {
        const sph = new THREE.SphereGeometry(3.4 * k, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), lat = new THREE.LineSegments(new THREE.WireframeGeometry(sph), new THREE.LineBasicMaterial({ color: '#ffffff' })); lat.scale.set(1.25, 1.1, 1); lat.position.y = 0.6; g.add(lat);
        const core = new THREE.Mesh(new THREE.CylinderGeometry(2 * k, 2.3 * k, 2.4 * k, 9), glass); core.position.y = 1.8; g.add(core);
      } else {
        let y = 0.65; for (let i = 0; i < tiers; i++) {
          const w = w0 * k * (1 - i * 0.17), d = d0 * k * (1 - i * 0.15), h = (2.3 - i * 0.2) * k;
          const tier = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.44, h, 9, 1), glass); tier.scale.z = d / w; tier.rotation.y = i * 0.35 + (p.seed || 0); tier.position.y = y + h / 2; tier.castShadow = true; g.add(tier);
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(tier.geometry), edge); e.scale.copy(tier.scale); e.rotation.copy(tier.rotation); e.position.copy(tier.position); g.add(e);
          const lip = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.56, w * 0.56, 0.14, 9), lam('#eef3f3')); lip.scale.z = d / w; lip.rotation.y = tier.rotation.y; lip.position.y = y + h; g.add(lip);
          y += h;
        }
        if (v === 'ga') for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(w0 * k * 0.25, 0.08, 4, 20, Math.PI), lam('#ffffff')); a.rotation.y = (i / 4) * Math.PI; a.position.y = y; g.add(a); } // 지붕 위 흰 철골
      }
      return { group: g, solid: [{ box: [w0 * k / 2 + 0.7, d0 * k / 2 + 0.7] }] };
    },
    mountain: (p) => { // 배경 산 (북악산·남산 등). tower: true 면 꼭대기에 N서울타워
      const g = new THREE.Group(), R = p.r || 60, H = p.h || 32, wide = p.wide || 1.7, seed = p.seed || 1;
      const geo = new THREE.SphereGeometry(R, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x), n = 1 + 0.1 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 7 + seed * 2); pa.setXYZ(i, x * n * wide, (y / R) * H * (1 + 0.15 * Math.sin(a * 5 + seed)), z * n); }
      geo.computeVertexNormals();
      const mt = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C(p.color || '#4c6b47'), flatShading: true })); mt.position.y = -0.5; g.add(mt);
      if (p.tower) { const t = new THREE.Group(), s = p.towerScale || 1.8; t.position.y = H - 1.2; t.scale.setScalar(s); g.add(t);
        cyl(t, 0.7, 1.0, 9, lam('#eceff1'), 0, 4.5, 0, 12); cyl(t, 2.1, 1.3, 2.4, lam('#dfe3e6'), 0, 10, 0, 16); cyl(t, 2.2, 2.2, 0.3, glow('#bfe3ff'), 0, 10.4, 0, 16);
        cyl(t, 0.35, 0.5, 4, lam('#eceff1'), 0, 13.2, 0, 8); cyl(t, 0.08, 0.2, 7, lam('#d9534f'), 0, 18.6, 0, 6); const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), glow('#ff6b6b')); l.position.y = 22.2; t.add(l); }
      return { group: g, solid: [] };
    },
    dome: (p) => { // 물 위 유리 돔 (일반용)
      const g = new THREE.Group(), k = p.scale || 1;
      box(g, 9 * k, 0.6, 7 * k, lam('#d9dde2'), 0, 0.3);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(4 * k, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: C(p.color || '#ffd6a8'), emissive: C(p.color || '#ffb36b'), emissiveIntensity: 0.55, transparent: true, opacity: 0.82, shininess: 90 }));
      shell.scale.set(1.15, 1.25, 0.85); shell.position.y = 0.6; g.add(shell);
      return { group: g, solid: [{ box: [4.6 * k, 3.6 * k] }] };
    },
    swanboat: (p) => { // 오리배
      const g = new THREE.Group(), m = lam(p.color || '#ffffff');
      const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m); hull.scale.set(1.5, 0.55, 1); hull.position.y = 0.3; g.add(hull);
      const neck = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 8, 16, Math.PI * 1.2), m); neck.position.set(1.1, 0.9, 0); neck.rotation.z = 0.5; g.add(neck);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), lam('#f2a03d')); beak.position.set(1.75, 1.15, 0); beak.rotation.z = -Math.PI / 2; g.add(beak);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.4), lam(P.accent)); roof.position.set(-0.2, 1.5, 0); g.add(roof);
      for (const x of [-0.8, 0.4]) for (const z of [-0.55, 0.55]) cyl(g, 0.04, 0.04, 1.0, lam('#ddd'), x, 1.0, z);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return { group: g, solid: [], float: true };
    },
    mat: (p) => { const g = new THREE.Group(), [w, d] = p.size || [2.4, 2]; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex.check(p.color || '#e75a5a') })); m.rotation.x = -Math.PI / 2; m.position.y = 0.015; m.receiveShadow = true; g.add(m);
      box(g, 0.5, 0.35, 0.35, lam('#c0563f'), w * 0.25, 0.18, -d * 0.2); const cup = cyl(g, 0.12, 0.1, 0.22, lam('#fffaf0'), -w * 0.2, 0.11, d * 0.15); return { group: g, solid: [] }; },
    store: (p) => { // 편의점 (한강 라면!)
      const g = new THREE.Group(), W = p.w || 6, D = p.d || 4, H = 3.2;
      box(g, W, H, D, lam('#f3f4f6'), 0, H / 2, -D / 2); box(g, W + 0.2, 0.6, D + 0.2, lam(p.color || '#2f6fd8'), 0, H + 0.3, -D / 2);
      box(g, W * 0.8, 2, 0.05, glow('#e9f6ff'), 0, 1.3, 0.02);
      if (p.text) { const t = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.5), new THREE.MeshBasicMaterial({ map: tex.sign(p.text, p.color || '#2f6fd8'), transparent: true })); t.position.set(0, H + 0.3, 0.12); g.add(t); }
      for (const x of [-W * 0.3, W * 0.3]) { const t = new THREE.Group(); t.position.set(x, 0, 1.6); g.add(t); cyl(t, 0.45, 0.45, 0.05, lam('#ffffff'), 0, 0.72, 0, 16); cyl(t, 0.05, 0.05, 0.72, lam('#888')); }
      return { group: g, solid: [{ box: [W / 2, D / 2], dz: -D / 2 }] };
    },
    flag: (p) => { const g = new THREE.Group(); cyl(g, 0.06, 0.06, 6, lam('#ddd'), 0, 3); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshLambertMaterial({ color: C(p.color || P.primary), side: THREE.DoubleSide })); f.position.set(0.8, 5.4, 0); g.add(f); return { group: g, solid: [{ r: 0.2 }] }; },
    // 줄 전구: from [x,z] → to [x,z] 사이에 늘어진 전구
    stringlights: (p) => {
      const g = new THREE.Group(), [ax, az] = p.from || [-10, 0], [bx, bz] = p.to || [10, 0], H = p.h || 4.2, n = Math.max(6, Math.round(Math.hypot(bx - ax, bz - az) / 0.9));
      const pts = []; for (let k = 0; k <= n; k++) { const t = k / n; pts.push(new THREE.Vector3(ax + (bx - ax) * t - p.x, H - Math.sin(t * Math.PI) * 0.9, az + (bz - az) * t - p.z)); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#333' })));
      pts.forEach((v, k) => { if (k % 1) return; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glow(pick([light, P.accent, '#ffb3c7', '#b9f3ff'], k))); b.position.copy(v).add(new THREE.Vector3(0, -0.12, 0)); g.add(b); });
      return { group: g, solid: [] };
    },
  };
  // 프로젝트 전용 소품 (src/props/<kind>.js) — Claude 가 사용자 설명을 듣고 새로 짓는 구조물. 같은 이름이면 기본 소품을 덮어씀
  //  각 파일: export default (p, kit) => ({ group, solid })   ← import 없이 kit 만 씀 (작업대·보드에서도 그대로 불림)
  const kit = { THREE, C, P, concept, lam, glow, tex, box, cyl, canvasTex, stoneMat, danMat, plaqueTex, giwa, storey, flow, roof, wood, leaf, trunk, light };
  for (const [kind, fn] of Object.entries(custom)) if (typeof fn === 'function') lib[kind] = (p) => fn(p, kit);
  return lib;
}
// import.meta.glob 결과 { './props/gate.js': { default } } → { gate: fn }
export const byName = (mods) => Object.fromEntries(Object.entries(mods || {}).filter(([f]) => !/\/_/.test(f)).map(([f, m]) => [f.split('/').pop().replace(/\.js$/, ''), m.default]));

// 바닥 무늬 텍스처: cobble(돌길) · wood(마루) · tile · grass · plain
export function floorTexture(kind, base, accent) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const col = new THREE.Color(base), dark = '#' + col.clone().multiplyScalar(0.82).getHexString(), lite = '#' + col.clone().lerp(new THREE.Color('#ffffff'), 0.18).getHexString();
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  if (kind === 'cobble') {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const ox = (y % 2) * 16; g.fillStyle = (x * 7 + y * 3) % 5 === 0 ? dark : (x + y) % 3 === 0 ? lite : base;
      g.beginPath(); g.roundRect(x * 32 + ox - 14 + 2, y * 32 + 2, 28, 28, 7); g.fill(); g.strokeStyle = dark; g.lineWidth = 2; g.stroke();
    }
  } else if (kind === 'wood') {
    for (let y = 0; y < 8; y++) { g.fillStyle = y % 2 ? lite : base; g.fillRect(0, y * 32, 256, 31); g.fillStyle = dark; g.fillRect(0, y * 32 + 31, 256, 1); g.fillRect(((y * 97) % 200) + 20, y * 32, 2, 32); }
  } else if (kind === 'tile') {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? lite : base; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); }
  } else if (kind === 'grass') {
    for (let k = 0; k < 900; k++) { g.fillStyle = Math.random() < 0.5 ? dark : lite; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 5); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
export function checkTexture(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 128, 128); g.fillStyle = color;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) g.fillRect(x * 16, y * 16, 16, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function rugTexture(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6; g.strokeRect(10, 10, 108, 108); g.lineWidth = 2; g.strokeRect(20, 20, 88, 88);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(64, 64, 18, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
