# world/world.json

```jsonc
{
  "slug": "starlight",            // 영문 소문자·숫자·- (배포 주소, 실시간 채널 이름)
  "title": "별빛 정원",
  "tagline": "밤마다 별이 내려앉는 작은 정원 마을",
  "spawn": "plaza",               // 처음 도착하는 구역 id
  "zones": [
    {
      "id": "plaza", "name": "중앙 광장", "desc": "모두가 처음 도착하는 곳",
      "shape": "open",            // open(야외) | room(실내, 벽)
      "size": [44, 44],           // 가로(x)·세로(z) m, 가운데가 (0,0)
      "height": 5,                // room 벽 높이
      "spawn": [0, 4],            // 이 구역에 포털 없이 들어올 때 위치 (기본 0,4)
      "floor": "#cfe3d4", "wall": "#e9e4f5",   // 생략하면 concept 색
      "props": [
        { "kind": "fountain", "x": 0, "z": 0 },
        { "kind": "sign", "x": 0, "z": -8, "text": "환영해요" },
        { "kind": "bench", "x": -6, "z": 5, "rot": 30 },          // rot: 도(°)
        { "kind": "box", "x": 9, "z": -6, "size": [6, 3, 1], "color": "#8b6a4e" }
      ],
      "portals": [ { "to": "library", "x": 0, "z": -20, "label": "달빛 도서관" } ]
    }
  ]
}
```

구역 추가 필드 (모두 선택):
- `pattern` 바닥 무늬 `cobble`(돌길)·`wood`·`tile`·`grass`·`plain`, `areas: [{ x, z, w, d, pattern, color }]` 구역 일부만 다른 바닥 (잔디 위 산책로 등)
- `water: [{ x, z, w, d } | { x, z, r }]` 물 (들어갈 수 없음). 구역 밖까지 길게 두면 강처럼 보임
- `skyline: false` 둘레 도시 불빛 끄기 · `fog: [가까이, 멀리]` 멀리 있는 랜드마크가 잘 보이게

### 소품 `kind`

> 아래는 엔진에 **기본으로 들어 있는 예시**다. 이 목록에 없는 건물·물건은 비슷한 걸로 때우지 말고 `src/props/<kind>.js` 로 새로 짓는다 (필드도 자유). 지형·날씨 같은 연출은 구역 `"scene": "<이름>"` + `src/scenes/<이름>.js`. → `docs/custom-code.md`

공통: `x` `z` `rot`(도) `color` `scale` `text`

| 분류 | kind (주요 필드) |
|---|---|
| 기본 | `tree` `bench` `lamp` `sign`(text) `box`(size) `rock` `flowers` `fountain` `kiosk`(text) |
| 골목·가게 | `shop`(text, w, d, seed) `shelf` `books` `table` `lantern` `planter` `crate` `cat` `stage` `chair` `rug`(size) `stringlights`(from, to, h) `store`(text) `mat`(size) `flag` |
| 자연 | `cherry`(벚나무) `pine`(소나무) `mountain`(r, h, wide, tower: N서울타워) |
| 서울 랜드마크 | `gate`(광화문: text, walls, wolldae) `hanok`(궁궐 전각: w, d) `statue`(pose: `sit` 세종대왕형 / `stand` 이순신형, text) `jets`(바닥분수: w, d) `tower`(롯데월드타워: h, mall) `bridge`(반포대교+무지개분수: len, fountain) `sevit`(세빛섬: variant `ga` `cha` `sol` `ye`) `swanboat`(오리배) `dome` |

배경용 소품(`tower` `bridge` `mountain` `hanok` 또는 `"bg": true`)은 구역 밖에 둬도 된다 (멀리 보이는 풍경).
실제 장소를 만들 땐 사진을 찾아보고 **누가 봐도 알아보는 특징**(실루엣·색·재질·배치 순서)을 맞춘다 — 예시 `skills/mv-build/template/world/world.json` "서울 산책".

포털: 야외는 가장자리 2~3m 안쪽, 실내는 벽 위 좌표(벽에 문이 뚫림). 양방향으로 둔다. 검사: `skills/mv-worldview/reference/validate.mjs`.
