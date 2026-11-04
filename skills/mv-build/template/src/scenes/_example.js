// 예시: 구역 연출 (이름이 _ 로 시작해서 무시됨 — 복사해서 src/scenes/<name>.js 로, world.json 구역에 "scene": "<name>")
//  엔진 기본 그리기(평평한 바닥·소품·포털)로 안 되는 것: 언덕·계단식 지형, 눈·비·반딧불, 떠다니는 섬, 오로라, 하늘 바꾸기, 움직이는 배 …
//  ctx = { THREE, group(구역 그룹 — 여기에 붙이면 구역을 떠날 때 저절로 치워짐), scene, camera, renderer, zone, world, P, concept, lam, glow, textSprite, solid(부딪힘 추가), player }
//  반환(선택): { update(dt, t) 매 프레임, dispose() 구역을 떠날 때 (scene 에 직접 바꾼 것 되돌리기) }
export default ({ THREE, group, scene, P }) => {
  // 반딧불 200개가 천천히 떠다님
  const n = 200, pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) { base.push([(Math.random() - 0.5) * 40, 0.5 + Math.random() * 4, (Math.random() - 0.5) * 40, Math.random() * 6]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: P.accent, size: 0.15, transparent: true, opacity: 0.9 }));
  group.add(pts);
  const oldFog = scene.fog.color.clone(); scene.fog.color.set('#1b2340'); // 이 구역만 안개색 바꾸기
  return {
    update(dt, t) { base.forEach(([x, y, z, k], i) => { pos.set([x + Math.sin(t * 0.5 + k) * 0.8, y + Math.sin(t * 0.9 + k) * 0.4, z + Math.cos(t * 0.4 + k) * 0.8], i * 3); }); geo.attributes.position.needsUpdate = true; },
    dispose() { scene.fog.color.copy(oldFog); },
  };
};
