#!/usr/bin/env node
// 브라우저 보드에서 사용자가 "이걸로 할게요" 를 누를 때까지 기다렸다가 고른 내용을 출력하고 끝남
//  node wait-choice.mjs <보드 폴더: worlds | concepts> [최대 기다릴 분=30]
//  Claude 는 이걸 백그라운드로 돌려 두고, 끝나면(=사용자가 골랐으면) 알림을 받아 바로 이어서 진행
//  지금 이후에 고른 것만 인정 (예전 choice.json 은 무시)
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
const dir = resolve(process.argv[2] || 'worlds'), f = join(dir, 'choice.json'), limit = +(process.argv[3] || 30) * 60e3, t0 = Date.now();
const timer = setInterval(() => {
  if (existsSync(f) && statSync(f).mtimeMs > t0) {
    clearInterval(timer);
    const c = JSON.parse(readFileSync(f, 'utf8'));
    console.log(`✅ 브라우저에서 골랐어요: ${c.id}${c.note ? `  · 고칠 점: ${c.note}` : ''}`);
    console.log(JSON.stringify(c));
    process.exit(0);
  }
  if (Date.now() - t0 > limit) { clearInterval(timer); console.log('⏰ 아직 안 골랐어요 (채팅으로 골라도 돼요)'); process.exit(2); }
}, 500);
