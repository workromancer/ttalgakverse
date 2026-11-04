---
name: mv-build
description: 딸각verse 4단계 — 템플릿 엔진(three.js + Vite)을 프로젝트에 깔고 world.json·concept.json 대로 실제 3D 월드를 만들어 로컬에서 실행·확인한다. 새 소품 종류, 구역 모양, 상호작용 추가 같은 커스터마이즈도 이 스킬로. "빌드", "월드 만들어 줘", "실행해 줘", "로컬에서 열어 줘", "소품 추가", "기능 추가" / "build my world", "run it locally", "add a prop" 요청에 사용.
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
world/world.json     세계관·구역 (mv-worldview 가 씀)
world/concept.json   색·빛·분위기 (mv-concept 가 씀)
wrangler.jsonc       배포 설정 (mv-deploy)
tools/secret-scan.mjs  비밀 정보 검사기 (.githooks 의 pre-commit·pre-push, npm run deploy 가 사용)
```
조작: WASD/방향키·Shift 달리기·Space 점프·드래그 시점·휠/핀치 줌·바닥 탭으로 이동·빛나는 포털로 구역 이동. 휴대폰은 조이스틱.

## 진행

1. **복사** — 프로젝트 폴더에 템플릿을 복사하되 이미 있는 `world/`·`.metaverse/`·`concepts/` 는 **덮어쓰지 않는다**.
   ```bash
   rsync -a --ignore-existing <이 스킬 폴더>/template/ ./
   ```
   (world 폴더가 아예 없으면 템플릿 예시 "별빛 정원"이 들어가므로, 2·3단계를 건너뛴 사람에게는 예시로 먼저 보여 주고 나중에 바꾸자고 안내)
2. `package.json` 의 `name`, `wrangler.jsonc` 의 `name` 을 `world.slug` 로 바꾼다.
3. git 저장소가 아니면 `git init` (비밀 정보 검사 훅이 걸리도록). 그다음 `npm install` — `prepare` 스크립트가 `.githooks/`(커밋·push 전 비밀 정보 검사)를 켠다. 확인: `git config core.hooksPath` → `.githooks`.
4. `npm run dev` (기본 http://localhost:5173, 같은 와이파이 휴대폰은 Network 주소).
5. **확인** — 가능하면 브라우저 도구로 첫 화면 스크린샷을 찍어 보여 주고, 포털로 다른 구역에 들어가지는지까지 본다. 콘솔 오류가 있으면 고친다. 도구가 없으면 사용자에게 열어 보라고 하고 체크리스트(구역 이름 보임 / 걸어짐 / 포털 이동 / 휴대폰 조이스틱)를 준다.
6. **다듬기 (요청이 있을 때)** — 자주 하는 것:
   - 새 소품: `src/props.js` 의 `makeProps` 반환 객체에 `이름: (p) => ({ group, solid })` 추가 (THREE 기본 도형 조합 + `solid` 에 부딪힘 영역 `{ r }`·`{ box:[반폭x,반폭z], dx, dz }`). world.json 에서 그 `kind` 를 쓰고, `mv-worldview/reference/validate.mjs` 의 KINDS 에도 추가.
   - **실제 건축물·명소**는 먼저 사진을 찾아본다 (예: 위키백과 요약 API 대표 사진을 받아 Read 로 보기). 누가 봐도 알아볼 특징 3~5개를 적고(실루엣·비율·색·재질·주변 배치) 그대로 맞춘다. 예: 광화문 = 흰 화강암 석축 + 홍예문 3칸 + 2층 우진각 기와지붕 + 검은 현판 금빛 글씨 + 뒤로 북악산. `props.js` 의 `giwa`(기와지붕)·`storey`(기둥+단청)·`stoneMat`·`plaqueTex`·`flow`(흐르는 물) 도우미를 재사용.
   - 다 만들면 브라우저로 여러 각도 스크린샷을 찍어 사진과 비교하고 고친다.
   - 구역 모양: `buildZone` (바닥·벽). 계단·다층은 이 템플릿 범위를 넘으니 "고급 확장"으로 따로 설계.
   - 상호작용: 소품에 `text` 를 두고 가까이 가면 버튼을 띄우는 식 (포털 감지 코드 참고).
   - 배경음·효과음: `public/` 에 파일을 두고 `new Audio()` (첫 터치 뒤에 재생).
   수정 후엔 다시 5번 확인.

## 끝나면

- `steps.build = { status: "done", notes: "로컬 실행 확인, 구역 N개" }`, PROGRESS.md 에 확인한 것과 남은 아이디어.
- 다음: `mv-multiplayer` (혼자 쓸 거면 건너뛰고 `mv-deploy`).

## 자주 막히는 곳

- 화면이 까맣다 → 콘솔에서 JSON 문법 오류(world.json 쉼표)를 먼저 의심. `node <키트>/skills/mv-worldview/reference/validate.mjs world/world.json`.
- 시작하자마자 소품에 끼임 → 엔진이 가까운 빈자리로 밀어내지만, 시작 지점(구역 `spawn`, 기본 0,4)을 비워 두는 게 좋다.
- 휴대폰에서 안 열림 → `npm run dev` 가 `--host` 로 떠 있는지, 같은 와이파이인지.
