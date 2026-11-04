---
name: mv-setup
description: 딸각verse 1단계 — 필요한 도구(Node.js, Supabase MCP, Cloudflare API MCP·wrangler) 준비 상태를 확인하고 없는 것만 설정을 안내한다. "메타버스 준비", "MCP 설정", "Supabase 연결", "Cloudflare 로그인" 요청이나 metaverse 길잡이가 이 단계로 넘겼을 때 / "setup", "connect supabase", "cloudflare login" 사용.
---

# 1단계 · 준비 (mv-setup)

목표: 이후 단계에서 막히지 않도록 **필요한 것만** 확인하고 설정한다. 이미 된 건 건너뛴다.

## 확인 순서

1. **Node.js 18 이상 / npm** — `node -v`, `npm -v`. 없으면 https://nodejs.org 의 LTS 설치 안내 (macOS 는 `brew install node` 도 가능).
2. **Supabase MCP** (멀티플레이용, 5단계 전까지만 되면 됨)
   - 📘 **공식 문서를 먼저 확인해서 그대로 따른다**: https://supabase.com/docs/guides/ai-tools/mcp (서버 주소·옵션·인증 방법이 바뀔 수 있음. 아래는 2026-11 기준 요약)
   - 연결돼 있는지: 이 세션에 `mcp__supabase__*` 도구가 있는지 본다 (`list_organizations` 를 불러 보면 확실).
   - 없으면 (개발자가 아니어도 따라 할 수 있게 한 단계씩):
     1. Supabase 계정 만들기 — https://supabase.com 에서 **Start your project** → GitHub 또는 이메일로 가입 (무료).
     2. Claude 가 프로젝트 폴더에 연결 설정을 넣는다:
        `claude mcp add --scope project --transport http supabase https://mcp.supabase.com/mcp`
        (→ `.mcp.json` 에 저장됨. 개인 토큰(PAT)은 만들 필요 없음 — OAuth 로그인)
        ⚠️ `read_only=true` 나 `features=` 로 범위를 좁히지 않는다 — Claude 가 프로젝트 만들기·DB 함수 적용·키 발급까지 대신 해야 하므로 쓰기 권한이 필요하다. `project_ref` 도 처음엔 붙이지 않는다 (프로젝트를 새로 만들어야 하니까).
     3. 사용자에게: Claude Code 를 껐다 켜고 `/mcp` 입력 → **supabase** 선택 → **Authenticate** → 브라우저가 열리면 조직(Organization)을 고르고 **Authorize Claude Code** 클릭 → "Authentication successful" 이 보이면 끝.
     4. 확인: `list_organizations` 가 결과를 돌려주면 성공.
   - 혼자 플레이만 할 거면 건너뛰어도 된다 → `steps.multiplayer.status = "skipped"` 예정임을 알려 둔다.
3. **Cloudflare** (배포용, 6단계 전까지만 되면 됨) — **Cloudflare API MCP + wrangler 로그인** 두 가지, 둘 다 브라우저에서 버튼만 누르면 됨
   - 📘 **공식 문서를 먼저 확인해서 그대로 따른다**: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/ (2026-11 기준: `https://mcp.cloudflare.com/mcp` 하나로 Cloudflare API 전체 + 문서 검색, OAuth 로 권한 선택)
   1. Cloudflare 계정 만들기 — https://dash.cloudflare.com/sign-up (무료, 이메일 인증).
   2. **Cloudflare API MCP 연결** (계정 확인·workers.dev 주소 만들기·배포 확인·도메인 연결을 Claude 가 대신 함):
      `claude mcp add --scope project --transport http cloudflare-api https://mcp.cloudflare.com/mcp`
      → 사용자에게: Claude Code 재시작 → `/mcp` → **cloudflare-api** → **Authenticate** → 브라우저에서 Base scopes 는 **Full access** 를 고르고 **Continue** → 계정 확인 화면에서 **Authorize**.
      ⚠️ Minimal·Read only 를 고르면 Claude 가 workers.dev 주소 만들기·도메인 연결 같은 변경을 못 해서 중간에 막힌다. 권한은 언제든 Cloudflare 대시보드 My Profile → Access Management → Connected Applications 에서 끊을 수 있다고 안내한다.
      확인: MCP 의 `search`/`execute` 로 계정과 workers.dev 하위 도메인을 읽어 본다. 하위 도메인이 없으면 이때 MCP 로 만들어 둔다 (대시보드를 헤맬 필요 없음).
   3. **wrangler 로그인** (사이트 파일 업로드 담당 — MCP 로 파일 수백 개를 올리는 건 비효율적이라 배포는 wrangler 가 함):
      사용자에게 `! npx wrangler login` 을 직접 실행하게 한다 → 브라우저에서 **Authorize** → 터미널에 "Successfully logged in". 확인은 `npx wrangler whoami`.
   - API 토큰을 직접 만들어 붙여 넣는 방식은 쓰지 않는다 (비밀 정보 노출 위험). 둘 다 OAuth 로그인.
4. **(선택) 브라우저 확인 도구** — 결과 화면을 스크린샷으로 확인하려면 Playwright 나 Claude in Chrome 이 있으면 좋다. 없으면 사용자가 직접 열어 보게 한다.

## 끝나면

- `.metaverse/state.json` 의 `steps.setup = { status: "done", at, notes }`, 확인한 버전·로그인 계정(이메일은 적지 말고 "로그인됨"만)을 `notes` 에.
- `.metaverse/PROGRESS.md` 에 "준비 완료: Node xx, Supabase MCP 연결/미연결, wrangler 로그인/미로그인" 한 단락.
- 다음: `mv-worldview` 로 이어간다.

## 자주 막히는 곳

- `.mcp.json` 을 고친 뒤엔 Claude Code 를 다시 시작해야 도구가 보인다.
- 설정 방법이 문서와 다르면 **위 공식 문서가 우선**이다 (서버 주소·옵션이 바뀌었을 수 있음).
- 회사 네트워크에서 `wrangler login` 콜백이 막히면 `npx wrangler login --browser=false` 로 나온 URL 을 직접 연다.
- Supabase 무료 프로젝트는 일주일 안 쓰면 일시 정지될 수 있다 → 대시보드에서 Restore.
