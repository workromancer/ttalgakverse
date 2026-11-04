---
name: metaverse
description: 나만의 브라우저 3D 메타버스를 처음부터 배포까지 만드는 워크플로우의 시작점이자 길잡이. "메타버스 만들고 싶어", "메타버스 이어서 하자", "어디까지 했지", "막혔어" 같은 요청이면 먼저 이 스킬을 쓴다. 진행 상태(.metaverse/state.json)를 읽어 다음 단계 스킬(mv-setup → mv-worldview → mv-concept → mv-build → mv-multiplayer → mv-deploy)로 안내하고, 중간에 혼자 하다 멈춘 프로젝트도 이어서 진행한다.
---

# 🌏 메타버스 만들기 — 길잡이

이 스킬 묶음(metaverse-kit)은 **서버 없이** (Supabase + Cloudflare Workers 정적 배포) 누구나 브라우저 3D 메타버스를 만들고 공개할 수 있게 6단계로 나눠 진행한다. 이 스킬은 그 **입구**다: 지금 어디까지 왔는지 판단하고, 알맞은 단계 스킬로 넘긴다.

## 단계 (각각 독립 스킬, 순서대로)

| # | 스킬 | 하는 일 | 결과물 |
|---|---|---|---|
| 1 | `mv-setup` | Node·Supabase MCP·Cloudflare 준비 확인과 설정 안내 | 준비 완료 체크 |
| 2 | `mv-worldview` | 세계관(어떤 세계인지)·구역·포털 정하기 | `world/world.json` |
| 3 | `mv-concept` | 월드 컨셉 시안 3개를 HTML 로 보여 주고 고르기 | `concepts/*.html`, `world/concept.json` |
| 4 | `mv-build` | 템플릿 엔진으로 실제 3D 월드 만들기, 로컬 실행 | `src/`, `npm run dev` |
| 5 | `mv-multiplayer` | Supabase Realtime 으로 같은 구역 사람끼리 보이게 | `.env`, DB 함수 |
| 6 | `mv-deploy` | `*.workers.dev` 로 공개 (원하면 내 도메인) | 공개 URL |

막혔을 때는 언제든 `mv-doctor` (진단 + 다음 단계 알려 줌).

## 이 스킬이 할 일

1. **프로젝트 폴더 정하기.** 사용자가 이미 프로젝트 안에 있으면(현재 폴더에 `.metaverse/` 또는 `world/world.json` 이 있음) 그대로 쓴다. 없으면 새 폴더 이름을 물어보고(기본: 세계 이름의 영문 slug) 만든다. 이 키트 저장소 자체 안에서 작업하지 않는다.
2. **진단부터.** 프로젝트 폴더에서 `node <이 스킬 폴더>/../mv-doctor/scripts/doctor.mjs <프로젝트>` 를 실행해 단계별 상태와 `next` 를 얻는다. (스크립트 경로는 이 SKILL.md 가 있는 폴더 기준 `../mv-doctor/scripts/doctor.mjs`)
3. **사용자에게 짧게 보여 주기**: ✅/⬜ 목록과 "다음은 ○○ 단계예요" 한 줄.
4. **다음 단계 스킬로 바로 이어서 진행**한다 (사용자가 다른 단계를 콕 집으면 그 단계로). 처음 시작하는 사람에게는 전체 6단계를 한 줄씩 먼저 소개한다.
5. 각 단계가 끝날 때마다 그 단계 스킬이 `.metaverse/state.json` 과 `.metaverse/PROGRESS.md` 를 갱신한다 (아래 규칙).

## 상태 파일 규칙 (모든 mv-* 스킬 공통)

- `.metaverse/state.json` — 기계용. 형식은 `docs/state.md` (키트 저장소) 참고. 핵심:
  ```json
  { "version": 1, "project": { "name": "별빛 정원", "slug": "starlight" },
    "steps": { "setup": { "status": "done" }, "worldview": { "status": "in_progress" } },
    "choices": { "worldview": "판타지 정원 마을", "concept": "A" },
    "supabase": { "project_ref": "", "region": "ap-northeast-2" },
    "deploy": { "url": "" }, "next": "mv-concept" }
  ```
  `status`: `todo` · `in_progress` · `done` · `skipped`. 단계 시작 때 `in_progress`, 끝나면 `done`.
- `.metaverse/PROGRESS.md` — 사람용 진행 일지. 단계마다 날짜·정한 것·남은 일을 한 단락씩 덧붙인다. 다른 사람(또는 다른 AI 세션)이 이것만 읽고 이어갈 수 있게 쓴다.
- 사용자의 선택(세계관·시안·지역·도메인 등)은 반드시 `choices` 에 남긴다. 나중에 "왜 이렇게 됐지?" 를 추적할 수 있게.

## 이어서 하기 (다른 데서 막혀서 온 사람)

- 상태 파일이 없어도 doctor 가 실제 파일을 보고 상태를 만든다. 다른 도구로 만들다 온 프로젝트면 `world/world.json` 형식(`docs/world-schema.md`)으로 옮기는 것부터 도와준다.
- 오류 메시지를 붙여 넣은 사람이면 `mv-doctor` 로 넘긴다.

## 말투

- 비개발자도 따라올 수 있게 쉬운 한국어로, 한 번에 한 가지씩 묻는다.
- 선택지는 3~4개로 보여 주고 추천을 하나 표시한다.
- 외부에 공개되는 일(배포, DB 변경, 도메인 연결)은 하기 전에 한 줄로 확인받는다.
