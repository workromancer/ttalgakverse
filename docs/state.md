# .metaverse/state.json

```jsonc
{
  "version": 1,
  "project": { "name": "별빛 정원", "slug": "starlight" },
  "steps": {
    "setup":       { "status": "done", "at": "2026-11-04T10:00:00Z", "notes": "node 22, supabase mcp ok, wrangler 로그인" },
    "worldview":   { "status": "done" },
    "concept":     { "status": "in_progress" },
    "build":       { "status": "todo" },
    "multiplayer": { "status": "todo" },      // 혼자 플레이면 "skipped"
    "deploy":      { "status": "todo" }
  },
  "choices": { "worldview": "판타지 정원 마을, 구역 3개", "concept": "A · 파스텔 밤하늘" },
  "supabase": { "project_ref": "", "region": "ap-northeast-2" },
  "deploy": { "url": "", "at": "", "custom_domain": "" },
  "next": "mv-concept"   // doctor 가 채움
}
```

- `status`: `todo` → `in_progress` → `done` (또는 `skipped`)
- doctor 가 실행될 때마다 `checked`, `detail`, `next` 를 덮어쓴다.
- 비밀값(키·토큰·이메일)은 넣지 않는다.

# .metaverse/polish.json (mv-polish 다듬기 루프)

```jsonc
{
  "keep": ["광화문 앞 바닥분수", "노을 하늘색"],     // 사용자가 마음에 든다고 한 것 — 다음 라운드에서 건드리지 않음
  "rounds": [{
    "n": 1, "at": "2026-11-04",
    "asked": ["광화문 지붕 납작", "한강 앞 휑함"],      // Claude 가 먼저 짚어 보기로 낸 것
    "feedback": [{ "text": "지붕이 너무 납작해요", "from": "button",   // chat | button
                   "prop": "plaza#2 gate", "fix": "giwa 높이 1.1→1.6", "files": ["src/props.js"] }],
    "commit": "abc1234",
    "verdict": "더 고칠래요"                            // 만족 이면 루프 끝
  }]
}
```

`.metaverse/feedback/inbox.jsonl` — 월드 안 📝 버튼이 쓰는 받은편지함 (한 줄 = 하나: text, zone, pos, cam, prop, shot). `.seen` 에 처리한 줄 수.

# .metaverse/PROGRESS.md

사람이 읽는 일지. 단계마다 한 단락:

```md
## 2026-11-04 · 3단계 컨셉
- 시안 A(파스텔 밤하늘)·B(한낮 정원)·C(네온 야시장) 중 A 선택. 하늘만 조금 더 밝게 조정.
- 남은 일: 도서관 소품 늘리기
```
