---
name: mv-concept
description: 딸각verse 3단계 — 분위기·색감 인터뷰로 월드 컨셉 시안(3D 미리보기 + 색 팔레트 + UI 샘플) 3개를 즉석에서 만들어 라이브 보드로 고르게 하고, 이어서 사용자가 말한 캐릭터를 그 프로젝트 전용 코드로 새로 지어(정해진 목록에서 고르기 아님) 걸어 다니는 후보들을 캐릭터 보드로 보여 주고 확정한다. "컨셉 시안", "디자인 고르기", "색감·분위기 바꾸기", "캐릭터 정하기", "캐릭터 바꾸고 싶어", "아바타", "우리 마스코트로", "concept", "art direction", "character", "avatar" 요청에 사용.
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
node <키트 루트>/shared/live-preview.mjs . 4321   # 이미 떠 있으면 그대로. 다른 앱이 4321 을 쓰면 다음 빈 포트 → 출력의 주소로 안내
```
→ **http://localhost:4321/concepts/** 를 열어 두게 한다. `concepts/interview.json`·`concepts.json` 을 고치면 저절로 바뀐다.
**보드에서 답하고 고르기**: 지금 질문이 예시 버튼과 함께 보드에 뜬다 (채팅으로 답해도 됨). 인터뷰 시작부터 `node <키트 루트>/shared/wait-choice.mjs concepts` 를 백그라운드로 — 출력 `type: answer` 면 시안을 고치고 다음 질문 `ex` 를 써서 다시 띄우고, `type: choice` 면 3)으로. 캐릭터 보드(`avatars`)도 똑같이.

## 1) 인터뷰 — 답마다 시안 갱신

`concepts/interview.json` 에 질문을 `{ "q", "ex", "a" }` 로 먼저 쓰고 답을 채워 간다. 질문마다 **예시 3~4개**를 같이 주고, 세계관 답(`world/interview.json`)에 맞춰 만든다 (아래는 출발점).

| # | 질문 | 예시 (출발점) | 시안에 반영 |
|---|---|---|---|
| 1 | 하루 중 **언제** 같은 분위기예요? 계절도 있으면 | 봄날 오후 2시 햇살 · 여름밤 노을 끝자락 · 눈 오는 겨울 새벽 · 시간이 멈춘 듯한 영원한 황혼 | 하늘 색, 빛 세기 |
| 2 | 떠오르는 **느낌 단어** 3개 | 포근·느긋·몽글 · 시크·네온·도시 · 신비·고요·반짝 · 레트로·장난·컬러풀 | mood, 채도·대비 |
| 3 | 닮았으면 하는 **장소·영화·브랜드 느낌** (없어도 됨) | 지브리 영화 속 시골 마을 · 성수동 카페 거리 · 90년대 오락실 · 북유럽 숲속 오두막 | 팔레트 방향 |
| 4 | 좋아하는 색 / 피하고 싶은 색 | 연두+크림 / 형광은 싫어요 · 남색+금색 · 분홍+민트 · "아무거나, 대신 너무 어둡진 않게" | primary·accent |

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

- **브라우저에서 고르기** (HTML 보드에서 고르는 방식은 그대로 유지 — 채팅과 둘 다 됨): `wait-choice.mjs concepts` 가 백그라운드로 돌고 있게 한다 (Bash `run_in_background`). 사용자가 보드에서 「이 시안으로 할게요」를 누르면 이 명령이 끝나며 알림이 오고, 출력에 고른 id 와 고칠 점(note)이 있다 → 채팅을 기다리지 말고 바로 이어서 진행한다.
  - note 가 있으면 반영해 시안을 고쳐 다시 보여 주고 `rm -f concepts/choice.json` 후 wait-choice 를 다시 띄운다. note 가 없으면 확정.
  - 사용자가 채팅으로 먼저 고르면 그걸 따르고, 돌고 있는 wait-choice 는 그냥 두거나 멈춘다 (30분 뒤 저절로 끝남).
- "B로", "A 색에 C 하늘" → 섞은 새 시안 D 를 추가해 보여 준다 (반복 가능).
- 확정하면 그 객체를 `world/concept.json` 으로 저장. 인터뷰 답은 `world/concept-interview.json`.
- 공유용 단독 파일이 필요하면: `node <이 스킬 폴더>/scripts/make-concepts.mjs concepts/export concepts/concepts.json concepts/zone.json` (파일만 열어도 보이는 버전).

## 4) 캐릭터 — 말을 듣고 새로 짓기

정해진 캐릭터 목록에서 고르게 하지 **않는다**. 사용자가 상상하는 캐릭터를 듣고, 그 프로젝트 전용 스타일 코드(`src/avatars/<id>.js`)를 Claude 가 새로 짓는다. 엔진에 들어 있는 토끼·고양이·곰·병아리·유령·로봇·꼬마 사람은 **짓는 방법의 예시**일 뿐이다 (사용자가 그중 하나를 원하면 그대로 써도 됨). 규칙·형식은 키트 `docs/custom-code.md`.

**보드 열기** (컨셉 확정 뒤, 같은 라이브 서버):
```bash
mkdir -p avatars src/avatars
cp <이 스킬 폴더>/assets/avatars.html avatars/index.html
cp <키트 루트>/skills/mv-build/template/src/character.js avatars/        # 엔진과 같은 캐릭터 코드
cp <키트 루트>/skills/mv-build/template/src/avatars/_example.js src/avatars/  # 견본
echo '[]' > avatars/avatars.json
```
→ **http://localhost:4321/avatars/** . 후보는 `avatars/avatars.json` 에 `{ "id": "A", "style": "<스타일 id>", "color": "#…", "acc": { "head": "scarf" }, "name": "…", "why": "왜 이렇게 지었는지 한 줄" }`. style 이 기본 스타일이 아니면 보드가 `/src/avatars/<style>.js` 를 불러 그린다. 걷기·멈춤·이모트를 번갈아 보여 줌.

**인터뷰 (`avatars/interview.json` 에 `{ q, ex, a }`, 답마다 후보 갱신)** — 질문마다 예시 3~4개를 같이 준다.
| # | 질문 | 예시 (세계관·컨셉에 맞춰 바꿈) | 짓는 데 반영 |
|---|---|---|---|
| 1 | 이 세계에서 **나는 어떤 모습**으로 걸어 다니면 좋겠어요? | 목도리 두른 아기 펭귄 · 머리에 화분이 자라는 꼬마 정령 · 레트로 TV 머리 로봇 · 우리 가게 마스코트 고양이 | 몸의 뼈대 |
| 2 | 어떤 **느낌**이면 좋겠어요? | 말랑하고 동글동글 · 날렵하고 시크하게 · 손그림처럼 삐뚤빼뚤 · 반짝반짝 빛나는 | 비율(머리 크기)·선(둥글게/각지게)·디테일 양 |
| 3 | 꼭 있었으면 하는 **특징** 하나 (사진·그림 있으면 보여 주세요) | 걸을 때 흔들리는 긴 귀 · 기분 따라 색이 바뀌는 볼 · 등에 작은 배낭 · 머리 위 떠 있는 별 | 상징 디테일 |
| 4 | 방문자가 **각자 골라** 쓰게 할까요? | 다 같은 모습으로 (통일감) · 2~3종 중에 고르기 (추천) · 색만 각자 다르게 | `avatar.styles` |

- 예: 세계관이 "비 오는 밤 LP바"면 1번 예시는 "트렌치코트 입은 고양이 · 레코드판 얼굴 로봇 · 우산 쓴 작은 유령 · 바텐더 너구리" 처럼 그 세계에 사는 존재로.

- **1번 답부터** 해석 3개를 새로 짓는다: 같은 말을 비율·디테일·귀여움 정도를 달리해 (예: "펭귄" → A 동글 아기 펭귄 / B 키 큰 황제펭귄 / C 목도리 두른 모험가 펭귄). 각각 `src/avatars/<id>.js` 로 쓰고 avatars.json 에 올린다. "보드 보세요".
- 짓는 요령: 견본(`_example.js`)과 엔진 안 STYLES 예시를 참고. 몸은 `ch.bodyPivot` 에, 키 0.9~1.2m, 앞 = +z. 손·발·걷기·이모트·모자/안경 액세서리·멀티플레이는 공통 뼈대가 해 준다 (`ch.rig`·`ch.accT` 로 위치만 맞춤). 색은 `M.skin` = 플레이어마다 다른 색이라 몸의 주색에 쓰고, 고유색(부리·무늬)은 고정색으로.
- 특정 게임·애니 캐릭터를 그대로 베끼지 않는다 — 느낌을 가져온 오리지널로 짓고 그렇게 말해 준다. 사용자 본인 브랜드의 마스코트는 OK.
- 고르기·고치기는 컨셉과 같다: `node <키트 루트>/shared/wait-choice.mjs avatars` 를 백그라운드로, note 가 오면 고쳐서 다시 (`rm -f avatars/choice.json` 후 재대기). "A 몸에 C 귀" → 섞은 새 파일 D.
- 🛠️ 빌드 뒤라면 `lab.html?avatar=<id>` 로 네 방향·1m 막대와 비교할 수 있다.
- **확정**: `world/concept.json` 의 `avatar` 에 `{ "me": "<내 색>", "style": "<id>" }`, 방문자가 고르게 하면 `"styles": ["<id>", …]` (첫 번째가 기본, 월드에 🎭 버튼이 생김). 안 고른 후보 파일은 `_` 를 붙여 보관하거나 지운다.

## 끝나면

- `state.choices.concept = "<id> · <name>"`, `state.choices.avatar = "<스타일 id> · 한 줄"`, `steps.concept.status = "done"`, PROGRESS.md 에 답 요약·고른 색 6개·캐릭터 특징·이유.
- 다음: `mv-build` (이미 빌드했다면 `npm run dev` 화면이 바로 바뀜).
