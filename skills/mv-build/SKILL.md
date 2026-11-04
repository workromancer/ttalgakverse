---
name: mv-build
description: 딸각verse 4단계 — 템플릿 엔진(three.js + Vite)을 프로젝트에 깔고 world.json·concept.json 대로 실제 3D 월드를 만들어 로컬에서 실행·확인한다. 기본 소품에 없는 건물·캐릭터·구역 연출은 사용자 설명대로 그 프로젝트 전용 코드(src/props·src/avatars·src/scenes)로 새로 짓는다. 새 구조물·캐릭터·연출·상호작용 추가도 이 스킬로. "빌드", "월드 만들어 줘", "실행해 줘", "로컬에서 열어 줘", "소품 추가", "기능 추가" / "build my world", "run it locally", "add a prop" 요청에 사용.
---

# 4단계 · 월드 만들기 (mv-build)

목표: `npm run dev` 로 열면 고른 세계관·컨셉 그대로 걸어 다닐 수 있는 3D 월드.

## 템플릿 (이 스킬 폴더의 `template/`)

```
index.html           HUD(구역 카드·이모트·닉네임)·조이스틱·로딩 화면
src/main.js          엔진: 구역 그리기(바닥 무늬·물·도시 불빛·그림자)·포털·이동·카메라·멀티플레이 연결
src/props.js         소품 라이브러리 30여 종 (골목·자연·서울 랜드마크). 컨셉 보드도 이 파일로 그림
src/character.js     동글동글 아바타 (이모트·액세서리·이름표)
src/net.js           Supabase Realtime 멀티플레이 (설정 없으면 혼자 모드)
src/props/<kind>.js  🧱 이 프로젝트만의 구조물 — Claude 가 새로 짓는 곳 (_example.js 견본)
src/avatars/<id>.js  🧸 이 프로젝트만의 캐릭터 (mv-concept 에서 지은 것)
src/scenes/<name>.js 🌫️ 이 프로젝트만의 구역 연출: 지형·날씨·빛·움직이는 것
world/world.json     세계관·구역 (mv-worldview 가 씀)
world/concept.json   색·빛·분위기 (mv-concept 가 씀)
wrangler.jsonc       배포 설정 (mv-deploy)
tools/secret-scan.mjs  비밀 정보 검사기 (.githooks 의 pre-commit·pre-push, npm run deploy 가 사용)
src/feedback.js      📝 「고칠 점」 버튼 + 🎯 구조물 콕 집기 (dev 서버에서만, vite.config.js 의 mv-feedback 이 저장)
lab.html, src/lab.js 🛠️ 구조물 작업대 — 소품 하나를 네 방향·사람 크기 비교·참고 사진과 함께 (dev 전용)
```
조작: WASD/방향키·Shift 달리기·Space 점프·드래그 시점·휠/핀치 줌·바닥 탭으로 이동·빛나는 포털로 구역 이동. 휴대폰은 조이스틱.

## 진행

1. **복사** — 프로젝트 폴더에 템플릿을 복사하되 이미 있는 `world/`·`.metaverse/`·`concepts/` 는 **덮어쓰지 않는다**.
   ```bash
   rsync -a --ignore-existing <이 스킬 폴더>/template/ ./
   ```
   (world 폴더가 아예 없으면 템플릿 예시 "별빛 정원"이 들어가므로, 2·3단계를 건너뛴 사람에게는 예시로 먼저 보여 주고 나중에 바꾸자고 안내)
2. `package.json` 의 `name`, `wrangler.jsonc` 의 `name` 을 `world.slug` 로 바꾼다.
2-1. **새로 지을 것 짓기** — `world/build.json`(없으면 `validate.mjs` 의 "아직 없는 소품/연출" 경고)에 있는 kind·scene 마다 `src/props/<kind>.js`·`src/scenes/<name>.js` 를 짓는다. 형식·규칙은 키트 `docs/custom-code.md`, 견본은 각 폴더 `_example.js`. 목록에 없는 걸 비슷한 기본 소품으로 때우지 않는다.
   - 설명이 짧으면 짓기 전에 예시로 한 번만 확인: "구름 위 도서관이면 ① 둥근 탑 모양 ② 펼친 책 모양 건물 ③ 책장이 구름 사이에 둥둥 — 어느 쪽?" (모르겠다고 하면 하나 골라 진행).
   - 하나 지을 때마다 🛠️ 작업대 `lab.html?kind=<kind>` 로 네 방향·사람 크기를 보고, 실제 장소면 사진(`&ref=`)과 비교한다. 연출은 월드 화면으로.
   - 기본 소품을 이 세계 분위기에 맞게 바꾸고 싶으면 같은 이름으로 덮어쓴다 (예: `src/props/tree.js` → 모든 나무가 바오밥나무).
