---
name: mv-setup
description: 딸각verse 1단계 — 필요한 도구(Node.js, Supabase MCP, Cloudflare 계정/wrangler) 준비 상태를 확인하고 없는 것만 설정을 안내한다. "메타버스 준비", "MCP 설정", "Supabase 연결", "Cloudflare 로그인" 요청이나 metaverse 길잡이가 이 단계로 넘겼을 때 / "setup", "connect supabase", "cloudflare login" 사용.
---

# 1단계 · 준비 (mv-setup)

목표: 이후 단계에서 막히지 않도록 **필요한 것만** 확인하고 설정한다. 이미 된 건 건너뛴다.

## 확인 순서

1. **Node.js 18 이상 / npm** — `node -v`, `npm -v`. 없으면 https://nodejs.org 의 LTS 설치 안내 (macOS 는 `brew install node` 도 가능).
2. **Supabase MCP** (멀티플레이용, 5단계 전까지만 되면 됨)
   - 연결돼 있는지: 이 세션에 `mcp__supabase__*` 도구가 있는지 본다 (`list_organizations` 를 불러 보면 확실).
   - 없으면 안내: Supabase 계정(https://supabase.com, 무료)을 만들고, 프로젝트 폴더의 `.mcp.json` 에 아래를 추가한 뒤 Claude Code 를 다시 시작 → 처음 쓸 때 브라우저로 로그인.
     ```json
     { "mcpServers": { "supabase": { "type": "http", "url": "https://mcp.supabase.com/mcp" } } }
     ```
     특정 프로젝트만 쓰게 하려면 URL 뒤에 `?project_ref=<ref>` 를 붙인다 (권장: 프로젝트를 만든 뒤).
   - 혼자 플레이만 할 거면 건너뛰어도 된다 → `steps.multiplayer.status = "skipped"` 예정임을 알려 둔다.
3. **Cloudflare** (배포용, 6단계 전까지만 되면 됨)
   - 계정: https://dash.cloudflare.com (무료). Workers 정적 자산 배포는 무료 요금제로 충분하고 요청 수도 거의 세지 않는다.
   - 로그인: 사용자에게 `! npx wrangler login` 을 직접 실행하게 한다 (브라우저 로그인이라 대신 못 함). 확인은 `npx wrangler whoami`.
   - 처음 배포할 때 `<계정>.workers.dev` 하위 도메인을 고르라는 안내가 나올 수 있다 → 대시보드 Workers & Pages 에서 한 번 정하면 됨.
   - (선택) Cloudflare MCP 를 쓰고 싶으면 공식 원격 MCP(`https://bindings.mcp.cloudflare.com/sse` 등)를 `.mcp.json` 에 추가할 수 있지만, 이 워크플로우는 wrangler CLI 만으로 충분하다.
4. **(선택) 브라우저 확인 도구** — 결과 화면을 스크린샷으로 확인하려면 Playwright 나 Claude in Chrome 이 있으면 좋다. 없으면 사용자가 직접 열어 보게 한다.

## 끝나면

- `.metaverse/state.json` 의 `steps.setup = { status: "done", at, notes }`, 확인한 버전·로그인 계정(이메일은 적지 말고 "로그인됨"만)을 `notes` 에.
- `.metaverse/PROGRESS.md` 에 "준비 완료: Node xx, Supabase MCP 연결/미연결, wrangler 로그인/미로그인" 한 단락.
- 다음: `mv-worldview` 로 이어간다.

## 자주 막히는 곳

- `.mcp.json` 을 고친 뒤엔 Claude Code 를 다시 시작해야 도구가 보인다.
- 회사 네트워크에서 `wrangler login` 콜백이 막히면 `npx wrangler login --browser=false` 로 나온 URL 을 직접 연다.
- Supabase 무료 프로젝트는 일주일 안 쓰면 일시 정지될 수 있다 → 대시보드에서 Restore.
