// 예시: 프로젝트 전용 캐릭터 스타일 (이름이 _ 로 시작해서 엔진이 무시함 — 복사해서 src/avatars/<id>.js 로)
//  사용자가 말한 캐릭터를 Claude 가 이 형식으로 새로 짓는다. import 를 쓰지 말고 kit 만 쓴다 (보드·작업대에서도 그대로 불림)
//  ch.bodyPivot 에 몸·얼굴을 붙인다. 바닥 = y 0, 키는 대략 0.9~1.2 (이름표가 1.4 에 뜸), 앞 = +z
//  M = { skin(플레이어 색), dark, white, pink } · kit = { THREE, lam, glow, add, sph, face, roundBody, sprout }
//  선택: ch.top(걸을 때 흔들리는 장식) · ch.rig = { hx, hy, fx }(손 x·y, 발 x) · ch.float(떠 있는 높이) · ch.noFeet
//        ch.handShape=[sx,sy,sz] · ch.handMat · ch.footColor · ch.handBox · ch.accT = { y, s }(모자·안경 위치·크기 보정)
export default {
  label: '펭귄', icon: '🐧',
  build(ch, M, { THREE, lam, add, sph, face }) {
    add(ch.bodyPivot, sph(0.4, 28, 20), lam(0x2b2f3a), 0, 0.5, 0, 1, 1.15, 0.95);      // 검은 몸
    add(ch.bodyPivot, sph(0.3, 24, 16), M.skin, 0, 0.45, 0.2, 1, 1.2, 0.75);           // 배 (플레이어 색, 몸보다 살짝 앞으로)
    const beak = add(ch.bodyPivot, new THREE.ConeGeometry(0.05, 0.1, 8), lam(0xffa62b), 0, 0.62, 0.42); beak.rotation.x = Math.PI / 2;
    face(ch, M, { y: 0.7, z: 0.36, dx: 0.11, mouth: false, blush: true });
    ch.top = new THREE.Group(); ch.bodyPivot.add(ch.top);
    ch.handShape = [0.5, 1.6, 0.9]; ch.footColor = 0xffa62b; ch.rig = { hx: 0.4, hy: 0.45, fx: 0.14 };
  },
};
