// 미니 Codex 앱 — 강사 PC들에서 켠 브리지(codex-bridge/server.mjs)와 대화한다. 브리지는 Codex CLI 또는 Claude Code CLI를 실행한다.
//  - 엔진(Claude/Codex)을 고를 수 있다(기본 Claude). 브리지 하나가 그 PC에 깔린 두 엔진을 함께 맡고(/health 의 engines),
//    고른 엔진을 쓸 수 있는 PC가 하나도 없으면 다른 엔진으로 이어 간다.
// 여러 PC(=여러 ChatGPT 계정)를 묶어 쓴다.
//  - 수강생마다 '내 PC'(home)를 하나 배정한다. 처음엔 사람이 적은 PC로 배정하고, 작업 파일은 그 PC에 쌓인다.
//  - 내 PC가 꺼지거나·사용량이 다 차거나·바쁘면 다른 PC로 옮겨 이어 간다(앞선 대화 요약을 함께 보낸다).
//  - 연결 주소 목록과 입장 코드는 참가 링크(?cx=주소1,주소2&code=코드)로 받는다.
(function () {
  const $ = id => document.getElementById(id);
  const root = document.querySelector('.cx');
  const log = $('cxLog'), form = $('cxForm'), input = $('cxPrompt');
  const sendBtn = $('cxSend'), stopBtn = $('cxStop');
  const statusEl = $('cxStatus');

  // 주제 하나로 1→5를 차례로 누르면 한 차시 수업(도입 영상 → 자막 → 게임 또는 웹앱 → PPT)이 완성된다. 1번의 00에 주제를 넣는다.
  // 3(게임)·4(웹앱)는 둘 중 하나만 고른다(pick).
  const TRIES = [
    // ref: 누르면 이 레퍼런스 영상을 작업 폴더에 올려 첨부한다(스타일 참고용)
    { t: '모션그래픽', p: '00에 관한 초등학생에게 설명하는 30초 이내의 빠른 템포 모션그래픽 도입 영상을 만들어줘', ref: 'assets/ref/style-ref.mp4' },
    { t: '자막 삽입', p: '이 영상에 핵심어를 ‘놀면 뭐하니’ 예능 자막으로 넣어 줘.' },
    { t: '게임 만들기', p: '영상 내용으로 개인별로 하는 카훗 스타일 퀴즈 게임을 만들어 줘.', pick: true },
    { t: '웹앱 만들기', p: '띵커벨 보드처럼 QR코드로 들어와서 의견을 올리는 웹앱을 만들어 줘.', pick: true },
    { t: 'PPT 자동화', p: '지금까지 만든 자료로 한 차시 수업 PPT를 만들어 줘.' },
  ];

  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 */ } }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = u => String(u || '').trim().replace(/\/+$/, '');

  // ---------- 연결 설정 (참가 링크로 받기) ----------
  const qs = new URLSearchParams(location.search);
  if (qs.get('cx') || qs.get('bridge')) save('cx.bridges', String(qs.get('cx') || qs.get('bridge')).split(',').map(norm).filter(Boolean));
  if (qs.get('code') !== null) save('cx.code', qs.get('code'));
  if (/^(claude|codex)$/.test(qs.get('engine') || '')) save('cx.engine', qs.get('engine'));
  if (qs.get('cx') || qs.get('bridge') || qs.get('code') !== null || qs.get('engine')) { ['cx', 'bridge', 'code', 'engine'].forEach(k => qs.delete(k)); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); }
  // 브리지 PC 자동 찾기: 각 PC가 켜질 때 연결 주소를 이 채널에 올린다(입장 코드 서명 확인 후 사용)
  const DISCOVERY = 'https://ntfy.sh/midong-cx-70402f1cb5f3ca16';
  const onLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let pool = load('cx.bridges', null) || (onLocal ? [location.origin] : []);
  let found = [];   // 자동으로 찾은 주소
  let otherCode = 0;   // 알림 채널에 PC는 있는데 다른 입장 코드로 서명된 수 (코드 잘못 넣음 안내용)
  let code = load('cx.code', '');  // 없으면 첫 화면에서 받는다
  let sid = load('cx.sid', null);
  if (!/^[a-z0-9]{8,40}$/.test(sid || '')) { sid = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join(''); save('cx.sid', sid); }
  let home = load('cx.home', null);
  let engine = load('cx.engine', 'claude') === 'codex' ? 'codex' : 'claude';   // 기본 Claude
  const stat = {};   // 주소 → {ok, info, err}
  const myName = () => { try { const v = window.MIDONG_ID && window.MIDONG_ID.get(); return v && v.name ? '미동초 ' + v.name : ''; } catch { return ''; } };
  const hdr = extra => Object.assign({ 'X-CX-Session': sid, 'X-CX-Code': code }, myName() ? { 'X-CX-Name': encodeURIComponent(myName()) } : {}, extra || {});

  // ---------- 상태 ----------
  let busy = false, curJob = null;
  let threads = load('cx.threads', []);
  let curKey = load('cx.cur', null);
  let attach = [], files = [];
  let turnFiles = new Set(), turnStart = 0, liveEl = null, liveT = null;
  const items = new Map();
  const cur = () => threads.find(t => t.key === curKey) || null;
  const labelOf = u => (stat[u] && stat[u].info && stat[u].info.label) || u.replace(/^https?:\/\//, '').split('.')[0];
  const anyOnline = () => allPCs().some(u => stat[u] && stat[u].ok);
  const ENG = { claude: 'Claude', codex: 'Codex' };
  const other = e => e === 'claude' ? 'codex' : 'claude';
  // PC마다 쓸 수 있는 엔진: 지금 브리지는 info.engines, 예전 브리지는 info.engine(없으면 codex) 하나
  const engsOf = u => { const i = (stat[u] && stat[u].info) || {}; return i.engines || { [i.engine || 'codex']: { version: i.agent || i.codex, limited: i.limited } }; };
  const has = (u, e) => { const s = stat[u]; const x = s && s.ok && engsOf(u)[e]; return !!x && !x.limited; };
  const usable = u => has(u, 'claude') || has(u, 'codex');
  const anyHas = e => allPCs().some(u => has(u, e));
  const runEng = u => has(u, engine) || !has(u, other(engine)) ? engine : other(engine);   // 고른 엔진, 그 PC에 없으면 다른 엔진
  const engOK = u => has(u, engine) || !anyHas(engine);   // 고른 엔진이 되거나, 고른 엔진이 되는 PC가 하나도 없을 때
  const nameOf = u => ENG[u ? runEng(u) : engine];
  const markLimited = (u, e) => { const s = stat[u]; if (!s || !s.info) return; if (s.info.engines && s.info.engines[e]) s.info.engines[e].limited = true; else s.info.limited = true; };
  const wsUrl = (u, p, s) => `${u}/ws/${s || sid}/${p.split('/').map(encodeURIComponent).join('/')}?t=${Date.now()}`;
  const dlUrl = (u, p) => wsUrl(u, p) + '&dl=1';   // 브리지가 내려받기로 보내 준다(다른 사이트 주소라 download 속성만으로는 안 됨)
  function relPath(p) {
    if (!p) return p;
    let s = String(p).replace(/\\/g, '/');
    const i = s.indexOf('/' + sid + '/');
    if (i >= 0) s = s.slice(i + sid.length + 2);
    return s.replace(/^\.\//, '');
  }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function add(html, cls) { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; log.insertBefore(d, liveEl && liveEl.isConnected ? liveEl : null); scroll(); return d; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function fetchT(url, opt, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 8000);
    try { return await fetch(url, Object.assign({ cache: 'no-store', signal: c.signal }, opt)); } finally { clearTimeout(t); }
  }

  // ---------- 칩 ----------
  const chip = (x, i) => `<button type="button" data-i="${i}"><b>${i + 1}</b>${x.t}</button>`;
  $('cxChips').innerHTML = TRIES.map((x, i) => x.pick && TRIES[i - 1] && TRIES[i - 1].pick ? ''
    : x.pick ? `<span class="cx-pick" title="둘 중 하나를 골라 만들어요"><i>택1</i>${TRIES.map((y, k) => y.pick && chip(y, k)).filter(Boolean).join('<em>또는</em>')}</span>`
    : chip(x, i)).join('');
  $('cxChips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) usePrompt(+b.dataset.i); });
  function usePrompt(i) {
    input.value = TRIES[i].p; autosize(); input.focus();
    const at = input.value.indexOf('00');   // 주제 자리(00)를 골라 두어 바로 덮어쓰게 한다
    if (at >= 0) input.setSelectionRange(at, at + 2); else input.setSelectionRange(input.value.length, input.value.length);
    if (TRIES[i].ref) attachRef(TRIES[i].ref);
  }
  // 레퍼런스 영상을 발표 사이트에서 받아 내 작업 폴더에 올리고 첨부한다(이미 첨부했으면 그대로)
  async function attachRef(url) {
    const name = url.split('/').pop();
    if (attach.includes(name)) return;
    try {
      const b = await (await fetch(url)).blob();
      const sel = [input.selectionStart, input.selectionEnd];
      await upload([new File([b], name, { type: b.type || 'video/mp4' })]);
      input.focus(); input.setSelectionRange(sel[0], sel[1]);   // 주제(00) 고르기 유지
    } catch { add('참고 영상을 불러오지 못했습니다.', 'm-err'); }
  }
  document.addEventListener('codex-try', e => setTimeout(() => usePrompt(e.detail), 60));

  // ---------- 연결 확인 · PC 고르기 ----------
  // ntfy.sh 는 같은 인터넷 주소에서 오는 요청 수를 제한한다(학교는 보통 모두가 주소 하나 → 금방 429).
  // 그래서 꼭 필요할 때만 읽는다: 슬라이드를 열 때 한 번(다른 탭이 5분 안에 읽었으면 그 결과를 같이 씀),
  // 연결된 PC가 있으면 더 읽지 않고, 쓸 PC가 없을 때만 1분에 한 번, 429면 3분 쉰다. force: 사람이 '다시 연결'·코드 입력.
  let discAt = 0, discPause = 0;
  async function discover(force) {
    if (!code) return;
    const now = Date.now();
    const shared = load('cx.found', null);
    if (!force && shared && shared.code === code && now - shared.t < 5 * 60000 && shared.t > discAt) { found = shared.urls || []; otherCode = shared.other || 0; discAt = shared.t; return; }
    if (now < discPause && !force) return;
    if (!force && discAt && (allPCs().some(usable) || now - discAt < 60000 + Math.random() * 15000)) return;
    discAt = now;
    try {
      const r = await fetchT(DISCOVERY + '/json?poll=1&since=12h', {}, 8000);
      if (r.status === 429) { discPause = now + 3 * 60000; return; }
      const lines = (await r.text()).split('\n').filter(Boolean);
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const latest = {}, bad = new Set();
      for (const l of lines) {
        let m; try { m = JSON.parse(JSON.parse(l).message || 'null'); } catch { continue; }
        if (!m || !/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(m.url || '')) continue;
        const sig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${m.url}|${m.label}|${m.t}`))), b => b.toString(16).padStart(2, '0')).join('');
        if (sig !== m.sig) { bad.add(m.label); continue; }   // 입장 코드로 서명되지 않은 주소는 버린다
        if (!latest[m.label] || latest[m.label].t < m.t) latest[m.label] = m;
      }
      found = Object.values(latest).map(m => norm(m.url));
      otherCode = [...bad].filter(l => !latest[l]).length;
      save('cx.found', { t: now, code, urls: found, other: otherCode });
    } catch { /* 알림 채널에 못 닿음 — 직접 넣은 주소만 쓴다 */ }
  }
  const allPCs = () => [...new Set(pool.concat(found))];
  async function healthAll(force) {
    await discover(force);
    await Promise.all(allPCs().map(async u => {
      try { const r = await fetchT(u + '/health', {}, 6000); const info = await r.json(); stat[u] = { ok: !!info.ok, info }; }
      catch (e) { stat[u] = { ok: false, info: {}, err: e.message }; }
    }));
    renderStatus();
  }
  // 새로 배정할 때: 사람 수(members)·실행 수가 적은 PC. 실행할 때: 내 PC가 되면 그대로, 아니면 여유 있는 다른 PC.
  function pick(exclude) {   // exclude: 이미 해 본 'PC|엔진'
    const c0 = allPCs().filter(u => usable(u) && !(exclude || []).includes(u + '|' + runEng(u)));
    if (!c0.length) return null;
    const same = c0.filter(u => has(u, engine)), c = same.length ? same : c0;
    const load_ = u => { const i = stat[u].info; return ((i.running || 0) + (i.members || 0) * 0.25) / (i.capacity || 1); };
    const free = c.filter(u => (stat[u].info.running || 0) < (stat[u].info.capacity || 1));
    const list = free.length ? free : c;
    const min = Math.min(...list.map(load_));
    const best = list.filter(u => load_(u) - min < 0.01);
    return best[Math.floor(Math.random() * best.length)];
  }
  // 내 PC 정하기: 자리(seats)가 덜 찬 PC부터 /join 으로 자리를 잡는다(브리지가 정원을 지켜 PC 2대·8명이면 4명씩).
  // 모든 PC가 다 찼으면 가장 덜 찬 PC에 자리를 더 만들어 들어간다. 예전 브리지(/join 없음)는 그냥 내 PC로 정한다.
  let claiming = null;
  function claim(exclude) {
    if (claiming) return claiming;
    claiming = (async () => {
      const fill = u => { const i = stat[u].info; return (i.members || 0) / (i.seats || i.capacity || 1); };
      const c = allPCs().filter(u => usable(u) && engOK(u) && !(exclude || []).includes(u + '|' + runEng(u)))
        .sort((x, y) => fill(x) - fill(y) || (stat[x].info.running || 0) - (stat[y].info.running || 0) || Math.random() - 0.5);
      for (const over of [false, true]) {
        for (const u of over ? c.slice(0, 1) : c) {
          try {
            const r = await fetchT(u + '/join', { method: 'POST', headers: hdr(over ? { 'X-CX-Overflow': '1' } : {}) }, 6000);
            const j = await r.json().catch(() => ({}));
            if (r.ok || r.status === 404) { if (j.members != null) stat[u].info.members = j.members; home = u; save('cx.home', home); return u; }
            if (r.status === 429 && j.members != null) stat[u].info.members = j.members;
          } catch { /* 그 PC는 건너뛴다 */ }
        }
      }
      return null;
    })().finally(() => { claiming = null; renderStatus(); });
    return claiming;
  }
  function ensureHome() {
    if (home && allPCs().includes(home) && usable(home) && engOK(home)) return home;
    claim();   // 자리는 뒤에서 잡고, 그동안은 여유 있는 PC를 쓴다(내 PC로 정하지는 않음)
    return pick();
  }
  function renderStatus() {
    const on = allPCs().filter(u => stat[u] && stat[u].ok);
    const h = home && stat[home] && stat[home].ok ? home : null;
    statusEl.className = 'cx-status ' + (busy ? 'busy' : on.length ? 'ok' : 'bad');
    const shown = h && engOK(h) ? h : (on.find(u => has(u, engine)) || on[0]);
    // 연결이 안 될 때는 이유를 보여 준다(스레드를 연 채로는 가운데 안내가 안 보이므로)
    const runT = busy && cur();   // 작업 중에는 실제로 실행한 엔진(모델을 적으면 브리지가 바꿀 수 있다)
    statusEl.querySelector('span').textContent = busy ? `${runT && runT.engine ? ENG[runT.engine] : nameOf(shown)} 작업 중` : on.length ? `연결됨 · PC ${on.length}대`
      : !code ? '입장 코드를 넣어 주세요' : otherCode ? `입장 코드가 달라요 (PC ${otherCode}대 있음)` : Date.now() < discPause ? 'PC 찾기 잠시 쉬는 중 · 3분 뒤 다시' : `${ENG[engine]} 연결 안 됨 · 켜진 PC 없음`;
    const ev = shown && engsOf(shown)[runEng(shown)];
    $('cxModel').textContent = ev && ev.version || ENG[engine].toLowerCase();
    $('cxBrandName').textContent = shown ? nameOf(shown) : ENG[engine];
    $('cxEng').querySelectorAll('[data-e]').forEach(b => {
      const e = b.dataset.e, n = allPCs().filter(u => has(u, e)).length;
      b.classList.toggle('on', e === engine); b.classList.toggle('off', !n);
      b.querySelector('small').textContent = n ? `PC ${n}대` : on.some(u => engsOf(u)[e]) ? '사용량 초과' : '연결 없음';
    });
    $('cxWs').textContent = h ? `내 작업 PC: ${labelOf(h)}` : '내 작업 PC: 아직 없음';
    if (!log.querySelector('.m-user')) renderHello();
  }
  $('cxEng').addEventListener('click', e => {
    const b = e.target.closest('[data-e]'); if (!b || b.dataset.e === engine) return;
    if (busy) { add('작업이 끝난 뒤에 바꿀 수 있어요.', 'm-done'); return; }
    engine = b.dataset.e; save('cx.engine', engine);
    if (home && !engOK(home)) { home = null; save('cx.home', null); }
    files = []; renderStatus(); refreshFiles();
  });
  let pollT;
  function poll(force) { clearTimeout(pollT); if (!root.classList.contains('active')) return; healthAll(force === true).finally(() => { if (code && anyOnline() && !(home && allPCs().includes(home) && usable(home) && engOK(home))) claim(); pollT = setTimeout(poll, anyOnline() ? 10000 : 4000); if (anyOnline() && !files.length) refreshFiles(); }); }
  document.addEventListener('slidechange', e => { if (e.detail.el === root) poll(); });

  // ---------- 스레드 ----------
  function renderThreads() {
    if (view === 'all') return renderAll();
    $('cxNavLabel').textContent = '스레드';
    $('cxThreads').innerHTML = threads.length ? threads.map(t => `<button class="cx-thread${t.key === curKey ? ' on' : ''}" data-k="${t.key}"><span>${esc(t.title)}</span><small>${new Date(t.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}${t.engine ? ' · ' + ENG[t.engine] : ''}${t.bridge ? ' · ' + esc(labelOf(t.bridge)) : ''}</small><i class="cx-del" title="이 스레드 지우기">✕</i></button>`).join('')
      : '<div class="cx-empty" style="font-size:13px;padding:10px">아직 스레드가 없어요</div>';
    $('cxTitle').textContent = cur() ? cur().title : '새 스레드';
    $('cxClearAll').disabled = !threads.length;
  }
  $('cxThreads').addEventListener('click', e => {
    const b = e.target.closest('.cx-thread'); if (!b || busy) return;
    if (b.dataset.gal !== undefined) { allSel = null; log.dataset.sig = ''; renderAll(); return; }   // 결과물 영상 모아 보기
    if (b.dataset.p) {
      if (e.target.closest('.cx-del')) { dropPerson(b.dataset.p); return; }
      allSel = b.dataset.p; renderAll(true);
      const p = people().find(x => x.key === allSel), last = p && [...p.turns].reverse().find(t => t.files && t.files.length);
      if (last) preview(last.files[0], p.pc, p.sid);   // 고르면 가장 최근 결과물을 바로 미리보기
      return;
    }
    if (e.target.closest('.cx-del')) {
      if (!isPresenter()) return;
      const t = threads.find(x => x.key === b.dataset.k), n = t ? ownFiles([t.key]).length : 0;
      if (confirm(n ? `이 스레드와 스레드에서 만든 파일 ${n}개를 지울까요?` : '이 스레드를 지울까요?')) dropThreads([b.dataset.k]);
      return;
    }
    curKey = b.dataset.k; save('cx.cur', curKey); openThread();
  });
  // 강사 모드에서만: 스레드 지우기 — 대화 기록과 함께 그 스레드에서 만든·올린 파일도 브리지 PC에서 지운다
  const isPresenter = () => !!(window.LiveAPI && window.LiveAPI.presenter);
  function filesOf(t) {   // 스레드가 기억한 파일 + (예전 스레드) 대화 기록에 남은 파일 버튼
    const s = new Set(t.files || []);
    const tpl = document.createElement('template'); tpl.innerHTML = t.html || '';
    tpl.content.querySelectorAll('.m-files [data-open]').forEach(b => s.add(b.dataset.open));
    return s;
  }
  function ownFiles(keys) {   // 지울 스레드의 파일 중 남는 스레드가 쓰지 않는 것
    const keep = new Set(); threads.filter(t => !keys.includes(t.key)).forEach(t => filesOf(t).forEach(f => keep.add(f)));
    const out = new Set(); threads.filter(t => keys.includes(t.key)).forEach(t => filesOf(t).forEach(f => keep.has(f) || out.add(f)));
    return [...out];
  }
  async function dropThreads(keys, all = false) {   // all: 「모두 지우기」 — 작업 폴더를 비운다
    const paths = ownFiles(keys);
    const pcs = new Set(allPCs().filter(u => stat[u] && stat[u].ok));
    threads.filter(t => keys.includes(t.key)).forEach(t => [t.bridge, ...(t.pcs || [])].forEach(u => u && pcs.add(u)));
    threads = threads.filter(t => !keys.includes(t.key)); save('cx.threads', threads);
    if (!cur()) { curKey = null; save('cx.cur', null); }
    openThread();
    if (!all && !paths.length) return;
    const body = JSON.stringify(all ? { all: true } : { paths });
    await Promise.all([...pcs].map(u => fetchT(u + '/delete', { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }), body }).catch(() => {})));
    files = []; refreshFiles();
  }
  $('cxClearAll').addEventListener('click', () => {
    if (busy || !isPresenter() || !threads.length) return;
    if (confirm(`스레드 ${threads.length}개와 작업 폴더의 파일을 모두 지울까요?`)) dropThreads(threads.map(t => t.key), true);
  });
  const showDel = () => {
    const on = isPresenter(); root.classList.toggle('cx-presenter', on); $('cxClearAll').hidden = !on || view === 'all'; $('cxView').hidden = !on;
    if (!on && view === 'all') setView('mine');
  };

  // ---------- 강사 모드: 모든 참가자의 스레드 보기 ----------
  // 브리지마다 /admin/turns(강사 서명이 있어야 열림)로 참가자별 실행 기록을 받아, 참가자를 고르면 그 사람의 요청·답·만든 파일을 읽기 전용으로 보여 준다.
  let view = 'mine', allTurns = [], allSel = null, allT = null, allErr = '', adminTok = null;
  const RUNNING = { done: '완료', failed: '실패', stopped: '중지', running: '작업 중' };
  async function adminHdr() {
    if (!adminTok || Date.now() - adminTok.t > 5 * 60000) { const t = Date.now(); adminTok = { t, v: t + '.' + await window.LiveAPI.sign('cx-admin|' + t) }; }
    return hdr({ 'X-CX-Admin': adminTok.v });
  }
  async function loadAll() {
    if (view !== 'all' || !isPresenter()) return;
    const pcs = allPCs().filter(u => stat[u] && stat[u].ok), out = []; let denied = 0;
    let h; try { h = await adminHdr(); } catch { allErr = '강사 모드 서명을 만들지 못했습니다.'; return renderAll(); }
    await Promise.all(pcs.map(async u => {
      try { const r = await fetchT(u + '/admin/turns', { headers: h }, 8000); if (!r.ok) { denied++; return; } const j = await r.json(); for (const t of j.turns || []) out.push(Object.assign(t, { pc: u })); }
      catch { /* 그 PC는 건너뜀 */ }
    }));
    allTurns = out.sort((a, b) => a.at - b.at);
    allErr = !pcs.length ? '연결된 PC가 없습니다.' : denied === pcs.length ? '브리지가 예전 버전이라 기록을 볼 수 없습니다. 새 bat으로 다시 켜 주세요.' : '';
    renderAll();
  }
  // ---------- 강사 모드: 수강생 작업이 끝나면 강사 화면에 잠깐 알림 ----------
  // 10초마다 브리지들의 실행 기록(/admin/turns)에서 새로 끝난 작업만 골라 오른쪽 아래에 5초 동안 띄운다(어느 슬라이드에서든).
  let watchFrom = 0, watchT = null;
  const seenDone = new Set();
  const toastBox = document.createElement('div'); toastBox.className = 'cx-toasts'; document.body.appendChild(toastBox);
  function toast(html, bad) {
    const t = document.createElement('div'); t.className = 'cx-toast' + (bad ? ' bad' : ''); t.innerHTML = html;
    toastBox.appendChild(t); while (toastBox.children.length > 4) toastBox.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 5000);
  }
  async function watchDone() {
    if (!isPresenter()) { watchFrom = 0; return; }
    if (!allPCs().some(u => stat[u] && stat[u].ok) && Date.now() - (watchDone.h || 0) > 60000) { watchDone.h = Date.now(); await healthAll(); }   // 연결 찾기는 1분에 한 번만
    const pcs = allPCs().filter(u => stat[u] && stat[u].ok); if (!pcs.length) return;
    const first = !watchFrom; if (first) watchFrom = Date.now();
    let h; try { h = await adminHdr(); } catch { return; }
    await Promise.all(pcs.map(async u => {
      try {
        const r = await fetchT(`${u}/admin/turns?since=${watchFrom - 3600e3}`, { headers: h }, 8000); if (!r.ok) return;
        for (const t of (await r.json()).turns || []) {
          const k = u + '|' + t.id;
          if (t.status === 'running' || seenDone.has(k)) continue;
          seenDone.add(k);
          if (first || t.sid === sid || !(t.endedAt > watchFrom)) continue;   // 강사 모드를 켜기 전에 끝난 것·내 작업은 알리지 않는다
          const who = esc(t.name || '참가자 ' + String(t.sid).slice(0, 4)), f = (t.files || [])[0];
          toast(t.status === 'done'
            ? `<b>✅ ${who}</b> 작업 완료${f ? `<small>${esc(f)}${t.files.length > 1 ? ` 외 ${t.files.length - 1}개` : ''}</small>` : ''}`
            : `<b>⚠️ ${who}</b> 작업이 ${t.status === 'stopped' ? '중지됐어요' : '실패했어요'}`, t.status !== 'done');
        }
      } catch { /* 그 PC는 건너뜀 */ }
    }));
  }
  function startWatch() { clearInterval(watchT); watchT = null; if (isPresenter()) { watchDone(); watchT = setInterval(watchDone, 10000); } else watchFrom = 0; }
  document.addEventListener('presenterchange', startWatch);
  setTimeout(startWatch, 1500);   // 새로 고침으로 강사 모드가 이어진 경우

  // 모두 보기: 한 참가자의 실행 기록과 작업 폴더 파일을 그 PC에서 지운다(강사 서명 필요)
  async function dropPerson(key) {
    if (!isPresenter()) return;
    const p = people().find(x => x.key === key); if (!p) return;
    const who = p.name || '참가자 ' + p.sid.slice(0, 4);
    if (p.turns.some(t => t.status === 'running')) { add(`${esc(who)}은(는) 지금 작업 중이라 끝난 뒤에 지울 수 있어요.`, 'm-done'); return; }
    if (!confirm(`${who}의 작업 기록 ${p.turns.length}개와 작업 폴더 파일을 모두 지울까요?\n(그 참가자 화면의 대화 기록은 그 기기에 남아요)`)) return;
    try {
      const r = await fetchT(p.pc + '/admin/delete', { method: 'POST', headers: await adminHdr().then(h => Object.assign(h, { 'Content-Type': 'application/json' })), body: JSON.stringify({ sid: p.sid }) }, 10000);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { alert(j.message || (r.status === 404 ? '브리지가 예전 버전입니다. 새 bat으로 다시 켜 주세요.' : '지우지 못했습니다.')); return; }
    } catch { alert('그 PC에 연결하지 못했습니다.'); return; }
    if (allSel === key) allSel = null;
    allTurns = allTurns.filter(t => !(t.pc === p.pc && t.sid === p.sid));
    renderAll(); loadAll();
  }
  // 모든 참가자의 mp4·webm 결과물(최신 것부터, 같은 파일은 한 번만)
  // 수강생이 올린 레퍼런스 영상(브리지가 보내 주는 uploads)과 이름이 참고·원본인 영상은 결과물이 아니므로 뺀다
  const REF_VID = /(^|[\/_\-. ])(ref|refs|reference|references|source|src|input|orig|original)([\/_\-. ]|\d|$)|레퍼런스|참고|원본/i;
  const isRefVid = f => REF_VID.test(f) && !/(subtitl|caption|자막|final|output|render|result|결과|완성)/i.test(f);
  function gallery() {
    const seen = new Set(), out = [];
    for (const t of [...allTurns].sort((a, b) => (b.endedAt || b.at) - (a.endedAt || a.at))) {
      if (t.status === 'running') continue;
      const up = new Set(t.uploads || []);
      for (const f of t.files || []) {
        if (!/\.(mp4|webm)$/i.test(f) || up.has(f) || isRefVid(f)) continue;
        const key = t.pc + '|' + t.sid + '|' + f; if (seen.has(key)) continue; seen.add(key);
        out.push({ key, f, pc: t.pc, sid: t.sid, at: t.endedAt || t.at, who: t.name || '참가자 ' + String(t.sid).slice(0, 4),
          url: `${t.pc}/ws/${t.sid}/${f.split('/').map(encodeURIComponent).join('/')}` });
      }
    }
    return out;
  }
  const people = () => {   // PC+세션 단위로 묶기
    const m = new Map();
    for (const t of allTurns) { const k = t.pc + '|' + t.sid; if (!m.has(k)) m.set(k, { key: k, pc: t.pc, sid: t.sid, name: '', turns: [] }); const p = m.get(k); p.turns.push(t); if (t.name) p.name = t.name; }
    return [...m.values()].sort((a, b) => b.turns[b.turns.length - 1].at - a.turns[a.turns.length - 1].at);
  };
  const hhmm = t => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  function renderAll(scrollDown) {
    if (view !== 'all') return;
    const ps = people();
    $('cxNavLabel').textContent = `참가자 ${ps.length}명`;
    const vids = gallery();
    $('cxThreads').innerHTML = `<button class="cx-thread cx-galbtn${!allSel ? ' on' : ''}" data-gal><span>🎬 결과물 영상 모아 보기</span><small>영상 ${vids.length}개</small></button>` + (ps.length ? ps.map(p => {
      const last = p.turns[p.turns.length - 1], run = p.turns.some(t => t.status === 'running');
      return `<button class="cx-thread${p.key === allSel ? ' on' : ''}" data-p="${esc(p.key)}"><span>${esc(p.name || '참가자 ' + p.sid.slice(0, 4))}${p.sid === sid ? ' (나)' : ''}</span><small>${run ? '<b class="run">작업 중</b> · ' : ''}${p.turns.length}번 · ${hhmm(last.at)} · ${esc(labelOf(p.pc))}</small><i class="cx-del" title="이 참가자의 기록과 파일 지우기">✕</i></button>`;
    }).join('') : `<div class="cx-empty" style="font-size:13px;padding:10px">${esc(allErr || '아직 아무도 실행하지 않았어요')}</div>`);
    const p = ps.find(x => x.key === allSel);
    $('cxTitle').textContent = p ? (p.name || '참가자 ' + p.sid.slice(0, 4)) : `결과물 영상 ${vids.length}개`;
    if (!p) {   // 고른 참가자가 없으면 모든 참가자의 결과물 영상을 카드로 모아 보여 준다(바뀐 것이 있을 때만 다시 그려 영상이 처음부터 다시 불러와지지 않게)
      const sig = vids.map(v => v.key).join('|') + '|' + allErr;
      if (log.dataset.sig === sig && log.querySelector('.cx-gal, .cx-hello')) return;
      log.dataset.sig = sig;
      log.innerHTML = vids.length ? `<div class="cx-gal">${vids.map(v => `<button type="button" class="cx-gcard" data-open="${esc(v.f)}" data-pc="${esc(v.pc)}" data-sid="${esc(v.sid)}"><video src="${esc(v.url)}#t=1" preload="metadata" muted playsinline></video><b>${esc(v.who)}</b><small>${esc(v.f)} · ${hhmm(v.at)}</small></button>`).join('')}</div>`
        : `<div class="cx-hello"><h3>아직 결과물 영상이 없어요</h3><p>수강생이 mp4 영상을 만들면 여기에 모여요. 카드를 누르면 오른쪽에서 크게 재생됩니다.<br>왼쪽에서 참가자를 누르면 그 사람이 시킨 일과 답, 만든 파일이 보입니다.${allErr ? '<br><b>' + esc(allErr) + '</b>' : ''}</p></div>`;
      return;
    }
    log.dataset.sig = '';
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.innerHTML = p.turns.map(t => `<div class="m-user">${esc(t.prompt)}</div>`
        + (t.files.length ? `<div class="m-files"><div class="h">파일 변경 ${t.files.length}개</div>${t.files.map(f => `<button type="button" data-open="${esc(f)}" data-pc="${esc(p.pc)}" data-sid="${esc(p.sid)}"><span class="k add">파일</span>${esc(f)}</button>`).join('')}</div>` : '')
        + (t.answer ? `<div class="m-ai">${md(t.answer)}</div>` : '')
        + `<div class="m-done">${RUNNING[t.status] || esc(t.status)}${t.status === 'running' ? ' · ' + Math.round((Date.now() - t.at) / 1000) + '초째' : t.endedAt ? ' · ' + Math.round((t.endedAt - t.at) / 1000) + '초' : ''} · ${ENG[t.engine] || esc(t.engine)} · ${hhmm(t.at)} · ${esc(t.label || labelOf(p.pc))}</div>`).join('');
    if (scrollDown || atBottom) scroll();
  }
  function setView(v) {
    if (busy && v === 'all') { add('작업이 끝난 뒤에 볼 수 있어요.', 'm-done'); return; }
    view = v; root.classList.toggle('cx-allview', v === 'all');
    $('cxView').querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $('cxClearAll').hidden = !isPresenter() || v === 'all';
    clearInterval(allT);
    if (v === 'all') { allSel = null; renderAll(); loadAll(); allT = setInterval(() => root.classList.contains('active') && loadAll(), 5000); }
    else openThread();
  }
  $('cxView').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b && b.dataset.v !== view) setView(b.dataset.v); });
  document.addEventListener('presenterchange', showDel);
  showDel();
  $('cxNew').addEventListener('click', () => { if (busy) return; if (view === 'all') setView('mine'); curKey = null; save('cx.cur', null); openThread(); input.focus(); });
  function openThread() { items.clear(); const t = cur(); log.innerHTML = t ? t.html : ''; renderThreads(); renderHello(); scroll(); }
  function persist() {
    const t = cur(); if (!t || view === 'all') return;   // 모두 보기 화면을 내 스레드에 저장하지 않는다
    const clone = log.cloneNode(true); clone.querySelectorAll('.m-live').forEach(n => n.remove());
    t.html = clone.innerHTML.slice(-400000); t.at = Date.now();
    save('cx.threads', threads.slice(0, 30));
  }
  function renderHello() {
    // 같은 안내가 이미 떠 있으면 다시 그리지 않는다 — 연결 확인(4초마다)이 입장 코드 칸을 새로 그려 휴대폰 키보드가 닫히던 문제
    const kind = anyOnline() ? 'on' : code && otherCode ? 'other' + otherCode : !code ? 'nocode' : 'off';
    const h = log.querySelector('.cx-hello');
    if (h && h.dataset.kind === kind) return;
    if (h && h.contains(document.activeElement) && document.activeElement.matches('input')) return;   // 입력 중에는 건드리지 않는다
    if (h) h.remove();
    if (log.children.length) return;
    log.innerHTML = anyOnline()
      ? `<div class="cx-hello"><img src="assets/img/chatgpt-buddy.png" alt=""><h3>무엇을 만들어 볼까요?</h3><p>아래 칩을 누르거나 직접 입력해 보세요.<br>만든 결과물은 오른쪽 미리보기에 바로 나타납니다.</p></div>`
      : code && otherCode ? `<div class="cx-hello"><img src="assets/img/chatgpt-buddy.png" alt=""><h3>입장 코드가 달라요</h3><p>켜져 있는 강사 PC ${otherCode}대를 찾았지만 입장 코드(<b>${esc(code)}</b>)가 맞지 않습니다.<br>브리지 창에 보이는 <b>입장 코드</b>를 넣어 주세요.</p><form class="cx-codeform"><input class="cx-codein" inputmode="numeric" autocomplete="off" placeholder="입장 코드"><button type="submit" class="cx-retry">연결</button></form></div>`
      : !code ? `<div class="cx-hello"><img src="assets/img/chatgpt-buddy.png" alt=""><h3>입장 코드를 넣어 주세요</h3><p>강사가 알려 준 입장 코드를 넣으면<br>켜져 있는 강사 PC를 자동으로 찾아 연결합니다.</p><form class="cx-codeform"><input class="cx-codein" inputmode="numeric" autocomplete="off" placeholder="입장 코드"><button type="submit" class="cx-retry">연결</button></form></div>`
      : `<div class="cx-hello"><img src="assets/img/chatgpt-buddy.png" alt=""><h3>${ENG[engine]}에 연결되지 않았어요</h3><p>강사가 나눠 준 <b>참가 링크</b>로 들어왔는지 확인해 주세요.<br>강사 PC에서는 <code>codex-bridge\\start-codex-bridge.bat</code>을 실행한 뒤<br>왼쪽 아래 <b>연결 관리</b>에 연결 주소를 넣습니다.</p><button class="cx-retry" type="button">다시 연결</button></div>`;
    const nh = log.querySelector('.cx-hello'); if (nh) nh.dataset.kind = kind;
    const cf = log.querySelector('.cx-codeform');
    if (cf) { cf.onsubmit = e => { e.preventDefault(); const v = cf.querySelector('input').value.trim(); if (!v) return; code = v; save('cx.code', code); log.innerHTML = ''; renderHello(); poll(true); }; return; }
    const r = log.querySelector('.cx-retry'); if (r) r.onclick = () => poll(true);
  }

  // ---------- 보내기 ----------
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(200, input.scrollHeight) + 'px'; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', e => { e.preventDefault(); send(); });
  stopBtn.addEventListener('click', () => { if (curJob) fetchT(curJob.bridge + '/stop', { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }), body: JSON.stringify({ jobId: curJob.id }) }).catch(() => {}); curJob && (curJob.stopped = true); });

  function setBusy(v) { busy = v; sendBtn.hidden = v; stopBtn.hidden = !v; renderStatus(); }
  function live(text) {
    if (!liveEl || !liveEl.isConnected) { liveEl = document.createElement('div'); liveEl.className = 'm-live'; log.appendChild(liveEl); }
    liveEl.dataset.t = text;
    liveEl.textContent = `${text} · ${Math.round((Date.now() - turnStart) / 1000)}초`;
    scroll();
  }
  // 다른 PC로 옮길 때 함께 보낼 앞선 대화 요약
  function contextSummary() {
    const us = [...log.querySelectorAll('.m-user')].slice(-4, -1).map(e => '- 사용자: ' + e.childNodes[0].textContent.trim().slice(0, 300));
    const ai = [...log.querySelectorAll('.m-ai')].slice(-1).map(e => '- AI: ' + e.textContent.trim().slice(0, 600));
    return us.length || ai.length ? `(앞선 대화 — 다른 PC에서 하던 작업을 이어서 합니다. 그때 만든 파일은 이 작업 폴더에 없을 수 있습니다.)\n${us.concat(ai).join('\n')}\n\n이번 요청:\n` : '';
  }

  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;
    if (!anyOnline()) await healthAll();
    if (!anyOnline()) { renderHello(); add('AI 브리지에 연결되지 않았습니다. 참가 링크와 강사 PC의 브리지 창을 확인해 주세요.', 'm-err'); return; }
    const hello = log.querySelector('.cx-hello'); if (hello) hello.remove();
    let t = cur();
    if (!t) { t = { key: 'k' + Date.now(), threadId: null, bridge: null, title: text.replace(/\s+/g, ' ').slice(0, 40), at: Date.now(), html: '' }; threads.unshift(t); curKey = t.key; save('cx.cur', curKey); }
    const att = attach.slice();
    if (att.length) t.files = [...new Set([...(t.files || []), ...att])];   // 올린 파일도 이 스레드 것으로
    const images = att.filter(p => /\.(png|jpe?g|webp|gif)$/i.test(p));
    let prompt = text + (att.length ? `\n\n(첨부 파일 — 작업 폴더에 있음: ${att.join(', ')})` : '');
    add(esc(text) + (att.length ? `<span class="att">📎 ${att.map(esc).join(', ')}</span>` : ''), 'm-user');
    input.value = ''; autosize(); attach = []; renderAttach(); renderThreads();

    turnFiles = new Set(); turnStart = Date.now(); items.clear();
    setBusy(true); live('생각 중');
    clearInterval(liveT); liveT = setInterval(() => liveEl && live(liveEl.dataset.t), 1000);
    let completed = false;
    const tried = [], origBridge = t.bridge, origEng = t.engine;
    let noted = false;
    try {
      for (let attempt = 0; attempt < allPCs().length * 2 + 1 && !completed; attempt++) {
        // 이 스레드가 쓰던 PC가 (고른 엔진으로) 되면 그대로(대화 이어 가기), 아니면 다른 PC로 옮긴다
        const fresh = u => u && usable(u) && engOK(u) && !tried.includes(u + '|' + runEng(u));
        let target = fresh(t.bridge) ? t.bridge : null;
        let moved = false;
        if (!target) {
          target = fresh(home) ? home : (await claim(tried)) || pick(tried);
          if (!target) { await healthAll(); target = (await claim(tried)) || pick(tried); }
          if (!target) throw new Error(tried.length ? '연결된 모든 PC가 꺼져 있거나 사용량이 다 찼습니다.' : 'AI 브리지에 연결할 수 있는 PC가 없습니다.');
        }
        const eng = runEng(target);
        tried.push(target + '|' + eng);
        moved = !!origBridge && (target !== origBridge || (origEng && eng !== origEng));
        const resume = target === t.bridge && eng === t.engine ? t.threadId : null;
        const body = { prompt: (moved || (!resume && log.querySelectorAll('.m-user').length > 1) ? contextSummary() : '') + prompt, text, engine: eng, threadId: resume, images: target === home ? images : [] };
        if (moved && !noted) {
          noted = true;
          add(target === origBridge || usable(origBridge) ? `🔁 ${esc(ENG[eng])}(으)로 바꿔 이어 갑니다.` : `🔁 ${esc(labelOf(origBridge))}에 연결할 수 없어 ${esc(labelOf(target))}(으)로 옮겨 이어 갑니다.`, 'm-done');
        }
        const r = await runOn(target, body, t);
        if (r === 'done') completed = true;
        else if (r === 'stopped' || r === 'failed') break;
        else { // 'retry' : 그 PC가 꺼짐·바쁨·사용량 초과 → 다음 PC
          if (t.bridge === target) { t.bridge = null; t.engine = null; t.threadId = null; }
          if (home === target) { home = null; save('cx.home', null); }
          await healthAll();
        }
      }
    } catch (err) {
      add(esc(err.message), 'm-err');
    } finally {
      clearInterval(liveT); if (liveEl) liveEl.remove(); liveEl = null; curJob = null;
      if (completed) add(`작업 완료 · ${Math.round((Date.now() - turnStart) / 1000)}초 · ${t.engine ? ENG[t.engine] + ' · ' : ''}${esc(labelOf(t.bridge || home || ''))}`, 'm-done');
      setBusy(false); persist(); renderThreads();
      await refreshFiles(true);
    }
  }

  // 한 PC에서 실행 → 'done' | 'retry' | 'stopped' | 'failed'
  async function runOn(u, body, t) {
    let r, j;
    try {
      r = await fetchT(u + '/run', { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }, 15000);
      j = await r.json().catch(() => ({}));
    } catch { stat[u] = { ok: false, info: {} }; return 'retry'; }
    if (r.status === 401) { add('입장 코드가 맞지 않습니다. 강사에게 참가 링크를 다시 받아 주세요.', 'm-err'); openSettings(); return 'failed'; }
    if (r.status === 429 || r.status === 503) { if (r.status === 503) markLimited(u, body.engine); return 'retry'; }
    if (!r.ok) { add(esc(j.message || ('오류 ' + r.status)), 'm-err'); return 'failed'; }
    const ranEng = j.engine || body.engine;   // 프롬프트에 다른 엔진의 모델을 적으면 브리지가 엔진을 바꿔 실행한다
    if (t.bridge !== u || t.engine !== ranEng) { t.bridge = u; t.engine = ranEng; t.threadId = ranEng === body.engine ? body.threadId || null : null; }
    if (j.model) add(`🧠 ${esc(j.model)} 모델로 실행합니다.`, 'm-done');
    renderStatus();
    if (!home || !usable(home)) { home = u; save('cx.home', home); }
    curJob = { bridge: u, id: j.jobId };
    let from = 0, failSince = 0, done = false, completed = false, limited = false;
    while (!done) {
      await sleep(from ? 900 : 400);
      let p;
      try { const pr = await fetchT(`${u}/job/${j.jobId}?from=${from}`, { headers: hdr() }, 10000); p = await pr.json(); if (!pr.ok) throw new Error(p.message); failSince = 0; }
      catch (e) {
        // 다른 탭을 보거나 화면이 꺼지면 브라우저가 요청을 멈춘다 → 화면이 보이는 동안 1분 넘게 안 될 때만 끊긴 것으로 본다(작업은 브리지에서 계속된다)
        if (p && p.error === 'nojob') { add(`${esc(labelOf(u))}가 다시 켜져 작업을 이어 받을 수 없습니다.`, 'm-err'); stat[u] = { ok: false, info: {} }; return completed ? 'done' : 'retry'; }
        if (document.hidden) { failSince = 0; continue; }
        if (!failSince) failSince = Date.now();
        if (Date.now() - failSince > 60000) { add(`${esc(labelOf(u))}의 응답이 끊겼습니다.`, 'm-err'); stat[u] = { ok: false, info: {} }; return completed ? 'done' : 'retry'; }
        continue;
      }
      for (const ev of p.events) {
        if (ev.type === 'bridge.limited') { limited = true; markLimited(u, ev.engine || body.engine); continue; }
        if (ev.type === 'thread.started' && !t.threadId) { t.threadId = ev.thread_id; persist(); }
        if (handle(ev)) completed = true;
      }
      from = p.next; done = p.done;
    }
    if (completed) return 'done';
    if (curJob && curJob.stopped) { add('작업을 멈췄습니다.', 'm-done'); return 'stopped'; }
    if (limited) { add(`${esc(labelOf(u))}의 ${ENG[body.engine] || 'AI'} 사용량이 다 찼습니다. 다른 PC나 다른 AI로 옮깁니다.`, 'm-done'); return 'retry'; }
    return 'failed';
  }

  // ---------- Codex 이벤트 ----------
  const quiet = m => /unrecognized configuration|failed to parse hooks config/i.test(m || '');
  function handle(ev) {
    switch (ev.type) {
      case 'turn.started': live('생각 중'); return false;
      case 'turn.completed': return true;
      case 'turn.failed': add('작업 실패: ' + esc(ev.error && ev.error.message || ''), 'm-err'); return false;
      case 'error': if (!quiet(ev.message)) add(esc(ev.message), 'm-err'); return false;
      case 'bridge.error': add(esc(ev.message), 'm-err'); return false;
      case 'bridge.exit': if (ev.code && ev.stderr) add('AI 종료(코드 ' + ev.code + ')\n' + esc(ev.stderr), 'm-err'); return false;
      case 'item.started': case 'item.updated': case 'item.completed': item(ev.item || {}, ev.type === 'item.completed'); return false;
    }
    return false;
  }
  function item(it, done) {
    let el = items.get(it.id);
    switch (it.type) {
      case 'agent_message':
        if (!done) return;
        el = el || add('', 'm-ai'); el.innerHTML = md(it.text || ''); items.set(it.id, el); live('정리 중'); break;
      case 'reasoning': {
        const txt = (it.text || '').replace(/\*\*/g, '').trim();
        if (!txt) return;
        el = el || add('', 'm-think'); el.innerHTML = `<span>💭</span><span class="t">${esc(txt)}</span>`; items.set(it.id, el); live('생각 중'); break;
      }
      case 'command_execution': {
        const cmd = prettyCmd(it.command || '');
        if (!el) { el = document.createElement('details'); el.className = 'm-tool'; log.insertBefore(el, liveEl); items.set(it.id, el); }
        const st = it.status === 'in_progress' || it.exit_code == null && !done ? '<span class="st run">실행 중</span>'
          : it.exit_code === 0 ? '<span class="st ok">완료</span>' : `<span class="st bad">실패 ${it.exit_code ?? ''}</span>`;
        const out = (it.aggregated_output || '').trim();
        el.innerHTML = `<summary><span class="ic">$</span><code>${esc(cmd)}</code>${st}</summary>${out ? `<pre>${esc(out.slice(-6000))}</pre>` : ''}`;
        live(done ? '생각 중' : '명령 실행 중'); scroll(); break;
      }
      case 'file_change': {
        const ch = it.changes || [];
        ch.forEach(c => turnFiles.add(relPath(c.path)));
        el = el || add('', 'm-files'); items.set(it.id, el);
        el.innerHTML = `<div class="h">파일 변경 ${ch.length}개</div>` + ch.map(c => { const p = relPath(c.path); return `<button type="button" data-open="${esc(p)}"><span class="k ${esc(c.kind)}">${{ add: '추가', update: '수정', delete: '삭제' }[c.kind] || esc(c.kind)}</span>${esc(p)}</button>`; }).join('');
        live('파일 만드는 중'); break;
      }
      case 'todo_list':
        el = el || add('', 'm-todo'); items.set(it.id, el);
        el.innerHTML = (it.items || []).map(x => `<div class="${x.completed ? 'y' : ''}">${x.completed ? '☑' : '☐'} ${esc(x.text)}</div>`).join(''); break;
      case 'web_search':
        if (!el) { el = add('', 'm-think'); items.set(it.id, el); }
        el.innerHTML = `<span>🔎</span><span class="t">검색: ${esc(it.query || '')}</span>`; live('검색 중'); break;
      case 'mcp_tool_call':
        if (!el) { el = add('', 'm-think'); items.set(it.id, el); }
        el.innerHTML = `<span>🔌</span><span class="t">${esc(it.server || '')} · ${esc(it.tool || '')} ${done ? '완료' : '실행 중'}</span>`; break;
      case 'error':
        if (!quiet(it.message)) add(esc(it.message), 'm-err'); break;
    }
  }
  function prettyCmd(c) {
    const m = /^"?[^"]*?(powershell|pwsh|cmd)(\.exe)?"?\s+(-NoProfile\s+)?(-Command|\/c)\s+([\s\S]*)$/i.exec(c);
    let s = m ? m[5] : c;
    if (/^".*"$/s.test(s)) s = s.slice(1, -1);
    return s.replace(/\\"/g, '"');
  }
  log.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); preview(b.dataset.open, b.dataset.pc, b.dataset.sid); } });

  function md(src) {
    const blocks = []; let s = String(src).replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => { blocks.push(code); return `\u0000${blocks.length - 1}\u0000`; });
    s = esc(s)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, txt, href) => {
        const h = href.replace(/&amp;/g, '&');
        if (/^https?:/i.test(h)) return `<a href="${esc(h)}" target="_blank" rel="noopener">${txt}</a>`;
        return `<a class="file" data-open="${esc(relPath(h.replace(/^file:\/\/\/?/, '').replace(/#.*$/, '')))}">${txt}</a>`;
      });
    const out = []; let list = null;
    for (const line of s.split('\n')) {
      const ul = /^\s*[-*]\s+(.*)/.exec(line), ol = /^\s*\d+[.)]\s+(.*)/.exec(line);
      if (ul || ol) { const tag = ul ? 'ul' : 'ol'; if (!list || list.tag !== tag) { if (list) out.push(`</${list.tag}>`); list = { tag }; out.push(`<${tag}>`); } out.push(`<li>${(ul || ol)[1]}</li>`); continue; }
      if (list) { out.push(`</${list.tag}>`); list = null; }
      out.push(line.trim() ? `<p>${line}</p>` : '');
    }
    if (list) out.push(`</${list.tag}>`);
    return out.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => `<pre><code>${esc(blocks[i])}</code></pre>`);
  }

  // ---------- 파일 · 미리보기 (내 PC의 내 작업 폴더) ----------
  const filesPC = () => { const t = cur(); return (t && t.bridge && usable(t.bridge) && t.bridge) || ensureHome(); };
  async function refreshFiles(afterTurn) {
    const u = filesPC(); if (!u) return;
    try { const r = await fetchT(u + '/files', { headers: hdr() }); files = (await r.json()).files || []; } catch { return; }
    files.pc = u;
    renderFiles();
    if (afterTurn) {
      const fresh = files.filter(f => turnFiles.has(f.path) || f.mtime >= turnStart - 1000);
      const t = cur();   // 이 스레드가 만든 파일과 PC를 기억해 둔다(스레드를 지울 때 함께 지운다)
      if (t && fresh.length) { t.files = [...new Set([...(t.files || []), ...fresh.map(f => f.path)])]; t.pcs = [...new Set([...(t.pcs || []), u])]; persist(); }
      // 새 영상이 있으면 영상을 먼저(HyperFrames 는 index.html 과 mp4 를 함께 만든다), 없으면 HTML, 그다음 그림
      const pick_ = fresh.find(f => /\.(mp4|webm)$/i.test(f.path)) || fresh.find(f => /\.html?$/i.test(f.path)) || fresh.find(f => /\.(png|jpe?g|gif|webp|svg|pdf)$/i.test(f.path));
      if (pick_) preview(pick_.path);
    }
  }
  function renderFiles() {
    const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB';
    $('cxFiles').innerHTML = files.length ? files.map(f => `<div class="cx-file${f.mtime >= turnStart - 1000 && turnStart ? ' new' : ''}"><span class="n" data-open="${esc(f.path)}" title="${esc(f.path)}">${esc(f.path)}</span><span class="s">${fmt(f.size)}</span><a class="dl" href="${esc(dlUrl(files.pc, f.path))}" download title="내려받기">받기</a><button type="button" data-att="${esc(f.path)}" class="${attach.includes(f.path) ? 'on' : ''}">첨부</button></div>`).join('')
      : '<div class="cx-empty">작업 폴더가 비어 있어요</div>';
    const z = $('cxZip'), info = files.pc && stat[files.pc] && stat[files.pc].info;
    z.hidden = !(files.length && info && info.zip);
    if (!z.hidden) z.href = `${files.pc}/zip/${sid}`;
  }
  $('cxFiles').addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) return preview(o.dataset.open);
    const a = e.target.closest('[data-att]'); if (a) { const p = a.dataset.att; attach = attach.includes(p) ? attach.filter(x => x !== p) : [...attach, p]; renderAttach(); renderFiles(); }
  });
  function renderAttach() { $('cxAttach').innerHTML = attach.map(p => `<span>📎 ${esc(p)} <button type="button" data-rm="${esc(p)}" aria-label="빼기">✕</button></span>`).join(''); }
  $('cxAttach').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { attach = attach.filter(x => x !== b.dataset.rm); renderAttach(); renderFiles(); } });

  // 미리보기 칸이 숨었다가(다른 슬라이드·탭) 다시 보이면 iframe 을 다시 불러온다.
  // 결과물이 처음 한 번 창 크기로 화면을 맞추는 경우(0 크기에서 맞추면 빈 화면) 크기가 틀어지지 않게.
  let prevHidden = false;
  new ResizeObserver(() => {
    const b = $('cxPrevBox'), shown = b.offsetWidth > 0 && b.offsetHeight > 0;
    if (shown && prevHidden) { const f = b.querySelector('iframe'); if (f) f.src = f.src; }
    prevHidden = !shown;
  }).observe($('cxPrevBox'));
  function preview(p, pc, who) {   // pc·who: 모두 보기에서 다른 참가자의 파일을 열 때
    const u = pc || filesPC(); if (!p || !u) return;
    const url = wsUrl(u, p, who), box = $('cxPrevBox');
    tab('prev');
    $('cxPrevName').textContent = p;
    const open = $('cxPrevOpen'); open.href = url; open.hidden = false;
    const dl = $('cxPrevDl'); dl.href = url + '&dl=1'; dl.hidden = false;
    if (/\.(mp4|webm|mov)$/i.test(p)) {   // 소리 내며 재생, 브라우저가 막으면 음소거로 재생하고 '소리 켜기' 버튼을 보인다
      box.innerHTML = `<video src="${url}" controls playsinline></video>`;
      const v = box.querySelector('video');
      v.play().catch(() => {
        v.muted = true; v.play().catch(() => {});
        const b = document.createElement('button'); b.type = 'button'; b.className = 'cx-unmute'; b.textContent = '🔊 소리 켜기';
        b.onclick = () => { v.muted = false; v.play().catch(() => {}); b.remove(); };
        box.appendChild(b);
      });
    }
    else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(p)) box.innerHTML = `<img src="${url}" alt="">`;
    else if (/\.(html?|pdf|txt|md|css|js|json|srt|vtt)$/i.test(p)) box.innerHTML = `<iframe src="${url}" title="미리보기" allow="autoplay; fullscreen; clipboard-write"></iframe>`;
    else box.innerHTML = `<div class="cx-empty">${esc(p)}<br>미리보기를 지원하지 않는 파일입니다.<br><a href="${url}&dl=1" download>내려받기</a></div>`;
  }
  function tab(name) {
    document.querySelectorAll('.cx-tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    document.querySelectorAll('.cx-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === name));
    if (name === 'files') refreshFiles();
  }
  document.querySelector('.cx-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });

  // ---------- 올리기 ----------
  async function upload(list) {
    if (!anyOnline()) await healthAll();
    const u = filesPC();
    if (!u) { add('AI 브리지에 연결되지 않아 파일을 올릴 수 없습니다.', 'm-err'); return; }
    for (const f of list) {
      const note = add(`📎 ${esc(f.name)} 올리는 중…`, 'm-done');
      try {
        const r = await fetch(`${u}/upload?name=${encodeURIComponent(f.name)}`, { method: 'PUT', headers: hdr(), body: f });
        const j = await r.json(); if (!r.ok) throw new Error(j.message || j.error);
        note.textContent = `📎 ${j.path} 올림`;
        if (!attach.includes(j.path)) attach.push(j.path);
      } catch (err) { note.className = 'm-err'; note.textContent = `${f.name} 올리기 실패: ${err.message}`; }
    }
    renderAttach(); refreshFiles(); persist();
  }
  $('cxUpload').addEventListener('change', e => { upload([...e.target.files]); e.target.value = ''; });
  let dragN = 0;
  root.addEventListener('dragenter', e => { if (e.dataTransfer.types.includes('Files')) { dragN++; root.classList.add('dragging'); e.preventDefault(); } });
  root.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); });
  root.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; root.classList.remove('dragging'); } });
  root.addEventListener('drop', e => { e.preventDefault(); dragN = 0; root.classList.remove('dragging'); if (e.dataTransfer.files.length) upload([...e.dataTransfer.files]); });

  // ---------- 연결 관리 (강사용: 주소 넣기 · 참가 링크/QR 만들기) ----------
  const dlg = $('cxSet');
  function joinLink() {
    const pub = pool.filter(u => !/\/\/(localhost|127\.0\.0\.1)/.test(u));  // 자동으로 찾는 주소는 링크에 넣지 않아도 된다
    const base = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'https://midong-edutech.vercel.app/' : location.origin + location.pathname;  // 수강생은 Vercel 주소로
    const q = [pub.length ? 'cx=' + pub.map(encodeURIComponent).join(',') : '', code ? 'code=' + encodeURIComponent(code) : ''].filter(Boolean).join('&');
    return `${base}${q ? '?' + q : ''}#13`;
  }
  function renderSettings() {
    $('cxSetList').innerHTML = allPCs().map(u => {
      const s = stat[u], i = (s && s.info) || {};
      const st = !s ? '확인 중' : !s.ok ? '<b class="bad">꺼짐</b>' : !usable(u) ? '<b class="bad">사용량 초과</b>' : `<b class="ok">연결됨</b> · 실행 ${i.running || 0}/${i.capacity || '?'} · 참가 ${i.members || 0}${i.seats ? '/' + i.seats : ''}명`;
      const auto = found.includes(u) && !pool.includes(u);
      const eg = s && s.ok ? Object.keys(engsOf(u)).map(e => ` <em class="cx-engtag ${e}${has(u, e) ? '' : ' x'}">${ENG[e] || esc(e)}</em>`).join('') : '';
      return `<div class="cx-setrow"><div><b>${esc(labelOf(u))}${eg}${auto ? ' <em class="cx-auto">자동</em>' : ''}</b><small>${esc(u)}</small></div><span>${st}</span>${auto ? '' : `<button type="button" data-rm="${esc(u)}" title="빼기">✕</button>`}</div>`;
    }).join('') || '<div class="cx-empty">연결 주소가 없습니다</div>';
    $('cxSetCode').value = code;
    $('cxJoin').value = joinLink();
    $('cxJoinBox').hidden = false;
    drawQR(joinLink());
  }
  async function drawQR(text) {
    const box = $('cxQR'); box.innerHTML = '';
    if (!window.QRCode) {
      await new Promise(res => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    }
    if (window.QRCode) new window.QRCode(box, { text, width: 168, height: 168, correctLevel: window.QRCode.CorrectLevel.M });
    else box.textContent = 'QR을 만들지 못했습니다(인터넷 확인).';
  }
  function openSettings() { dlg.hidden = false; renderSettings(); healthAll(true).then(renderSettings); }
  $('cxSetOpen').addEventListener('click', openSettings);
  $('cxSetClose').addEventListener('click', () => { dlg.hidden = true; });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.hidden = true; });
  $('cxSetList').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; pool = pool.filter(u => u !== b.dataset.rm); save('cx.bridges', pool); renderSettings(); });
  $('cxSetAdd').addEventListener('submit', e => {
    e.preventDefault();
    const v = norm($('cxSetUrl').value); if (!/^https?:\/\//.test(v)) { $('cxSetUrl').focus(); return; }
    if (!pool.includes(v)) pool.push(v);
    save('cx.bridges', pool); $('cxSetUrl').value = '';
    renderSettings(); healthAll().then(renderSettings);
  });
  $('cxSetCode').addEventListener('change', e => { code = e.target.value.trim(); save('cx.code', code); renderSettings(); healthAll(true); });
  $('cxJoinCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('cxJoin').value); $('cxJoinCopy').textContent = '복사됨'; setTimeout(() => { $('cxJoinCopy').textContent = '복사'; }, 1500); } catch { $('cxJoin').select(); } });

  openThread();
  if (root.classList.contains('active')) poll();
})();
