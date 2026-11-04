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

소품 `kind`: `tree` `bench` `lamp` `sign`(text) `box`(size, color) `rock`(scale) `flowers` `fountain` `kiosk`(text). 공통: `x` `z` `rot` `color` `scale`.

포털: 야외는 가장자리 2~3m 안쪽, 실내는 벽 위 좌표(벽에 문이 뚫림). 양방향으로 둔다. 검사: `skills/mv-worldview/reference/validate.mjs`.
