#!/usr/bin/env node
// 라이브 미리보기 서버: 폴더를 열어 두면 파일이 바뀔 때마다 브라우저가 저절로 새로고침됨
//  인터뷰하면서 Claude 가 세계관·컨셉 시안 HTML 을 고쳐 쓰면, 사용자 화면에 바로 반영됨
//  node live-preview.mjs <폴더> [포트=4321]   → http://localhost:<포트>/ (같은 와이파이 휴대폰도 Network 주소로)
//  이미 그 포트에 떠 있으면 새로 띄우지 않고 주소만 알려 줌
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, watch } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const dir = resolve(process.argv[2] || '.'), port = +(process.argv[3] || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const clients = new Set();
const INJECT = `<script>(()=>{const es=new EventSource('/__live');es.onmessage=()=>location.reload();})();</script>`;
const lan = Object.values(networkInterfaces()).flat().find((n) => n && n.family === 'IPv4' && !n.internal)?.address;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
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
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log(`이미 열려 있어요 → http://localhost:${port}/`); process.exit(0); }
  throw e;
});
server.listen(port, '0.0.0.0', () => {
  console.log(`🔴 라이브 미리보기: http://localhost:${port}/${lan ? `  (휴대폰: http://${lan}:${port}/)` : ''}`);
  console.log(`   ${dir} 의 파일이 바뀌면 브라우저가 저절로 새로고침돼요. 끄려면 Ctrl+C`);
});
let t = null;
watch(dir, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 150); });
