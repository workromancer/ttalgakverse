---
name: mv-deploy
description: 딸각verse 6단계 — 빌드해서 Cloudflare Workers 정적 자산으로 https://<이름>.<계정>.workers.dev 에 공개한다. 공유 미리보기(OG 태그·파비콘), 원하면 내 도메인 연결까지. "배포", "배포해 줘", "공개", "링크 만들기", "도메인 연결" / "deploy", "publish", "workers.dev", "push to github" 요청에 사용.
---

# 6단계 · 배포 (mv-deploy)

Cloudflare Workers 의 정적 자산(assets) 배포: 서버 코드 없이 `dist/` 를 그대로 올린다. 무료 요금제로 충분하고, 정적 파일 요청은 Workers 요청 수에도 거의 잡히지 않는다.

## 진행

1. **로그인 확인** — `npx wrangler whoami`. 안 돼 있으면 사용자에게 `! npx wrangler login` 실행을 부탁한다 (브라우저에서 Allow). Cloudflare API MCP(`mcp.cloudflare.com/mcp`, 설정은 mv-setup 참고 — 문서: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)가 연결돼 있으면 계정·workers.dev 하위 도메인을 MCP 로 확인하고, 없으면 MCP 로 만들어 둔다.
2. **이름 정하기** — `wrangler.jsonc` 의 `name` 이 주소가 된다: `https://<name>.<계정 하위도메인>.workers.dev`. 기본은 `world.slug`. 영문 소문자·숫자·`-`.
3. **공유 미리보기 채우기** (`index.html` `<head>`):
   - `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`(1200×630), `og:url`, `twitter:card=summary_large_image`, `theme-color`.
   - og 이미지: 컨셉 시안 화면을 1200×630 으로 캡처하거나(브라우저 도구), 세계 이름이 들어간 간단한 카드를 HTML 로 만들어 캡처해 `public/og.png` 로. 파비콘은 `public/favicon.svg` (템플릿에 기본 있음).
4. **빌드·배포** — 바깥에 공개되는 일이므로 한 줄로 확인받고:
   ```bash
   npm run deploy   # = build → dist 비밀 정보 검사 → wrangler deploy
   ```
   출력 마지막의 `https://….workers.dev` 주소를 받는다. 처음이면 workers.dev 하위 도메인 등록 안내가 나올 수 있다 → Cloudflare API MCP 로 만들거나, 대시보드 Workers & Pages 에서 한 번 정하면 끝. 배포 뒤엔 MCP 로 Worker 가 올라갔는지 확인할 수 있다.
5. **확인** — `curl -I <주소>` 200, 브라우저로 열어 첫 화면·포털·(멀티플레이면) 두 기기 동시 접속. 휴대폰으로도 열어 보라고 QR 이나 링크를 준다.
6. **(선택) 내 도메인** — Cloudflare 에 등록된 도메인이 있으면 `wrangler.jsonc` 에
   ```jsonc
   "routes": [{ "pattern": "meta.example.com", "custom_domain": true }]
   ```
   를 넣고 다시 `npx wrangler deploy` (DNS·인증서는 Cloudflare 가 자동). og:url 도 바꾼다.

## (선택) GitHub 에 코드 올리기

- 저장소는 기본 **private**. 공개(public)는 사용자가 원할 때만.
- 올리기 전에 꼭: `node tools/secret-scan.mjs --all` 결과를 보여 주고 ⛔ 가 0 인지 확인 (훅도 막지만 미리 보여 주는 게 친절함).
- `gh repo create <이름> --private --source . --push` (gh 로그인이 안 돼 있으면 사용자에게 `! gh auth login`).
- `.env` 는 `.gitignore` 에 있어 안 올라간다. Supabase anon/publishable 키는 공개용이라 괜찮지만, service_role·secret 키는 절대 코드에 넣지 않는다.

## 끝나면

- `state.deploy = { url, at, custom_domain }`, `steps.deploy.status = "done"`.
- PROGRESS.md 에 주소·배포 시각. 다음에 고친 뒤엔 `npm run deploy` 한 번이면 된다고 안내.
- 축하하고, 다음에 해 볼 만한 것 제안: 구역 추가(mv-worldview), 분위기 바꾸기(mv-concept), 소품·상호작용(mv-build), 방문자 통계(mv-multiplayer 의 002_visits.sql).

## 자주 막히는 곳

- `Authentication error` → `wrangler login` 다시.
- 화면이 빈 페이지 → `wrangler.jsonc` 의 `assets.directory` 가 `./dist` 인지, `npm run build` 를 했는지.
- 멀티플레이가 배포본에서만 안 됨 → `.env` 값은 **빌드할 때** 들어간다. `.env` 를 고쳤으면 다시 build·deploy.
