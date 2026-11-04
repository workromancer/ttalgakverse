---
name: mv-concept
description: 메타버스 만들기 3단계 — 정한 세계관에 맞는 월드 컨셉(색·빛·하늘·분위기) 시안 3개를 브라우저에서 바로 열리는 HTML 로 만들어 나란히 보여 주고, 사용자가 고른(또는 섞은) 시안을 world/concept.json 으로 확정한다. "컨셉 시안", "디자인 고르기", "색감 바꾸기", "분위기 바꾸기" 요청에 사용.
---

# 3단계 · 월드 컨셉 시안 (mv-concept)

목표: 말로 고르기 어려운 "분위기"를 **눈으로 보고 고르게** 한다. 시안은 실제 엔진과 같은 소품·색 규칙으로 그린 3D 미리보기라서, 고른 그대로 빌드된다.

## 준비물

- `world/world.json` (없으면 `mv-worldview` 먼저)
- 이 스킬 폴더의 `assets/concept-template.html` (시안 틀), `scripts/make-concepts.mjs` (시안 생성기)

## 진행

1. **시안 3개 설계** — 세계관(`state.choices.worldview`, world.json 의 title·tagline)에 맞춰 서로 **확실히 다른** 3방향을 잡는다. 예: 같은 정원 마을이라도 A 파스텔 밤 / B 한낮 청량 / C 네온 밤. 사용자가 원하는 키워드가 있으면 그걸 A 에 반영하고 B·C 는 대안으로.
   각 시안은 아래 형식 (concept.json 과 같음, `docs/concept-schema.md`):
   ```json
   { "id": "A", "name": "파스텔 밤하늘", "mood": "포근하고 몽환적인 밤 산책", "keywords": ["파스텔", "별빛"],
     "palette": { "primary": "#6c5ce7", "accent": "#ffd166", "floor": "#cfe3d4", "wall": "#e9e4f5", "sky": ["#2b2a5c", "#f2b8c6"], "fog": "#c9a7c7" },
     "light": { "sky": "#e6dcff", "ground": "#6b5a7a", "ambient": 1.5, "sun": "#ffe6c9", "intensity": 1.0 },
     "props": { "leaf": "#7ec8a4", "trunk": "#8b6a4e", "wood": "#c49a6c", "light": "#fff1b8", "water": "#8ec9ff" },
     "avatar": { "me": "#fff3dc" } }
   ```
   색 고르는 요령: `primary` 는 UI·포털·이름표(흰 글씨가 읽히게 진한 색), `accent` 는 포인트(밝게), 바닥·벽은 채도 낮게, 하늘은 위가 진하고 아래가 밝게. 밤 분위기면 `ambient` 1.0~1.3, 낮이면 1.5~1.7.
2. **파일 만들기**
   ```bash
   # 프로젝트 폴더에서
   cat > concepts/concepts.json   # 위 시안 3개 배열
   node -e "const w=require('./world/world.json');const z=w.zones.find(z=>z.id===w.spawn);console.log(JSON.stringify(z))" > concepts/zone.json
   node <이 스킬 폴더>/scripts/make-concepts.mjs concepts concepts/concepts.json concepts/zone.json
   ```
   → `concepts/index.html` (세 개 나란히), `concepts/concept-A.html` …
3. **보여 주기** — `open concepts/index.html` (macOS) 또는 경로를 알려 준다. 스크린샷 도구가 있으면 찍어서 대화에 보여 준다. 각 시안을 한 줄로 설명하고 추천 하나를 표시.
4. **고르기·다듬기** — "B로", "A 색에 C 하늘" 같은 답을 받으면 해당 값으로 새 시안 `D` 를 만들어 다시 보여 줘도 된다 (확정 전까지 반복, 보통 1~2번).
5. **확정** — 고른 시안 객체를 그대로 `world/concept.json` 에 쓴다 (`id`·`keywords` 는 남겨 둬도 됨).

## 끝나면

- `state.choices.concept = "<id> · <name>"`, `steps.concept.status = "done"`.
- PROGRESS.md 에 고른 시안 이름·색 6개·이유 한 줄.
- 이미 빌드된 프로젝트면 `npm run dev` 화면이 바로 바뀐다고 알려 주고, 아니면 `mv-build` 로.

## 참고

- 시안 HTML 은 인터넷(three.js CDN) 이 있어야 3D 가 보인다. 오프라인이면 색 카드만 보인다.
- 시안을 공개 링크로 공유하고 싶으면 `concepts/` 폴더를 그대로 정적 호스팅에 올리면 된다.
