#!/usr/bin/env node
// Claude Code PreToolUse 훅: git commit / git push / 저장소 만들기 / 배포 명령 직전에 항상 비밀 정보 검사
//  막아야 할 것이 있으면 exit 2 → 명령이 실행되지 않고, 이유가 Claude 에게 전달돼 사용자에게 경고·처리함
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
let input = '';
for await (const c of process.stdin) input += c;
let cmd = '', cwd = process.cwd();
try { const j = JSON.parse(input); cmd = j.tool_input?.command || ''; cwd = j.cwd || cwd; } catch { process.exit(0); }
const scan = fileURLToPath(new URL('./secret-scan.mjs', import.meta.url));
const run = (mode) => { try { execSync(`node "${scan}" ${mode} "${cwd}"`, { stdio: ['ignore', 'pipe', 'pipe'] }); return null; } catch (e) { return (e.stderr || e.stdout || '').toString(); } };
const inRepo = existsSync(join(cwd, '.git')) || (() => { try { execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' }); return true; } catch { return false; } })();
let out = null, what = '';
if (inRepo && /\bgit\s+commit\b/.test(cmd)) { what = '커밋'; out = run('--staged'); if (!out && /\s-a\b|--all\b|-am\b/.test(cmd)) out = run('--all'); }
else if (inRepo && /\bgit\s+push\b|\bgh\s+repo\s+create\b|\bgh\s+pr\s+create\b/.test(cmd)) { what = 'GitHub 에 올리기'; out = run('--all'); }
else if (/\bwrangler\s+(deploy|pages\s+deploy)\b|\bnpm\s+run\s+deploy\b/.test(cmd) && existsSync(join(cwd, 'dist'))) { what = '배포'; out = run('--dir dist'); }
if (!out || !/⛔/.test(out)) process.exit(0);
process.stderr.write(`🔐 딸각verse 비밀 정보 검사가 ${what}을(를) 멈췄어요.\n${out}\n→ 사용자에게 위 항목을 보여 주고, 파일은 --fix 로 빼거나 값을 .env 로 옮긴 뒤 다시 시도하세요. 사용자가 공개해도 되는 값이라고 확인하면 그 줄에 'secret-scan: allow' 를 달거나 .secretscanignore 에 추가하세요.\n`);
process.exit(2);
