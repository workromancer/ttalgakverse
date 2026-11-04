#!/usr/bin/env node
// 컨셉 시안 HTML 만들기: node make-concepts.mjs <출력폴더> <concepts.json> [zone.json]
//  concepts.json: [{ id, name, mood, keywords, palette, light, props, avatar }, ...] (보통 3개)
//  zone.json: 미리보기할 구역 (world.json 의 첫 구역 형태). 없으면 템플릿 기본 광장
//  결과: concept-A.html … + index.html (나란히 비교)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const [out, conceptsPath, zonePath] = process.argv.slice(2);
if (!out || !conceptsPath) { console.error('사용법: node make-concepts.mjs <출력폴더> <concepts.json> [zone.json]'); process.exit(1); }
const tpl = readFileSync(fileURLToPath(new URL('../assets/concept-template.html', import.meta.url)), 'utf8');
const concepts = JSON.parse(readFileSync(conceptsPath, 'utf8'));
const zone = zonePath ? readFileSync(zonePath, 'utf8') : null;
mkdirSync(out, { recursive: true });
const swap = (html, id, json) => html.replace(new RegExp(`(<script id="${id}" type="application/json">)[\\s\\S]*?(</script>)`), `$1\n${json}\n$2`);
for (const c of concepts) {
  let html = swap(tpl, 'concept', JSON.stringify(c, null, 2));
  if (zone) html = swap(html, 'zone', zone);
  writeFileSync(join(out, `concept-${c.id}.html`), html);
}
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>컨셉 시안 비교</title>
<style>*{box-sizing:border-box;margin:0}body{font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;background:#0d1014;color:#fff;padding:18px}
h1{font-size:22px}p{opacity:.7;margin:6px 0 16px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:14px}
.c{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#151a20}.c iframe{width:100%;height:480px;border:0;display:block}
.c a{display:block;padding:10px 14px;color:#fff;font-weight:800;text-decoration:none}</style></head><body>
<h1>🌏 메타버스 컨셉 시안</h1><p>마음에 드는 시안을 Claude 에게 "시안 A로 할게" 처럼 알려 주세요. 섞고 싶으면 "A 색에 B 분위기" 도 돼요.</p>
<div class="g">${concepts.map((c) => `<div class="c"><iframe src="concept-${c.id}.html" loading="lazy"></iframe><a href="concept-${c.id}.html" target="_blank">시안 ${c.id} · ${c.name} ↗</a></div>`).join('')}</div></body></html>`);
console.log(`시안 ${concepts.length}개 → ${out}/index.html`);