3. git 저장소가 아니면 `git init` (비밀 정보 검사 훅이 걸리도록). 그다음 `npm install` — `prepare` 스크립트가 `.githooks/`(커밋·push 전 비밀 정보 검사)를 켠다. 확인: `git config core.hooksPath` → `.githooks`.
4. `npm run dev` (기본 http://localhost:5173, 같은 와이파이 휴대폰은 Network 주소).
5. **확인** — 가능하면 브라우저 도구로 첫 화면 스크린샷을 찍어 보여 주고, 포털로 다른 구역에 들어가지는지까지 본다. 콘솔 오류가 있으면 고친다. 도구가 없으면 사용자에게 열어 보라고 하고 체크리스트(구역 이름 보임 / 걸어짐 / 포털 이동 / 휴대폰 조이스틱)를 준다.
6. **다듬기 (요청이 있을 때)** — 자주 하는 것:
   - 새 구조물·소품: `src/props/<kind>.js` 파일 하나 (`export default (p, kit) => ({ group, solid })`, 부딪힘 `{ r }`·`{ box:[반폭x,반폭z], dx, dz }`). 엔진이 자동으로 불러오고 validate 도 인정한다. `src/props.js`(템플릿 기본 라이브러리)는 건드리지 않는다.
   - 새 캐릭터: `src/avatars/<id>.js` + concept.json `avatar.style` (자세한 건 mv-concept 4번).
   - 지형·날씨·빛·움직이는 것: `src/scenes/<name>.js` + 구역 `"scene"`.
   - **실제 건축물·명소**는 먼저 사진을 찾아본다 (예: 위키백과 요약 API 대표 사진을 받아 Read 로 보기). 누가 봐도 알아볼 특징 3~5개를 적고(실루엣·비율·색·재질·주변 배치) 그대로 맞춘다. 예: 광화문 = 흰 화강암 석축 + 홍예문 3칸 + 2층 우진각 기와지붕 + 검은 현판 금빛 글씨 + 뒤로 북악산. `props.js` 의 `giwa`(기와지붕)·`storey`(기둥+단청)·`stoneMat`·`plaqueTex`·`flow`(흐르는 물) 도우미를 재사용.
   - 다 만들면 🛠️ 작업대(`/lab.html?kind=<새 kind>&ref=/ref/<사진>.jpg`)로 네 방향·사람 크기를 사진과 한 화면에서 비교하고 고친다. (자세한 반복 절차는 `mv-polish` 의 「구조물 다듬기」)
   - 구역 모양: 언덕·물가·계단식 지형은 scene 으로 지형 메시를 얹고 `solid` 로 막는다. 여러 층을 오르내리는 실내처럼 이동 규칙이 바뀌는 건 `src/main.js` 를 직접 고친다 (PROGRESS.md 에 기록). "템플릿 범위 밖이라 안 돼요" 로 끝내지 않는다.
   - 상호작용: 소품에 `text` 를 두고 가까이 가면 버튼을 띄우는 식 (포털 감지 코드 참고).
   - 배경음·효과음: `public/` 에 파일을 두고 `new Audio()` (첫 터치 뒤에 재생).
   수정 후엔 다시 5번 확인.

## 끝나면

- `steps.build = { status: "done", notes: "로컬 실행 확인, 구역 N개" }`, PROGRESS.md 에 확인한 것과 남은 아이디어.
- **바로 `mv-polish` 1라운드로 넘어간다** — 처음 걸어 본 순간이 "어? 이건 좀…" 이 가장 잘 나오는 때다. 스크린샷과 함께 내가 찾은 아쉬운 점 보기를 내밀고 묻는다 (특히 구조물). 📝 버튼과 🎯 콕 집기를 이때 소개하고 `wait-feedback.mjs` 를 백그라운드로 띄운다. 사용자가 "다음으로" 를 원하면 건너뛴다.
- 그다음: `mv-multiplayer` (혼자 쓸 거면 건너뛰고 `mv-deploy`).

## 자주 막히는 곳

- 화면이 까맣다 → 콘솔에서 JSON 문법 오류(world.json 쉼표)를 먼저 의심. `node <키트>/skills/mv-worldview/reference/validate.mjs world/world.json`.
- 시작하자마자 소품에 끼임 → 엔진이 가까운 빈자리로 밀어내지만, 시작 지점(구역 `spawn`, 기본 0,4)을 비워 두는 게 좋다.
- 휴대폰에서 안 열림 → `npm run dev` 가 `--host` 로 떠 있는지, 같은 와이파이인지.
