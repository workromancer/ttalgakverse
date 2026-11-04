#!/usr/bin/env node
// 메타버스 프로젝트 진단: 어디까지 됐고 다음에 뭘 할지 알려줌 (상태 파일과 실제 파일을 대조)
//  사용: node doctor.mjs [프로젝트 폴더]   → 사람이 읽는 요약 + 맨 끝 줄에 JSON
//  .metaverse/state.json 이 실제와 다르면 실제 기준으로 고쳐 씀 (--no-write 로 끔)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
const dir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : process.cwd();
const write = !process.argv.includes('--no-write');
const P = (...a) => join(dir, ...a);
const read = (f) => { try { return readFileSync(P(f), 'utf8'); } catch { return null; } };
const json = (f) => { try { return JSON.parse(read(f)); } catch { return null; } };
const sh = (c) => { try { return execSync(c, { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).toString().trim(); } catch { return null; } };
const env = Object.fromEntries((read('.env') || '').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const STEPS = ['setup', 'worldview', 'concept', 'build', 'multiplayer', 'deploy'];
const ASK = { setup: '준비됐는지 봐줘', worldview: '세계관 정하자', concept: '분위기 정하자', build: '월드 만들어 줘', multiplayer: '친구랑 같이 놀게 해 줘', deploy: '배포해 줘' }; // 슬래시 명령 없이 이렇게 말하면 됨
const SKILL = { setup: 'mv-setup', worldview: 'mv-worldview', concept: 'mv-concept', build: 'mv-build', multiplayer: 'mv-multiplayer', deploy: 'mv-deploy' };
const state = json('.metaverse/state.json') || { version: 1, project: {}, steps: {}, choices: {} };
const checks = {};
const node = process.versions.node.split('.').map(Number);
checks.setup = { ok: node[0] >= 18 && !!sh('npm -v'), detail: `node ${process.versions.node}, npm ${sh('npm -v') || '없음'}` };
const world = json('world/world.json');
checks.worldview = { ok: !!(world && world.zones?.length && world.slug), detail: world ? `${world.title} · 구역 ${world.zones?.length || 0}개` : 'world/world.json 없음' };
const concept = json('world/concept.json');
const concepts = existsSync(P('concepts/index.html'));
checks.concept = { ok: !!concept?.palette, detail: concept ? `선택: ${concept.name}` : concepts ? '시안은 있음, 아직 선택 안 함' : '시안 없음' };
const pkg = json('package.json');
const built = existsSync(P('src/main.js')) && !!pkg?.dependencies?.three;
checks.build = { ok: built && existsSync(P('node_modules')), detail: !built ? '템플릿 없음' : existsSync(P('node_modules')) ? `npm 패키지 설치됨${existsSync(P('dist/index.html')) ? ' · dist 빌드 있음' : ''}` : 'npm install 필요' };
let mp = { ok: false, detail: '.env 에 VITE_SUPABASE_URL/KEY 없음 (없어도 혼자 플레이는 됨)' };
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_KEY) {
  const r = sh(`curl -s -m 8 -X POST "${env.VITE_SUPABASE_URL}/rest/v1/rpc/server_time" -H "apikey: ${env.VITE_SUPABASE_KEY}" -H "Content-Type: application/json" -d '{}'`);
  mp = { ok: !!r && /^\d+(\.\d+)?$/.test(r), detail: r && /^\d/.test(r) ? `Supabase 연결됨 (${env.VITE_SUPABASE_URL})` : `Supabase 응답 이상: ${String(r).slice(0, 120)} → server_time 함수(마이그레이션) 확인` };
}
checks.multiplayer = mp;
const wr = read('wrangler.jsonc') || '';
const wname = (wr.match(/"name"\s*:\s*"([^"]+)"/) || [])[1];
const url = state.deploy?.url;
let dep = { ok: false, detail: wname ? `wrangler 이름 ${wname}, 아직 배포 기록 없음` : 'wrangler.jsonc 없음' };
if (url) { const code = sh(`curl -s -o /dev/null -w "%{http_code}" -m 8 ${url}`); dep = { ok: code === '200', detail: `${url} → HTTP ${code}` }; }
checks.deploy = dep;

const now = new Date().toISOString();
state.steps ||= {};
for (const s of STEPS) {
  const prev = state.steps[s] || {};
  const status = checks[s].ok ? 'done' : prev.status === 'skipped' ? 'skipped' : prev.status === 'in_progress' ? 'in_progress' : 'todo';
  state.steps[s] = { ...prev, status, checked: now, detail: checks[s].detail };
}
const next = STEPS.find((s) => !['done', 'skipped'].includes(state.steps[s].status));
state.next = next ? SKILL[next] : null;
if (write) { mkdirSync(P('.metaverse'), { recursive: true }); writeFileSync(P('.metaverse/state.json'), JSON.stringify(state, null, 2)); }
const icon = { done: '✅', todo: '⬜', in_progress: '🟡', skipped: '⏭️' };
console.log(`📂 ${dir}`);
for (const s of STEPS) console.log(`${icon[state.steps[s].status]} ${SKILL[s].padEnd(15)} ${checks[s].detail}`);
console.log(next ? `\n👉 다음 단계: ${SKILL[next]} — "${ASK[next]}" 라고 말하면 돼요` : '\n🎉 모든 단계 완료! 바꾸고 싶은 게 있으면 해당 단계 스킬을 다시 실행하세요.');
console.log(JSON.stringify({ next: state.next, steps: Object.fromEntries(STEPS.map((s) => [s, state.steps[s].status])) }));
