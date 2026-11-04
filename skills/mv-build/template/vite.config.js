import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

// 📝 월드 안 「고칠 점」 버튼이 보낸 것을 .metaverse/feedback/ 에 저장 (npm run dev 에서만 동작)
//  inbox.jsonl 한 줄 = 피드백 하나 { id, at, text, zone, pos, cam, prop(🎯 집은 구조물: zone·index·kind·size), shot(스크린샷 경로) }
//  Claude 는 <키트>/shared/wait-feedback.mjs 로 기다렸다가 받아서 고친다 (mv-polish)
function feedbackInbox() {
  const dir = '.metaverse/feedback';
  return {
    name: 'mv-feedback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__feedback', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let raw = '';
        req.on('data', (c) => { raw += c; if (raw.length > 8e6) req.destroy(); });
        req.on('end', () => {
          try {
            const b = JSON.parse(raw), id = Date.now().toString(36);
            mkdirSync(dir, { recursive: true });
            let shot = '';
            if (/^data:image\/jpeg;base64,/.test(b.shot || '')) { shot = `${dir}/${id}.jpg`; writeFileSync(shot, Buffer.from(b.shot.split(',')[1], 'base64')); }
            const item = { id, at: new Date().toISOString(), text: String(b.text || '').slice(0, 500), zone: b.zone, pos: b.pos, cam: b.cam, view: b.view, prop: b.prop || null, shot };
            appendFileSync(`${dir}/inbox.jsonl`, JSON.stringify(item) + '\n');
            res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: true, id }));
          } catch { res.statusCode = 400; res.end('{"ok":false}'); }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [feedbackInbox()],
  server: { host: true, watch: { ignored: ['**/.metaverse/**'] } },
});
