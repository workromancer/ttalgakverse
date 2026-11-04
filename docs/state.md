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

# .metaverse/PROGRESS.md

사람이 읽는 일지. 단계마다 한 단락:

```md
## 2026-11-04 · 3단계 컨셉
- 시안 A(파스텔 밤하늘)·B(한낮 정원)·C(네온 야시장) 중 A 선택. 하늘만 조금 더 밝게 조정.
- 남은 일: 도서관 소품 늘리기
```
