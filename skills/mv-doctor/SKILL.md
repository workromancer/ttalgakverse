---
name: mv-doctor
description: 메타버스 프로젝트 진단·복구 — 어디까지 만들었는지 확인하고, 오류(빌드 실패, 까만 화면, 멀티플레이 안 됨, 배포 실패 등)를 고친 뒤 다음 단계를 알려 준다. 다른 도구나 혼자 하다가 막혀서 이어서 하려는 사람에게도 사용. "막혔어", "오류 나", "안 돼", "어디까지 했지", "이어서" / "I'm stuck", "something broke", "where was I" 요청에 사용.
---

# 진단·이어하기 (mv-doctor)

## 1) 현재 상태 보기

```bash
node <이 스킬 폴더>/scripts/doctor.mjs <프로젝트 폴더>
```
- 단계별 ✅/⬜ 와 이유, 마지막 줄에 JSON(`next`)이 나온다. 실제 파일 기준으로 `.metaverse/state.json` 을 고쳐 쓴다(`--no-write` 로 끌 수 있음).
- 결과를 사용자에게 그대로 보여 주고 "다음은 ○○" 를 말한다.

## 2) 증상별 처방

| 증상 | 확인 | 처방 |
|---|---|---|
| `npm run dev` 가 안 켜짐 | Node 버전, `node_modules` | `mv-setup`, `npm install` |
| 화면이 까맣거나 하얗다 | 브라우저 콘솔 첫 오류 | JSON 문법(`validate.mjs`), import 경로(`../world/*.json`) |
| 시작하자마자 갇힘 | 시작 좌표 근처 소품 | world.json 소품 옮기기 |
| 포털이 안 됨 | 포털 좌표가 구역 안인지, 대상 id | `validate.mjs` |
| 다른 사람이 안 보임 | doctor 의 multiplayer 줄, `.env` | `mv-multiplayer` 3·4번, dev 서버 재시작 |
| 배포본만 안 됨 | 빌드 시점 `.env`, wrangler 설정 | 다시 build → deploy |
| 동작은 하는데 마음에 안 듦 | doctor 의 📝 줄 | `mv-polish` (구조물이면 「구조물 다듬기」) |
| `wrangler` 인증 오류 | `npx wrangler whoami` | 사용자가 `! npx wrangler login` |
| Supabase 승인 창 만료 | — | 같은 호출 다시, 2분 안에 허용 |

## 3) 다른 데서 만들다 온 프로젝트

- three.js·Vite 기반이 아니면: 지금 것을 고치기보다 `mv-build` 템플릿으로 새로 깔고, 기존 구역·색을 `world/world.json`·`world/concept.json` 으로 옮기는 걸 권한다 (`docs/world-schema.md`, `docs/concept-schema.md`).
- 같은 템플릿인데 상태 파일만 없으면: doctor 가 만들어 준다.
- 손으로 크게 고친 `main.js` 가 있으면 덮어쓰지 말고, 바뀐 점을 PROGRESS.md 에 적어 둔 뒤 필요한 부분만 고친다.

## 끝나면

고친 내용을 PROGRESS.md 에 "문제 → 원인 → 고친 것" 한 줄로 남기고, `next` 단계 스킬로 이어간다. doctor 가 "📝 쌓인 고칠 점" 을 알리면 `mv-polish` 로 먼저 처리한다.
