# 워크플로우 설계

## 한눈에

```mermaid
flowchart LR
  start([metaverse<br/>길잡이]) --> doc{mv-doctor<br/>상태 진단}
  doc -->|처음| S1[1 mv-setup<br/>Node·Supabase MCP·wrangler]
  S1 --> S2[2 mv-worldview<br/>인터뷰 → 라이브 세계관 초안<br/>world/world.json]
  S2 --> S3[3 mv-concept<br/>인터뷰 → 라이브 3D 시안 3개<br/>world/concept.json]
  S3 --> S4[4 mv-build<br/>템플릿 엔진·로컬 실행]
  S4 --> S5[5 mv-multiplayer<br/>Supabase Realtime<br/>.env]
  S5 --> S6[6 mv-deploy<br/>workers.dev 공개]
  S4 -. 혼자 플레이 .-> S6
  doc -->|이어서| S2 & S3 & S4 & S5 & S6
  S6 -. 고치고 싶을 때 .-> S2 & S3 & S4
  S4 -. 처음 걸어 보자마자 .-> PL[🔁 mv-polish<br/>먼저 짚어 묻기 → 고치기<br/>→ 전후 비교 → 또 묻기]
  S6 -. 배포본 보고 .-> PL
  PL -. 만족할 때까지 .-> PL
```

## 설계 원칙

1. **단계마다 결과물이 파일 하나로 남는다** — 세계관은 `world/world.json`, 분위기는 `world/concept.json`. 엔진 코드는 이 두 파일만 읽으므로, 단계를 다시 해도 앞뒤가 깨지지 않는다.
2. **상태는 두 곳에** — 기계용 `.metaverse/state.json`, 사람용 `.metaverse/PROGRESS.md`. 다른 사람·다른 AI 세션이 이것만 보고 이어간다.
3. **진단은 실제 파일 기준** — `mv-doctor` 가 상태 파일을 믿지 않고 파일·설정·네트워크를 직접 확인해 상태를 고쳐 쓴다. 그래서 손으로 만들다 온 프로젝트도 이어갈 수 있다.
4. **인터뷰하며 라이브로 보고 고른다** — 세계관·분위기 모두 고정 예시가 아니라 사용자 답으로 즉석에서 초안을 만든다. `shared/live-preview.mjs` 가 띄운 화면(`/worlds/`, `/concepts/`)이 답할 때마다 저절로 바뀐다. 시안은 엔진과 같은 소품·색 규칙으로 그려서 "고른 게 그대로 나온다".
5. **서버 없음, 비용 0 에서 시작** — 정적 배포(Cloudflare Workers assets) + Supabase 무료. 키는 공개용(publishable)만 브라우저에.
6. **외부에 영향 주는 일은 확인 후** — DB 변경, 배포, 도메인 연결은 한 줄 확인을 받는다.
7. **만들고 끝이 아니라 묻고 다듬는다** — 빌드·배포 직후 `mv-polish` 가 Claude 가 찾은 약점을 구체적 보기로 내밀어 "마음에 안 드는 것"을 끌어낸다. 막연한 "어때요?" 는 쓰지 않고, 매 라운드 전후 비교와 다음 제안으로 끝낸다. 월드 안 📝/🎯 버튼과 구조물 작업대가 말로 설명하기 어려운 불만(특히 구조물)을 정확한 대상·크기·화면으로 바꿔 준다.
8. **기술 스택만 고정, 모양은 새로 짓는다** — 엔진·데이터 형식·멀티플레이·배포는 그대로, 캐릭터·건물·구역 연출은 사용자 말대로 그 프로젝트 전용 코드(`src/avatars/`·`src/props/`·`src/scenes/`)로 짓는다. 템플릿의 토끼·서울 랜드마크는 메뉴가 아니라 예시 (`docs/custom-code.md`).

## 단계별 입출력

| 단계 | 읽는 것 | 쓰는 것 | 완료 판정 (doctor) |
|---|---|---|---|
| setup | — | state.steps.setup | Node ≥18, npm |
| worldview | 사용자 답 | world/world.json | slug·zones 있음 |
| concept | world.json | concepts/*.html, world/concept.json | concept.json 에 palette |
| build | world/*.json | src/, package.json, node_modules | 템플릿 + 설치 |
| multiplayer | — | .env, Supabase 함수 | server_time RPC 응답 |
| deploy | dist | state.deploy.url | URL 이 200 |
| polish (루프) | 스크린샷, `.metaverse/feedback/inbox.jsonl` | world/*.json, src/props.js, `.metaverse/polish.json`, 라운드별 커밋 | 마지막 라운드 verdict "만족" |

## 🔐 비밀 정보 검사가 걸리는 곳

```mermaid
flowchart LR
  C[Claude 의 Bash 명령] -->|git commit| H{PreToolUse 훅<br/>secret-guard}
  C -->|git push / gh repo create| H
  C -->|wrangler deploy / npm run deploy| H
  H -->|⛔ 있음| B[명령 멈춤 → 사용자에게 경고<br/>--fix 로 거르기 · .env 로 옮기기]
  H -->|문제 없음| OK[그대로 실행]
  U[사람이 직접 git] --> G[.githooks pre-commit · pre-push]
  G --> S[(shared/secret-scan.mjs)]
  H --> S
  D[npm run deploy] -->|dist 검사| S
```
