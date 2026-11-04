// 📝 고칠 점 남기기 (개발 서버 `npm run dev` 에서만 보임 — 배포본에는 안 들어감)
//  월드를 걸어 다니다 거슬리는 곳에서 누르고 한 줄 적으면, 지금 화면 스크린샷·구역·위치와 함께
//  .metaverse/feedback/inbox.jsonl 에 저장된다 (vite.config.js 의 mv-feedback 플러그인).
//  🎯 「구조물 콕 집기」로 건물·소품을 눌러 고르면 그게 world.json 의 몇 번째 소품인지까지 같이 간다.
//  Claude 는 `wait-feedback.mjs` 를 백그라운드로 돌려 두고 있다가 바로 받아서 고친다 (mv-polish 스킬).
import * as THREE from 'three';

const CHIPS = ['너무 어두워요', '너무 비어 보여요', '색이 별로예요', '여기서 막혀요', '글씨가 안 읽혀요'];
// 구조물을 집었을 때는 구조물용 보기 (사람들이 가장 많이 걸리는 곳)
const STRUCT_CHIPS = ['진짜랑 안 닮았어요', '너무 커요', '너무 작아요', '비율이 이상해요', '색·재질이 어색해요', '너무 밋밋해요', '위치·방향이 이상해요', '길을 막아요'];

