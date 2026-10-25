// 실시간 의견 나누기 — "Claude와 ChatGPT로 ____을 할 수 있다."
//  - 빈칸에 예시를 타자 치듯 썼다 지웠다 한다.
//  - 수강자는 성별만 고르면 '미동초 ○○○' 이름이 정해지고(가상 나이스·에듀파인 이름과 같음), 의견이 채팅처럼 모두에게 보인다.
//  - 의견은 알림 채널(ntfy.sh)로 오간다. 강사 모드에서만 '비우기'를 할 수 있다(강사 서명).
(function () {
  const root = document.querySelector('.s-op'); if (!root) return;
  const TOPIC = 'midong-chat-46c645f1ccea7547', CH = 'https://ntfy.sh/' + TOPIC;
  const ID = window.MIDONG_ID;
  const $ = s => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- 빈칸 타자 효과 ----------
  // 오늘 연수에서 다룰 것(평가계획·공문·영상·게임 등)은 빼고 일상생활 예시만 (모두 받침으로 끝나 뒤의 '을'과 맞음)
  const EXAMPLES = ['가족 여행 계획', '일주일 식단', '냉장고 재료 요리법', '운동 루틴', '가계부 분석', '영어 회화 연습', '중고 거래 글', '이사 준비물 점검', '부모님 선물 고민', '반려견 훈련법', '건강검진 결과 해석'];
  const typed = $('.op-typed');
  // 빈칸에는 '내용을 입력해 주세요'와 예시(회색)가 번갈아 나온다. 빈칸을 누르면 그 자리에서 바로 쓴다.
  const PROMPT = '내용을 입력해 주세요';
  let ei = 0, ci = 0, del = false;
  const showPrompt = () => { typed.textContent = PROMPT; typed.classList.add('prompt'); };
  function tick() {
    const word = EXAMPLES[ei];
    if (!del) { ci++; if (ci >= word.length) { del = true; typed.textContent = word; return setTimeout(tick, 2600); } }
    else { ci--; if (ci <= 0) { del = false; ei = (ei + 1) % EXAMPLES.length; showPrompt(); return setTimeout(tick, 2600); } }
    typed.classList.remove('prompt');
    typed.textContent = word.slice(0, ci);
    setTimeout(tick, del ? 90 : 230);
  }
  showPrompt(); setTimeout(tick, 4000);

  // ---------- 의견 목록 ----------
  const list = $('.op-list'), count = $('.op-count');
  let msgs = [], seen = new Set(), clearedAt = 0;
  const myId = () => (ID.get() || {}).name;
  // 의견은 아래에 말풍선으로 하나씩 나타난다(올라온 순서대로, 최근 12개)
  const shown = new Set();
  function render() {
    const view = msgs.filter(m => m.t > clearedAt).sort((a, b) => a.t - b.t);
    count.textContent = view.length;
    if (!view.length) { list.innerHTML = '<div class="op-empty">아직 의견이 없어요. 첫 의견을 남겨 주세요!</div>'; shown.clear(); return; }
    list.innerHTML = view.slice(-12).map(m => {
      const isNew = !shown.has(m.id); shown.add(m.id);
      const mine = m.name === myId();
      return `<div class="op-chip ${m.g === 'm' ? 'm' : 'f'} ${mine ? 'me' : ''} ${isNew ? 'new' : ''}"><span class="op-nm">${m.g === 'm' ? '👨' : '👩'} 미동초 ${esc(m.name)}</span><span class="op-tx">${esc(m.text)}</span></div>`;
    }).join('');
  }
  async function onRaw(text) {
    let m; try { m = JSON.parse(text); } catch { return; }
    if (!m) return;
    if (m.clear) {   // 강사 서명이 맞는 '비우기'만 받는다
      if (window.LiveAPI && typeof m.p === 'string' && await window.LiveAPI.verify(m.p, m.s)) { const c = JSON.parse(m.p); if (c.t > clearedAt) { clearedAt = c.t; render(); } }
      return;
    }
    if (typeof m.id !== 'string' || seen.has(m.id) || typeof m.text !== 'string' || typeof m.name !== 'string') return;
    seen.add(m.id);
    msgs.push({ id: m.id, name: m.name.slice(0, 8), g: m.g === 'm' ? 'm' : 'f', text: m.text.slice(0, 80), t: +m.t || Date.now() });
    render();
  }
  // 강사 화면 맞추기(live.js)와 알림 채널 연결 하나를 같이 쓴다(학교 공용 인터넷 주소의 ntfy.sh 동시 연결 한도 때문).
  // 지난 12시간 의견도 그 연결로 먼저 들어오고, 다 들어온 뒤(잠잠해지면) 이미 쓰인 이름을 피해 내 이름을 정한다.
  function load() {
    render();
    const settle = () => { ensureMe(); renderMe(); };
    let meT = setTimeout(settle, 3000);   // 채널에 못 닿거나 지난 의견이 없으면 3초 뒤
    const onMsg = (text, old) => { onRaw(text); if (old) { clearTimeout(meT); meT = setTimeout(settle, 400); } };
    if (window.Ntfy) { window.Ntfy.listen(TOPIC, onMsg); return; }
    try { const es = new EventSource(CH + '/sse?since=12h'); es.onmessage = ev => { try { const e = JSON.parse(ev.data); if (e.event === 'message') onMsg(e.message, true); } catch { /* skip */ } }; } catch { /* noop */ }
  }

  // ---------- 참여(성별 → 이름) · 보내기 ----------
  // 기본은 여자 이름, 아래쪽 「남」을 누르면 남자 이름으로 바꾼다
  const input = $('.op-input'), who = $('.op-who'), blank = $('.op-blank');
  const taken = () => [...new Set(msgs.map(m => m.name))];
  const ensureMe = () => ID.get() || ID.pick('f', taken());
  function renderMe() {
    const me = ID.get();
    who.innerHTML = me ? `${me.g === 'm' ? '👨' : '👩'} <b>미동초 ${esc(me.name)}</b> · 빈칸을 눌러 써 보세요` : '';
    root.querySelectorAll('.op-gender [data-g]').forEach(b => b.classList.toggle('on', !!me && b.dataset.g === me.g));
  }
  root.addEventListener('click', e => {
    const g = e.target.closest('[data-g]');
    if (g) { const me = ID.get(); if (!me || me.g !== g.dataset.g) ID.pick(g.dataset.g, taken()); renderMe(); return; }
    if (e.target.closest('.op-clear')) clearAll();
  });
  async function send() {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const me = ensureMe(); renderMe();
    const m = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: me.name, g: me.g, text: text.slice(0, 80), t: Date.now() };
    input.value = ''; sync(); input.blur();   // 휴대폰 키보드를 내려 올라온 의견이 보이게
    root.classList.add('op-sent');
    onRaw(JSON.stringify(m));   // 내 화면에 바로
    try { await fetch(CH, { method: 'POST', body: JSON.stringify(m) }); } catch { /* 다시 보내지 않음 */ }
  }
  const sync = () => blank.classList.toggle('has', !!input.value);
  input.addEventListener('input', sync);
  // 한글 입력 중 Enter는 글자 조합이 끝난 뒤 보낸다
  let pending = false;
  input.addEventListener('keydown', e => {
    e.stopPropagation();   // 입력 중에는 슬라이드가 넘어가지 않게
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (e.isComposing || e.keyCode === 229) { pending = true; return; }
    send();
  });
  input.addEventListener('compositionend', () => { if (pending) { pending = false; setTimeout(send, 0); } });
  const sendBtn = $('.op-send');
  sendBtn.addEventListener('pointerdown', e => e.preventDefault());   // 누를 때 입력칸 포커스 유지
  sendBtn.addEventListener('click', send);

  // ---------- 강사: 비우기 ----------
  const clr = $('.op-clear');
  // 강사 화면: '비우기'만 보이고, 이름·보내기 줄과 성별 선택은 숨기고 문구를 크게 가운데로
  const showClear = () => { const on = !!(window.LiveAPI && window.LiveAPI.presenter); clr.hidden = !on; root.classList.toggle('op-presenter', on); };
  document.addEventListener('presenterchange', showClear);
  async function clearAll() {
    if (!window.LiveAPI || !window.LiveAPI.presenter) return;
    if (!confirm('지금까지 올라온 의견을 모두의 화면에서 비울까요?')) return;
    const p = JSON.stringify({ clear: true, t: Date.now() });
    try { const s = await window.LiveAPI.sign(p); await fetch(CH, { method: 'POST', body: JSON.stringify({ clear: true, p, s }) }); onRaw(JSON.stringify({ clear: true, p, s })); } catch { /* noop */ }
  }

  renderMe(); showClear();
  if (!/[?&]static/.test(location.search)) load(); else { render(); ensureMe(); renderMe(); }
})();
