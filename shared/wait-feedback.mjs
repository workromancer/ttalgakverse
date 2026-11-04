#!/usr/bin/env node
// 월드 안 📝 버튼으로 남긴 「고칠 점」을 기다렸다가 출력하고 끝남 (mv-polish 가 백그라운드로 돌려 둠)
//  node wait-feedback.mjs [프로젝트 폴더=.] [최대 기다릴 분=30] [--now]
//  - 아직 처리 안 한 피드백이 이미 있으면 바로 출력하고 끝남 (Claude 가 바빴던 사이 들어온 것도 안 놓침)
//  - 없으면 새로 들어올 때까지 기다림. 첫 피드백이 오면 3초 더 기다려 연달아 보낸 것까지 한꺼번에
//  - --now: 기다리지 않고 지금 쌓인 것만 확인 (없으면 종료 코드 1)
//  어디까지 읽었는지는 .metaverse/feedback/.seen (줄 수) 에 남김
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2), now = args.includes('--now'), pos = args.filter((a) => !a.startsWith('--'));
const dir = resolve(pos[0] || '.'), limit = +(pos[1] || 30) * 60e3, t0 = Date.now();
const inbox = join(dir, '.metaverse/feedback/inbox.jsonl'), seenF = join(dir, '.metaverse/feedback/.seen');
const lines = () => (existsSync(inbox) ? readFileSync(inbox, 'utf8').split('\n').filter(Boolean) : []);
const seen = () => (existsSync(seenF) ? +readFileSync(seenF, 'utf8') || 0 : 0);

function flush() {
  const all = lines(), fresh = all.slice(seen()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  writeFileSync(seenF, String(all.length));
  console.log(`📝 월드에서 고칠 점 ${fresh.length}개가 왔어요`);
  for (const f of fresh) {
    const where = f.prop ? `🎯 ${f.prop.text || f.prop.kind} — world.json 구역 "${f.prop.zone}" 의 props[${f.prop.index}] (${f.prop.kind}, 크기 ${f.prop.size?.join('×')}m)` : `${f.zone?.name || f.zone?.id || '?'} (${f.pos?.x}, ${f.pos?.z})`;
    console.log(`- [${where}] ${f.text}${f.shot ? `  · 화면: ${f.shot}` : ''}`);
  }
  console.log(JSON.stringify(fresh));
  process.exit(0);
}

if (lines().length > seen()) flush();
if (now) { console.log('📭 쌓인 고칠 점 없음'); process.exit(1); }
let firstAt = 0;
setInterval(() => {
  if (lines().length > seen()) { firstAt ||= Date.now(); if (Date.now() - firstAt > 3000) flush(); }
  else if (Date.now() - t0 > limit) { console.log('⏰ 아직 📝 피드백 없음 (채팅으로 말해도 돼요)'); process.exit(2); }
}, 500);
