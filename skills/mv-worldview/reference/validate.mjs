#!/usr/bin/env node
// world.json 검사: node validate.mjs world/world.json
import { readFileSync } from 'node:fs';
const w = JSON.parse(readFileSync(process.argv[2] || 'world/world.json', 'utf8'));
const errs = [], warns = [];
const KINDS = ['tree', 'bench', 'lamp', 'sign', 'box', 'rock', 'flowers', 'fountain', 'kiosk', 'shop', 'shelf', 'books', 'table', 'lantern', 'planter', 'crate', 'cat', 'stage', 'chair', 'rug', 'stringlights', 'cherry', 'pine', 'hanok', 'gate', 'statue', 'tower', 'bridge', 'dome', 'swanboat', 'mat', 'store', 'flag', 'sevit', 'jets', 'mountain'];
if (!/^[a-z0-9-]{2,40}$/.test(w.slug || '')) errs.push('slug 는 영문 소문자·숫자·- 2~40자');
if (!w.title) errs.push('title 이 없어요');
const ids = new Set();
for (const z of w.zones || []) {
  if (ids.has(z.id)) errs.push(`구역 id 중복: ${z.id}`); ids.add(z.id);
  const [W, D] = z.size || [40, 40];
  const inside = (x, zz, m = 0.5) => Math.abs(x) <= W / 2 - m && Math.abs(zz) <= D / 2 - m;
  for (const p of z.props || []) {
    if (!KINDS.includes(p.kind)) warns.push(`${z.id}: 템플릿에 없는 소품 '${p.kind}' → box 로 그려져요 (mv-build 에서 추가 가능)`);
    if (!p.bg && !['tower', 'bridge', 'mountain', 'hanok'].includes(p.kind) && !inside(p.x, p.z)) errs.push(`${z.id}: 소품 ${p.kind} (${p.x}, ${p.z}) 가 구역 밖`);
    if (Math.hypot(p.x - (z.spawn?.[0] ?? 0), p.z - (z.spawn?.[1] ?? 4)) < 1.5) warns.push(`${z.id}: 시작 지점 근처에 ${p.kind} — 처음 위치가 밀려날 수 있어요`);
  }
  for (const pt of z.portals || []) {
    if (!inside(pt.x, pt.z, -0.01)) errs.push(`${z.id}: 포털 → ${pt.to} (${pt.x}, ${pt.z}) 가 구역 밖`);
    const to = (w.zones || []).find((x) => x.id === pt.to);
    if (!to) errs.push(`${z.id}: 포털 대상 '${pt.to}' 구역이 없어요`);
    else if (!(to.portals || []).some((b) => b.to === z.id)) warns.push(`${z.id} → ${pt.to} 는 있는데 돌아오는 포털이 없어요`);
  }
}
if (!ids.has(w.spawn)) errs.push(`spawn '${w.spawn}' 구역이 없어요`);
for (const e of errs) console.log('❌', e);
for (const e of warns) console.log('⚠️ ', e);
console.log(errs.length ? `문제 ${errs.length}개` : `✅ 통과 (구역 ${ids.size}개${warns.length ? `, 확인할 점 ${warns.length}개` : ''})`);
process.exit(errs.length ? 1 : 0);
