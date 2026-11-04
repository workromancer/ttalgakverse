---
name: mv-concept
description: 딸각verse 3단계 — 분위기·색감 인터뷰를 하면서 그 답으로 월드 컨셉 시안(3D 미리보기 + 색 팔레트 + UI 샘플) 3개를 즉석에서 만들어 라이브 보드로 보여 주고, 고르거나 섞은 시안을 world/concept.json 으로 확정한다. "컨셉 시안", "디자인 고르기", "색감·분위기 바꾸기", "concept", "art direction" 요청에 사용.
---

# 3단계 · 컨셉 인터뷰와 라이브 시안 (mv-concept)

목표: 사용자 말에서 바로 시안을 만들어 **보면서 고르게** 한다. 시안은 실제 엔진과 같은 소품·색 규칙의 3D 미리보기라 고른 그대로 빌드된다. 사용자 언어(한국어/영어)로 진행.

## 0) 라이브 보드 열기

```bash
mkdir -p concepts
cp <이 스킬 폴더>/assets/board.html concepts/index.html
cp <이 스킬 폴더>/assets/concept-template.html concepts/
cp <키트 루트>/skills/mv-build/template/src/props.js concepts/   # 엔진과 같은 소품으로 그리기
echo '[]' > concepts/concepts.json
node -e "const w=require('./world/world.json');console.log(JSON.stringify(w.zones.find(z=>z.id===w.spawn)))" > concepts/zone.json
node <키트 루트>/shared/live-preview.mjs . 4321   # 이미 떠 있으면 그대로
```
→ **http://localhost:4321/concepts/** 를 열어 두게 한다. `concepts/interview.json`·`concepts.json` 을 고치면 저절로 바뀐다.

## 1) 인터뷰 — 답마다 시안 갱신

`concepts/interview.json` 에 질문을 먼저 쓰고 답을 채워 간다.

| # | 질문 (예) | 시안에 반영 |
|---|---|---|
| 1 | 하루 중 언제 같은 분위기예요? (새벽·한낮·노을·밤) 계절도 있으면 | 하늘 색, 빛 세기 |
| 2 | 떠오르는 **단어 3개** | mood, 채도·대비 |
| 3 | 닮았으면 하는 **장소·게임·영화·브랜드** 하나 (없어도 됨) | 팔레트 방향 |
| 4 | 좋아하는 색 / 피하고 싶은 색 | primary·accent |
| 5 | 캐릭터 느낌 (말랑 귀여움 · 깔끔 · 반짝임) | 아바타 색, 이름표 |

- **1번 답부터** 시안 3개를 바로 만든다: 같은 답을 세 방향으로 해석 (예: "노을" → A 따뜻한 주황 노을 / B 보라빛 매직아워 / C 노을 지는 바닷가 청록). 답이 늘수록 세 시안을 좁혀 간다.
- 세 시안은 **확실히 달라야** 한다 (밝기·주색·채도 중 둘 이상 다르게).

## 2) 시안 형식 (`concepts/concepts.json`, 키트 docs/concept-schema.md)

```json
[{ "id": "A", "name": "서울의 노을", "mood": "노을 지는 서울, 불빛이 하나둘 켜지는 시간", "keywords": ["노을", "벚꽃"],
   "palette": { "primary": "#c0563f", "accent": "#ffcf7a", "floor": "#e8dcc6", "wall": "#f4ead8", "sky": ["#5b3a6b", "#ffb88c"], "fog": "#e9b9a0" },
   "light": { "sky": "#ffe0c2", "ground": "#6b4f45", "ambient": 1.4, "sun": "#ffc58a", "intensity": 1.1 },
   "props": { "leaf": "#8fb87a", "trunk": "#7a5536", "wood": "#b07a4f", "light": "#ffe2a8", "water": "#7fb8d6" },
   "avatar": { "me": "#fff3dc" } }]
```
요령: primary 는 흰 글씨가 읽히는 진한 색(UI·포털·이름표), accent 는 밝은 포인트, 바닥·벽은 채도 낮게, 하늘은 위 진하게·아래 밝게. 밤이면 ambient 1.0~1.3, 낮이면 1.5~1.7.

## 3) 고르고 다듬기 → 확정

- "B로", "A 색에 C 하늘" → 섞은 새 시안 D 를 추가해 보여 준다 (반복 가능).
- 확정하면 그 객체를 `world/concept.json` 으로 저장. 인터뷰 답은 `world/concept-interview.json`.
- 공유용 단독 파일이 필요하면: `node <이 스킬 폴더>/scripts/make-concepts.mjs concepts/export concepts/concepts.json concepts/zone.json` (파일만 열어도 보이는 버전).

## 끝나면

- `state.choices.concept = "<id> · <name>"`, `steps.concept.status = "done"`, PROGRESS.md 에 답 요약·고른 색 6개·이유.
- 다음: `mv-build` (이미 빌드했다면 `npm run dev` 화면이 바로 바뀜).
