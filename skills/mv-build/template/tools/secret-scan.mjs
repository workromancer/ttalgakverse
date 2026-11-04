#!/usr/bin/env node
// 🔐 비밀 정보 검사기 — GitHub 에 올리면 안 되는 것(키·토큰·.env·개인키)을 찾아 경고하고 걸러 냄
//
//  node secret-scan.mjs [--staged | --all | --dir <폴더>] [--fix] [--json] [프로젝트 폴더]
//    --staged  커밋하려고 올려 둔(staged) 파일만 (기본, git pre-commit 용)
//    --all     git 이 추적하는 파일 + 아직 추적 안 하는 파일(.gitignore 제외) 전부 (push·저장소 만들기 전)
//    --dir     폴더 안 모든 파일 (배포 전 dist/ 검사용)
//    --fix     위험한 파일을 staged 에서 빼고 .gitignore 에 추가 (내용 속 키는 직접 지워야 해서 위치만 알려 줌)
//  종료 코드: 0 = 문제 없음, 1 = 막아야 할 것 있음(high)
//  예외: 줄 끝에 `secret-scan: allow` 주석, 또는 프로젝트의 .secretscanignore 에 경로(글롭 *) 한 줄씩
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null;
const root = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--dir')[0] || process.cwd();
const mode = flag('--all') ? 'all' : dirArg ? 'dir' : 'staged';
const sh = (c) => { try { return execSync(c, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString(); } catch { return ''; } };

// ---- 위험한 파일 이름 ----
const BAD_FILES = [
  [/(^|\/)\.env(\.[\w.-]+)?$/, '환경변수 파일 (.env)', (p) => !/\.env\.(example|sample|template)$/.test(p)],
  [/(^|\/)\.dev\.vars$/, 'Cloudflare 로컬 비밀값 (.dev.vars)'],
  [/\.(pem|key|p12|pfx|keystore|jks)$/i, '인증서·개인키 파일'],
  [/(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/, 'SSH 키'],
  [/(^|\/)(service[-_]?account|credentials?)[\w-]*\.json$/i, '서비스 계정 키 JSON'],
  [/(^|\/)\.(wrangler|supabase\/\.temp)\//, '도구 임시 폴더 (토큰이 들어 있을 수 있음)'],
  [/(^|\/)\.npmrc$/, 'npm 설정 (토큰이 들어 있을 수 있음)', (p, txt) => /_authToken/.test(txt || '')],
];
// ---- 내용 속 비밀값 ----
const jwtRole = (tok) => { try { return JSON.parse(Buffer.from(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()).role; } catch { return null; } };
const RULES = [
  { id: 'private-key', sev: 'high', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, why: '개인키' },
  { id: 'supabase-service-role', sev: 'high', re: /eyJ[\w-]{10,}\.eyJ[\w-]{20,}\.[\w-]{20,}/g, why: 'Supabase service_role 키 (DB 전체 권한)', test: (m) => jwtRole(m) === 'service_role' },
  { id: 'supabase-anon', sev: 'info', re: /eyJ[\w-]{10,}\.eyJ[\w-]{20,}\.[\w-]{20,}/g, why: 'Supabase anon 키 (브라우저 공개용이라 괜찮음)', test: (m) => jwtRole(m) === 'anon' },
  { id: 'supabase-secret', sev: 'high', re: /\bsb_secret_[\w-]{20,}/g, why: 'Supabase secret 키' },
  { id: 'supabase-access-token', sev: 'high', re: /\bsbp_[a-f0-9]{40}\b/g, why: 'Supabase 개인 액세스 토큰' },
  { id: 'anthropic', sev: 'high', re: /\bsk-ant-[\w-]{20,}/g, why: 'Anthropic API 키' },
  { id: 'openai', sev: 'high', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/g, why: 'OpenAI 계열 API 키' },
  { id: 'github', sev: 'high', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/g, why: 'GitHub 토큰' },
  { id: 'aws', sev: 'high', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, why: 'AWS 액세스 키' },
  { id: 'slack', sev: 'high', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/g, why: 'Slack 토큰' },
  { id: 'telegram-bot', sev: 'high', re: /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/g, why: '텔레그램 봇 토큰' },
  { id: 'stripe', sev: 'high', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/g, why: 'Stripe 비밀 키' },
  { id: 'cloudflare-token', sev: 'high', re: /\b(?:CLOUDFLARE|CF)_API_(?:TOKEN|KEY)\s*[=:]\s*['"]?[A-Za-z0-9_-]{30,}/g, why: 'Cloudflare API 토큰' },
  { id: 'google-api', sev: 'medium', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, why: 'Google API 키 (공개용인지 확인 필요)' },
  { id: 'assignment', sev: 'medium', re: /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key|admin[_-]?token)\b\s*[:=]\s*['"]?([^\s'"`,;]{12,})/gi, why: '비밀번호·토큰 같은 값을 코드에 적음',
    test: (m) => !/process\.env|import\.meta\.env|<|\$\{|example|your[_-]|xxxx|\*\*\*|placeholder/i.test(m) },
];
const BIN = /\.(png|jpe?g|gif|webp|ico|mp3|m4a|ogg|wav|mp4|woff2?|ttf|glb|gltf|zip|pdf)$/i;

function ignoreGlobs() {
  const f = join(root, '.secretscanignore');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*') + '$'));
}
function walk(d, out = []) {
  for (const n of readdirSync(d)) { if (n === 'node_modules' || n === '.git') continue; const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
function listFiles() {
  if (mode === 'dir') return walk(join(root, dirArg)).map((p) => relative(root, p));
  if (mode === 'staged') return sh('git diff --cached --name-only --diff-filter=ACMR').split('\n').filter(Boolean);
  return [...new Set([...sh('git ls-files').split('\n'), ...sh('git ls-files --others --exclude-standard').split('\n')].filter(Boolean))];
}
function content(p) {
  if (mode === 'staged') { try { return execSync(`git show ":${p}"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 << 20 }).toString(); } catch { return ''; } }
  try { const s = statSync(join(root, p)); return s.size > 2_000_000 ? '' : readFileSync(join(root, p), 'utf8'); } catch { return ''; }
}

const ign = ignoreGlobs();
const findings = [];
for (const p of listFiles()) {
  if (ign.some((r) => r.test(p))) continue;
  const txt = BIN.test(p) ? '' : content(p);
  for (const [re, why, cond] of BAD_FILES) if (re.test(p) && (!cond || cond(p, txt))) findings.push({ sev: 'high', file: p, line: 0, rule: 'file', why, fixable: true });
  if (!txt) continue;
  txt.split('\n').forEach((line, i) => {
    if (/secret-scan:\s*allow/.test(line)) return;
    for (const r of RULES) {
      // 압축된(minified) 코드·빌드 결과의 라이브러리 코드는 '비밀번호 같은 값' 규칙이 잘못 걸리기 쉬워 건너뜀 (진짜 키 패턴은 그대로 검사)
      if (r.id === 'assignment' && (line.length > 300 || mode === 'dir' || /\.min\.|(^|\/)(dist|build)\//.test(p))) continue;
      r.re.lastIndex = 0;
      const ms = r.re.global ? [...line.matchAll(r.re)].map((m) => m[0]) : (line.match(r.re) || []).slice(0, 1);
      for (const m of ms) if (!r.test || r.test(m)) findings.push({ sev: r.sev, file: p, line: i + 1, rule: r.id, why: r.why, sample: m.length > 14 ? `${m.slice(0, 6)}…${m.slice(-4)}` : '***' });
    }
  });
}

const high = findings.filter((f) => f.sev === 'high'), med = findings.filter((f) => f.sev === 'medium'), info = findings.filter((f) => f.sev === 'info');
if (flag('--fix') && mode !== 'dir') {
  const files = [...new Set(high.filter((f) => f.fixable).map((f) => f.file))];
  for (const f of files) sh(`git rm --cached -q -- "${f}"`) || sh(`git reset -q -- "${f}"`);
  const gi = join(root, '.gitignore'), cur = existsSync(gi) ? readFileSync(gi, 'utf8') : '';
  const add = files.filter((f) => !cur.split('\n').includes(f) && !cur.split('\n').includes(basename(f)));
  if (add.length) appendFileSync(gi, `${cur.endsWith('\n') || !cur ? '' : '\n'}# secret-scan 이 추가함\n${add.join('\n')}\n`);
  if (files.length) console.error(`🧹 커밋에서 뺀 파일: ${files.join(', ')} (.gitignore 에 추가)`);
  // 뺀 파일에서 나온 항목은 결과에서 지움 (남은 것만 보여 줌)
  for (const arr of [high, med, info]) for (let i = arr.length - 1; i >= 0; i--) if (files.includes(arr[i].file)) arr.splice(i, 1);
  findings.splice(0, findings.length, ...high, ...med, ...info);
}
if (flag('--json')) { console.log(JSON.stringify({ mode, high: high.length, medium: med.length, info: info.length, findings })); process.exit(high.length ? 1 : 0); }
const label = { staged: '커밋할 파일', all: '저장소 전체', dir: `${dirArg} 폴더` }[mode];
if (!findings.length) { console.log(`🔐 비밀 정보 검사 (${label}): 문제 없음 ✅`); process.exit(0); }
const show = (f) => `  - ${f.file}${f.line ? `:${f.line}` : ''}  ${f.why}${f.sample ? ` (${f.sample})` : ''}`;
if (high.length) console.error(`⛔ 올리면 안 되는 비밀 정보 ${high.length}건 (${label})\n${high.map(show).join('\n')}`);
if (med.length) console.error(`⚠️  확인이 필요한 값 ${med.length}건\n${med.map(show).join('\n')}`);
if (info.length) console.error(`ℹ️  공개해도 되는 키 ${info.length}건 (그대로 둬도 됨)`);
if (high.length) console.error(`\n처리 방법: 파일이면 'secret-scan.mjs --fix' 로 커밋에서 빼고 .gitignore 에 추가.\n코드 속 키는 .env 로 옮기고, 이미 GitHub 에 올라갔다면 그 키는 반드시 재발급(폐기)하세요.\n의도한 예시 값이면 줄 끝에 'secret-scan: allow' 주석.`);
process.exit(high.length ? 1 : 0);
