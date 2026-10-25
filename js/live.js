// 강사 모드 — 강사 화면(슬라이드 번호·실습 안내 팝업)을 접속한 모든 사람에게 맞춘다.
//  - 강사: 「🎤 강사 모드」 → 강사 비밀번호 → 화면을 넘길 때마다 서명해서 알림 채널(ntfy.sh)에 올린다.
//  - 보는 사람: 채널을 듣다가 서명이 맞는 신호만 따라간다. 「따라가지 않기」로 끌 수 있다.
//  - 비밀번호가 없으면 서명할 수 없으므로 다른 사람이 화면을 움직일 수 없다.
(function () {
  // ---------- 알림 채널(ntfy.sh) 연결 하나로 ----------
  // ntfy.sh 는 같은 인터넷 주소에서 동시 연결 30개, 요청 60개(그다음 5초에 1개)까지만 받는다(넘으면 429).
  // 학교는 보통 모두가 주소 하나라, 기기마다 연결 2개(강사 신호·의견)와 처음 읽기 2번이면 15명쯤부터 끊긴다.
  // 그래서 이 화면이 듣는 채널을 연결 하나로 묶고, 지난 12시간 신호도 그 연결로 받는다(따로 읽지 않음): 기기당 요청 1번·연결 1개.
  // 끊기면(429 포함) 브라우저가 3초마다 다시 붙지 않게 닫고, 10초~3분 뒤(늘려 가며) 놓친 것부터 다시 받는다.
  // Ntfy.listen(채널, fn) — fn(글, 지난신호인가): 둘째 값은 연결 전에 올라와 있던 신호(들어올 때 훑기용)면 true.
  window.Ntfy = window.Ntfy || (() => {
    const subs = {};
    let es = null, timer = null, wait = 0, lastTime = 0, openTime = 0;
    function connect() {
      clearTimeout(timer); timer = null;
      if (es) { es.close(); es = null; }
      const topics = Object.keys(subs);
      if (!topics.length || typeof EventSource === 'undefined') return;
      es = new EventSource(`https://ntfy.sh/${topics.join(',')}/sse?since=${lastTime || '12h'}`);   // 같은 초 것은 다시 오지만 각자 거른다
      es.addEventListener('open', ev => {   // 연결 자체의 open 과 ntfy 의 'open' 신호(data 있음)가 같은 이름이다
        if (!ev.data) return;
        try { openTime = JSON.parse(ev.data).time; wait = 0; } catch { /* skip */ }
      });
      es.onmessage = ev => {
        let e; try { e = JSON.parse(ev.data); } catch { return; }
        if (e.event !== 'message') return;
        if (e.time > lastTime) lastTime = e.time;
        (subs[e.topic] || []).forEach(fn => { try { fn(e.message, e.time < openTime); } catch { /* skip */ } });
      };
      es.onerror = () => {
        es.close(); es = null;
        wait = wait ? Math.min(wait * 2, 180e3) : 10e3;
        timer = setTimeout(connect, wait * (1 + Math.random() / 2));   // 다 같이 한꺼번에 다시 붙지 않게 흩는다
      };
    }
    // 휴대폰에서 다른 앱에 갔다 오면 연결이 끊겨 있다 → 기다리지 않고 바로 다시 붙는다(사람이 돌아올 때만)
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !es && timer) connect(); });
    let queued = false;
    return {
      listen(topic, fn) {
        const fresh = !subs[topic];
        (subs[topic] = subs[topic] || []).push(fn);
        if (!fresh || queued) return;
        if (es) { lastTime = 0; connect(); return; }   // 늦게 붙은 채널: 처음부터 다시(드묾)
        // 같은 화면의 다른 기능도 붙도록 스크립트가 다 실행된 뒤 한 번에 연다
        queued = true;
        const go = () => { queued = false; connect(); };
        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go, { once: true }) : setTimeout(go, 0);
      }
    };
  })();

  const C = window.LIVE_CFG;
  if (!C || !window.crypto || !crypto.subtle) return;
  const CH = 'https://ntfy.sh/' + C.topic;
  const te = new TextEncoder();
  const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const ls = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* noop */ } } };

  let privKey = null, presenter = false;
  const keyReady = crypto.subtle.importKey('jwk', C.pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);   // 강사 신호 확인용 공개키
  let follow = ls.get('live.follow', true);
  let lastT = 0, liveAt = 0, liveState = null;
  // 강사 모드 음악: 'auto' = 1번(표지)에서만 자동, 'on' = 「음악 켬」으로 지금 화면에서, 'off' = 「음악 끔」으로 멈춤 — 화면을 넘기면 'auto'로
  let musicMode = 'auto';

  // ---------- 화면 ----------
  const bar = document.createElement('div');
  bar.id = 'liveBar'; bar.hidden = true;
  document.body.appendChild(bar);
  const dlg = document.createElement('div');
  dlg.id = 'liveDlg'; dlg.hidden = true;
  dlg.innerHTML = `<form class="live-box"><b>🎤 강사 모드</b><p>강사 비밀번호를 넣으면 지금 보고 있는 화면이<br>접속한 모든 사람에게 그대로 따라갑니다.</p>
    <input type="password" autocomplete="current-password" placeholder="강사 비밀번호"><div class="live-err" hidden>비밀번호가 맞지 않습니다.</div>
    <div class="live-btns"><button type="button" class="no">취소</button><button type="submit" class="yes">시작</button></div></form>`;
  document.body.appendChild(dlg);
  const hudBtn = document.getElementById('hudLive');

  // 강사가 지금 송출 중인가: 강사 화면은 4분마다 신호를 다시 보내므로, 최근 10분 안에 신호가 있었으면 송출 중으로 본다
  const isLive = () => Date.now() - liveAt < 10 * 60e3;
  setInterval(() => render(), 30e3);   // 강사 신호가 끊기면 표시를 거둔다
  function render() {
    const live = isLive();
    if (presenter) {
      bar.hidden = false; bar.className = 'on-air';
      bar.innerHTML = `<span class="dot"></span><span class="txt">강사 모드 · 화면 송출 중</span><button type="button" data-live="music" title="음악 켜기/끄기 — 켜면 어느 화면에서나 흐른다">${musicWant() ? '♪ 음악 끔' : '♪ 음악 켬'}</button><button type="button" data-live="stop">끄기</button>`;
    } else if (live) {
      bar.hidden = false; bar.className = follow ? 'following' : 'free';
      bar.innerHTML = follow
        ? `<span class="dot"></span><span class="txt">강사 화면 따라가는 중</span><button type="button" data-live="unfollow">따라가지 않기</button>`
        : `<span class="txt">자유롭게 보는 중</span><button type="button" data-live="follow">강사 화면 따라가기</button>`;
    } else bar.hidden = true;
    dock();
    if (hudBtn) hudBtn.classList.toggle('on', presenter);
    document.documentElement.classList.toggle('live-host', presenter);   // .host-only 버튼(강사 전용)
    if (!presenter && window.Deck) document.querySelectorAll('.guide-pop[data-host-only]:not([hidden])').forEach(p => window.Deck.guide(p.id, false));
    const viewer = !presenter && live && follow;
    if (document.documentElement.classList.contains('live-viewer') !== viewer) {
      document.documentElement.classList.toggle('live-viewer', viewer);
      document.dispatchEvent(new Event('liveviewer'));
    }
  }
  bar.addEventListener('click', e => {
    const a = e.target.closest('[data-live]'); if (!a) return;
    if (a.dataset.live === 'stop') stopPresenter();
    if (a.dataset.live === 'unfollow') { follow = false; ls.set('live.follow', false); render(); }
    if (a.dataset.live === 'follow') { follow = true; ls.set('live.follow', true); render(); if (liveState) apply(liveState); }
    if (a.dataset.live === 'music') { musicMode = musicWant() ? 'off' : 'on'; syncMusic(); }
  });

  // ---------- 강사 모드: 연수 시작 전·쉬는 시간 음악 ----------
  // 강사 모드를 켠 PC에서만 나온다(보는 사람 화면에서는 나오지 않는다). 기본은 1번(표지)에서만 자동으로 흐르고 다른 화면으로 넘기면 줄어들며 멈춘다.
  // 「음악 켬」을 누르면 지금 화면에서 흐르고, 「음악 끔」을 누르면 멈춘다. 화면을 넘기면 다시 기본으로 돌아간다. 영상 화면에서는 늘 멈춘다.
  // 곡: Suno로 만든 가사 없는 카페풍 연주곡 「연수 카페 모닝」 두 버전 — 끝나면 다음 곡으로 넘어가며 번갈아 흐른다
  const TRACKS = ['assets/audio/opening-1.mp3', 'assets/audio/opening-2.mp3'];
  let track = 0;
  const music = new Audio(TRACKS[0]);
  music.preload = 'none'; music.volume = 0;
  music.addEventListener('ended', () => { track = (track + 1) % TRACKS.length; music.src = TRACKS[track]; syncMusic(); });
  const MUSIC_VOL = 0.5;
  let fadeT = null;
  function fade(to, then) {
    clearInterval(fadeT);
    fadeT = setInterval(() => {
      const d = to - music.volume;
      if (Math.abs(d) <= 0.04) { music.volume = to; clearInterval(fadeT); if (then) then(); }
      else music.volume = Math.min(1, Math.max(0, music.volume + Math.sign(d) * 0.04));
    }, 60);
  }
  function musicWant() {
    if (!presenter || musicMode === 'off' || !window.Deck) return false;
    if (document.querySelector('.s-video.active')) return false;   // 영상 화면에서는 영상 소리와 겹치지 않게
    return musicMode === 'on' || window.Deck.n === 1;
  }
  function syncMusic() {
    const want = musicWant();
    const b = bar.querySelector('[data-live="music"]'); if (b) b.textContent = want ? '♪ 음악 끔' : '♪ 음악 켬';
    if (want) { if (music.paused) music.play().then(() => fade(MUSIC_VOL)).catch(() => { /* 첫 클릭 전에는 브라우저가 막는다 */ }); else fade(MUSIC_VOL); }
    else if (!music.paused) fade(0, () => music.pause());
  }
  document.addEventListener('slidechange', () => { musicMode = 'auto'; setTimeout(syncMusic, 0); });   // 화면을 넘기면 기본(1번에서만)으로 돌아간다 → 다른 화면에서는 꺼진다
  document.addEventListener('presenterchange', syncMusic);
  // 새로 고침으로 강사 모드가 이어지면 자동 재생이 막혀 있으므로, 첫 클릭·키 입력 때 다시 시도한다
  ['pointerdown', 'keydown'].forEach(t => addEventListener(t, () => { if (music.paused && musicWant()) setTimeout(syncMusic, 0); }, true));
  // 실습 화면(나이스·업무포털 등)에서는 위쪽 바 안으로 옮겨 ChatGPT 등 버튼을 가리지 않게 한다
  function dock() {
    const sp = document.querySelector('.app.active .appbar > .sp');
    if (sp) { if (sp.nextSibling !== bar) sp.after(bar); }
    else if (bar.parentNode !== document.body) document.body.appendChild(bar);
    bar.classList.toggle('docked', !!sp);
  }
  document.addEventListener('slidechange', dock);
  dock();

  // ---------- 강사 ----------
  async function unlock(pw) {
    const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
    const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ub64(C.enc.salt), iterations: C.enc.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const pk8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(C.enc.iv) }, aes, ub64(C.enc.data));   // 틀리면 여기서 실패
    privKey = await crypto.subtle.importKey('pkcs8', pk8, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  }
  async function startPresenter(pw) {
    await unlock(pw);
    presenter = true; ss.set('live.pw', pw);
    render(); publish(true);
    document.dispatchEvent(new Event('presenterchange'));
  }
  async function stopPresenter() {
    if (presenter && privKey) { try { await send({ end: true, t: Date.now() }); } catch { /* noop */ } }
    presenter = false; privKey = null; ss.set('live.pw', null); liveAt = 0; liveState = null; render();
    document.dispatchEvent(new Event('presenterchange'));
  }
  function openDlg() {
    if (presenter) { stopPresenter(); return; }
    dlg.hidden = false; dlg.querySelector('.live-err').hidden = true;
    const inp = dlg.querySelector('input'); inp.value = ''; setTimeout(() => inp.focus(), 30);
  }
  dlg.querySelector('.no').onclick = () => { dlg.hidden = true; };
  dlg.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const pw = dlg.querySelector('input').value;
    try { await startPresenter(pw); dlg.hidden = true; }
    catch { dlg.querySelector('.live-err').hidden = false; }
  };
  if (hudBtn) hudBtn.addEventListener('click', openDlg);
  addEventListener('keydown', e => {   // L 키로도 강사 모드
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'l' || e.key === 'L') openDlg();
  });

  async function send(st) {
    const p = JSON.stringify(st);
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, te.encode(p));
    await fetch(CH, { method: 'POST', body: JSON.stringify({ p, s: b64(sig) }) });
  }
  const state = () => {
    const g = document.querySelector('.guide-pop:not([hidden]):not([data-host-only])');   // 강사 전용 팝업은 보내지 않는다
    return { n: window.Deck ? window.Deck.n : null, g: g ? g.id : null, t: Date.now() };
  };
  let pubT = null, lastSent = '';
  function publish(now) {
    if (!presenter) return;
    clearTimeout(pubT);
    pubT = setTimeout(async () => {
      const st = state(); const key = st.n + '|' + st.g;
      if (!now && key === lastSent) return;
      lastSent = key;
      try { await send(st); } catch { /* 잠깐 끊김 — 다음 변경 때 다시 보냄 */ }
    }, now ? 0 : 250);
  }
  document.addEventListener('slidechange', () => publish());
  document.addEventListener('guidechange', () => publish());
  setInterval(() => presenter && publish(true), 4 * 60e3);   // 새로 들어온 사람도 맞추도록 4분마다 다시 알림

  // ---------- 보는 사람 ----------
  let applying = false;
  function apply(st) {
    if (!window.Deck || presenter) return;
    applying = true;
    try {
      if (st.n != null && window.Deck.n !== st.n) window.Deck.go(st.n);
      document.querySelectorAll('.guide-pop:not([data-host-only])').forEach(p => {
        const want = p.id === st.g;
        if (p.hidden === want) window.Deck.guide(p.id, want);
      });
    } finally { applying = false; }
  }
  async function onMessage(text, quiet) {   // quiet: 따라가지는 않고 상태만 기록(들어올 때 지난 신호 훑기용)
    let m; try { m = JSON.parse(text); } catch { return; }
    if (!m || typeof m.p !== 'string' || typeof m.s !== 'string') return;
    let ok = false;
    try { ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await keyReady, ub64(m.s), te.encode(m.p)); } catch { ok = false; }
    if (!ok) return;                                      // 강사 비밀번호로 서명되지 않은 신호는 무시
    const st = JSON.parse(m.p);
    if (!(st.t > lastT) || Date.now() - st.t > 12 * 3600e3) return;   // 예전 신호·되풀이 무시
    lastT = st.t;
    if (st.end) { liveAt = 0; liveState = null; render(); return; }   // 강사 모드 끝 → 따라가기 해제
    liveAt = Math.min(st.t, Date.now()); liveState = st;   // 신호를 보낸 시각(들어올 때 훑은 지난 신호는 그만큼 오래된 것)
    render();
    if (!quiet && follow && !presenter) apply(st);
  }
  // 들어오자마자(또는 다시 붙었을 때) 지난 신호를 훑고, 마지막 강사 화면 하나로만 맞춘다(이미 끝났으면 그대로)
  let catchT = null;
  function onLive(text, old) {
    if (!old) { onMessage(text); return; }
    onMessage(text, true).then(() => {
      clearTimeout(catchT);
      catchT = setTimeout(() => { if (liveState && follow && !presenter && isLive()) apply(liveState); }, 300);
    });
  }

  // 다른 기능(의견 나누기 비우기 등)이 강사 서명을 쓸 수 있게
  window.LiveAPI = {
    get presenter() { return presenter; },
    async sign(p) { if (!presenter || !privKey) throw new Error('강사 모드가 아닙니다'); return b64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, te.encode(p))); },
    async verify(p, s) { try { return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await keyReady, ub64(s), te.encode(p)); } catch { return false; } }
  };
  if (!/[?&]static/.test(location.search)) window.Ntfy.listen(C.topic, onLive);   // 의견 나누기와 연결 하나를 같이 쓴다
  (async () => {
    await keyReady;
    const saved = ss.get('live.pw');
    if (saved) { try { await startPresenter(saved); } catch { ss.set('live.pw', null); } }
    render();
  })();
})();
