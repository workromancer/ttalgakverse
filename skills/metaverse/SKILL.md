---
name: metaverse
description: 딸각verse — 나만의 브라우저 3D 메타버스를 채팅 몇 마디로 만들어 배포까지 하는 워크플로우의 입구이자 길잡이. "메타버스 만들고 싶어", "이어서 하자", "어디까지 했지", "막혔어", "build me a metaverse", "continue my metaverse" 같은 요청이면 먼저 이 스킬을 쓴다. 진행 상태(.metaverse/state.json)를 읽어 다음 단계 스킬(mv-setup → mv-worldview → mv-concept → mv-build → mv-multiplayer → mv-deploy, 다 만든 뒤엔 mv-polish 다듬기 루프)로 안내하고, 중간에 혼자 하다 멈춘 프로젝트도 이어서 진행한다.
---

# 🌏 딸각verse — 길잡이

이 스킬 묶음(딸각verse, ttalgakverse)은 **서버 없이** (Supabase + Cloudflare Workers 정적 배포) 누구나 브라우저 3D 메타버스를 만들고 공개할 수 있게 6단계로 나눠 진행한다. 이 스킬은 그 **입구**다: 지금 어디까지 왔는지 판단하고, 알맞은 단계 스킬로 넘긴다.

## 단계 (각각 독립 스킬, 순서대로)

| # | 스킬 | 하는 일 | 결과물 |
|---|---|---|---|
| 1 | `mv-setup` | Node·Supabase MCP·Cloudflare 준비 확인과 설정 안내 | 준비 완료 체크 |
| 2 | `mv-worldview` | **인터뷰하면서** 세계관 초안을 라이브로 그려 보여 주고 고르기 | `world/world.json` |
| 3 | `mv-concept` | **인터뷰하면서** 컨셉 시안 3개를 라이브로 만들어 보여 주고 고르기 | `world/concept.json` |
| 4 | `mv-build` | 템플릿 엔진으로 실제 3D 월드 만들기, 로컬 실행 | `src/`, `npm run dev` |
| 5 | `mv-multiplayer` | Supabase Realtime 으로 같은 구역 사람끼리 보이게 | `.env`, DB 함수 |
| 6 | `mv-deploy` | `*.workers.dev` 로 공개 (원하면 내 도메인) | 공개 URL |
| 🔁 | `mv-polish` | **다 만든 뒤** 마음에 안 드는 점을 먼저 짚어 묻고 → 고치고 → 전후 비교 → 또 묻기. 특히 구조물(건물·랜드마크) | `.metaverse/polish.json`, 라운드별 커밋 |

막혔을 때는 언제든 `mv-doctor` (진단 + 다음 단계 알려 줌).

**기술 스택만 고정, 모양은 사용자가 말한 대로 새로 짓는다.** 엔진·데이터 형식·멀티플레이·배포는 그대로 두고, 캐릭터·건물·구역 연출은 그 프로젝트 전용 코드(`src/avatars/`·`src/props/`·`src/scenes/`)로 Claude 가 짓는다. 템플릿의 토끼·서울 랜드마크는 고르는 메뉴가 아니라 예시다 — "목록에 없어서 비슷한 걸로" 는 하지 않는다. (키트 `docs/custom-code.md`)

**만들고 끝이 아니다.** 4단계(build)에서 처음 걸어 볼 수 있게 되면 바로 `mv-polish` 1라운드로 "마음에 안 드는 것"을 끌어내고, 배포 뒤에도 한 번 더 묻는다. 사용자가 "마음에 안 들어 / 이상해 / 안 닮았어" 같은 말을 하면 단계와 상관없이 `mv-polish` 로.

## 이 스킬이 할 일

1. **프로젝트 폴더 정하기.** 사용자가 이미 프로젝트 안에 있으면(현재 폴더에 `.metaverse/` 또는 `world/world.json` 이 있음) 그대로 쓴다. 없으면 새 폴더 이름을 물어보고(기본: 세계 이름의 영문 slug) 만든다. 이 키트 저장소 자체 안에서 작업하지 않는다.
2. **진단부터.** 프로젝트 폴더에서 `node <키트 루트>/skills/mv-doctor/scripts/doctor.mjs <프로젝트>` 를 실행해 단계별 상태와 `next` 를 얻는다. (키트 루트 = 이 SKILL.md 폴더의 `../..`)
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

## 🔐 비밀 정보 검사 (항상 켜짐)

