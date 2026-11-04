import { createClient } from '@supabase/supabase-js';

// 서버 없이 Supabase Realtime 으로만 동기화
//  - 구역(zone)마다 채널 하나 (같은 구역에 있는 사람끼리만 주고받음)
//  - Presence: 접속자 목록 / Broadcast: 위치 스냅샷 (움직일 때만, 초당 최대 3회)
//  - 열차는 모두 같은 시각으로 계산하므로 주고받지 않음 (server_time() 으로 시계 보정)
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;
const APP = import.meta.env.VITE_APP_SLUG || 'mv'; // 채널·저장 이름 앞에 붙는 앱 이름 (같은 Supabase 를 여러 앱이 써도 안 섞이게)
const COLORS = [0xfff3dc, 0xffd9e4, 0xd9ecff, 0xdff5d6, 0xfff0b8, 0xeadcff, 0xd6f3ef, 0xffe0c7];

function ident() {
  let me = null;
  try { me = JSON.parse(localStorage.getItem(`${APP}.me`)); } catch { /* 무시 */ }
  if (!me || !me.id) me = { id: crypto.randomUUID().slice(0, 8), name: `여행자${Math.floor(1000 + Math.random() * 9000)}`, color: COLORS[(Math.random() * COLORS.length) | 0] };
  if (!me.key) me.key = crypto.randomUUID().replace(/-/g, ''); // 내 신청 내역 조회용 비밀 키 (방송하지 않음)
  if (!me.acc) me.acc = {};
  localStorage.setItem(`${APP}.me`, JSON.stringify(me));
  return me;
}

export function createNet({ onState, onLeave, onCount }) {
  const me = ident();
  const net = { me, enabled: !!(URL && KEY), offset: 0, station: null, peers: 0 };
  if (!net.enabled) { console.warn('Supabase 설정 없음 → 싱글 플레이'); return Object.assign(net, { sb: null, setZone() {}, send() {}, setName() {}, save: () => localStorage.setItem(`${APP}.me`, JSON.stringify(me)), now: () => Date.now() }); }
  const sb = createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 10 } } });
  net.sb = sb;
  let ch = null, joined = false, lastSent = 0, lastPayload = null, pending = null;

  // 시계 보정 (왕복 지연 절반 보정, 3회 중 가장 빠른 응답 사용)
  (async () => {
    let best = null;
    for (let k = 0; k < 3; k++) {
      const t0 = Date.now();
      const { data, error } = await sb.rpc('server_time');
      const t1 = Date.now();
      if (error || typeof data !== 'number') continue;
      if (!best || t1 - t0 < best.rtt) best = { rtt: t1 - t0, off: data - (t0 + t1) / 2 };
    }
    if (best) net.offset = best.off;
  })();
  net.now = () => Date.now() + net.offset;

  const countPeers = () => {
    if (!ch) return;
    const n = Object.keys(ch.presenceState()).length;
    net.peers = n; onCount?.(n);
  };
  net.setZone = (i) => {
    if (net.station === i) return;
    net.station = i;
    if (ch) { sb.removeChannel(ch); ch = null; }
    joined = false;
    onLeave?.('*');
    const c = sb.channel(`${APP}:zone:${i}`, { config: { broadcast: { self: false }, presence: { key: me.id } } });
    c.on('broadcast', { event: 's' }, ({ payload }) => { if (payload && payload.id !== me.id) onState?.(payload); })
      .on('presence', { event: 'sync' }, countPeers)
      .on('presence', { event: 'join' }, ({ key }) => {
        // 새로 들어온 사람이 구독을 마치기 전에 보낸 건 못 받을 수 있어서, 조금 뒤 두 번 더 보냄
        if (key === me.id || !lastPayload) return;
        for (const ms of [0, 700, 2000]) setTimeout(() => { if (ch === c && lastPayload) { lastSent = 0; net.send(lastPayload, true); } }, ms);
      })
      .on('presence', { event: 'leave' }, ({ key }) => { onLeave?.(key); countPeers(); })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && ch === c) {
          joined = true;
          await c.track({ name: me.name, color: me.color });
          if (lastPayload) net.send(lastPayload, true);
        }
      });
    ch = c;
  };
  // 상태 전송: 바뀌었을 때만. 움직이거나 도는 중엔 초당 ~8회, 그 밖엔 초당 3회 (+ 8초마다 생존 신호)
  let gap = 333;
  net.send = (state, force = false, fast = false) => {
    gap = fast ? 120 : 333;
    const payload = { id: me.id, n: me.name, c: me.color, ...state }; // key 는 절대 보내지 않음
    const same = lastPayload && JSON.stringify({ ...lastPayload, t: 0 }) === JSON.stringify({ ...payload, t: 0 });
    lastPayload = payload;
    const now = Date.now();
    if (!ch || !joined || (!force && same && now - lastSent < 4000)) return;
    if (!force && now - lastSent < gap) { pending = payload; return; }
    pending = null; lastSent = now;
    ch.send({ type: 'broadcast', event: 's', payload });
  };
  setInterval(() => { if (pending && ch && joined && Date.now() - lastSent >= gap) { const p = pending; pending = null; lastSent = Date.now(); ch.send({ type: 'broadcast', event: 's', payload: p }); } }, 40);
  net.save = () => localStorage.setItem(`${APP}.me`, JSON.stringify(me));
  net.setName = (name) => {
    me.name = name.slice(0, 12); localStorage.setItem(`${APP}.me`, JSON.stringify(me));
    if (ch) ch.track({ name: me.name, color: me.color });
    if (lastPayload) net.send(lastPayload, true);
  };
  return net;
}
