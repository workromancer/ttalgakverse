// 예시: 프로젝트 전용 구조물 (이름이 _ 로 시작해서 무시됨 — 복사해서 src/props/<kind>.js 로, world.json 에서 "kind": "<kind>")
//  사용자가 원하는 건물·소품을 Claude 가 이 형식으로 새로 짓는다. 기본 소품 목록에 없어도, 있어도(같은 이름이면 덮어씀).
//  import 없이 kit 만 쓴다: { THREE, C, P(팔레트), concept, lam, glow, tex, box, cyl, canvasTex, stoneMat, danMat, plaqueTex, giwa, storey, flow, roof, wood, leaf, trunk, light }
//  p = world.json 의 소품 객체 (x, z, rot 은 엔진이 처리 — 여기선 원점 기준으로 지음, 앞 = +z, 1 단위 = 1m)
//  solid: 부딪히는 영역 [{ r }] 원 또는 [{ box: [반폭x, 반폭z], dx, dz }]
export default (p, { THREE, P, lam, glow, box, cyl }) => {
  const g = new THREE.Group(), W = p.w || 6, H = p.h || 5;
  box(g, W, H, 4, lam(p.color || P.wall), 0, H / 2, 0);                         // 몸통
  const r = new THREE.Mesh(new THREE.ConeGeometry(W * 0.75, 2.4, 4), lam(P.primary)); r.position.y = H + 1.2; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r); // 지붕
  box(g, 1.2, 2.2, 0.1, lam('#5a3d2b'), 0, 1.1, 2.03);                           // 문
  for (const s of [-1, 1]) box(g, 1, 1, 0.08, glow(P.accent), s * W * 0.3, H * 0.6, 2.03); // 불 켜진 창
  cyl(g, 0.15, 0.15, 1.5, lam('#444'), W / 2 + 0.6, 0.75, 1.5);                 // 옆 기둥
  return { group: g, solid: [{ box: [W / 2, 2] }] };
};