export function mountFeedback(ctx) {
  const css = document.createElement('style');
  css.textContent = `
  #fb-panel { position: fixed; right: 12px; top: calc(70px + var(--st)); width: min(330px, calc(100vw - 24px)); padding: 12px; border-radius: 16px; z-index: 40; display: none; -webkit-user-select: text; user-select: text; touch-action: auto; }
  #fb-panel.on { display: block; }
  #fb-panel b { font-size: 13px; }
  #fb-panel p { font-size: 11px; opacity: .7; margin: 4px 0 8px; }
  #fb-panel textarea { width: 100%; height: 66px; border-radius: 10px; border: 1px solid var(--line); background: rgba(0,0,0,.35); color: #fff; padding: 8px; font: 14px var(--font); resize: none; }
  #fb-panel .chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 8px; }
  #fb-panel .chips button { border: 1px solid var(--line); background: rgba(255,255,255,.06); color: #fff; border-radius: 20px; padding: 4px 9px; font: 12px var(--font); cursor: pointer; }
  #fb-panel .row { display: flex; gap: 6px; }
  #fb-panel .row button { flex: 1; border: none; border-radius: 10px; padding: 9px; font: 800 13px var(--font); cursor: pointer; }
  #fb-pick { width: 100%; border: 1px dashed var(--accent) !important; background: rgba(255,255,255,.04); color: var(--accent); border-radius: 10px; padding: 8px; font: 800 13px var(--font); cursor: pointer; margin-bottom: 6px; }
  #fb-picked { font-size: 12px; margin-bottom: 6px; display: none; }
  #fb-picked span { opacity: .6; cursor: pointer; margin-left: 6px; }
  #fb-send { background: var(--primary); color: #fff; }
  #fb-close { background: rgba(255,255,255,.1); color: #fff; flex: .5 !important; }
  #fb-count { position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px; border-radius: 8px; background: var(--accent); color: #000; font-size: 10px; font-weight: 900; display: none; place-items: center; padding: 0 3px; }
  #fb-shield { position: fixed; inset: 0; z-index: 35; cursor: crosshair; display: none; }
  #fb-shield.on { display: block; }
  #fb-shield div { position: fixed; left: 50%; top: calc(14px + var(--st)); transform: translateX(-50%); padding: 8px 14px; border-radius: 20px; background: rgba(0,0,0,.75); font-weight: 800; font-size: 13px; pointer-events: none; }`;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.title = '고칠 점 남기기 (개발 중에만 보임)'; btn.style.position = 'relative';
  btn.innerHTML = '📝<span id="fb-count"></span>';
  document.getElementById('dock')?.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'fb-panel'; panel.className = 'glass';
  panel.innerHTML = `<b>📝 여기 마음에 안 들어요</b><p>지금 화면·위치가 같이 저장돼요. Claude 가 받아서 고쳐요.</p>
    <button id="fb-pick">🎯 마음에 안 드는 구조물 콕 집기</button>
    <div id="fb-picked"></div>
    <textarea id="fb-text" placeholder="예: 이 나무들이 너무 커서 길이 막혀요"></textarea>
    <div class="chips" id="fb-chips"></div>
    <div class="row"><button id="fb-close">닫기</button><button id="fb-send">보내기</button></div>`;
  document.body.appendChild(panel);
  const shield = document.createElement('div');
  shield.id = 'fb-shield'; shield.innerHTML = '<div>🎯 고칠 구조물을 눌러 주세요 (Esc 취소)</div>';
  document.body.appendChild(shield);

  const $ = (s) => panel.querySelector(s), text = $('#fb-text');
  // 글 쓰는 동안 WASD 가 캐릭터를 움직이지 않게
  for (const ev of ['keydown', 'keyup']) panel.addEventListener(ev, (e) => e.stopPropagation());

  let sent = 0, picked = null, outline = null;
  const chips = (list) => { $('#fb-chips').innerHTML = list.map((c) => `<button data-chip="${c}">${c}</button>`).join(''); };
  chips(CHIPS);
  $('#fb-chips').addEventListener('click', (e) => { const c = e.target.dataset?.chip; if (c) { text.value = (text.value ? text.value + ' · ' : '') + c; text.focus(); } });
  const open = (on) => { panel.classList.toggle('on', on); if (on) setTimeout(() => text.focus(), 50); else unpick(); };
  btn.addEventListener('click', () => open(!panel.classList.contains('on')));
  $('#fb-close').addEventListener('click', () => open(false));

  // ---- 🎯 구조물 콕 집기 ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function unpick() {
    picked = null; if (outline) { ctx.scene.remove(outline); outline.geometry.dispose(); outline = null; }
    $('#fb-picked').style.display = 'none'; $('#fb-pick').style.display = ''; chips(CHIPS);
  }
  $('#fb-pick').addEventListener('click', () => { panel.classList.remove('on'); shield.classList.add('on'); });
  addEventListener('keydown', (e) => { if (e.code === 'Escape' && shield.classList.contains('on')) { shield.classList.remove('on'); panel.classList.add('on'); } });
  shield.addEventListener('click', (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, ctx.camera);
    let hitObj = null;
    for (const h of ray.intersectObjects(ctx.zoneGroup?.children || [], true)) { // 맞은 것 중 소품(userData.prop)이 있는 첫 번째
      let o = h.object; while (o && !o.userData?.prop) o = o.parent;
      if (o) { hitObj = o; break; }
    }
    if (!hitObj) { ctx.toast('구조물이 아니에요 — 다시 눌러 주세요'); return; }
    shield.classList.remove('on'); unpick();
    const box = new THREE.Box3().setFromObject(hitObj), size = box.getSize(new THREE.Vector3());
    outline = new THREE.Box3Helper(box, 0xffe066); ctx.scene.add(outline);
    const u = hitObj.userData.prop;
    picked = { ...u, x: +hitObj.position.x.toFixed(1), z: +hitObj.position.z.toFixed(1), size: [size.x, size.y, size.z].map((v) => +v.toFixed(1)) };
    $('#fb-picked').innerHTML = `🎯 <b>${u.text || u.kind}</b> (${u.kind} · ${u.zone} 소품 ${u.index}번 · 높이 ${picked.size[1]}m)<span>✕</span>`;
    $('#fb-picked').style.display = 'block'; $('#fb-pick').style.display = 'none';
    $('#fb-picked span').addEventListener('click', unpick);
    chips(STRUCT_CHIPS); text.placeholder = '어디가 어떻게 이상한지 — 예: 지붕이 너무 납작해요, 실제는 더 뾰족해요';
    panel.classList.add('on'); setTimeout(() => text.focus(), 50);
  });

  function shot() {
    // 패널을 숨긴 화면을 한 장 그려서 바로 캡처 (preserveDrawingBuffer 없이도 같은 틱이면 읽힘). 집은 구조물은 노란 상자로 보임
    ctx.renderer.render(ctx.scene, ctx.camera);
    const src = ctx.renderer.domElement, w = Math.min(960, src.width), h = Math.round((src.height / src.width) * w);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.8);
  }

  $('#fb-send').addEventListener('click', async () => {
    const t = text.value.trim();
    if (!t) { text.focus(); return; }
    const z = ctx.zone, p = ctx.player, cam = ctx.cam;
    const body = { text: t, zone: { id: z?.id, name: z?.name }, pos: { x: +p.x.toFixed(1), z: +p.z.toFixed(1), yaw: +p.yaw.toFixed(2) },
      cam: { yaw: +cam.yaw.toFixed(2), pitch: +cam.pitch.toFixed(2), dist: +cam.dist.toFixed(1) }, view: [innerWidth, innerHeight], prop: picked, shot: shot() };
    const r = await fetch('/__feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (r?.ok) {
      text.value = ''; text.placeholder = '예: 이 나무들이 너무 커서 길이 막혀요'; open(false); sent++;
      const n = document.getElementById('fb-count'); n.textContent = sent; n.style.display = 'grid';
      ctx.toast('📝 Claude 에게 전달했어요');
    } else ctx.toast('전달 실패 — 채팅으로 말해 주세요');
  });
}
