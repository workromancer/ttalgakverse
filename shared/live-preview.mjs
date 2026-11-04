#!/usr/bin/env node
// 라이브 미리보기 서버: 폴더를 열어 두면 파일이 바뀔 때마다 브라우저가 저절로 새로고침됨
//  인터뷰하면서 Claude 가 세계관·컨셉 시안 HTML 을 고쳐 쓰면, 사용자 화면에 바로 반영됨
//  node live-preview.mjs <폴더> [포트=4321]   → http://localhost:<포트>/ (같은 와이파이 휴대폰도 Network 주소로)
//  같은 폴더로 이미 떠 있으면 새로 띄우지 않고 주소만 알려 줌. 그 포트를 다른 앱이 쓰고 있으면 다음 빈 포트로 (출력의 주소를 안내할 것)
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync, watch } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const dir = resolve(process.argv[2] || '.');
let port = +(process.argv[3] || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const clients = new Set();
const INJECT = `<script>(()=>{const es=new EventSource('/__live');es.onmessage=()=>location.reload();})();</script>`;
const lan = Object.values(networkInterfaces()).flat().find((n) => n && n.family === 'IPv4' && !n.internal)?.address;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // 보드에서 "이걸로 할게요" 를 누르면 → <보드 폴더>/choice.json 에 저장 (스킬이 wait-choice.mjs 로 기다렸다가 읽음)
  if (url === '/__choice' && req.method === 'POST') {
    let raw = ''; req.on('data', (c) => { raw += c; if (raw.length > 4000) req.destroy(); });
    req.on('end', () => {
      try {
        const b = JSON.parse(raw), board = ['worlds', 'concepts', 'avatars'].includes(b.board) ? b.board : null;
        if (!board || !existsSync(join(dir, board))) throw new Error('board');
        const choice = { id: String(b.id ?? '').slice(0, 20), note: String(b.note ?? '').slice(0, 300), at: new Date().toISOString() };
        writeFileSync(join(dir, board, 'choice.json'), JSON.stringify(choice, null, 1));
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true }));
      } catch { res.writeHead(400); res.end('{"ok":false}'); }
    });
    return;
  }
  // 보드에서 인터뷰 답(예시 클릭·직접 입력) → <보드>/interview.json 의 그 질문 a 를 채우고 answer.json 에 남김 (wait-choice.mjs 가 받아 감)
  if (url === '/__answer' && req.method === 'POST') {
    let raw = ''; req.on('data', (c) => { raw += c; if (raw.length > 4000) req.destroy(); });
    req.on('end', () => {
      try {
        const b = JSON.parse(raw), board = ['worlds', 'concepts', 'avatars'].includes(b.board) ? b.board : null;
        if (!board) throw new Error('board');
        const f = join(dir, board, 'interview.json'), qa = JSON.parse(readFileSync(f, 'utf8')), i = +b.i, a = String(b.a ?? '').trim().slice(0, 300);
        if (!qa[i] || !a) throw new Error('q');
        qa[i].a = a; writeFileSync(f, JSON.stringify(qa, null, 1));
        writeFileSync(join(dir, board, 'answer.json'), JSON.stringify({ i, q: qa[i].q, a, at: new Date().toISOString() }, null, 1));
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true }));
      } catch { res.writeHead(400); res.end('{"ok":false}'); }
    });
    return;
  }
  if (url === '/__ping') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ app: 'live-preview', dir })); }
  if (url === '/__live') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(': ok\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  let p = join(dir, url);
  if (!p.startsWith(dir)) { res.writeHead(403); return res.end(); }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) {
    res.writeHead(200, { 'content-type': TYPES['.html'] });
    return res.end(`<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;background:#0d1014;color:#fff;display:grid;place-items:center;height:100vh"><div style="text-align:center"><div style="font-size:42px">✍️</div><p style="margin-top:10px;opacity:.8">Claude 가 시안을 그리는 중이에요… 저절로 열려요</p></div>${INJECT}`);
  }
  const ext = extname(p), body = readFileSync(p);
  res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(ext === '.html' ? body.toString().replace(/<\/body>|$/i, (m) => INJECT + m) : body);
});
// localhost:<포트> 에 누가 답하나 확인 (다른 앱이 IPv6 localhost 에만 떠 있으면 listen 은 성공해도 브라우저는 그 앱으로 감)
async function whoIs(p) {
  try { const r = await fetch(`http://localhost:${p}/__ping`, { signal: AbortSignal.timeout(1500) }); return await r.json().catch(() => ({})); }
  catch { return null; } // 아무도 안 씀
}
async function start(p, tries = 10) {
  const who = await whoIs(p);
  if (who?.app === 'live-preview' && who.dir === dir) { console.log(`이미 열려 있어요 → http://localhost:${p}/`); process.exit(0); }
  if (who) {
    if (tries <= 1) { console.log(`⚠️ 빈 포트를 못 찾았어요. 다른 포트를 직접 주세요: node live-preview.mjs ${process.argv[2] || '.'} <포트>`); process.exit(3); }
    console.log(`⚠️ ${p} 포트는 다른 앱이 쓰고 있어요 → ${p + 1} 로 열어요`);
    return start(p + 1, tries - 1);
  }
  server.once('error', (e) => { if (e.code === 'EADDRINUSE' && tries > 1) start(p + 1, tries - 1); else throw e; });
  server.listen(p, () => {
    port = p;
    console.log(`🔴 라이브 미리보기: http://localhost:${port}/${lan ? `  (휴대폰: http://${lan}:${port}/)` : ''}`);
    console.log(`   ${dir} 의 파일이 바뀌면 브라우저가 저절로 새로고침돼요. 끄려면 Ctrl+C`);
  });
}
start(port);
let t = null;
watch(dir, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 150); });
