---
name: mv-multiplayer
description: 딸각verse 5단계 — 서버 없이 Supabase Realtime(Presence·Broadcast)으로 같은 구역에 있는 사람끼리 서로 보이게 한다. Supabase MCP 로 프로젝트 생성(지역 선택)·DB 함수 적용·키 발급까지 하고 .env 를 채운다. "멀티플레이", "같이 놀기", "다른 사람 보이게", "Supabase 연결" / "multiplayer", "let friends join", "supabase realtime" 요청에 사용.
---

# 5단계 · 멀티플레이 (mv-multiplayer)

구조 (서버 코드 없음):
- **Realtime 채널 = 구역 하나**: 같은 구역 사람끼리만 위치·방향·이모트를 주고받음 (움직일 때 초당 3~8번, 가만히 있으면 8초마다 한 번).
- **Presence**: 지금 구역에 몇 명 있는지.
- **server_time()**: 모두 같은 시계를 쓰도록 DB 시각 (열차 시간표처럼 시간에 따라 움직이는 걸 만들 때 필요).
- 아바타 정보(이름·색)는 브라우저 localStorage, DB 에 개인정보 저장 없음.

## 진행

1. **Supabase MCP 확인** — `mcp__supabase__list_organizations` 가 되면 OK. 안 되면 `mv-setup` 의 안내로 돌아간다.
2. **프로젝트 정하기**
   - 기존 프로젝트를 쓸지, 새로 만들지 묻는다. 새로 만들면:
     - 지역: 사용자가 주로 있는 곳과 가까운 곳 (한국이면 `ap-northeast-2` 서울). **지역은 나중에 못 바꾼다**고 한 줄 알려 준다.
     - `get_cost` → `confirm_cost` → `create_project` (무료 요금제면 비용 0, 계정당 무료 프로젝트 2개 제한 안내).
   - 만들어지는 데 1~2분 걸린다 → `get_project` 로 `ACTIVE_HEALTHY` 될 때까지 기다린다.
3. **DB 함수 적용** — `apply_migration` 으로 이 스킬 폴더의 `sql/001_server_time.sql` (필수). 방문자 통계가 필요하면 `sql/002_visits.sql` 도 (선택). 사용자 승인 창이 뜨면 "허용"을 누르라고 미리 알려 준다 (2분 안에 안 누르면 만료 → 다시 시도).
4. **키** — `get_project_url`, `get_publishable_keys` (publishable 또는 anon 키. **service_role 키는 절대 쓰지 않는다**) → 프로젝트의 `.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_KEY=<publishable/anon 키>
   VITE_APP_SLUG=<world.slug>
   ```
   이 키는 브라우저에 공개되는 용도라 괜찮지만, `.env` 는 이미 `.gitignore` 에 있다.
5. **확인** — `npm run dev` 를 다시 켜고(환경변수는 재시작해야 반영), 브라우저 창 두 개로 같은 구역에 들어가 서로 보이는지·이모트가 보이는지. 가능하면 브라우저 도구로 두 탭을 띄워 확인한다. `node <키트>/skills/mv-doctor/scripts/doctor.mjs` 의 multiplayer 줄이 ✅ 인지.
6. **보안 점검** — `get_advisors` (security) 를 돌려 경고가 있으면 설명하고 고친다.

## 끝나면

- `state.supabase = { project_ref, region }`, `steps.multiplayer.status = "done"`.
- PROGRESS.md 에 프로젝트 ref·지역·적용한 SQL.
- 다음: `mv-deploy`. 배포 후엔 Supabase 대시보드 Authentication → URL Configuration 은 건드릴 필요 없음 (로그인 안 씀).

## 비용·한도 (무료 요금제 기준, 2026년 기준 대략)

- Realtime 동시 접속 200명·메시지 월 200만 건 안팎. 작은 커뮤니티엔 충분하고, 늘면 Pro 로.
- 메시지를 아끼려고 템플릿은 "바뀌었을 때만" 보낸다. 사람이 아주 많아지면 `net.js` 의 전송 간격을 늘린다.

## 혼자 플레이만 할 거면

이 단계를 `skipped` 로 두고 넘어가도 된다. `.env` 가 비어 있으면 엔진이 자동으로 혼자 모드로 동작한다.
