/* 연수용 나이스 클론 - 화면 골격(헤더, 메가메뉴, LNB, MDI 탭, 팝업, 저장소) */
(function () {
  'use strict';
  const SEED = window.NEIS_SEED;
  const MENU = window.NEIS_MENU;
  const STORE_KEY = 'neis-training-v4-midong';

  /* ---------------- 저장소 ---------------- */
  const Store = {
    data: null,
    load() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; }
      // 다른 접속자로 저장된 연습 자료면 이름을 지금 접속자로 바꿔 이어 쓴다
      const me = window.NEIS_ME, old = saved && saved.user && saved.user.name;
      if (me && old && old !== me) saved = JSON.parse(JSON.stringify(saved).split(old).join(me));
      this.data = saved || JSON.parse(JSON.stringify(SEED));
      if (saved) {
        // 이전 버전에서 저장된 자료에 새 항목(결재·복무 등)이 없으면 예시 데이터로 채움
        Object.keys(SEED).forEach(k => { if (!(k in this.data)) this.data[k] = JSON.parse(JSON.stringify(SEED[k])); });
        this.data.staff = JSON.parse(JSON.stringify(SEED.staff));
      }
      return this.data;
    },
    save() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* 저장 불가 환경 */ }
    },
    reset() {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
      this.data = JSON.parse(JSON.stringify(SEED));
    }
  };
  Store.load();

  /* ---------------- 아이콘 ---------------- */
  const I = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4H5v16h9"/><path d="M10 12h10M16 8l4 4-4 4"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 3v18"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10h-6V4M14 10l7-7M4 14h6v6M10 14l-7 7"/></svg>',
    person: '<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="6" fill="#fff"/><path d="M5 29c0-7 5-11 11-11s11 4 11 11z" fill="#fff"/></svg>',
    personOff: '<svg viewBox="0 0 32 32" fill="none" stroke="#3772ff" stroke-width="2"><circle cx="16" cy="10" r="6"/><path d="M5 29c0-7 5-11 11-11s11 4 11 11z"/></svg>',
    list: '<svg viewBox="0 0 32 32" fill="none" stroke="#3772ff" stroke-width="2"><circle cx="16" cy="16" r="13"/><path d="M10 11h12M10 16h12M10 21h12"/></svg>',
    listOn: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2"><circle cx="16" cy="16" r="13"/><path d="M10 11h12M10 16h12M10 21h12"/></svg>',
    bell: '<svg viewBox="0 0 32 32" fill="none" stroke="#3772ff" stroke-width="2"><path d="M8 23V14a8 8 0 0116 0v9l2 2H6z"/><path d="M13 27a3 3 0 006 0"/></svg>',
    bellOn: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2"><path d="M8 23V14a8 8 0 0116 0v9l2 2H6z"/><path d="M13 27a3 3 0 006 0"/></svg>',
    search: '<svg viewBox="0 0 32 32" fill="none" stroke="#3772ff" stroke-width="2.4"><circle cx="13" cy="13" r="8"/><path d="M19 19l8 8" stroke="#f59e0b" stroke-width="3.4" stroke-linecap="round"/></svg>',
    searchOn: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4"><circle cx="13" cy="13" r="8"/><path d="M19 19l8 8" stroke-width="3.4" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 32 32" fill="none" stroke="#3772ff" stroke-width="2"><path d="M16 4l3.6 7.6 8.2 1-6 5.7 1.6 8.2L16 22.4 8.6 26.5l1.6-8.2-6-5.7 8.2-1z"/></svg>',
    starOn: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2"><path d="M16 4l3.6 7.6 8.2 1-6 5.7 1.6 8.2L16 22.4 8.6 26.5l1.6-8.2-6-5.7 8.2-1z"/></svg>',
    gear: '<svg viewBox="0 0 32 32" fill="#3772ff"><path d="M13.5 3h5l.8 3.4 2.4 1 3-1.8 3.5 3.5-1.8 3 1 2.4 3.4.8v5l-3.4.8-1 2.4 1.8 3-3.5 3.5-3-1.8-2.4 1-.8 3.4h-5l-.8-3.4-2.4-1-3 1.8-3.5-3.5 1.8-3-1-2.4L3 18.5v-5l3.4-.8 1-2.4-1.8-3 3.5-3.5 3 1.8 2.4-1z"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>',
    gearOn: '<svg viewBox="0 0 32 32" fill="#fff"><path d="M13.5 3h5l.8 3.4 2.4 1 3-1.8 3.5 3.5-1.8 3 1 2.4 3.4.8v5l-3.4.8-1 2.4 1.8 3-3.5 3.5-3-1.8-2.4 1-.8 3.4h-5l-.8-3.4-2.4-1-3 1.8-3.5-3.5 1.8-3-1-2.4L3 18.5v-5l3.4-.8 1-2.4-1.8-3 3.5-3.5 3 1.8 2.4-1z"/><circle cx="16" cy="16" r="5" fill="#3772ff"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="#6d7074" stroke-width="2"><path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="#6d7074"><path d="M10 2h4l.6 2.6 1.9.8 2.3-1.4 2.8 2.8-1.4 2.3.8 1.9L22 11.6v4l-2.6.6-.8 1.9 1.4 2.3-2.8 2.8-2.3-1.4-1.9.8L12.4 25h-4"/><circle cx="12" cy="12" r="9" fill="#6d7074"/><circle cx="12" cy="12" r="3.5" fill="#f2f4f6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" fill="none" stroke="#172f57" stroke-width="1.8"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#172f57" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="#3772ff" stroke-width="1.8"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    q: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5M12 17h.01"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><path d="M4 6h16v10H9l-5 4z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><rect x="3" y="5" width="18" height="15" rx="1"/><path d="M3 9h18M10 12l5 3-5 3z"/></svg>',
    starLine: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8l-5.5 2.9 1.2-6.1-4.5-4.2 6.1-.8z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" fill="#f5b400" stroke="#f5b400" stroke-width="1.6"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8l-5.5 2.9 1.2-6.1-4.5-4.2 6.1-.8z"/></svg>',
    page: '<svg viewBox="0 0 24 24" fill="none" stroke="#6d7074" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M9 11h6M9 15h6"/></svg>',
    lt: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>',
    gt: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>',
    xa: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 20L10 4l6 16" stroke="#e0262c"/><path d="M7 13h6" stroke="#e0262c"/><path d="M14 8l8 12M22 8l-8 12" stroke="#172f57"/></svg>',
    xx: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 4v8" stroke="#e0262c"/><path d="M8 6l12 14M20 6L8 20" stroke="#172f57"/></svg>',
    listview: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M4 14h16"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="2"><path d="M6 18L17 7M8 7h9v9"/></svg>',
    glass: '<svg viewBox="0 0 64 64"><circle cx="26" cy="26" r="17" fill="#dfe9f7" stroke="#8aa0bf" stroke-width="4"/><path d="M20 18a9 9 0 0110-3" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 38l16 16" stroke="#f0a020" stroke-width="8" stroke-linecap="round"/></svg>',
    searchSm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="1"/><path d="M7 14h10v7H7z"/></svg>',
    gearSm: '<svg viewBox="0 0 24 24" fill="none" stroke="#172f57" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
  };

  /* ---------------- 유틸 ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  // 나이스 바이트 계산: 한글 3byte, 영문·숫자·공백 1byte, 줄바꿈 2byte
  function nbytes(s) {
    let b = 0;
    for (const ch of String(s || '')) {
      if (ch === '\n') b += 2;
      else if (ch.charCodeAt(0) > 127) b += 3;
      else b += 1;
    }
    return b;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { return new Date(2026, 8, 30); } // 연수 기준일 고정: 2026.09.30

  /* ---------------- 팝업 ---------------- */
  function modal(opts) {
    const dim = el('<div class="dim"></div>');
    const pop = el(`<div class="popup" style="width:${opts.width || 640}px"><div class="p-hd"><h3>${esc(opts.title)}</h3><span class="x">${I.close}</span></div><div class="p-bd"></div><div class="p-ft"></div></div>`);
    const bd = $('.p-bd', pop);
    if (typeof opts.body === 'string') bd.innerHTML = opts.body; else if (opts.body) bd.appendChild(opts.body);
    const ft = $('.p-ft', pop);
    const close = () => dim.remove();
    (opts.buttons || [{ text: '닫기' }]).forEach(b => {
      const btn = el(`<button class="btn ${b.cls || ''}">${esc(b.text)}</button>`);
      btn.onclick = () => { if (b.onClick && b.onClick(close) === false) return; if (!b.keep) close(); };
      ft.appendChild(btn);
    });
    if (!ft.children.length) ft.remove();
    $('.x', pop).onclick = () => { if (opts.beforeClose && opts.beforeClose(close) === false) return; close(); };
    dim.appendChild(pop);
    document.body.appendChild(dim);
    if (opts.onOpen) opts.onOpen(pop, close);
    return { pop, close, body: bd };
  }
  function alertBox(msg, cb) {
    const dim = el('<div class="dim"></div>');
    const pop = el(`<div class="popup alert"><div class="p-hd"><h3>알림</h3><span class="x">${I.close}</span></div><div class="p-bd"></div><div class="p-ft"><button class="btn primary">확인</button></div></div>`);
    $('.p-bd', pop).textContent = msg;
    const close = () => { dim.remove(); if (cb) cb(); };
    $('.x', pop).onclick = close; $('.btn', pop).onclick = close;
    dim.appendChild(pop); document.body.appendChild(dim);
    $('.btn', pop).focus();
  }
  function confirmBox(msg, onYes) {
    const dim = el('<div class="dim"></div>');
    const pop = el(`<div class="popup alert"><div class="p-hd"><h3>확인</h3><span class="x">${I.close}</span></div><div class="p-bd"></div><div class="p-ft"><button class="btn primary y">확인</button><button class="btn n">취소</button></div></div>`);
    $('.p-bd', pop).textContent = msg;
    const close = () => dim.remove();
    $('.x', pop).onclick = close; $('.n', pop).onclick = close;
    $('.y', pop).onclick = () => { close(); onYes(); };
    dim.appendChild(pop); document.body.appendChild(dim);
  }
  function toast(msg) {
    const t = el(`<div class="toast">${esc(msg)}</div>`);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  /* ---------------- 화면 공통 부품 ---------------- */
  function appHeader(title) {
    const fav = (Store.data.favorites || []).includes(title);
    return `<div class="app-hd"><h1 class="app-tit">${esc(title)}</h1>
      <span class="crumb" title="${esc(App.pathOf(title).join(' > '))}">${I.home}<span>...${esc(title)}</span></span>
      <span class="utils"><span data-u="help" title="도움말">${I.q}</span><span data-u="chat" title="의견">${I.chat}</span><span data-u="manual" title="매뉴얼">${I.doc}</span><span data-u="call" title="원격지원">${I.phone}</span><span data-u="video" title="동영상">${I.video}</span><span data-u="fav" title="즐겨찾기">${fav ? I.starFill : I.starLine}</span></span>
      <button class="fold">축소</button></div>`;
  }
  function bindHeader(page, title) {
    $$('.utils span', page).forEach(s => {
      s.onclick = () => {
        const u = s.dataset.u;
        if (u === 'fav') {
          const f = Store.data.favorites || (Store.data.favorites = []);
          const i = f.indexOf(title);
          if (i >= 0) f.splice(i, 1); else f.push(title);
          Store.save();
          s.innerHTML = i >= 0 ? I.starLine : I.starFill;
          toast(i >= 0 ? '즐겨찾기에서 삭제되었습니다.' : '즐겨찾기에 추가되었습니다.');
          if (App.lnbMode === 'fav') App.renderLnb();
        } else if (u === 'help' || u === 'manual') {
          alertBox(`[${title}] 도움말\n\n메뉴경로 : ${App.pathOf(title).join(' > ')}\n\n실제 사용법은 「2026년 하반기 나이스 교무업무 사용자 설명서」를 참고하세요.`);
        } else {
          alertBox('연수용 가상 환경에서는 제공되지 않는 기능입니다.');
        }
      };
    });
    const fold = $('.fold', page);
    if (fold) fold.onclick = () => {
      const boxes = $$('.search-box, .flow', page);
      const hidden = fold.textContent === '확대';
      boxes.forEach(b => { b.style.display = hidden ? '' : 'none'; });
      fold.textContent = hidden ? '축소' : '확대';
    };
  }
  function nodata(msg) { return `<div class="nodata">${I.glass}${esc(msg || '데이터를 조회해 주십시오.')}</div>`; }
  function opts(list, sel) { return list.map(v => { const [val, txt] = Array.isArray(v) ? v : [v, v]; return `<option value="${esc(val)}"${String(val) === String(sel) ? ' selected' : ''}>${esc(txt)}</option>`; }).join(''); }
  function sf(label, control, req) { return `<div class="sf"><label class="${req ? 'req' : ''}">${req ? '*' : ''}${esc(label)}</label><span class="${req ? 'req-mark' : ''}">${control}</span></div>`; }
  // 학년도/학기/학년/반 공통 검색 필드
  function commonSearch(o) {
    o = o || {};
    const d = Store.data;
    let h = '';
    if (o.year !== false) h += sf('학년도', `<select class="sel s-year">${opts([[d.year, d.year + '학년도']], d.year)}</select>`, true);
    if (o.sem) h += sf('학기', `<select class="sel s-sem">${opts([['1', '1학기'], ['2', '2학기']], '2')}</select>`, true);
    if (o.grade !== false) h += sf('학년', `<select class="sel s-grade">${opts([['5', '5학년']], '5')}</select>`, true);
    if (o.cls !== false) h += sf('반', `<select class="sel s-cls">${opts([['2', '2반']], '2')}</select>`, true);
    return h;
  }
  function searchBtn() { return `<span class="sp"></span><button class="btn primary b-search">${I.searchSm}조회</button>`; }

  /* ---------------- 앱 골격 ---------------- */
  const App = {
    Store, I, $, $$, el, esc, nbytes, pad, today, modal, alertBox, confirmBox, toast,
    appHeader, bindHeader, nodata, opts, sf, commonSearch, searchBtn,
    role: '학급담임',
    lnbMode: 'home',
    lnbCtx: null,       // { role, groupIndex path }
    tabs: [],           // { id, title, page, tabEl }
    current: 'home',
    leafIndex: {},      // leaf -> { role, g, m }

    init() {
      this.buildIndex();
      this.renderShell();
      this.renderLnb();
      this.renderHome();
      this.startTimer();
    },
    buildIndex() {
      Object.keys(window.NEIS_BASE_SUB).forEach(g => window.NEIS_BASE_SUB[g].forEach(leaf => { this.leafIndex[leaf] = { role: '기본메뉴', g, m: g }; }));
      window.NEIS_APPR_BOX.forEach(b => { this.leafIndex[b] = { role: '승인사항', g: '승인사항', m: '승인사항' }; });
      Object.keys(MENU).forEach(role => {
        MENU[role].forEach(row => row.forEach(grp => grp.items.forEach(it => it.leaves.forEach(leaf => {
          if (!this.leafIndex[leaf]) this.leafIndex[leaf] = { role, g: grp.g, m: it.m };
        }))));
      });
    },
    pathOf(leaf) {
      const x = this.leafIndex[leaf];
      if (x && x.role === '승인사항') return ['승인사항', leaf];
      if (x && x.role === '기본메뉴') return ['기본 메뉴', x.g, leaf];
      return x ? [x.role, x.g, x.m.trim(), leaf] : [leaf];
    },

    renderShell() {
      const d = Store.data;
      document.body.innerHTML = `
      <div id="header">
        <div id="logo" title="초기화면">
          <svg class="logo-mark" viewBox="0 0 48 36"><ellipse cx="24" cy="20" rx="22" ry="15" fill="#1d3f8f"/><path d="M8 26c6-10 26-10 32 0" stroke="#fff" stroke-width="2.4" fill="none"/><circle cx="24" cy="12" r="5" fill="#f2b705"/><text x="24" y="33" font-size="6" text-anchor="middle" fill="#fff" font-weight="700">연수</text></svg>
          <div class="logo-text">${esc(d.org.office)}</div>
        </div>
        <div id="topbar">
          <span class="school">${esc(d.org.school)}</span>
          <span class="user">${esc(d.user.name)}(${esc(d.user.id)})</span>
          <span class="train-badge">연수용 가상환경</span>
          <span class="spacer"></span>
          <span class="timer" title="클릭하면 세션 시간이 연장됩니다">${I.clock}<span id="timer-txt">60분 00초</span></span>
          <button class="tb-btn" id="btn-logout">${I.logout}로그아웃</button>
          <button class="tb-btn" id="btn-tutorial">${I.book}튜토리얼</button>
          <button class="tb-btn" id="btn-support">${I.monitor}사용자지원</button>
          <span style="display:inline-flex;margin-left:5px"><button class="tb-btn sq" id="btn-zoomin" title="화면 확대">${I.expand}</button><button class="tb-btn sq" id="btn-zoomout" title="화면 축소">${I.shrink}</button></span>
        </div>
        <div id="rolenav">${Object.keys(MENU).map(r => `<a data-role="${esc(r)}" class="${r === this.role ? 'active' : ''}">${esc(r)}</a>`).join('')}</div>
      </div>
      <div id="megamenu"><button class="mm-close" title="닫기">${I.close}</button><div class="mm-body"></div></div>
      <div id="quickbar">
        <div class="qb" data-q="home" style="top:8px" title="마이메뉴(승인사항)"></div>
        <div class="qb" data-q="menu" style="top:56px" title="메뉴"></div>
        <div class="qb" data-q="noti" style="top:104px" title="알림"><span class="dot"></span></div>
        <div class="qb" data-q="find" style="top:152px" title="메뉴검색"></div>
        <div class="qb" data-q="fav" style="top:200px" title="즐겨찾기"></div>
        <div class="qb" data-q="set" style="top:248px" title="설정"></div>
        <button class="fit" title="화면맞춤">맞춤</button>
      </div>
      <div id="lnb"></div>
      <div id="lnb-toggle" title="메뉴 접기/펴기 (Alt+Ctrl+H)"></div>
      <div id="main">
        <div id="pages"><div class="page active" data-id="home" id="page-home"></div></div>
        <div id="mdibar">
          <div id="mditabs"><div class="mdi-tab home selected" data-id="home">초기화면</div></div>
          <div id="mdictl">
            <span class="mdictl-group"><button class="mdictl-btn" id="mdi-prev" title="이전 화면">${I.lt}</button><button class="mdictl-btn" id="mdi-next" title="다음 화면">${I.gt}</button><button class="mdictl-btn" id="mdi-closeothers" title="현재 화면 외 모두 닫기">${I.xa}</button><button class="mdictl-btn" id="mdi-closeall" title="모든 화면 닫기">${I.xx}</button></span>
            <button class="mdictl-btn round" id="mdi-list">${I.listview}<span class="cnt" id="mdi-cnt" style="display:none">0</span>목록보기</button>
            <button class="mdictl-btn round" id="mdi-full">${I.full}전체화면</button>
          </div>
        </div>
      </div>
      <div class="watermark">※ 본 화면은 나이스 업무 연수를 위한 가상 환경이며 실제 데이터가 아닙니다.</div>`;
      this.bindShell();
      this.renderQuick();
    },

    bindShell() {
      $('#logo').onclick = () => this.select('home');
      $$('#rolenav a').forEach(a => {
        a.onclick = () => {
          const mm = $('#megamenu');
          if (mm.classList.contains('show') && mm.dataset.role === a.dataset.role) { this.closeMega(); return; }
          this.openMega(a.dataset.role);
        };
      });
      $('#megamenu .mm-close').onclick = () => this.closeMega();
      document.addEventListener('mousedown', e => {
        const mm = $('#megamenu');
        if (mm.classList.contains('show') && !mm.contains(e.target) && !e.target.closest('#rolenav')) this.closeMega();
        const ctx = $('.ctx'); if (ctx && !ctx.contains(e.target)) ctx.remove();
        this.resetTimer();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeMega();
        if (e.altKey && e.ctrlKey && (e.key === 'h' || e.key === 'H')) document.body.classList.toggle('lnb-collapsed');
      });
      $('#lnb-toggle').onclick = () => document.body.classList.toggle('lnb-collapsed');
      $$('#quickbar .qb').forEach(q => { q.onclick = () => this.quick(q.dataset.q); });
      $('#quickbar .fit').onclick = () => { this.zoom = 1; this.applyZoom(); toast('화면 배율을 기본값으로 맞췄습니다.'); };
      $('#btn-logout').onclick = () => confirmBox('로그아웃 하시겠습니까?\n(연수용 환경에서는 입력한 연습 자료가 브라우저에 그대로 남아 있습니다.)', () => {
        if (window.NEIS_NEW_ME) window.NEIS_NEW_ME();
        document.body.innerHTML = `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:#eff3fb"><div style="font-size:20px;font-weight:700">로그아웃 되었습니다.</div><button class="btn primary" onclick="location.reload()">다시 접속(연수용)</button></div>`;
      });
      $('#btn-tutorial').onclick = () => this.tutorial();
      $('#btn-support').onclick = () => alertBox('사용자지원(연수용)\n\n실제 나이스 사용 문의는 소속 교육청 나이스 콜센터를 이용하세요.\n본 가상 환경 관련 문의는 연수 담당자에게 문의하세요.');
      this.zoom = 1;
      $('#btn-zoomin').onclick = () => { this.zoom = Math.min(1.3, +(this.zoom + 0.1).toFixed(1)); this.applyZoom(); };
      $('#btn-zoomout').onclick = () => { this.zoom = Math.max(0.8, +(this.zoom - 0.1).toFixed(1)); this.applyZoom(); };
      $('#mdi-prev').onclick = () => this.step(-1);
      $('#mdi-next').onclick = () => this.step(1);
      $('#mdi-closeall').onclick = () => { [...this.tabs].forEach(t => this.closeTab(t.id)); };
      $('#mdi-closeothers').onclick = () => { [...this.tabs].forEach(t => { if (t.id !== this.current) this.closeTab(t.id); }); };
      $('#mdi-list').onclick = () => this.tabList();
      $('#mdi-full').onclick = () => {
        const full = document.body.classList.toggle('fullmode');
        $('#header').style.display = full ? 'none' : '';
        $('#quickbar').style.display = full ? 'none' : '';
        $('#lnb').style.display = full ? 'none' : '';
        $('#lnb-toggle').style.display = full ? 'none' : '';
        const m = $('#main');
        m.style.top = full ? '0' : ''; m.style.left = full ? '0' : '';
        $('#mdi-full').innerHTML = `${I.full}${full ? '기본화면' : '전체화면'}`;
      };
      $('.mdi-tab.home').onclick = () => this.select('home');
    },
    applyZoom() { $('#pages').style.zoom = this.zoom; },

    /* ---- 퀵바 ---- */
    renderQuick() {
      const map = { home: ['personOff', 'person'], menu: ['list', 'listOn'], noti: ['bell', 'bellOn'], find: ['search', 'searchOn'], fav: ['star', 'starOn'], set: ['gear', 'gearOn'] };
      $$('#quickbar .qb').forEach(q => {
        const k = q.dataset.q; const on = this.lnbMode === k;
        q.classList.toggle('active', on);
        const dot = k === 'noti' ? '<span class="dot"></span>' : '';
        q.innerHTML = I[map[k][on ? 1 : 0]] + dot;
      });
    },
    quick(k) {
      if (k === 'noti') {
        const ms = (Store.data.msgs || []).slice(0, 5).map(x => `<tr><td>${esc(x.at.slice(5).replace('-', '.'))}</td><td class="l">${esc(x.text)}</td></tr>`).join('');
        modal({ title: '알림', width: 560, body: `<table class="grid"><colgroup><col style="width:110px"><col></colgroup><tr><th>일시</th><th>내용</th></tr>${ms}
          <tr><td>09.30 08:40</td><td class="l">[연수] 9월 출결 마감을 진행해 주세요.</td></tr>
          <tr><td>09.29 16:10</td><td class="l">[연수] 2학기 교과평가 입력 기간 안내</td></tr>
          <tr><td>09.25 09:00</td><td class="l">[연수] 학교생활기록부 기재요령 연수 자료 게시</td></tr></table>` });
        return;
      }
      if (k === 'find') { this.menuSearch(); return; }
      if (k === 'set') {
        modal({ title: '설정', width: 480, body: `<div class="info-box">연수용 가상 환경 설정입니다.<br>입력한 연습 자료는 이 PC의 브라우저에만 저장됩니다.</div>
          <table class="form"><tr><th>연습 자료</th><td><button class="btn red b-reset">연수 자료 초기화</button> <span style="font-size:12px;color:#5d6b82">처음 상태의 예시 데이터로 되돌립니다.</span></td></tr>
          <tr><th>화면 배율</th><td>${Math.round(this.zoom * 100)}%</td></tr></table>`,
          onOpen: (pop, close) => {
            $('.b-reset', pop).onclick = () => confirmBox('입력한 모든 연습 자료를 삭제하고 초기 상태로 되돌리시겠습니까?', () => { Store.reset(); if (window.NEIS_NEW_ME) window.NEIS_NEW_ME(); close(); location.reload(); });
          } });
        return;
      }
      if (k === 'menu' && !this.lnbCtx) { this.openMega(this.role); return; }
      this.lnbMode = k;
      this.renderLnb();
    },
    menuSearch() {
      const leaves = Object.keys(this.leafIndex);
      const m = modal({ title: '메뉴 검색', width: 520, body: `<div style="display:flex;gap:6px;margin-bottom:10px"><input class="inp q" style="flex:1" placeholder="메뉴명을 입력하세요 (예: 출결, 행동특성)"><button class="btn primary go">${I.searchSm}검색</button></div><div class="grid-wrap" style="max-height:340px"><table class="grid"><colgroup><col><col style="width:230px"></colgroup><tr><th>메뉴명</th><th>경로</th></tr><tbody class="rs"></tbody></table></div>` });
      const run = () => {
        const q = $('.q', m.pop).value.trim();
        const rs = leaves.filter(l => !q || l.includes(q));
        $('.rs', m.pop).innerHTML = rs.map(l => `<tr><td class="l link" data-l="${esc(l)}">${esc(l)}</td><td class="l" style="font-size:12px">${esc(this.pathOf(l).slice(0, 3).join(' > '))}</td></tr>`).join('') || `<tr><td colspan="2">검색 결과가 없습니다.</td></tr>`;
        $$('.link', m.pop).forEach(td => { td.onclick = () => { m.close(); this.openLeaf(td.dataset.l); }; });
      };
      $('.go', m.pop).onclick = run;
      $('.q', m.pop).onkeydown = e => { if (e.key === 'Enter') run(); };
      run();
      $('.q', m.pop).focus();
    },

    /* ---- 메가 메뉴 ---- */
    openMega(role) {
      const mm = $('#megamenu');
      mm.dataset.role = role;
      $$('#rolenav a').forEach(a => a.classList.toggle('open', a.dataset.role === role));
      $('.mm-body', mm).innerHTML = MENU[role].map(row => `<div class="mm-row">${row.map((grp, gi) => `<div class="mm-group"><h4>${esc(grp.g)}</h4>${grp.items.map(it => `<a data-g="${esc(grp.g)}" data-m="${esc(it.m)}">${esc(it.m.trim())}</a>`).join('')}</div>`).join('')}</div>`).join('');
      $$('.mm-group a', mm).forEach(a => {
        a.onclick = () => { this.closeMega(); this.openMenu(role, a.dataset.g, a.dataset.m); };
      });
      mm.classList.add('show');
    },
    closeMega() { $('#megamenu').classList.remove('show'); $$('#rolenav a').forEach(a => a.classList.remove('open')); },
    findGroup(role, g) {
      for (const row of MENU[role]) for (const grp of row) if (grp.g === g) return grp;
      return null;
    },
    // 중메뉴 클릭 → LNB 구성 후 첫 화면 열기
    openMenu(role, g, m, leaf) {
      this.role = role;
      $$('#rolenav a').forEach(a => a.classList.toggle('active', a.dataset.role === role));
      const grp = this.findGroup(role, g);
      const item = grp.items.find(it => it.m === m);
      this.lnbCtx = { role, g, openM: m };
      this.lnbMode = 'menu';
      this.renderLnb();
      this.openScreen(leaf || item.leaves[0]);
    },
    openLeaf(leaf) {
      const x = this.leafIndex[leaf];
      if (!x) { this.openScreen(leaf); return; }
      if (x.role === '기본메뉴' || x.role === '승인사항') {
        if (x.role === '기본메뉴') this.baseOpen = x.g;
        this.lnbMode = 'home';
        this.openScreen(leaf);
        this.renderLnb();
        return;
      }
      this.openMenu(x.role, x.g, x.m, leaf);
    },

    /* ---- LNB ---- */
    renderLnb() {
      const lnb = $('#lnb');
      const d = Store.data;
      this.renderQuick();
      if (this.lnbMode === 'menu' && this.lnbCtx) {
        const grp = this.findGroup(this.lnbCtx.role, this.lnbCtx.g);
        lnb.innerHTML = `<div class="lnb-tree">${grp.items.map(it => `<div class="l2 ${it.m === this.lnbCtx.openM ? 'open' : ''}" data-m="${esc(it.m)}"><span>${esc(it.m.trim())}</span>${I.chev}</div><div class="l3wrap">${it.leaves.map(l => `<a class="l3 ${l === this.current ? 'current' : ''}" data-l="${esc(l)}">${esc(l)}</a>`).join('')}</div>`).join('')}</div>`;
        $$('.l2', lnb).forEach(x => { x.onclick = () => { this.lnbCtx.openM = x.classList.contains('open') ? null : x.dataset.m; this.renderLnb(); }; });
        $$('.l3', lnb).forEach(x => { x.onclick = () => this.openScreen(x.dataset.l); });
        return;
      }
      if (this.lnbMode === 'fav') {
        const f = d.favorites || [];
        lnb.innerHTML = `<div class="lnb-title">즐겨찾기</div><div class="lnb-tree">${f.length ? f.map(l => `<a class="l3" style="padding:10px 20px;border-bottom:1px solid #e3e5e6" data-l="${esc(l)}">${esc(l)}</a>`).join('') : '<div style="padding:30px 16px;color:#6d7074;line-height:1.7">등록된 즐겨찾기가 없습니다.<br>업무 화면 우측 상단의 ☆ 버튼으로 추가할 수 있습니다.</div>'}</div>`;
        $$('.l3', lnb).forEach(x => { x.onclick = () => this.openLeaf(x.dataset.l); });
        return;
      }
      this.lnbMode = 'home';
      this.renderQuick();
      const cnt = window.Approval ? window.Approval.counts() : {};
      const sub = window.NEIS_BASE_SUB;
      lnb.innerHTML = `
        <div class="lnb-head">승인사항<span class="ic r">${I.refresh}</span></div>
        <ul class="appr-list">${window.NEIS_APPR_BOX.map(b => `<li data-b="${esc(b)}" class="${this.current === b ? 'on' : ''}">${esc(b)}<span>${cnt[b] == null ? '' : cnt[b]}</span></li>`).join('')}</ul>
        <div class="lnb-head">기본 메뉴<span class="ic">${I.cog}</span></div>
        <ul class="base-list">${window.NEIS_BASE_MENU.map(m => `<li data-m="${esc(m)}" class="${this.baseOpen === m ? 'open' : ''}">${esc(m)}${I.chev}</li>${sub[m] && this.baseOpen === m ? `<li class="subwrap">${sub[m].map(l => `<a class="bl3 ${l === this.current ? 'current' : ''}" data-l="${esc(l)}">${esc(l)}</a>`).join('')}</li>` : ''}`).join('')}</ul>`;
      $$('.appr-list li', lnb).forEach(li => { li.onclick = () => this.openLeaf(li.dataset.b); });
      $$('.base-list li[data-m]', lnb).forEach(li => {
        li.onclick = () => {
          const m = li.dataset.m;
          if (!sub[m]) { alertBox(`[${m}] 메뉴는 연수 범위가 아닙니다.\n'복무' 메뉴 또는 상단의 역할 메뉴(학급담임 등)를 이용하세요.`); return; }
          this.baseOpen = this.baseOpen === m ? null : m;
          this.renderLnb();
        };
      });
      $$('.base-list .bl3', lnb).forEach(a => { a.onclick = () => this.openLeaf(a.dataset.l); });
      $('.lnb-head .r', lnb).onclick = () => { this.renderLnb(); toast('승인사항을 새로고침했습니다.'); };
    },

    /* ---- MDI 탭 ---- */
    openScreen(leaf) {
      this.closeMega();
      let t = this.tabs.find(x => x.id === leaf);
      if (!t) {
        if (this.tabs.length >= 10) { alertBox('화면은 최대 10개까지 열 수 있습니다.\n사용하지 않는 화면을 닫은 후 다시 시도하세요.'); return; }
        const page = el(`<div class="page" data-id="${esc(leaf)}"></div>`);
        $('#pages').appendChild(page);
        const tabEl = el(`<div class="mdi-tab" data-id="${esc(leaf)}">${I.page}<span>${esc(leaf)}</span><span class="x" title="닫기">×</span></div>`);
        $('#mditabs').appendChild(tabEl);
        tabEl.onclick = e => { if (e.target.classList.contains('x')) { this.closeTab(leaf); return; } this.select(leaf); };
        t = { id: leaf, page, tabEl };
        this.tabs.push(t);
        const render = (window.SCREENS && window.SCREENS[leaf]) || window.SCREENS.__generic;
        page.innerHTML = appHeader(leaf);
        try { render(page, leaf, App); } catch (err) { console.error(err); page.insertAdjacentHTML('beforeend', `<div class="info-box warn">화면을 여는 중 오류가 발생했습니다: ${esc(err.message)}</div>`); }
        bindHeader(page, leaf);
      }
      this.select(leaf);
    },
    select(id) {
      this.current = id;
      $$('#pages .page').forEach(p => p.classList.toggle('active', p.dataset.id === id));
      $$('#mditabs .mdi-tab').forEach(p => p.classList.toggle('selected', p.dataset.id === id));
      const cnt = $('#mdi-cnt');
      cnt.textContent = this.tabs.length; cnt.style.display = this.tabs.length ? '' : 'none';
      if (id === 'home') { if (this.lnbMode === 'menu') { /* 유지 */ } }
      else {
        const x = this.leafIndex[id];
        if (x && (x.role === '기본메뉴' || x.role === '승인사항')) {
          if (this.lnbMode === 'menu') this.lnbMode = 'home';
          if (x.role === '기본메뉴') this.baseOpen = x.g;
        } else if (x && this.lnbMode === 'menu' && this.lnbCtx && (this.lnbCtx.g !== x.g || this.lnbCtx.role !== x.role)) { this.lnbCtx = { role: x.role, g: x.g, openM: x.m }; }
        if (x && this.lnbCtx && this.lnbCtx.g === x.g && this.lnbCtx.role === x.role) this.lnbCtx.openM = x.m;
      }
      if (this.lnbMode === 'menu' || this.lnbMode === 'home') this.renderLnb();
      const tab = $(`#mditabs .mdi-tab[data-id="${CSS.escape(id)}"]`);
      if (tab) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },
    closeTab(id) {
      const i = this.tabs.findIndex(t => t.id === id);
      if (i < 0) return;
      const t = this.tabs[i];
      t.page.remove(); t.tabEl.remove();
      this.tabs.splice(i, 1);
      if (this.current === id) {
        const nx = this.tabs[i] || this.tabs[i - 1];
        this.select(nx ? nx.id : 'home');
      } else this.select(this.current);
    },
    step(dir) {
      const ids = ['home'].concat(this.tabs.map(t => t.id));
      const i = ids.indexOf(this.current);
      const n = ids[(i + dir + ids.length) % ids.length];
      this.select(n);
    },
    tabList() {
      if (!this.tabs.length) { alertBox('열려 있는 화면이 없습니다.'); return; }
      const m = modal({ title: '열린 화면 목록', width: 420, body: `<table class="grid"><colgroup><col style="width:50px"><col><col style="width:70px"></colgroup><tr><th>순번</th><th>화면명</th><th>닫기</th></tr>${this.tabs.map((t, i) => `<tr><td>${i + 1}</td><td class="l link" data-id="${esc(t.id)}">${esc(t.id)}</td><td><button class="btn c" data-id="${esc(t.id)}" style="height:24px">닫기</button></td></tr>`).join('')}</table>` });
      $$('.link', m.pop).forEach(x => { x.onclick = () => { m.close(); this.select(x.dataset.id); }; });
      $$('.c', m.pop).forEach(x => { x.onclick = () => { this.closeTab(x.dataset.id); m.close(); this.tabList(); }; });
    },

    /* ---- 초기화면(월간일정) ---- */
    calYM: null,
    renderHome() {
      const page = $('#page-home');
      const t = today();
      if (!this.calYM) this.calYM = { y: t.getFullYear(), m: t.getMonth() };
      const { y, m } = this.calYM;
      const first = new Date(y, m, 1);
      const start = new Date(y, m, 1 - first.getDay());
      const sch = Store.data.schedule;
      let rows = '';
      for (let w = 0; w < 6; w++) {
        let tds = '';
        for (let k = 0; k < 7; k++) {
          const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + k);
          const key = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
          const evs = sch.filter(s => s.d === key);
          let evh = '';
          if (k === 6) evh += '<span class="ev">· 토요휴업일</span>';
          evs.forEach(e => { evh += `<span class="ev ${e.k === 'etc' ? 'etc' : ''}">· ${esc(e.t)}</span>`; });
          const cls = [k === 0 ? 'sun' : '', k === 6 ? 'sat' : '', dt.getMonth() !== m ? 'other' : '', dt.toDateString() === t.toDateString() ? 'today' : ''].join(' ');
          tds += `<td class="${cls}"><span class="d">${dt.getDate()}</span>${evh}</td>`;
        }
        rows += `<tr>${tds}</tr>`;
        const nd = new Date(start); nd.setDate(start.getDate() + (w + 1) * 7);
        if (nd.getMonth() !== m && w >= 3) break;
      }
      page.innerHTML = `<div class="home-tit">월간일정</div>
        <div class="cal-nav"><button class="p">‹</button><span>${y}년 ${pad(m + 1)}월</span><button class="n">›</button><div class="legend"><span class="a">- 학사일정</span><span>· 기타일정</span></div></div>
        <table class="cal"><tr><th class="sun">일요일</th><th>월요일</th><th>화요일</th><th>수요일</th><th>목요일</th><th>금요일</th><th class="sat">토요일</th></tr>${rows}</table>`;
      $('.cal-nav .p', page).onclick = () => { this.calYM.m--; if (this.calYM.m < 0) { this.calYM.m = 11; this.calYM.y--; } this.renderHome(); };
      $('.cal-nav .n', page).onclick = () => { this.calYM.m++; if (this.calYM.m > 11) { this.calYM.m = 0; this.calYM.y++; } this.renderHome(); };
    },

    /* ---- 세션 타이머 ---- */
    startTimer() {
      this.remain = 3600;
      $('.timer').onclick = () => { this.resetTimer(); toast('로그인 시간이 연장되었습니다.'); };
      setInterval(() => {
        this.remain--;
        if (this.remain <= 0) { this.remain = 3600; alertBox('장시간 사용하지 않아 세션이 만료되었습니다.\n(연수용 환경에서는 자동으로 다시 연장됩니다.)'); }
        const mm = Math.floor(this.remain / 60), ss = this.remain % 60;
        const tt = $('#timer-txt'); if (tt) tt.textContent = `${pad(mm)}분 ${pad(ss)}초`;
      }, 1000);
    },
    resetTimer() { this.remain = 3600; },

    tutorial() {
      modal({ title: '튜토리얼 (연수용)', width: 620, body: `
        <div class="info-box">이 사이트는 <b>나이스 교무업무 연수</b>를 위한 가상 환경입니다. 모든 학생·교직원은 만화 캐릭터 이름의 허구 인물이며, 입력한 자료는 이 브라우저에만 저장됩니다.</div>
        <table class="form">
          <tr><th>1. 역할 메뉴</th><td>상단 <b>학급담임</b> 등 업무분장(역할)을 클릭하면 전체 메뉴가 펼쳐집니다.</td></tr>
          <tr><th>2. 좌측 메뉴</th><td>중메뉴를 선택하면 좌측에 하위 메뉴가 표시되고 첫 화면이 열립니다.</td></tr>
          <tr><th>3. 화면 탭</th><td>열린 화면은 하단 탭으로 관리됩니다(최대 10개). <b>초기화면</b>으로 돌아가 월간일정을 볼 수 있습니다.</td></tr>
          <tr><th>4. 추천 실습</th><td>① 출결관리 → 일자 칸 클릭 후 출결 입력 → 마감<br>② 자율·자치활동관리 → 특기사항 입력(바이트 확인) → 저장<br>③ 행동특성및종합의견 → 일괄적용·문자열바꾸기<br>④ 교과평가 → 성취기준별 단계 일괄적용<br>⑤ 학교생활기록부 → 자료검증 및 반마감 → 학생부 조회및출력</td></tr>
          <tr><th>5. 복무·결재</th><td>좌측 <b>기본 메뉴 &gt; 복무</b>에서 근무상황·출장·초과근무를 신청하고 {승인요청} → 결재선 지정 → {상신}합니다.<br>가상 결재선: 부장(나미리) → 교감(권준호) → 교장(고길동), 출장·초과근무는 행정실장(신형만) 협조 포함.<br>진행 상황은 <b>승인사항 &gt; 상신함</b>에서 확인하고, 문서 상세의 [연수용 결재 시뮬레이션]으로 승인·반려를 체험합니다.<br>담임 결재 업무: 교외체험학습관리, 결보강처리, 출결현황및통계(월말 상신), 정정대장작성</td></tr>
          <tr><th>6. 초기화</th><td>좌측 ⚙(설정)에서 <b>연수 자료 초기화</b>로 처음 상태로 되돌릴 수 있습니다.</td></tr>
        </table>` });
    }
  };

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // ?open=화면이름 : 그 화면을 바로 연다 (예: index.html?open=평가계획(안)관리)
    // 짧은 이름: ?open=plan → 평가계획(안)관리 (브라우저 에이전트·수강생 바로가기용)
    const ALIAS = { plan: '평가계획(안)관리', plan2: '평가계획(안)관리', close: '평가계획(안)마감', grade: '교과평가' };
    let open = new URLSearchParams(location.search).get('open');
    if (open && ALIAS[open]) open = ALIAS[open];
    if (open) setTimeout(() => App.openLeaf(open), 0);
  });
})();
