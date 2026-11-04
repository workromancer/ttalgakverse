# world/concept.json

```jsonc
{
  "id": "A", "name": "파스텔 밤하늘", "mood": "포근하고 몽환적인 밤 산책", "keywords": ["파스텔", "별빛"],
  "palette": {
    "primary": "#6c5ce7",   // UI 버튼·포털·이름표 (흰 글씨가 읽히는 진한 색)
    "accent":  "#ffd166",   // 포인트 (밝게)
    "floor":   "#cfe3d4",   // 바닥 (채도 낮게)
    "wall":    "#e9e4f5",   // 벽·가장자리
    "sky":     ["#2b2a5c", "#f2b8c6"],  // 하늘 위 → 아래
    "fog":     "#c9a7c7"
  },
  "light": { "sky": "#e6dcff", "ground": "#6b5a7a", "ambient": 1.5, "sun": "#ffe6c9", "intensity": 1.0 },
  "props": { "leaf": "#7ec8a4", "trunk": "#8b6a4e", "wood": "#c49a6c", "light": "#fff1b8", "water": "#8ec9ff" },
  "avatar": {
    "me": "#fff3dc",          // 내 캐릭터 색 (몸 주색)
    "style": "penguin",       // 캐릭터 스타일: 엔진 예시(bunny cat bear chick ghost robot kid) 또는 src/avatars/<id>.js (사용자 말대로 새로 지은 것)
    "styles": ["penguin", "cat"]  // (선택) 방문자가 🎭 로 골라 쓸 스타일들, 첫 번째가 기본
  }
}
```
