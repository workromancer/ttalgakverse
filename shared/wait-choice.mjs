#!/usr/bin/env node
// 브라우저 보드에서 사용자가 움직일 때까지 기다렸다가 내용을 출력하고 끝남
//  - 「이걸로 할게요」로 골랐을 때 (choice.json)  → type: "choice"
//  - 인터뷰 질문에 보드에서 답했을 때 (answer.json: 예시 클릭·직접 입력) → type: "answer"
//  node wait-choice.mjs <보드 폴더: worlds | concepts | avatars> [최대 기다릴 분=30]
//  Claude 는 이걸 백그라운드로 돌려 두고, 끝나면 알림을 받아 바로 이어서 진행 (답이면 초안 갱신 + 다음 질문, 고르기면 확정/수정)
//  지금 이후에 생긴 것만 인정 (예전 파일은 무시)
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
const dir = resolve(process.argv[2] || 'worlds'), limit = +(process.argv[3] || 30) * 60e3, t0 = Date.now();
const fresh = (f) => existsSync(f) && statSync(f).mtimeMs > t0;
const timer = setInterval(() => {
  const cf = join(dir, 'choice.json'), af = join(dir, 'answer.json');
  if (fresh(cf)) {
    clearInterval(timer);
    const c = JSON.parse(readFileSync(cf, 'utf8'));
    console.log(`✅ 브라우저에서 골랐어요: ${c.id}${c.note ? `  · 고칠 점: ${c.note}` : ''}`);
    console.log(JSON.stringify({ type: 'choice', ...c }));
    process.exit(0);
  }
  if (fresh(af)) {
    clearInterval(timer);
    const a = JSON.parse(readFileSync(af, 'utf8'));
    console.log(`💬 보드에서 답했어요 (${a.i + 1}번) ${a.q} → ${a.a}`);
    console.log('   → interview.json 에 이미 저장됨. 초안을 고치고 다음 질문(예시 포함)을 쓴 뒤 이 명령을 다시 띄우세요.');
    console.log(JSON.stringify({ type: 'answer', ...a }));
    process.exit(0);
  }
  if (Date.now() - t0 > limit) { clearInterval(timer); console.log('⏰ 아직 보드에서 움직임 없음 (채팅으로 해도 돼요)'); process.exit(2); }
}, 500);
