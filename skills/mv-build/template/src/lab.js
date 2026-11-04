// 🛠️ 구조물 작업대 (lab.html) — 구조물 하나를 네 방향에서 동시에 보고, 사람(아바타)과 크기를 비교하고, 참고 사진과 나란히 본다.
//  mv-polish 의 구조물 다듬기에서 Claude 가 "고치기 → 이 화면 스크린샷 → 사진과 비교" 를 반복할 때 쓴다.
//  props.js 의 소품, src/props/*.js 의 프로젝트 전용 구조물, ?avatar=<스타일> 이면 캐릭터를 그린다. (tree·bench 같은 main.js 안 기본 소품은 안 그림)
import * as THREE from 'three';
import world from '../world/world.json';
import concept from '../world/concept.json';
import { Character, registerStyles, STYLES } from './character.js';
import { makeProps, byName, rugTexture, checkTexture } from './props.js';
registerStyles(byName(import.meta.glob(['./avatars/*.js', '!./avatars/_*.js'], { eager: true })));
const CUSTOM_PROPS = byName(import.meta.glob(['./props/*.js', '!./props/_*.js'], { eager: true }));

const q = new URLSearchParams(location.search), C = (h) => new THREE.Color(h), P = concept.palette;
const info = document.getElementById('info');
let spec;
if (q.get('avatar')) spec = { avatar: q.get('avatar'), color: q.get('color') || concept.avatar?.me || '#fff3dc' };
else if (q.get('zone')) spec = world.zones.find((z) => z.id === q.get('zone'))?.props?.[+q.get('i') || 0];
else if (q.get('kind')) { try { spec = { kind: q.get('kind'), ...JSON.parse(q.get('p') || '{}') }; } catch { spec = { kind: q.get('kind') }; } }
if (q.get('ref')) { document.getElementById('grid').classList.add('ref'); document.getElementById('refimg').src = q.get('ref'); }

const mat = new Map();
const lam = (hex) => { if (!mat.has(hex)) mat.set(hex, new THREE.MeshLambertMaterial({ color: C(hex) })); return mat.get(hex); };
const glow = (hex) => new THREE.MeshBasicMaterial({ color: C(hex) });
function signTexture(text, bg = P.primary) {
  const c = document.createElement('canvas'); c.width = 720; c.height = 220; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, 720, 220, 40); g.fill();
  g.font = '800 60px "Pretendard","Apple SD Gothic Neo",sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 360, 114);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const PROPS = makeProps({ P, concept, lam, glow, tex: { sign: signTexture, rug: rugTexture, check: checkTexture }, custom: CUSTOM_PROPS });

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(C(concept.light?.sky || '#ffffff'), C(concept.light?.ground || '#888888'), concept.light?.ambient ?? 1.4));
const sun = new THREE.DirectionalLight(C(concept.light?.sun || '#ffffff'), concept.light?.intensity ?? 1.2);
sun.position.set(30, 60, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), lam(P.floor || '#cccccc')); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
scene.add(Object.assign(new THREE.GridHelper(400, 400, 0x000000, 0x000000), { material: new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 }) })); // 1m 눈금

if (!spec || (spec.avatar ? !STYLES[spec.avatar] : !PROPS[spec.kind])) {
  info.textContent = !spec ? '?zone=<구역 id>&i=<번호> · ?kind=<종류> · ?avatar=<캐릭터 스타일> 중 하나를 붙여 주세요'
    : spec.avatar ? `캐릭터 "${spec.avatar}" 가 없어요 → src/avatars/${spec.avatar}.js` : `"${spec.kind}" 가 없어요 → src/props/${spec.kind}.js 로 만들 수 있어요`;
  throw new Error('no prop');
}
const avatarMode = !!spec.avatar;
const obj = avatarMode ? new Character(C(spec.color), null, spec.avatar) : PROPS[spec.kind]({ ...spec, x: 0, z: 0, rot: 0 }).group;
if (avatarMode) { obj.update(0.016, 0, false); if (q.get('acc')) obj.setAccessories(Object.fromEntries(q.get('acc').split(',').map((a) => a.split(':')))); } obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
scene.add(obj);
const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
// 사람 크기 비교: 아바타를 구조물 정면 오른쪽 앞에
// 크기 비교 기준: 구조물이면 아바타(월드 속 사람), 캐릭터면 1m 막대
let me = null;
if (!avatarMode) { me = new Character(C(concept.avatar?.me || '#fff3dc'), '사람 (약 1.6m)', concept.avatar?.style); me.position.set(box.max.x + 1.2, 0, box.max.z + 0.8); me.rotation.y = -0.4; scene.add(me); me.update?.(0.016, 0, false); }
else { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.04), lam('#ff5d73')); bar.position.set(box.max.x + 0.3, 0.5, box.min.z - 0.3); scene.add(bar); }
info.innerHTML = avatarMode ? `<b>${STYLES[spec.avatar].icon || ''} ${STYLES[spec.avatar].label || spec.avatar}</b> · 캐릭터 <code>${spec.avatar}</code> · 키 ${size.y.toFixed(2)}m (빨간 막대 = 1m) · 걷는 모습은 4초마다` : `<b>${spec.text || spec.kind}</b> · kind <code>${spec.kind}</code> · 가로 ${size.x.toFixed(1)}m · 높이 ${size.y.toFixed(1)}m · 깊이 ${size.z.toFixed(1)}m${q.get('zone') ? ` · ${q.get('zone')} 소품 ${q.get('i') || 0}번` : ''}`;

// 네 방향 카메라: 구조물 크기에 맞춰 거리 자동
const R = Math.max(size.x, size.y, size.z) * 0.5 + (avatarMode ? 0.25 : 2);
const views = {
  front: (c) => { c.position.set(mid.x, mid.y, mid.z + R * 2.6); },
  three: (c) => { c.position.set(mid.x + R * 1.9, mid.y + R * 1.1, mid.z + R * 1.9); },
  side: (c) => { c.position.set(mid.x + R * 2.6, mid.y, mid.z); },
  top: (c) => { c.position.set(mid.x, mid.y + R * 3.2, mid.z + 0.01); },
};
const cams = Object.fromEntries(Object.entries(views).map(([k, place]) => { const c = new THREE.PerspectiveCamera(40, 1, 0.1, 2000); place(c); c.lookAt(mid); return [k, c]; }));
scene.background = C(P.fog || '#dfe6ee');

function draw() {
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.domElement.style.width = innerWidth + 'px'; renderer.domElement.style.height = innerHeight + 'px';
  for (const el of document.querySelectorAll('[data-view]')) {
    const b = el.getBoundingClientRect(), c = cams[el.dataset.view], y = innerHeight - b.bottom;
    c.aspect = b.width / b.height; c.updateProjectionMatrix();
    renderer.setViewport(b.left, y, b.width, b.height); renderer.setScissor(b.left, y, b.width, b.height);
    renderer.render(scene, c);
  }
}
addEventListener('resize', draw);
// 물 흐름 같은 애니메이션 소품도 보이게 계속 그림
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => { const dt = Math.min(0.1, clock.getDelta()); if (avatarMode) obj.update(dt, Math.sin(clock.elapsedTime * Math.PI / 4) > 0 ? 3 : 0, false); draw(); });