- 이 플러그인의 훅(`hooks/hooks.json`)이 **`git commit` · `git push` · `gh repo create/pr create` · 배포 명령 직전마다** `shared/secret-scan.mjs` 를 돌린다. `.env`, 개인키, Supabase service_role·secret 키, API 토큰(Anthropic·OpenAI·GitHub·AWS·Slack·Telegram·Stripe·Cloudflare) 등이 있으면 명령을 막는다.
- 막히면 반드시 사용자에게 **무엇이 어디에 있는지**(값은 앞뒤 몇 글자만) 보여 주고 처리한다:
  - 파일 → `node <키트 루트>/shared/secret-scan.mjs --staged --fix` (커밋에서 빼고 `.gitignore` 에 추가)
  - 코드 속 키 → `.env` 로 옮기고 `import.meta.env` 로 읽게 고친다. 이미 GitHub 에 올라간 키는 **폐기·재발급**을 권한다.
  - 사용자가 공개해도 된다고 확인한 값 → 그 줄에 `secret-scan: allow` 주석 또는 `.secretscanignore`.
- 훅을 우회하는 방법(`--no-verify`, 훅 끄기)은 쓰지 않는다. Claude 밖에서 하는 커밋도 템플릿의 `.githooks/`(pre-commit·pre-push)가 같은 검사를 한다.
- GitHub 저장소는 기본 **private** 으로 만든다. 만들기 전에 `secret-scan.mjs --all` 결과를 보여 준다.

## 질문할 때는 항상 예시와 함께 (모든 mv-* 스킬 공통)

막연한 질문("어떤 세계를 원하세요?")만 던지면 대부분 막힌다. 질문마다 **예시 답 3~4개**를 같이 준다.

```
어디서 사람들이 만나면 좋겠어요?
  ① 벚꽃 핀 한강 공원 피크닉   ② 비 오는 밤 골목 LP바
  ③ 구름 위에 떠 있는 도서관    ④ 우리 학교 옥상
번호로 골라도, 섞어도("①+③"), 전혀 다른 걸 말해도 돼요. 모르겠으면 "추천해 줘".
```

- **예시는 서로 확 다르게** — 분위기·규모·현실/상상을 넓게 퍼뜨려서 "이런 것까지 돼?" 를 보여 준다. 비슷한 셋은 의미 없음.
- **앞 답에 맞춰 즉석에서** 만든다 (고정 목록 아님). 첫 질문만 넓게, 그다음부터는 지금까지 답을 반영한 예시로 좁혀 간다. 예: 앞에서 "LP바" → 다음 질문 예시는 "턴테이블 위 작은 무대 / 레코드 벽 / 창밖 네온 간판".
- 예시는 **구체적인 장면**으로 쓴다 ("자연" ✕ → "이끼 낀 돌다리와 반딧불 계곡" ○).
- 하나는 엉뚱하거나 그 사람만의 것(예: "우리 동네", "내 반려동물")으로 — 자유롭게 말해도 된다는 신호.
- AskUserQuestion 이 있으면 예시를 보기로 쓴다 (Other 로 자유 입력 가능). 추천이 분명하면 하나에 (추천).
- **"모르겠어요" / "추천해 줘"** → 묻기를 멈추고 지금까지 답에 가장 어울리는 걸 골라 바로 진행하고, "나중에 언제든 바꿀 수 있어요" 라고 한 줄.
- 라이브 보드의 `interview.json` 에도 `ex` 로 예시를 적는다: `{ "q": "...", "ex": ["...", "..."], "a": "" }` → 보드에 지금 질문이 **예시 버튼 + 입력칸**으로 떠서 사용자가 HTML 에서 눌러 답할 수 있다 (`wait-choice.mjs` 가 `type: "answer"` 로 받아 옴). 고르기(「이걸로 할게요」)도 보드에서 그대로. 채팅으로 해도 둘 다 된다.
- 예시는 생각의 출발점일 뿐 — 사용자가 다른 걸 말하면 예시에 끼워 맞추지 않는다.

## 말투

- 사용자의 언어(한국어/영어)로 답한다. 비개발자도 따라올 수 있게 쉬운 말로, 한 번에 한 가지씩 묻는다.
- 질문은 위 규칙대로 예시 3~4개와 함께, 추천이 있으면 하나 표시한다.
- 외부에 공개되는 일(배포, DB 변경, 도메인 연결)은 하기 전에 한 줄로 확인받는다.
