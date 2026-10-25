// 7번 가상 나이스·10번 가상 에듀파인: 「ChatGPT 컴퓨터 사용」 시연 창 (실제 AI가 아니라 정해진 각본대로 움직임)
// - 10번: 스킬 2개(hwpx·kordoc) 가상 설치 → 운영 계획서(hwpx) 만들기 → 가상 에듀파인에 기안·상신 (아래 「10번 각본」)
// - 위쪽 막대 「ChatGPT」 → 오른쪽에 ChatGPT 창. 다운로드의 PDF를 채팅창으로 끌어 첨부하고 프롬프트를 보내면,
//   커서가 움직이며 가상 나이스(같은 출처 iframe)의 평가계획(안)관리에 PDF 내용(js/chatgpt-plan.js)을 실제로 입력한다.
// - 첫 요청은 국어, 이어서 「나머지도 해줘」·「수학만 해줘」 같은 요청으로 다른 교과. 네트워크 요청 없음.
(function () {
  // 슬라이드마다 창 하나: KIND 'neis'(7번 가상 나이스) / 'edu'(10번 가상 에듀파인)
  function makeChat(sec, KIND) {
    const btn = sec && sec.querySelector('.cg-btn');
    if (!btn || (KIND === 'neis' && !window.CGPT_PLAN)) return;
    const stage = sec.querySelector('.app-stage'), frame = stage.querySelector('iframe');
    const PLAN = window.CGPT_PLAN || {}, SUBJS = Object.keys(PLAN), LV = ['잘함', '보통', '노력요함'];
    const PDF = { name: '2026학년도 미동초 5학년 2학기 교수학습 및 평가 계획.pdf', url: 'assets/doc/plan-g5s2.pdf', pages: 17 };
    const STORE = KIND === 'edu' ? 've_state_v1' : 'neis-training-v4-midong';   // 가상 나이스·에듀파인 연습 자료(localStorage) — 되돌리기용
    const EMPTY = `<div class="cg-empty"><h3>무엇을 도와드릴까요?</h3><p>${KIND === 'edu' ? '스킬을 설치하고 한글 문서 만들기·기안을 요청해 보세요.' : '파일을 첨부하고 컴퓨터 사용을 요청해 보세요.'}</p></div>`;
    const TOUCH = matchMedia('(pointer: coarse)').matches;   // 휴대폰·태블릿: 칸에 focus()하면 가상 키보드가 떠서 하지 않는다
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
    const IC = {
      logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.2l7.6 4.4v8.8L12 20.8l-7.6-4.4V7.6z"/><path d="M12 3.2v8.8l7.6 4.4M12 12l-7.6 4.4"/></svg>',
      pdf: '<svg viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#FA423E"/><path d="M11 8h10l5 5v15H11z" fill="#fff" opacity=".95"/><path d="M21 8v5h5" fill="none" stroke="#FA423E" stroke-width="1.3"/><text x="18.5" y="25" text-anchor="middle" font-size="6.5" font-weight="800" fill="#FA423E" font-family="Arial">PDF</text></svg>',
      send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>',
      cursor: '<svg viewBox="0 0 28 28"><path d="M5 3l17 9.5-7.3 1.6-3.6 7.2z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      mouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3l12 7-5 1.3L10.5 17z" stroke-linejoin="round"/></svg>'
    };

    // ---------- 창 ----------
    const win = h(`<div class="cg-win" hidden role="dialog" aria-label="ChatGPT">
      <div class="cg-title"><span class="cg-logo">${IC.logo}</span><b>ChatGPT</b><span class="cg-mode">에이전트</span><span class="cg-sp"></span>
        <button type="button" class="cg-ib cg-speed" title="시연 속도">1×</button><button type="button" class="cg-ib cg-new" title="새 채팅">✎</button><button type="button" class="cg-ib cg-x" title="닫기">✕</button></div>
      <div class="cg-log">${EMPTY}</div>
      <div class="cg-tray"><span class="cg-tl">📂 다운로드</span>
        <div class="cg-file" draggable="true" title="채팅창으로 끌어다 놓으세요 (눌러도 첨부)">${IC.pdf}<span><b>${esc(PDF.name)}</b><small>PDF · ${PDF.pages}쪽 · 끌어서 채팅에 놓기</small></span></div></div>
      <form class="cg-comp"><div class="cg-att"></div>
        <div class="cg-taw"><div class="cg-tabg" aria-hidden="true"></div><textarea rows="1" placeholder="무엇이든 물어보세요" aria-label="ChatGPT에 메시지 보내기"></textarea></div>
        <div class="cg-crow"><button type="button" class="cg-plus" title="파일 첨부">＋</button><span class="cg-tool">${IC.mouse}컴퓨터 사용</span><span class="cg-sp"></span><button type="submit" class="cg-send" aria-label="보내기" disabled>${IC.send}</button></div></form>
      <div class="cg-foot">ChatGPT는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.</div>
      <div class="cg-drop">여기에 놓아 파일 첨부</div></div>`);
    sec.appendChild(win);
    const $ = s => win.querySelector(s);
    const log = $('.cg-log'), ta = $('textarea'), att = $('.cg-att'), sendB = $('.cg-send'), tray = $('.cg-tray');
    const PROMPT = '이 파일을 참고해서 크롬을 조작해 가상의 나이스에 평가계획 입력해줘.';
    // 「크롬을 조작해」(컴퓨터 사용의 핵심)는 입력창·말풍선·추천 버튼에서 색으로 강조한다
    const HL = '크롬을 조작해';
    const hlHtml = t => esc(t).split(esc(HL)).join(`<span class="cg-hl">${esc(HL)}</span>`);
    const tabg = $('.cg-tabg');
    const syncHl = () => { tabg.innerHTML = hlHtml(ta.value) + '\n'; tabg.scrollTop = ta.scrollTop; };
    ta.addEventListener('scroll', () => { tabg.scrollTop = ta.scrollTop; });

    function toggle(open) {
      open = open === undefined ? win.hidden : open;
      win.hidden = !open; sec.classList.toggle('cg-open', open);
      btn.classList.toggle('on', open); btn.setAttribute('aria-pressed', open);
      if (!open && run) run.stop = true;
      dispatchEvent(new Event('resize'));   // 나이스 화면 축소 맞춤(deck.js fitApps) 다시
      if (open && !TOUCH) setTimeout(() => ta.focus(), 60);
    }
    btn.addEventListener('click', () => toggle());
    $('.cg-x').onclick = () => toggle(false);
    let speed = 1;
    try { speed = +localStorage.getItem('cg.speed') || 1; } catch (e) { /* 저장 불가 */ }
    const showSpeed = () => { $('.cg-speed').textContent = speed + '×'; };
    showSpeed();
    $('.cg-speed').onclick = () => { speed = speed >= 4 ? 1 : speed * 2; showSpeed(); try { localStorage.setItem('cg.speed', speed); } catch (e) { /* noop */ } };
    $('.cg-new').onclick = () => { if (run) run.stop = true; log.innerHTML = EMPTY; done = new Set(); hadFile = false; attached = false; edu.skills = edu.made = false; $('.cg-tool').innerHTML = `${IC.mouse}컴퓨터 사용`; drawAtt(); };

    // ---------- 첨부 (끌어다 놓기 / 눌러서) ----------
    let attached = false, dragN = 0;
    function drawAtt() {
      att.innerHTML = attached ? `<div class="cg-chip">${IC.pdf}<span><b>${esc(PDF.name)}</b><small>PDF</small></span><button type="button" class="cg-chipx" aria-label="첨부 빼기">✕</button></div>` : '';
      tray.hidden = KIND === 'edu' || !!(attached || log.querySelector('.cg-u .cg-fc'));
      if (attached) att.querySelector('.cg-chipx').onclick = () => { attached = false; drawAtt(); };
      syncSend();
    }
    function attach() {
      if (KIND === 'edu') { note('에듀파인 실습은 파일 첨부 없이 진행해요. 아래 추천 문장을 눌러 보세요.'); return; }   // 나이스용 PDF·프롬프트가 들어가 나이스 창처럼 보이던 문제
      attached = true; drawAtt(); if (!ta.value.trim()) { ta.value = PROMPT; autoGrow(); } if (!TOUCH) ta.focus(); syncSend(); }
    const fileEl = $('.cg-file');
    fileEl.addEventListener('dragstart', e => { e.dataTransfer.setData('text/x-cg-file', '1'); e.dataTransfer.setData('text/plain', PDF.name); e.dataTransfer.effectAllowed = 'copy'; });
    fileEl.addEventListener('click', attach);
    $('.cg-plus').onclick = attach;
    if (KIND === 'edu') { $('.cg-plus').hidden = true; tray.hidden = true; }   // 에듀파인 실습에는 첨부할 파일이 없다(나이스용 다운로드 PDF 상자도 숨김)
    const isOurs = e => [...e.dataTransfer.types].some(t => t === 'text/x-cg-file' || t === 'Files');
    win.addEventListener('dragenter', e => { if (!isOurs(e)) return; e.preventDefault(); dragN++; win.classList.add('dragging'); });
    win.addEventListener('dragover', e => { if (isOurs(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    win.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; win.classList.remove('dragging'); } });
    win.addEventListener('drop', e => {
      e.preventDefault(); dragN = 0; win.classList.remove('dragging');
      const f = e.dataTransfer.files[0];
      if (e.dataTransfer.types.includes('text/x-cg-file') || (f && f.name.normalize() === PDF.name.normalize())) attach();   // 탐색기에서 같은 PDF를 끌어와도 됨
      else if (f) note(`시연용 파일(「${PDF.name}」)만 첨부할 수 있어요.`);
    });

    // ---------- 입력창 ----------
    function autoGrow() { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; syncHl(); }
    function syncSend() { sendB.disabled = !run && !ta.value.trim(); sendB.innerHTML = run ? IC.stop : IC.send; sendB.classList.toggle('stop', !!run); sendB.setAttribute('aria-label', run ? '중지' : '보내기'); }
    ta.addEventListener('input', () => { autoGrow(); syncSend(); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('.cg-comp').requestSubmit(); } });
    $('.cg-comp').addEventListener('submit', e => {
      e.preventDefault();
      if (run) { if (e.submitter === sendB) run.stop = true; return; }   // 실행 중 Enter로는 멈추지 않음
      const text = ta.value.trim(); if (!text) return;
      ta.value = ''; autoGrow();
      const withFile = attached; attached = false;
      userMsg(text, withFile); drawAtt();
      answer(text, withFile);
    });

    // ---------- 채팅 그리기 ----------
    let done = new Set(), hadFile = false;   // 이번 채팅에서 입력을 끝낸 교과 · 파일을 첨부한 적 있는지
    function scrollEnd() { log.scrollTop = log.scrollHeight; }
    function userMsg(text, withFile) {
      const e = log.querySelector('.cg-empty'); if (e) e.remove();
      const m = h(`<div class="cg-u">${withFile ? `<div class="cg-fc" title="PDF 열기">${IC.pdf}<span><b>${esc(PDF.name)}</b><small>PDF</small></span></div>` : ''}<div class="cg-bub"></div></div>`);
      m.querySelector('.cg-bub').innerHTML = hlHtml(text);
      if (withFile) m.querySelector('.cg-fc').onclick = () => open(PDF.url, '_blank');
      log.appendChild(m); scrollEnd();
    }
    function aMsg() { const m = h('<div class="cg-a"></div>'); log.appendChild(m); scrollEnd(); return m; }
    function note(text) { const n = h(`<div class="cg-note">${esc(text)}</div>`); win.appendChild(n); setTimeout(() => n.remove(), 2600); }
    // 글자가 흘러나오듯 (html 조각 단위)
    async function say(m, html) {
      const p = h(`<div class="cg-p">${html}</div>`), full = p.innerHTML;
      const text = p.textContent; p.textContent = ''; m.appendChild(p);
      for (let i = 0; i < text.length; i += 3) { p.textContent = text.slice(0, i + 3); scrollEnd(); await sleep(14); }
      p.innerHTML = full; scrollEnd();
      return p;
    }
    async function think(m, ms) {
      const t = h('<div class="cg-think"><span class="cg-shim">생각하는 중</span></div>'); m.appendChild(t); scrollEnd();
      await sleep(ms);
      t.innerHTML = `<span>${Math.max(1, Math.round(ms / 1000 / speed))}초 동안 생각함</span> ›`; t.classList.add('done');
    }
    function chips(m, list) {
      const c = h('<div class="cg-chips"></div>');
      list.forEach(t => { const b = h(`<button type="button">${hlHtml(t)}</button>`); b.onclick = () => { ta.value = t; autoGrow(); syncSend(); if (!TOUCH) ta.focus(); }; c.appendChild(b); });   // 누르면 입력창에 넣기만, 보내기는 직접
      m.appendChild(c); scrollEnd();
    }
    // 작업 카드: 컴퓨터 사용 단계 목록 + 경과 시간
    function actCard(m, label = '컴퓨터 사용 중') {
      const c = h(`<div class="cg-act"><div class="cg-ah"><span class="cg-spin"></span><b>${label}</b><span class="cg-sp"></span><span class="cg-tm">0:00</span></div><ol class="cg-steps"></ol></div>`);
      m.appendChild(c); scrollEnd();
      const t0 = Date.now(), list = c.querySelector('ol');
      const tick = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); c.querySelector('.cg-tm').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
      return {
        step(icon, text) { list.querySelectorAll('li.now').forEach(x => x.classList.remove('now')); const li = h(`<li class="now"><i>${icon}</i><span></span></li>`); li.querySelector('span').textContent = text; list.appendChild(li); list.scrollTop = list.scrollHeight; scrollEnd(); return li; },
        end(ok) { if (c.matches('.ok,.fail')) return; clearInterval(tick); list.querySelectorAll('li.now').forEach(x => x.classList.remove('now')); c.classList.add(ok ? 'ok' : 'fail'); c.querySelector('.cg-ah b').textContent = ok ? `작업 완료 · ${list.children.length}단계` : '작업 중지됨'; c.querySelector('.cg-spin').textContent = ok ? '✓' : '■'; }
      };
    }

    // ---------- 실행 제어 (중지·속도) ----------
    let run = null;
    const STOP = new Error('stop');
    const raw = ms => new Promise(r => setTimeout(r, ms));
    async function sleep(ms) { const end = Date.now() + ms / speed; while (Date.now() < end) { if (run && run.stop) throw STOP; await raw(Math.min(40, end - Date.now())); } if (run && run.stop) throw STOP; }
    const D = () => frame.contentDocument, Wn = () => frame.contentWindow;
    async function waitFor(fn, ms = 8000) {
      const t0 = Date.now();
      for (;;) { if (run && run.stop) throw STOP; let v = null; try { v = fn(); } catch (e) { /* 아직 안 그려짐 */ } if (v) return v; if (Date.now() - t0 > ms) throw new Error('화면에서 필요한 칸을 찾지 못했어요'); await raw(60); }
    }

    // ---------- 화면 조작: 커서·클릭·입력 ----------
    const ctl = h(`<div class="cg-ctl" hidden><div class="cg-pill"><span class="cg-dot"></span>ChatGPT가 이 화면을 사용하는 중<button type="button">중지</button></div></div>`);
    const cur = h(`<div class="cg-cur" hidden>${IC.cursor}<span>ChatGPT</span></div>`);
    stage.append(ctl, cur);
    ctl.querySelector('button').onclick = () => { if (run) run.stop = true; };
    let cx = 0, cy = 0;
    function ctlOn() {
      ctl.hidden = cur.hidden = false;
      const r = stage.getBoundingClientRect(); cx = r.width * .55; cy = r.height * .45;
      cur.style.transition = 'none'; cur.style.transform = `translate(${cx}px,${cy}px)`;
    }
    function ctlOff() { ctl.hidden = cur.hidden = true; hl(null); stage.querySelectorAll('.cg-dd').forEach(x => x.remove()); }
    // 요소 → 무대 좌표. 요소가 든 iframe(나이스·에듀파인·기안창)의 축소(fitApps·scale)를 반영
    function pt(el, fx = .5, fy = .5) {
      const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), fr = el.ownerDocument === document ? null : el.ownerDocument.defaultView.frameElement;
      if (!fr) return { x: r.left - s.left + r.width * fx, y: r.top - s.top + r.height * fy, w: r.width, h: r.height };
      const f = fr.getBoundingClientRect(), k = f.width / fr.offsetWidth;
      return { x: f.left - s.left + (r.left + r.width * fx) * k, y: f.top - s.top + (r.top + r.height * fy) * k, w: r.width * k, h: r.height * k };
    }
    async function moveTo(x, y) {
      const d = Math.hypot(x - cx, y - cy), ms = Math.min(950, 260 + d * .7) / speed;
      cur.style.transition = `transform ${ms}ms cubic-bezier(.35,.1,.25,1)`; cur.style.transform = `translate(${x}px,${y}px)`;
      cx = x; cy = y; await sleep(ms * speed + 60);
    }
    async function point(el, fx, fy) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); stage.scrollTop = stage.scrollLeft = 0; await raw(30); const p = pt(el, fx, fy); await moveTo(p.x, p.y); return p; }
    function ripple() { const r = h('<i class="cg-rip"></i>'); r.style.transform = `translate(${cx}px,${cy}px)`; stage.appendChild(r); cur.classList.add('down'); setTimeout(() => cur.classList.remove('down'), 160); setTimeout(() => r.remove(), 600); }
    async function click(el, fx, fy) { await point(el, fx, fy); ripple(); await sleep(140); el.click(); await sleep(260); }
    const HLCSS = '.cg-hl{outline:2px solid #10A37F!important;outline-offset:1px;box-shadow:0 0 0 5px rgba(16,163,127,.18)!important}';
    function hl(el) {
      [D(), popDoc()].forEach(d => d && d.querySelectorAll('.cg-hl').forEach(x => x.classList.remove('cg-hl')));
      if (!el) return;
      const d = el.ownerDocument; if (!d.getElementById('cg-style')) { const st = d.createElement('style'); st.id = 'cg-style'; st.textContent = HLCSS; d.head.appendChild(st); }
      el.classList.add('cg-hl');
    }
    async function type(el, text) {
      await point(el, .2, .5); ripple(); await sleep(120);
      if (!TOUCH) el.focus(); hl(el);
      const base = '';   // 이미 글이 있으면 지우고 새로 쓴다
      el.value = base; el.dispatchEvent(new Event('input', { bubbles: true }));
      // 검은 포인터는 칸 위에 둔 채 '입력 중' 표시로 키를 치는 모습을 보여 준다 (1배속 초당 약 50자)
      const tag = cur.querySelector('span'); cur.classList.add('typing'); tag.textContent = '⌨ 입력 중';
      try {
        const n = Math.max(1, Math.round(2 * speed));
        for (let i = 0; i < text.length; i += n) { el.value = base + text.slice(0, i + n); el.dispatchEvent(new Event('input', { bubbles: true })); await sleep(38); }
      } finally { cur.classList.remove('typing'); tag.textContent = 'ChatGPT'; }
      el.value = base + text; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(220);
    }
    // 선택상자: 진짜 목록은 스크립트로 못 펼치므로 똑같이 생긴 목록을 띄워 고른다
    async function choose(sel, value) {
      const p = await point(sel, .5, .5); ripple(); await sleep(160);
      const opts = [...sel.options], k = p.w / sel.getBoundingClientRect().width;
      const dd = h(`<div class="cg-dd">${opts.map(o => `<div class="o${o.value === sel.value ? ' on' : ''}">${esc(o.textContent)}</div>`).join('')}</div>`);
      const s = stage.getBoundingClientRect();
      dd.style.left = (p.x - p.w / 2) + 'px'; dd.style.top = (p.y + p.h / 2) + 'px'; dd.style.minWidth = p.w + 'px'; dd.style.fontSize = Math.round(14 * k) + 'px';
      stage.appendChild(dd);
      if (dd.getBoundingClientRect().bottom > s.bottom - 6) dd.style.top = (p.y - p.h / 2 - dd.offsetHeight) + 'px';
      await sleep(320);
      const i = opts.findIndex(o => o.value === value || o.textContent === value), oe = dd.children[i];
      if (!oe) { dd.remove(); throw new Error(`「${value}」 항목이 없어요`); }
      const r = oe.getBoundingClientRect(); await moveTo(r.left - s.left + Math.min(40, r.width / 2), r.top - s.top + r.height / 2);
      [...dd.children].forEach(x => x.classList.toggle('on', x === oe)); ripple(); await sleep(160);
      dd.remove();
      sel.value = opts[i].value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(220);
    }
    // 나이스 확인·알림 창 처리: 확인 → 알림(저장되었습니다) 닫기. 알림이 먼저 뜨면 그 내용을 오류로
    const topDim = () => { const ds = D().querySelectorAll('.dim'); return ds[ds.length - 1]; };
    async function confirmSave() {
      let dim = await waitFor(topDim, 4000);
      if (dim.querySelector('h3').textContent === '확인') { await click(dim.querySelector('.btn.y')); dim = await waitFor(() => { const x = topDim(); return x && x.querySelector('h3').textContent === '알림' && x; }, 4000); }
      const msg = dim.querySelector('.p-bd').textContent;
      await sleep(350); await click(dim.querySelector('.btn.primary'));
      return /저장되었/.test(msg) ? '' : msg;   // 빈 문자열 = 저장됨, 아니면 나이스가 띄운 오류
    }
    // 기존 자료에 빈 필수 칸(평가요소)이 있으면 저장이 막힌다 → 알림을 읽고 그 칸을 채운 뒤 다시 저장
    const FIXELEM = { '[6사03-01]': '고조선 이야기로 조상들의 생활 모습 탐구하기', '[6과00-01]': '탐구 문제를 정하고 계획하여 탐구 수행하기' };

    // ---------- 각본: 평가계획(안)관리 ----------
    // 첫 시연 직전의 나이스 자료를 남겨 두었다가 되돌린다 (새로고침해도 유지, 되돌리면 지움). '-' = 자료 없던 상태
    const BK = 'cg.neis-backup';
    const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
    const page = () => D().querySelector('#pages .page.active.ep-page') || D().querySelector('.ep-page');
    // 학교자율시간 과목: PDF에는 실과 아래에 있지만 나이스에서는 과목을 먼저 개설해야 평가계획(안)관리에 나온다
    const AUTO = { name: '디지털 사회와 인공지능', rel: '실과', hours: '17' };
    const autoOf = () => (Wn().App.Store.data.autonomy || []).find(a => a.grade === 5 && a.name === AUTO.name);
    async function openLeaf(act, leaf, label) {
      act.step('🧭', label);
      const nav = D().querySelector('#rolenav'); if (nav) { await point(nav, .25, .5); ripple(); await sleep(250); }
      Wn().App.openLeaf(leaf);
      return waitFor(() => { const p = D().querySelector(`#pages .page.active[data-id="${leaf}"]`); return p && p.querySelector('.toolbar, .ep-top, .search-box') && p; });
    }
    const topBtn = (dim, text) => [...dim.querySelectorAll('.p-ft .btn')].find(b => b.textContent === text);
    async function makeAuto(act) {
      const d = Wn().App.Store.data, cls = String(d.user.cls || 2);
      let a = autoOf();
      if (a && Object.keys(a.teachers || {}).length) { act.step('👁', `「${AUTO.name}」은 이미 개설되어 있음`); return; }
      if (!a) {
        const p = await openLeaf(act, '학교교육과정편제및시간배당관리', '교육과정 › 학교교육과정편제및시간배당관리 열기');
        act.step('🖱', '등록 클릭'); await click(p.querySelector('.b-reg'));
        const reg = await waitFor(() => { const x = topDim(); return x && x.querySelector('.b-au') && x; });
        act.step('🖱', '학교자율시간 「등록」 클릭'); await click(reg.querySelector('.b-au'));
        const f = await waitFor(() => { const x = topDim(); return x !== reg && x.querySelector('.a2') && x; });
        act.step('🖱', '운영방식 「학급공통」 선택'); await choose(f.querySelector('.a1'), '학급공통');
        act.step('⌨', `편제(과목명): ${AUTO.name}`); await type(f.querySelector('.a2'), AUTO.name); hl(null);
        act.step('🖱', `관련교과 「${AUTO.rel}」 선택`); await choose(f.querySelector('.a3'), AUTO.rel);
        act.step('🖱', '과목활동구분 「과목」 선택'); await choose(f.querySelector('.a4'), '과목');
        act.step('👁', `학기 2학기 · 시수 ${AUTO.hours} 확인`); await point(f.querySelector('.a6'), .5, .5); await sleep(300);
        act.step('🖱', '저장 클릭'); await click(topBtn(f, '저장'));
        await waitFor(() => !f.isConnected && autoOf());
        await sleep(500); await point(reg.querySelector('.p-bd'), .5, .9); await sleep(400);   // 학교자율시간 목록에 새 과목 확인
        act.step('🖱', '닫기'); await click(topBtn(reg, '닫기'));
        a = autoOf();
      }
      const p = await openLeaf(act, '학교자율시간관리', '학급담임편성및교과개설 › 학교자율시간관리 열기 (과목(활동) 개설)');
      if (!a.assigned) {
        act.step('🖱', '학급공통 일괄편성 클릭 → 확인'); await click(p.querySelector('.b-bulk'));
        const c = await waitFor(() => { const x = topDim(); return x && x.querySelector('.btn.y') && x; }); await click(c.querySelector('.btn.y'));
        await sleep(500);
      }
      act.step('🖱', '과목(활동)개설 클릭'); await click(p.querySelector('.b-open'));
      const m = await waitFor(() => { const x = topDim(); return x && x.querySelector('select.a') && x; });
      act.step('🖱', `과목(활동) 「${AUTO.name}」 선택`); await choose(m.querySelector('select.a'), AUTO.name);
      act.step('👁', `교사명 「${d.user.name}」 확인`); await point(m.querySelector('select.t'), .5, .5); await sleep(300);
      act.step('🖱', `편성학반 5-${cls} 체크`); await click(m.querySelector(`.k[value="${cls}"]`));
      act.step('🖱', '저장 클릭'); await click(topBtn(m, '저장'));
      await waitFor(() => !m.isConnected);
      await sleep(500); await point(p.querySelector('.body'), .5, .25); await sleep(400);
      act.step('✅', `「${AUTO.name}」 과목 개설됨 (5-${cls} 담당 ${d.user.name})`);
      // 평가계획(안)관리는 열 때 과목 목록을 읽으므로 닫았다가 다시 연다
      const tab = D().querySelector('#mditabs .mdi-tab[data-id="평가계획(안)관리"]');
      if (tab) { act.step('🖱', '평가계획(안)관리 화면 닫기'); await click(tab.querySelector('.x')); }
      await openLeaf(act, '평가계획(안)관리', '성적 › 평가계획(안)관리 다시 열기 (새 과목 반영)');
      await waitFor(() => page() && page().querySelector('.b-search'));
    }
    async function openPlan(act) {
      act.step('🌐', '가상 나이스 › 성적 › 평가계획(안)관리 열기');
      await moveTo(cx, 30); ripple();
      const loaded = new Promise(r => frame.addEventListener('load', r, { once: true }));
      frame.src = sec.dataset.src + (sec.dataset.src.includes('?') ? '&' : '?') + 'open=plan';
      await loaded;
      await waitFor(() => page() && page().querySelector('.b-search'));
      const st = D().createElement('style');
      st.textContent = '.cg-hl{outline:2px solid #10A37F!important;outline-offset:1px;box-shadow:0 0 0 5px rgba(16,163,127,.18)!important}';
      D().head.appendChild(st);
      await sleep(500);
      act.step('👁', '화면 확인 — 학년도 2026 · 2학기 · 5학년');
      await point(page().querySelector('.s-grade'), .5, .5); await sleep(350);
    }
    const rowsStd = () => [...page().querySelectorAll('.ep-body tbody tr[data-i]')];
    async function pickSubj(act, subj) {
      const s = page().querySelector('.s-subj');
      if (s.value !== subj) { act.step('🖱', `교과(목) 「${subj}」 선택`); await choose(s, subj); }
      act.step('🖱', '조회 클릭'); await click(page().querySelector('.b-search'));
      await waitFor(() => page().querySelector('.ep-body tbody tr'));
    }
    async function fillStd(act, subj) {
      await pickSubj(act, subj);
      const have = rowsStd().map(tr => [tr.querySelector('[data-f="std"]').value, tr.querySelector('[data-f="elem"]').value].join('|'));
      const todo = PLAN[subj].filter(x => !have.includes(x[1] + '|' + x[2]));
      act.step('👁', `기존 ${have.length}건 확인 → 새로 ${todo.length}건 입력`);
      await sleep(400);
      for (const [area, std, elem] of todo) {
        act.step('🖱', '행추가(+) 클릭'); await click(page().querySelector('.b-add'));
        const tr = await waitFor(() => rowsStd().pop()), n = rowsStd().length;
        act.step('🖱', `${n}행 영역명 「${area}」 선택`); await choose(tr.querySelector('[data-f="area"]'), area);
        act.step('⌨', `${n}행 성취기준: ${std.slice(0, 12)}…`); await type(rowsStd()[n - 1].querySelector('[data-f="std"]'), std);
        act.step('⌨', `${n}행 평가요소: ${elem}`); await type(rowsStd()[n - 1].querySelector('[data-f="elem"]'), elem);
        hl(null);
      }
      if (!todo.length) return 0;
      for (let tries = 0; ; tries++) {
        act.step('🖱', '저장 클릭 → 확인'); await click(page().querySelector('.b-save'));
        const err = await confirmSave(); if (!err) break;
        const m = /(\d+)번째 행의 \[평가요소\]/.exec(err);
        if (!m || tries > 3) throw new Error(err);
        const tr = rowsStd()[+m[1] - 1], std = tr.querySelector('[data-f="std"]').value, code = (/^\s*(\[[^\]]+\])/.exec(std) || [])[1] || '';
        const elem = FIXELEM[code] || std.replace(/^\s*\[[^\]]+\]\s*/, '').replace(/[.。]\s*$/, '').slice(0, 40);
        act.step('👁', `저장 막힘: 기존 ${m[1]}행 평가요소가 비어 있음 → 채우기`);
        await type(tr.querySelector('[data-f="elem"]'), elem); hl(null);
        run.fixes.push(`${subj} ${m[1]}행(${code}) 평가요소 「${elem}」`);
      }
      act.step('✅', `${subj} 성취기준 ${todo.length}건 저장됨`);
      return todo.length;
    }
    async function fillCrit(act, subj) {
      act.step('🖱', '2단계 「성취기준(평가기준)관리」 클릭'); await click(page().querySelector('.ep-step[data-step="2"]'));
      let saved = 0;
      for (const [, std, elem, steps] of PLAN[subj]) {
        const find = () => [...page().querySelectorAll('.ep-left tbody tr[data-i]')].find(tr => tr.children[2].textContent === std && tr.children[3].textContent === elem);
        const tr = await waitFor(find);
        act.step('🖱', `${std.slice(0, 12)} 선택`); await click(tr, .45, .5);
        await waitFor(() => find().classList.contains('cur'));
        const filled = () => LV.every((lv, i) => { const t = page().querySelector(`textarea.g[data-s="${lv}"]`); return t && t.value === steps[i]; });
        if (filled()) { act.step('👁', '이미 입력되어 있음 — 건너뜀'); continue; }
        const sel = page().querySelector('.ep-stepsel');
        if (sel.value !== '3') { act.step('🖱', '단계선택 「3단계」 (잘함·보통·노력요함)'); await choose(sel, '3'); }
        for (let i = 0; i < 3; i++) {
          act.step('⌨', `평가결과 「${LV[i]}」 입력`);
          await type(await waitFor(() => page().querySelector(`textarea.g[data-s="${LV[i]}"]`)), steps[i]);
        }
        hl(null);
        act.step('🖱', '저장 클릭 → 확인'); await click(page().querySelector('.b-save2'));
        const err = await confirmSave(); if (err) throw new Error(err);
        saved++;
      }
      act.step('🖱', '1단계 「성취기준관리」로 돌아가기'); await click(page().querySelector('.ep-step[data-step="1"]'));
      return saved;
    }

    // ---------- 각본: 육아시간 신청 (복무 › 개인근무상황관리 › 특별휴가 › 육아시간, 대상자녀 안유진) ----------
    // 날짜: 4/3 · 4월 3일 · 2026-10-20 · 오늘·내일·모레·글피 · 3일 후/뒤 · 이틀 뒤 · 다음 주(같은 요일) · (이번/다음 주) 수요일 · 수, 목
    // 시간: 3시~4시 반 · 15:00~16:30 · 오후 2시부터 2시간 — 말하지 않으면 15:00~16:30, 시작만 말하면 1시간 30분
    const CHILD = '안유진', WD = '일월화수목금토', NUM = { 하루: 1, 이틀: 2, 사흘: 3, 나흘: 4, 닷새: 5 };
    const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const md = k => { const d = new Date(k + 'T00:00'); return `${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '년 ' : ''}${d.getMonth() + 1}월 ${d.getDate()}일(${WD[d.getDay()]})`; };
    const hhmm = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    function parseDates(text, now = new Date()) {
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()), out = [];
      const plus = n => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
      const monDay = (mo, da) => { const d = new Date(base.getFullYear(), mo - 1, da); return d < base ? new Date(base.getFullYear() + 1, mo - 1, da) : d; };   // 지난 날짜면 내년
      const weekOf = (pre, w) => {
        const k = WD.indexOf(w);
        if (!pre) return plus((k - base.getDay() + 7) % 7);   // 요일만: 오늘 포함 가장 가까운 그 요일
        const off = /다다음/.test(pre) ? 2 : /다음|담/.test(pre) ? 1 : 0;
        return plus(-((base.getDay() + 6) % 7) + off * 7 + (k + 6) % 7);   // 월요일 기준 주
      };
      let t = text;
      const take = (re, fn) => { t = t.replace(re, (...a) => { const at = a[a.length - 2]; [].concat(fn(...a)).forEach((d, i) => out.push([at + i / 100, d])); return ' '.repeat(a[0].length); }); };
      const WK = '(?:다다음\\s*[주쭈]|다음\\s*[주쭈]|담[주쭈]|이번\\s*[주쭈]|금주)', PRE = '(' + WK + ')?\\s*';
      const SUF = '(?:요일|요인|요잉|요앨|여일|오일|욜|요)';   // 「금요인」「금욜」「금요」 같은 오타도 요일로
      take(/(\d{4})\s*[-.]\s*(\d{1,2})\s*[-.]\s*(\d{1,2})/g, (s, y, mo, da) => new Date(+y, mo - 1, +da));
      take(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/g, (s, mo, da) => monDay(+mo, +da));
      take(/(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/g, (s, mo, da) => monDay(+mo, +da));
      take(/(\d+)\s*(일|주)\s*(?:후|뒤)|(하루|이틀|사흘|나흘|닷새)\s*(?:후|뒤)/g, (s, n, u, w) => plus(w ? NUM[w] : u === '주' ? n * 7 : +n));
      take(new RegExp(PRE + '((?:[월화수목금토일]\\s*[,·와]\\s*)*[월화수목금토일])' + SUF, 'g'), (s, pre, ws) => ws.match(/[월화수목금토일]/g).map(w => weekOf(pre, w)));
      take(new RegExp(PRE + '((?:[월화수목금]\\s*[,·]\\s*)+[월화수목금])(?![가-힣])', 'g'), (s, pre, ws) => ws.match(/[월화수목금]/g).map(w => weekOf(pre, w)));
      take(new RegExp('(' + WK + ')\\s*([월화수목금토일])(?![가-힣])', 'g'), (s, pre, w) => weekOf(pre, w));   // 「이번 주 금」「다음 주 금」
      take(/다다음\s*[주쭈]|다음\s*[주쭈]|담[주쭈]/g, s => plus(/다다음/.test(s) ? 14 : 7));
      take(/내일\s*모레/g, () => plus(2));
      take(/오늘|금일/g, () => plus(0)); take(/내일|명일/g, () => plus(1)); take(/모레/g, () => plus(2)); take(/글피/g, () => plus(3));
      return { dates: [...new Set(out.sort((a, b) => a[0] - b[0]).map(x => ymd(x[1])))], rest: t };
    }
    function parseTimes(t) {
      const toH = (ap, h) => ap === '오후' ? (h < 12 ? h + 12 : h) : ap === '오전' ? h : (h <= 7 ? h + 12 : h);   // 1~7시는 오후로
      let dur = 0, ap = '';
      t = t.replace(/(\d+)\s*시간(?:\s*(\d+)\s*분|\s*(반))?|(\d+)\s*분\s*(?:동안|간)/g, (s, h, m, half, mm) => { dur = mm ? +mm : h * 60 + (m ? +m : half ? 30 : 0); return ' '.repeat(s.length); });
      const ts = [];
      t.replace(/(오전|오후)?\s*(\d{1,2})\s*(?::\s*(\d{2})|시(?!간)\s*(?:(\d{1,2})\s*분|(반))?)/g, (s, a, h, m1, m2, half) => { if (a) ap = a; ts.push(toH(a || ap, +h) * 60 + (m1 ? +m1 : m2 ? +m2 : half ? 30 : 0)); return s; });
      const from = ts.length ? ts[0] : 15 * 60;
      let to = ts.length > 1 ? ts[1] : from + (dur || 90);
      if (to <= from && to + 720 > from) to += 720;
      const r = x => Math.round(x / 10) * 10;   // 나이스 분 선택은 10분 단위
      return { from: r(from), to: r(to), said: ts.length > 0 || dur > 0 };
    }
    window.CGPT_PARSE = { parseDates, parseTimes };   // 확인용
    async function prepFrame() {
      await waitFor(() => Wn().App && D().querySelector('#rolenav'));
      if (!D().getElementById('cg-style')) { const st = D().createElement('style'); st.id = 'cg-style'; st.textContent = '.cg-hl{outline:2px solid #10A37F!important;outline-offset:1px;box-shadow:0 0 0 5px rgba(16,163,127,.18)!important}'; D().head.appendChild(st); }
    }
    async function typeDate(el, v) {   // 날짜 칸은 한 글자씩 넣을 수 없어 입력하는 동안 표시만 하고 한 번에 넣는다
      await point(el, .3, .5); ripple(); await sleep(140); if (!TOUCH) el.focus(); hl(el);
      const tag = cur.querySelector('span'); cur.classList.add('typing'); tag.textContent = '⌨ 입력 중';
      try { await sleep(650); } finally { cur.classList.remove('typing'); tag.textContent = 'ChatGPT'; }
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); await sleep(220); hl(null);
    }
    async function childcare(m, text, setAct) {
      const { dates: ds, rest } = parseDates(text), tm = parseTimes(rest);
      await think(m, 1500);
      if (tm.to - tm.from > 120) { await say(m, `육아시간은 하루 최대 2시간까지 쓸 수 있어요. 말씀하신 ${hhmm(tm.from)}~${hhmm(tm.to)}는 2시간이 넘어요. 시간을 다시 알려 주세요.`); return; }
      if (tm.from < 7 * 60 || tm.to > 22 * 60) { await say(m, `${hhmm(tm.from)}~${hhmm(tm.to)}는 신청할 수 있는 시간(07:00~22:00)이 아니에요. 시간을 다시 알려 주세요.`); return; }
      let dates = ds.length ? ds : [ymd(new Date())];
      const off = dates.filter(k => { const w = new Date(k + 'T00:00').getDay(), H = Wn().SH; return w === 0 || w === 6 || !!(H && H.holiday && H.holiday(k)); });
      dates = dates.filter(k => !off.includes(k));
      if (!dates.length) { await say(m, `${off.map(md).join(', ')}은 주말·공휴일이라 육아시간을 신청할 수 없어요. 근무일 날짜를 알려 주세요.`); return; }
      const when = `${dates.map(md).join(', ')} <b>${hhmm(tm.from)}~${hhmm(tm.to)}</b>`;
      await say(m, `${when} 육아시간(대상 자녀 <b>${CHILD}</b>)을 가상 나이스 「개인근무상황관리」에서 신청할게요.${tm.said ? '' : ' 시간을 말씀하지 않아 기본 시간 15:00~16:30으로 했어요.'}${off.length ? ` ${off.map(md).join(', ')}은 주말·공휴일이라 뺐어요.` : ''}`);
      if (ls(BK) === null) ls(BK, ls(STORE) || '-');
      const act = actCard(m); setAct(act);
      ctlOn(); await prepFrame();
      const p = await openLeaf(act, '개인근무상황관리', '복무 › 개인근무상황관리 열기');
      const [fh, fm] = hhmm(tm.from).split(':'), [th, tmm] = hhmm(tm.to).split(':');
      const ok = [], bad = [], clash = [];
      for (const k of dates) {
        act.step('🖱', '신청 클릭'); await click(p.querySelector('.b-new'));
        const f = await waitFor(() => { const x = topDim(); return x && x.querySelector('.f-cat') && x; }), q = c => f.querySelector('.' + c);
        act.step('🖱', '근무상황 「특별휴가」 선택'); await choose(q('f-cat'), '특별휴가');
        act.step('🖱', '「육아시간」 선택'); await choose(q('f-sub'), '육아시간');
        act.step('🖱', `대상자녀 「${CHILD}」 선택`); await choose(await waitFor(() => !q('f-childrow').hidden && q('f-child')), CHILD);
        act.step('⌨', `시작 ${k} ${fh}:${fm}`); await typeDate(q('f-fd'), k); await choose(q('f-ft-h'), fh); await choose(q('f-ft-m'), fm);
        act.step('⌨', `종료 ${k} ${th}:${tmm}`); await typeDate(q('f-td'), k); await choose(q('f-tt-h'), th); await choose(q('f-tt-m'), tmm);
        act.step('👁', `기간 확인 — ${q('f-dh').value}시간 ${q('f-dm').value}분`); await point(q('f-dh'), .5, .5); await sleep(350);
        act.step('⌨', '사유 입력'); await type(q('f-reason'), `자녀(${CHILD}) 육아`); hl(null);
        act.step('🖱', '승인요청 클릭'); await click(topBtn(f, '승인요청'));
        const nx = await waitFor(() => { const x = topDim(); return x !== f && x; });
        if (nx.querySelector('h3').textContent === '알림') {   // 나이스가 막음 (겹치는 신청 등)
          const msg = nx.querySelector('.p-bd').textContent; await sleep(300); await click(nx.querySelector('.btn.primary')); await click(topBtn(f, '닫기'));
          act.step('⚠', msg.split('\n')[0]); bad.push([k, msg.split('\n').slice(0, 2).join(' ')]); continue;
        }
        const names = [...nx.querySelectorAll('.le .right tbody tr')].slice(1).map(tr => `${tr.children[3].textContent} ${tr.children[2].textContent}`).join(' → ');
        act.step('👁', `결재선 확인: ${names}`); await point(nx.querySelector('.le .right'), .5, .5); await sleep(450);
        act.step('🖱', '상신 클릭'); await click(topBtn(nx, '상신'));
        const al = await waitFor(() => { const x = topDim(); return x && x.querySelector('h3').textContent === '알림' && x; });
        const now = (/현재 결재자 : (.+)/.exec(al.querySelector('.p-bd').textContent) || [])[1] || '';
        await sleep(400); await click(al.querySelector('.btn.primary')); await sleep(300);
        const cb = topDim();
        if (cb && /결강·보강/.test(cb.textContent)) { act.step('🖱', '결보강 안내 — 취소 (나중에 등록)'); await click(cb.querySelector('.btn.n')); clash.push(k); }
        act.step('✅', `${md(k)} 육아시간 상신됨`); ok.push([k, now]);
      }
      act.end(true); ctlOff();
      if (ok.length) {
        await say(m, '육아시간 신청을 상신했어요 ✅');
        await say(m, `<ul class="cg-ul">${ok.map(([k, n]) => `<li><b>${md(k)}</b> ${hhmm(tm.from)}~${hhmm(tm.to)} · 대상 자녀 ${CHILD}${n ? ` — 현재 결재자 ${esc(n)}` : ''}</li>`).join('')}</ul>`);
      }
      if (bad.length) await say(m, `신청하지 못한 날: ${bad.map(([k, msg]) => `${md(k)} (${esc(msg)})`).join(', ')}`);
      if (clash.length) await say(m, `${clash.map(md).join(', ')}은 수업 시간과 겹쳐요. 결강·보강은 [결보강처리]에서 따로 등록해 주세요.`);
      if (ok.length) await say(m, '결재 진행 상황은 나이스 「승인사항 › 상신함」에서 확인할 수 있어요.');
      undoLink(m);
    }

    // ---------- 10번 각본: 스킬 설치 → 운영 계획서(hwpx) 만들기 → 가상 에듀파인 기안·상신 ----------
    const EDU_P1 = '아래 두 스킬을 설치해 줘.\nhttps://github.com/jkf87/hwpx-skill\nhttps://github.com/chrisryugj/kordoc';
    const EDU_P2 = '아래 내용으로 운영 계획서 만들어줘.\n미동초등학교 찾아가는 AI 활용 연수\n1) 일   시: 11월 3일(화) 3:20~5:00 (90분)\n2) 장   소: 베이크우드\n3) 대   상: 미동초 8명\n4) 준비물: 노트북 8대\n   (Codex, Claudecode, Muse 설치)\n5) 내   용: 업무자동화 40분→10분 휴식→수업컨텐츠 제작 40분';
    const EDU_P3 = '만든 운영 계획서를 크롬의 연수용 가상 에듀파인에 기안해서 상신해 줘.';
    // 만들어지는 파일 = 강사가 준비한 「2026 찾아가는 AI 활용 연수 운영 계획서(미동초).hwpx」 (assets/doc/ops-plan.hwpx)
    const DOCF = { name: '2026 찾아가는 AI 활용 연수 운영 계획서(미동초).hwpx', url: 'assets/doc/ops-plan.hwpx', size: '13.8KB' };
    const OPS = {   // 미리보기용 (위 hwpx의 내용)
      date: '(2026. 10. 16. 미동초등학교)', title: '미동초등학교 찾아가는 AI 활용 연수 운영 계획',
      intro: '교원의 생성형 AI 활용 역량을 높이기 위하여 업무 자동화와 수업 콘텐츠 제작을 직접 실습하는 찾아가는 연수를 운영하고자 함.',
      secs: [
        ['Ⅰ', '운영 개요', ['❍ (연수명) 미동초등학교 찾아가는 AI 활용 연수', '❍ (일시) 2026. 11. 3.(화) 15:20∼17:00(100분)', '❍ (장소) 베이크우드', '❍ (대상) 미동초등학교 8명', '❍ (강사) 황지중앙초등학교 교사 김형석', '❍ (방법) 강의·시연 후 1인 1노트북 실습', '❍ (준비물) 노트북 8대(Codex, Claude Code, Muse 설치)']],
        ['Ⅱ', '세부 운영 일정', [['시간', '구분', '주요 내용', '소요 시간'], ['15:20∼16:00', '1부', '업무 자동화(나이스·공문)', '40분'], ['16:00∼16:10', '휴식', '휴식 및 실습 환경 점검', '10분'], ['16:10∼16:50', '2부', '수업 콘텐츠 제작', '40분'], ['16:50∼17:00', '마무리', '질의응답 및 사례 공유', '10분']]],
        ['Ⅲ', '세부 내용', ['❍ (1부 업무 자동화) 반복 업무를 AI에게 맡기는 방법 실습', '- (나이스) AI가 화면을 보고 마우스·키보드를 직접 조작해 성취기준(평가계획) 입력', '- (업무포털) 업무 매뉴얼(Skill)과 도구 연결(MCP)로 공문을 규격에 맞게 작성하고 가상 에듀파인에 상신', '❍ (2부 수업 콘텐츠 제작) 기존 수업 자료를 살려 AI와 함께 만들기', '- 수업 PPT를 바탕으로 모션그래픽·자막 영상·게임·웹앱 제작', '- 미니 Codex 창에서 1인 1과제로 실습', '- 메신저 한마디로 클라우드 AI 비서(Muse)에게 일을 맡기는 방법 소개']],
        ['Ⅳ', '준비 사항', ['❍ (강사) 발표 자료·실습 환경 점검(연수 전)', '- 발표 자료, 가상 나이스·가상 에듀파인, 미니 Codex 연결 환경 점검', '❍ (학교) 연수 장소와 기기 준비(연수 전)', '- 노트북 8대에 Codex, Claude Code, Muse 설치 및 로그인 확인', '- 연수 장소(베이크우드) 무선 인터넷 연결 및 전원 확인', '❍ (당일) 노트북 배치·전원 연결 및 실습 화면 접속 확인']],
        ['Ⅴ', '유의 사항', ['❍ (개인정보) 실제 나이스·업무포털에 접속하지 않고 연수용 가상 화면으로 실습', '- 실습 중 실제 학생·교직원 정보를 입력하지 않음', '❍ (검토) AI가 만든 결과물은 저장·제출 전에 반드시 사람이 확인', '❍ (계정) 개인 계정 정보는 다른 사람과 공유하지 않음']],
        ['Ⅵ', '기대 효과', ['❍ (업무) 반복 입력·문서 작성 시간을 줄여 교육 활동에 집중', '❍ (수업) 기존 자료를 활용한 맞춤형 수업 콘텐츠 제작 역량 향상', '❍ (문화) 교내 AI 활용 사례 공유로 동료 간 배움 문화 확산']]
      ]
    };
    const DRAFT = {   // 기안문
      title: '2026학년도 찾아가는 AI 활용 연수 운영 계획', task: '[교원연수] 교원직무연수운영 (3년)', outline: '찾아가는 AI 활용 연수(11. 3.) 운영 계획 결재',
      lines: [[0, '1. 교원의 생성형 AI 활용 역량을 높이기 위하여 찾아가는 AI 활용 연수를 다음과 같이 운영하고자 합니다.'], [1, '가. 연수명: 미동초등학교 찾아가는 AI 활용 연수'], [1, '나. 일시: 2026. 11. 3.(화) 15:20∼17:00'], [1, '다. 장소: 베이크우드'], [1, '라. 대상: 미동초등학교 교원 8명'], [1, '마. 내용: 업무 자동화(40분), 수업 콘텐츠 제작(40분)'], [0, '2. 세부 내용은 붙임 운영 계획서와 같습니다.']]
    };
    const edu = { skills: false, made: false };
    const hwpxIc = '<svg viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#2D7FF9"/><path d="M11 8h10l5 5v15H11z" fill="#fff"/><path d="M21 8v5h5" fill="none" stroke="#2D7FF9" stroke-width="1.3"/><text x="18.5" y="25" text-anchor="middle" font-size="5.6" font-weight="800" fill="#2D7FF9" font-family="Arial">HWPX</text></svg>';
    // 터미널 블록: 명령이 한 글자씩 쳐지고 결과가 나온다
    function term(m) {
      const t = h('<div class="cg-term"><div class="cg-th">터미널</div><pre></pre></div>'); m.appendChild(t); scrollEnd();
      const pre = t.querySelector('pre');
      return async (cmd, out) => {
        const ln = document.createElement('div'); ln.className = 'c'; pre.appendChild(ln);
        for (let i = 0; i <= cmd.length; i += 2) { ln.textContent = '$ ' + cmd.slice(0, i); pre.scrollTop = pre.scrollHeight; scrollEnd(); await sleep(18); }
        ln.textContent = '$ ' + cmd; await sleep(260);
        for (const o of [].concat(out || [])) { const d = document.createElement('div'); d.className = 'o'; d.textContent = o; pre.appendChild(d); pre.scrollTop = pre.scrollHeight; scrollEnd(); await sleep(160); }
      };
    }
    function fileCard(m) {
      const c = h(`<div class="cg-out">${hwpxIc}<span><b>${esc(DOCF.name)}</b><small>HWPX 문서 · ${DOCF.size}</small></span><button type="button" class="cg-ob v">미리보기</button><a class="cg-ob" href="${DOCF.url}" download="${esc(DOCF.name)}">⬇ 받기</a></div>`);
      c.querySelector('.v').onclick = preview; m.appendChild(c); scrollEnd();
    }
    function preview() {
      const tbl = rows => `<table>${rows.map((r, i) => `<tr>${r.map(x => i ? `<td>${esc(x)}</td>` : `<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table>`;
      const pv = h(`<div class="cg-prev"><div class="cg-pvbar"><b>${esc(DOCF.name)}</b><span class="cg-sp"></span><a class="cg-ob" href="${DOCF.url}" download="${esc(DOCF.name)}">⬇ 받기</a><button type="button" class="cg-ib">✕</button></div><div class="cg-pvsc"><div class="cg-a4">
        <p class="dt">${esc(OPS.date)}</p><h1>${esc(OPS.title)}</h1><p class="in">${esc(OPS.intro)}</p>
        ${OPS.secs.map(([n, t, b]) => `<h2><i>${n}</i>${esc(t)}</h2>${Array.isArray(b[0]) ? tbl(b) : b.map(l => `<p class="${l[0] === '-' ? 'l2' : 'l1'}">${esc(l)}</p>`).join('')}`).join('')}
      </div></div></div>`);
      // 닫기: ✕, 문서(A4) 바깥 회색 부분 누르기, Esc
      const close = () => { pv.remove(); removeEventListener('keydown', onKey, true); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
      pv.querySelector('.cg-ib').onclick = close;
      pv.onclick = e => { if (e.target === pv || e.target.classList.contains('cg-pvsc')) close(); };
      addEventListener('keydown', onKey, true);
      sec.appendChild(pv);
    }
    // 기안창(card.html)은 원래 새 창(window.open)으로 뜬다 → 시연 중에는 화면 안의 창(iframe)으로 띄워 커서가 들어가게 한다
    let popFr = null;
    const popDoc = () => popFr && popFr.contentDocument;
    function hookOpen() {
      const W = Wn(); if (W.__cgOpen) return; W.__cgOpen = W.open;
      W.open = url => {
        const box = h('<div class="cg-popwin"><div class="cg-poph"><b>기안문작성</b><span>K-에듀파인 · 연수용 가상 화면</span></div><div class="cg-popin"><iframe title="기안문작성"></iframe></div></div>');
        stage.appendChild(box);
        const s = stage.getBoundingClientRect(), bw = Math.min(900, s.width * .8), k = bw / 900, bh = s.height - 20;
        box.style.width = bw + 'px'; box.style.height = bh + 'px';
        const fr = box.querySelector('iframe'); fr.style.width = '900px'; fr.style.height = (bh - 30) / k + 'px'; fr.style.transform = `scale(${k})`;
        popFr = fr; fr.src = new URL(url, W.location.href).href;
        fr.addEventListener('load', () => { const w = fr.contentWindow; try { w.opener = W; } catch (e) { /* noop */ } w.close = () => { box.remove(); if (popFr === fr) popFr = null; }; });
        return fr.contentWindow;
      };
    }
    function unhookOpen() { const W = Wn(); if (W && W.__cgOpen) { W.open = W.__cgOpen; delete W.__cgOpen; } }
    // 에듀파인 왼쪽 메뉴: 묶음(기안·결재)을 펼치고 화면을 연다
    async function eduMenu(act, grp, leaf, label) {
      const g = D().querySelector(`#lnbGrid .mRow[data-grp="${grp}"]`);
      if (!D().querySelector(`#lnbGrid .mRow[data-leaf="${leaf}"]`)) { act.step('🖱', `왼쪽 메뉴 「${g.textContent.trim()}」 펼치기`); await click(g, .3, .5); }
      act.step('🖱', label); await click(await waitFor(() => D().querySelector(`#lnbGrid .mRow[data-leaf="${leaf}"]`)), .3, .5);
      return waitFor(() => { const w = D().querySelector(`.win[data-id="${leaf}"]`); return w && w.offsetWidth && w; });
    }
    // 기안창 안 대화상자(.modal): 마지막 것
    const popModal = () => { const ms = popDoc() && popDoc().querySelectorAll('.modal'); return ms && ms[ms.length - 1]; };
    // 본문(편집되는 공문 쪽) 줄 쓰기: 줄마다 글자가 하나씩 들어간다
    async function typeLine(p, text) {
      await point(p, .05, .5); ripple(); await sleep(100); hl(p);
      const tag = cur.querySelector('span'); cur.classList.add('typing'); tag.textContent = '⌨ 입력 중';
      try { const n = Math.max(1, Math.round(2 * speed)); for (let i = 0; i < text.length; i += n) { p.textContent = text.slice(0, i + n); await sleep(38); } }
      finally { cur.classList.remove('typing'); tag.textContent = 'ChatGPT'; }
      p.textContent = text; await sleep(160);
    }
    // 가짜 파일 열기 창 (실제 파일 대화상자는 스크립트로 못 다룬다)
    async function pickFile(act) {
      const dlg = h(`<div class="cg-fdlg"><div class="hd">열기<span class="cg-sp"></span>✕</div><div class="pa">📁 내 PC › 다운로드</div><div class="ls"><div class="f">${hwpxIc}<span>${esc(DOCF.name)}</span><small>${DOCF.size}</small></div></div><div class="ft"><span>파일 이름: <i></i></span><button type="button">열기</button></div></div>`);
      stage.appendChild(dlg); await sleep(500);
      const f = dlg.querySelector('.f');
      act.step('🖱', `다운로드 › ${DOCF.name} 선택`); await click(f, .3, .5); f.classList.add('on'); dlg.querySelector('i').textContent = DOCF.name; await sleep(300);
      act.step('🖱', '열기'); await click(dlg.querySelector('button')); dlg.remove();
    }
    async function eduSubmit(m, setAct) {
      await say(m, '가상 에듀파인에서 기안문을 써서 상신할게요. 제목·과제카드·본문을 넣고, 방금 만든 운영 계획서를 첨부한 뒤 결재올림 하겠습니다.');
      if (ls(BK) === null) ls(BK, ls(STORE) || '-');
      const act = actCard(m); setAct(act);
      ctlOn();
      await waitFor(() => Wn().VE && Wn().VE.Shell && D().querySelector('#lnbGrid'));
      hookOpen();
      try {
        const gnb = D().querySelector('#gnbMenu a[data-id="A00AAB01"]');
        if (gnb && !gnb.classList.contains('on')) { act.step('🖱', '위 메뉴 「문서관리」'); await click(gnb); }
        const w = await eduMenu(act, 'A00AAB0101', 'A00AAB0101001', '기안 › 공용서식 열기');
        const form = await waitFor(() => w.querySelector('a[data-form]'));
        act.step('🖱', `서식 「${form.getAttribute('data-form')}」 클릭 → 기안창`); await click(form, .2, .5);
        const P = () => popDoc(), q = id => P().getElementById(id);
        await waitFor(() => P() && q('Sj') && q('task'));
        await sleep(500);
        act.step('⌨', `제목: ${DRAFT.title}`); await type(q('Sj'), DRAFT.title);
        act.step('🖱', `과제카드 「${DRAFT.task}」 선택`); await choose(q('task'), DRAFT.task);
        act.step('⌨', '문서요지 입력'); await type(q('docOutline'), DRAFT.outline); hl(null);
        const names = ['ap2', 'ap3'].map(id => q(id).value);
        act.step('👁', `결재경로 확인: 검토 ${names[0]} → 결재 ${names[1]}`); await point(q('ap2'), .5, .5); await sleep(350); await point(q('ap3'), .5, .5); await sleep(350);
        act.step('🖱', '「본문」 탭'); await click(P().querySelector('a[data-tab="maindoc1"]'));
        const page = await waitFor(() => { const pg = P().querySelector('#maindoc1-area .page'); return pg && pg.offsetWidth && pg; });
        // 기본 줄(1. 관련: / 2.)을 지우고 한 줄씩 쓴다
        [...page.querySelectorAll('p.l0, p.l1, p.l2')].forEach(p => p.remove());
        let after = page.querySelector('.ttl');
        for (const [lv, text] of DRAFT.lines) {
          const p = P().createElement('p'); p.className = 'l' + lv; after.after(p); after = p;
          act.step('⌨', `본문: ${text.slice(0, 18)}…`); await typeLine(p, text);
        }
        hl(null);
        act.step('🖱', '첨부 「파일추가」'); await point(P().querySelector('[data-a="attAdd"]'), .5, .5); ripple(); await sleep(300);
        await pickFile(act);
        const buf = await (await fetch(DOCF.url)).arrayBuffer(), pw = popFr.contentWindow, dt = new pw.DataTransfer();
        dt.items.add(new pw.File([buf], DOCF.name, { type: 'application/hwp+zip' }));
        const fi = q('fileIn'); fi.files = dt.files; fi.dispatchEvent(new pw.Event('change'));
        await waitFor(() => P().querySelector('#attWrap').textContent.includes('운영 계획서'));
        act.step('👁', `첨부 확인: ${DOCF.name}`); await point(P().querySelector('#attWrap'), .4, .6); await sleep(400);
        act.step('🖱', '결재올림 클릭'); await click(q('btnSubmit'));
        let mo = await waitFor(() => { const x = popModal(); return x && x.querySelector('[data-b]') && x; });
        if (!/올리시겠습니까/.test(mo.textContent)) throw new Error(mo.querySelector('.msg').textContent);
        act.step('🖱', '「결재를 올리시겠습니까?」 → 확인'); await click(mo.querySelector('[data-b="0"]'));
        mo = await waitFor(() => { const x = popModal(); return x && /올림 되었습니다/.test(x.textContent) && x; });
        await sleep(400); act.step('🖱', '「결재 올림 되었습니다」 → 확인'); await click(mo.querySelector('[data-b="0"]'));
        await waitFor(() => !popFr, 4000).catch(() => {});
        act.step('✅', '상신됨');
        const w2 = await eduMenu(act, 'A00AAB0102', 'A00AAB0102002', '결재 › 문서진행 열기');
        const row = await waitFor(() => [...w2.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes(DRAFT.title)), 5000).catch(() => null);
        if (row) { act.step('👁', '문서진행 목록에서 확인'); await point(row, .4, .5); await sleep(500); }
        act.end(true); ctlOff();
        await say(m, '기안문을 상신했어요 ✅');
        await say(m, `<ul class="cg-ul"><li><b>제목</b> ${esc(DRAFT.title)}</li><li><b>과제카드</b> ${esc(DRAFT.task)}</li><li><b>첨부</b> ${esc(DOCF.name)}</li><li><b>결재경로</b> 기안(나) → 검토 ${esc(names[0])} → 결재 ${esc(names[1])}</li></ul>`);
        await say(m, '진행 상황은 에듀파인 「결재 › 문서진행」에서 확인할 수 있어요.');
        undoLink(m);
      } finally { unhookOpen(); }
    }
    // 스킬 2개 설치 (터미널 git clone) — 설치 요청이나, 설치 전에 계획서를 부탁받았을 때
    async function installSkills(m, setAct) {
      await say(m, '두 스킬을 내려받아 설치할게요.');
      const act = actCard(m, '작업 중'); setAct(act);
      const t = term(m);
      act.step('🌐', 'github.com/jkf87/hwpx-skill 확인');
      await t('git clone https://github.com/jkf87/hwpx-skill ~/.codex/skills/hwpx', ["Cloning into '/home/user/.codex/skills/hwpx'...", 'done.']);
      act.step('🌐', 'github.com/chrisryugj/kordoc 확인');
      await t('git clone https://github.com/chrisryugj/kordoc ~/.codex/skills/kordoc', ["Cloning into '/home/user/.codex/skills/kordoc'...", 'done.']);
      act.step('📖', 'SKILL.md 읽기');
      await t('ls ~/.codex/skills', ['hwpx  kordoc']);
      act.step('✅', '스킬 2개 등록'); act.end(true);
      edu.skills = true; $('.cg-tool').innerHTML = `${IC.mouse}컴퓨터 사용 · 🧩 hwpx · kordoc`;
      await say(m, '✓ <b>hwpx · kordoc</b> 스킬을 설치했습니다.');
    }
    async function eduAnswer(m, text, setAct) {
      const isSubmit = /기안|상신|결재/.test(text), isMake = !isSubmit && /계획서|만들|작성/.test(text), isInstall = !isSubmit && !isMake && /스킬|skill|github|설치/i.test(text);
      if (isInstall) {
        await think(m, 1800);
        await installSkills(m, setAct);
        await say(m, '한글 문서를 만들고(hwpx) 읽을 수(kordoc) 있어요. 무엇을 만들어 볼까요?');
        chips(m, [EDU_P2]); return;
      }
      if (isMake) {
        await think(m, 1200);
        if (!edu.skills) { await say(m, '한글(HWPX) 파일을 만들려면 hwpx 스킬이 필요해요. 먼저 hwpx·kordoc 스킬을 설치하고 이어서 만들게요.'); await installSkills(m, setAct); }   // 설치 → 바로 계획서
        await think(m, 2400);
        await say(m, '<b>hwpx</b> 스킬로 운영 계획서를 만들게요. 학교 계획서 모양(Ⅰ 운영 개요 ~ Ⅵ 기대 효과)으로 쓰고, 시간표는 표로 넣겠습니다.');
        const act = actCard(m, '작업 중'); setAct(act);
        act.step('🧩', 'hwpx 스킬 사용 — SKILL.md 지침 확인');
        act.step('📝', '내용 정리 — 11. 3.(화) 15:20∼17:00 · 베이크우드 · 미동초 8명'); await sleep(700);
        act.step('🧮', '일정 계산 — 1부 40분 → 휴식 10분 → 2부 40분 → 마무리 10분'); await sleep(700);
        const t = term(m);
        await t('python ~/.codex/skills/hwpx/scripts/build.py plan.md -o "운영 계획서.hwpx"', ['표지·제목 · 장 6개 · 표 1개(세부 운영 일정)', `saved: ${DOCF.name} (${DOCF.size})`]);
        act.step('🔍', 'kordoc으로 다시 읽어 확인');
        await t(`kordoc "${DOCF.name}" --text | head -4`, [OPS.date, OPS.title, 'Ⅰ 운영 개요 …']);
        act.step('✅', '운영 계획서.hwpx 저장'); act.end(true);
        edu.made = true;
        await say(m, '운영 계획서를 만들었어요.');
        fileCard(m);
        await say(m, '3:20~5:00은 100분이라, 1부 40분·휴식 10분·2부 40분 뒤 마지막 10분을 마무리(질의응답·사례 공유)로 넣었어요. 이 문서를 가상 에듀파인에 기안해서 상신할까요?');
        chips(m, [EDU_P3]); return;
      }
      if (isSubmit) {
        await think(m, 1500);
        if (!edu.made) { await say(m, '상신할 문서가 아직 없어요. 먼저 운영 계획서를 만들어 주세요.'); chips(m, [edu.skills ? EDU_P2 : EDU_P1]); return; }
        await eduSubmit(m, setAct); return;
      }
      await think(m, 700);
      await say(m, '이 창은 연수용 시연이에요. 스킬을 설치하고, 운영 계획서를 만든 뒤, 가상 에듀파인에 기안·상신해 달라고 요청해 보세요.');
      chips(m, [edu.made ? EDU_P3 : edu.skills ? EDU_P2 : EDU_P1]);
    }

    // ---------- 대답 ----------
    async function answer(text, withFile) {
      if (withFile) hadFile = true;
      const m = aMsg();
      let act = null;
      run = { stop: false, fixes: [] }; syncSend();
      try {
        if (KIND === 'edu') { await eduAnswer(m, text, a => { act = a; }); return; }
        if (/육아\s*시간/.test(text)) { await childcare(m, text, a => { act = a; }); return; }   // 파일 없이도 됨
        if (WIPE.test(text)) {   // 「저장한 내용 모두 없애줘」 → 평가계획·복무를 처음 예시 상태로(시연 연출 없이 바로)
          const r = resetSaved();
          m.appendChild(h(`<div class="cg-p">${r ? `가상 나이스의 <b>평가계획</b>(입력돼 있던 ${r.plans}건)과 <b>복무</b>(근무상황·출장·초과근무 신청 ${r.leaves}건, 복무 결재 문서)를 지우고 처음 상태로 되돌렸어요. 출결·학사일정 같은 다른 연습 자료는 그대로예요.` : '가상 나이스의 평가계획과 복무는 이미 처음 상태예요.'}</div>`));
          scrollEnd(); return;
        }
        const wantsNeis = /나이스|평가\s*계획|입력|크롬|chrome/i.test(text);
        const isAuto = /디지털|인공지능|자율\s*과목/.test(text), rest0 = text.replace(/디지털\s*사회와\s*인공지능/g, ' ');   // 「…사회…」가 사회로 잡히지 않게
        const named = SUBJS.filter(s => s === AUTO.name ? isAuto : rest0.includes(s));
        const more = /나머지|전부|모두|모든|다 해|계속|이어서|^(응|네|예|좋아)/.test(text);
        if (!hadFile && (wantsNeis || named.length)) {
          await think(m, 900);
          await say(m, '참고할 평가 계획 파일이 보이지 않아요. 아래 <b>📂 다운로드</b>의 PDF를 채팅창으로 끌어다 놓아 첨부한 뒤 다시 요청해 주세요.');
          return;
        }
        if (!wantsNeis && !named.length && !more) {
          await think(m, 700);
          await say(m, '이 창은 연수용 시연이에요. 첨부한 평가 계획 PDF를 참고해 <b>가상 나이스에 평가계획을 입력</b>해 달라고 요청해 보세요.');
          chips(m, [PROMPT]); return;
        }
        const left = SUBJS.filter(s => !done.has(s));
        let subjs = named.length ? named : (done.size && more) ? left : (/전부|모든|전 교과|모두/.test(text) ? SUBJS : ['국어']);
        if (!subjs.length) { await say(m, '첨부한 계획의 교과(목)를 모두 입력했어요. 가상 나이스 「평가계획(안)관리」에서 확인해 보세요.'); return; }
        await think(m, 2600);
        if (!done.size) {
          const total = SUBJS.reduce((a, s) => a + PLAN[s].length, 0);
          await say(m, `첨부한 「${esc(PDF.name)}」(${PDF.pages}쪽)를 읽었어요. 교과별 평가 계획에서 <b>${SUBJS.length}개 교과(목), 평가 ${total}건</b>을 찾았어요. 「${AUTO.name}」은 학교자율시간 과목이라 나이스에서 과목을 먼저 개설한 뒤 입력할게요.`);
          await say(m, `<span class="cg-sum">${SUBJS.map(s => `${s} ${PLAN[s].length}`).join(' · ')}</span>`);
        }
        subjs = subjs.filter(s => s !== AUTO.name).concat(subjs.includes(AUTO.name) ? [AUTO.name] : []);   // 자율 과목은 개설부터 하므로 맨 뒤
        const cnt = subjs.reduce((a, s) => a + PLAN[s].length, 0);
        await say(m, `가상 나이스 <b>평가계획(안)관리</b>에서 ${subjs.join('·')} ${cnt}건을 입력할게요. 1단계(영역명·성취기준·평가요소)를 넣고 저장한 뒤, 2단계에서 평가기준(잘함·보통·노력요함)을 넣겠습니다.`);
        if (ls(BK) === null) ls(BK, ls(STORE) || '-');
        act = actCard(m);
        ctlOn();
        await openPlan(act);
        const res = [];
        for (const s of subjs) {
          if (s === AUTO.name) await makeAuto(act);
          const a = await fillStd(act, s), b = await fillCrit(act, s);
          res.push([s, a, b]); done.add(s);
        }
        act.end(true); ctlOff();
        await say(m, `<b>${subjs.join('·')}</b> 평가계획 입력을 마쳤어요 ✅`);
        await say(m, `<ul class="cg-ul">${res.map(([s, a, b]) => `<li><b>${s}</b> — 성취기준 ${a}건 추가, 평가기준 ${b}건 저장${a + b ? '' : ' (이미 입력되어 있었음)'}</li>`).join('')}</ul>`);
        if (run.fixes.length) await say(m, `참고: 기존 자료 중 필수 칸이 비어 저장이 막힌 곳이 있어 성취기준에 맞게 채웠어요 — ${esc(run.fixes.join(', '))}`);
        const rest = SUBJS.filter(s => !done.has(s));
        if (rest.length) {
          await say(m, `화면에서 확인해 보세요. 나머지 ${rest.length}개 교과(${rest.reduce((a, s) => a + PLAN[s].length, 0)}건)도 이어서 입력할까요?`);
          chips(m, ['응, 나머지도 다 해줘', `${rest.includes('수학') ? '수학' : rest[0]}만 해줘`]);
        } else await say(m, '첨부한 계획의 모든 교과를 입력했어요. 「출력」으로 한 번 더 확인하시는 걸 권해요.');
        undoLink(m);
      } catch (e) {
        ctlOff(); if (act) act.end(false);
        m.appendChild(h(`<div class="cg-p cg-dim">${e === STOP ? '작업을 중지했어요. 지금까지 입력하고 저장한 내용은 그대로 남아 있어요.' : '작업 중 문제가 생겨 멈췄어요: ' + esc(e.message)}</div>`));
        undoLink(m);
      } finally { run = null; syncSend(); scrollEnd(); }
    }
    // 「(저장한·입력한) 내용 모두 없애줘」, 「평가계획 지워줘」, 「초기화해줘」 같은 말 — 나이스 평가계획·복무를 처음(예시) 상태로 되돌린다
    const WIPE = /(저장|입력|넣은|평가|복무).{0,12}(없애|지워|지우|삭제|초기|되돌|리셋)|초기화|처음\s*상태로/;
    function resetSaved() {
      let d = null; try { d = JSON.parse(ls(STORE) || 'null'); } catch (e) { d = null; }
      if (!d) { ls(BK, null); return null; }   // 저장된 자료가 없으면 이미 처음 상태
      const seed = (frame.contentWindow && frame.contentWindow.NEIS_SEED) || {};
      const copy = v => JSON.parse(JSON.stringify(v));
      const plans = (d.evalPlans || []).filter(p => p.std && p.std.trim()).length;
      const seedLeaves = (seed.leaves || []).length + (seed.bizTrips || []).length + (seed.overtime || []).length;
      const leaves = Math.max(0, (d.leaves || []).length + (d.bizTrips || []).length + (d.overtime || []).length - seedLeaves);
      // 평가계획: 지우면 다음에 열 때 예시 자료로 다시 만든다
      ['evalPlans', 'planSeedV', 'planApproval', 'planClose', 'autonomy'].forEach(k => { delete d[k]; });
      if (seed.standards) d.standards = copy(seed.standards);
      // 복무: 근무상황·출장·초과근무와 복무 결재 문서를 예시 자료로
      ['leaves', 'bizTrips', 'overtime'].forEach(k => { if (seed[k]) d[k] = copy(seed[k]); else delete d[k]; });
      if (Array.isArray(d.docs)) d.docs = d.docs.filter(x => x.area !== '복무').concat((seed.docs || []).filter(x => x.area === '복무').map(copy))
        .filter((x, i, a) => a.findIndex(y => y.id === x.id) === i);
      if (seed.approvals) d.approvals = copy(seed.approvals);
      ls(STORE, JSON.stringify(d)); ls(BK, null);
      done = new Set(); frame.src = sec.dataset.src;   // 나이스 화면 다시 불러오기
      return { plans, leaves };
    }
    function undoLink(m) {
      if (ls(BK) === null || m.querySelector('.cg-undo')) return;
      const b = h(`<button type="button" class="cg-undo">↺ 시연 전 ${KIND === 'edu' ? '에듀파인' : '나이스'} 자료로 되돌리기</button>`);
      b.onclick = () => {
        if (run) return;
        const b0 = ls(BK); if (b0 === null) return;
        ls(STORE, b0 === '-' ? null : b0); ls(BK, null);
        done = new Set(); frame.src = sec.dataset.src; b.textContent = '✓ 되돌렸어요'; b.disabled = true;
      };
      m.appendChild(b); scrollEnd();
    }

    const firstChip = () => { const e = log.querySelector('.cg-empty'); if (KIND === 'edu' && e) chips(e, [EDU_P1]); };   // 10번: 빈 채팅에 1단계(스킬 설치) 프롬프트
    firstChip(); $('.cg-new').addEventListener('click', firstChip);
    if (/[?&]chatgpt\b/.test(location.search)) setTimeout(() => toggle(true), 300);   // ?chatgpt#7 : 창을 연 채로 시작
  }
  makeChat(document.querySelector('.app[data-n="7"]'), 'neis');
  makeChat(document.querySelector('.app[data-n="10"]'), 'edu');
})();
