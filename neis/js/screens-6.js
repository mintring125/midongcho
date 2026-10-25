/* 업무 화면 (6) — 시간표관리(학급시간표관리·학급별/전체시간표조회) · 결보강처리 : 실제 나이스 화면 구성을 기준으로 재구현 */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const Ap = window.Approval;
  const esc = s => H.esc(s);
  const pad = n => String(n).padStart(2, '0');

  /* ================= 공통 정의 ================= */
  const SEM_START = '2026-08-18', SEM_END = '2026-12-31', NP = 8;
  const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
  const FULL = { '자율·자치': '자율·자치활동', '동아리': '동아리활동', '진로': '진로활동' };
  const ABBR = { '국어': '국', '사회': '사', '도덕': '도', '수학': '수', '과학': '과', '실과': '실', '체육': '체', '음악': '음', '미술': '미', '영어': '영', '자율·자치': '자', '동아리': '동', '진로': '진' };
  const disp = s => FULL[s] || s;
  const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
  const dow = k => (parse(k).getDay() + 6) % 7; // 0=월
  const dot = k => k.replace(/-/g, '.') + '.';
  const md = k => `${+k.slice(5, 7)}/${+k.slice(8, 10)}`;
  const tid = n => { const s = Ap.staff(n); return s ? s.id : 'teacher'; };
  const tLabel = n => `${n}(${tid(n)})`;
  const me = () => D().user.name;
  const hol = k => H.holiday(k);
  const schoolDay = k => dow(k) < 5 && !hol(k) && k >= SEM_START && k <= SEM_END;
  const clone = o => JSON.parse(JSON.stringify(o));
  // 과목·교사 선택 목록 (교과전담: 영어-마이콜, 체육-봉미선)
  const OPTS = () => { const out = []; D().subjects.forEach(s => { out.push({ s, t: me() }); if (s === '영어') out.push({ s, t: '마이콜' }); if (s === '체육') out.push({ s, t: '봉미선' }); }); return out; };
  // 다른 학급의 교과전담 수업(가상) — 교사중복·공강 판정용 [요일, 교시(0부터)]
  const OTHER = { '마이콜': { '5-1': [[0, 1], [1, 3], [3, 2]], '5-3': [[0, 3], [2, 1], [4, 2]] }, '봉미선': { '5-1': [[1, 1], [3, 4]], '5-3': [[0, 0], [2, 3]] }, '안한수': { '6-1': [[0, 2], [1, 4], [2, 0], [3, 1], [4, 3]] } };
  const OTHER_LEN = [6, 6, 5, 6, 5];
  const HOMER = { '나미리': '5-1', '변태수': '5-3' };
  function otherBusy(name, d, p) {
    if (OTHER[name]) return Object.values(OTHER[name]).some(l => l.some(([a, b]) => a === d && b === p));
    if (HOMER[name]) { const c = HOMER[name]; const spec = ['마이콜', '봉미선'].some(t => (OTHER[t][c] || []).some(([a, b]) => a === d && b === p)); return p < OTHER_LEN[d] && !spec; }
    return false;
  }
  const dupOf = (e, d, p) => !!(e && e.t && e.t !== me() && otherBusy(e.t, d, p));

  /* ================= 데이터(일자별 학급시간표) ================= */
  function baseTTs() {
    const d = D();
    if (!d.baseTTs) {
      const g = [...Array(NP)].map(() => [...Array(7)].map(() => null));
      d.baseTimetable.forEach((row, r) => row.forEach((s, c) => { if (s) g[r][c] = { s, t: s === '영어' ? '마이콜' : (s === '체육' && r === 3 && c === 3) ? '봉미선' : me() }; }));
      d.baseTTs = [{ name: '기본 시간표', grid: g, lunch: null }];
    }
    return d.baseTTs;
  }
  function tt() {
    const d = D();
    if (!d.tt2) {
      d.tt2 = { days: {}, lunch: {} };
      const g = baseTTs()[0].grid;
      for (let k = SEM_START; k <= SEM_END; k = addDays(k, 1)) if (schoolDay(k)) d.tt2.days[k] = g.map(r => r[dow(k)] ? clone(r[dow(k)]) : null);
      // 예시 결보강: 9/9 출장으로 5교시 체육을 봉미선 교사가 보강(완결)
      const e = d.tt2.days['2026-09-09'] && d.tt2.days['2026-09-09'][4];
      if (e) { e.mark = '보'; e.subT = '봉미선'; }
    }
    return d.tt2;
  }
  const day = k => (tt().days[k] || []);
  function bogang() {
    const d = D();
    if (!d.bogang) d.bogang = [{ id: 1, date: '2026-09-09', grade: 5, cls: 2, period: 5, subj: '체육', absT: me(), subT: '봉미선', reason: '출장(2학기 학교생활기록부 기재요령 연수)', field: false, status: '완결' }];
    return d.bogang;
  }
  const bgStatus = r => r.docId ? Ap.statusOf(r.docId) : (r.status || '저장');
  // 다른 화면(주간학습안내·진도표 등)이 쓰는 주간 시간표도 일자별 시간표에서 가져오도록 연결
  const oldTimetable = H.timetable;
  H.timetable = wkKey => { if (wkKey < SEM_START.slice(0, 8) + '01') return oldTimetable(wkKey); return [0, 1, 2, 3, 4, 5].map(r => [0, 1, 2, 3, 4].map(c => { const e = day(addDays(wkKey, c))[r]; return e ? e.s : (tt().days[addDays(wkKey, c)] ? '' : (oldTimetable(wkKey)[r] || [])[c] || ''); })); };

  // 학기 주차 (1주차: 08.18.~08.23.)
  function semWeeks() {
    const out = []; let s = SEM_START, n = 1;
    while (s <= SEM_END) { const e = addDays(s, 6 - dow(s)); out.push({ no: n++, start: s, end: e > SEM_END ? SEM_END : e, mon: addDays(s, -dow(s)) }); s = addDays(e, 1); }
    return out;
  }
  function weekEvents(w) {
    const ev = [];
    for (let k = w.start; k <= w.end; k = addDays(k, 1)) {
      const h = D().schedule.filter(x => x.d === k);
      if (dow(k) === 5) { ev.push(h.length ? h.map(x => `${x.t}(${md(k)})`).join(', ') : `토요휴업일(${md(k)})`); continue; }
      if (dow(k) === 6) { h.forEach(x => ev.push(`${x.t}(${md(k)})`)); continue; }
      h.forEach(x => ev.push(`${x.t}(${md(k)})`));
    }
    return ev.join(', ');
  }
  const curWeek = () => { const t = key(A().today()); return semWeeks().find(w => t >= w.start && t <= w.end) || semWeeks()[0]; };
  function stdHours() {
    const c = (D().curri || {})[5];
    const base = { '국어': 102, '사회': 51, '도덕': 17, '수학': 68, '과학': 51, '실과': 34, '체육': 51, '음악': 34, '미술': 34, '영어': 51, '자율·자치': 17, '동아리': 17, '진로': 17 };
    if (!c) return base;
    const o = {}; Object.keys(base).forEach(s => { const v = (c.subj[s] || c.cha[s]); o[s] = v ? v[1] : base[s]; }); return o;
  }
  function countRange(a, b, src) {
    const c = {}; for (let k = a; k <= b; k = addDays(k, 1)) { if (!schoolDay(k)) continue; ((src && src[k]) || day(k)).forEach(e => { if (e && e.s) c[e.s] = (c[e.s] || 0) + 1; }); }
    return c;
  }
  const dateStep = (cls, v) => `<span class="dstep"><input type="date" class="inp ${cls}" value="${v}" style="width:150px"><button class="rb" data-d="-1" data-t="${cls}">−</button><button class="rb" data-d="1" data-t="${cls}">+</button></span>`;
  const bindSteps = root => H.$$('.dstep .rb', root).forEach(b => { b.onclick = () => { const i = H.$('.' + b.dataset.t, root); if (i.value) i.value = addDays(i.value, +b.dataset.d); i.dispatchEvent(new Event('change')); }; });
  function ctx(e, items) {
    e.preventDefault(); document.querySelectorAll('.ctx').forEach(x => x.remove());
    const m = A().el(`<div class="ctx blue">${items.map(i => `<div>${esc(i[0])}</div>`).join('')}</div>`);
    m.style.left = Math.min(e.clientX, window.innerWidth - 260) + 'px'; m.style.top = Math.max(10, Math.min(e.clientY - 200, window.innerHeight - 440)) + 'px';
    H.$$('div', m).forEach((x, i) => { x.onclick = () => { m.remove(); items[i][1](); }; });
    document.body.appendChild(m);
  }
  // 화면 머리: 글자크기(A A)·조회숨김 버튼 (실제 화면과 동일한 배치)
  function headerExtras(page) {
    const hd = H.$('.app-hd', page); if (!hd || H.$('.hd-a', hd)) return;
    const u = H.$('.utils', hd);
    const a1 = A().el('<button class="hd-a" title="글자 크게">A</button>'), a2 = A().el('<button class="hd-a" title="글자 작게" style="font-size:11px">A</button>');
    hd.insertBefore(a1, u); hd.insertBefore(a2, u);
    let z = 1; a1.onclick = () => { z = Math.min(1.3, z + 0.1); page.style.zoom = z; }; a2.onclick = () => { z = Math.max(0.8, z - 0.1); page.style.zoom = z; };
    const hide = A().el('<button class="hd-hide">조회숨김</button>'); hd.appendChild(hide);
    hide.onclick = () => { const sb = H.$('.search-box', page); const v = sb.style.display === 'none'; sb.style.display = v ? '' : 'none'; hide.textContent = v ? '조회숨김' : '조회보이기'; };
  }
  const confirmClose = close => { A().confirmBox('윈도우창을 닫으시겠습니까?', close); return false; };

  /* ================= 리포트 뷰어 ================= */
  function viewer(box, pages, opts) {
    opts = opts || {}; let i = 0, z = 100;
    box.innerHTML = `<div class="rv-bar"><button data-a="first" title="처음">«</button><button data-a="prev" title="이전">‹</button><button data-a="next" title="다음">›</button><button data-a="last" title="마지막">»</button><span class="sep"></span><input class="pg" readonly><span class="tot"></span><span class="sep"></span><button data-a="zo" title="축소">−</button><button data-a="zi" title="확대">+</button><select class="zs">${[50, 75, 100, 125, 150].map(v => `<option ${v === 100 ? 'selected' : ''}>${v}%</option>`).join('')}</select><span class="sep"></span><button data-a="save" title="저장">💾</button><span class="sep"></span><button data-a="print" title="인쇄">🖶</button><span class="sep"></span><button data-a="find" title="찾기">⌕</button><button data-a="clear" title="찾기 해제">⊘</button></div><div class="rv-body"><div class="rv-page print-doc"></div></div>`;
    const pg = H.$('.rv-page', box);
    const draw = () => { pg.innerHTML = pages.length ? pages[i] : '<div class="nodata" style="padding:60px">출력할 자료가 없습니다.</div>'; pg.style.zoom = z / 100; H.$('.pg', box).value = pages.length ? i + 1 : 0; H.$('.tot', box).textContent = `/ ${pages.length}`; H.$('.zs', box).value = z + '%'; };
    H.$$('.rv-bar button', box).forEach(b => { b.onclick = () => { const a = b.dataset.a; if (a === 'first') i = 0; if (a === 'prev') i = Math.max(0, i - 1); if (a === 'next') i = Math.min(pages.length - 1, i + 1); if (a === 'last') i = pages.length - 1; if (a === 'zo') z = Math.max(50, z - 25); if (a === 'zi') z = Math.min(150, z + 25); if (a === 'save') { A().alertBox('연수용 환경에서는 파일 저장(PDF·한글·엑셀 등)을 지원하지 않습니다.'); return; } if (a === 'print') { window.print(); return; } if (a === 'find') { const m = A().modal({ title: '찾기', width: 380, body: '<input class="inp q" style="width:100%">', buttons: [{ text: '찾기', cls: 'primary', onClick: () => { const q = H.$('.q', m.pop).value.trim(); if (!q) return false; draw(); pg.innerHTML = pg.innerHTML.split(esc(q)).join(`<mark>${esc(q)}</mark>`); } }, { text: '닫기' }] }); return; } if (a === 'clear') { draw(); return; } if (i < 0) i = 0; draw(); }; });
    H.$('.zs', box).onchange = e => { z = parseInt(e.target.value, 10); draw(); };
    draw();
  }
  function classReport(w, src) {
    const d = D(); const std = stdHours();
    const tot = countRange(SEM_START, SEM_END), acc = countRange(SEM_START, w.end), wk = countRange(w.start, w.end, src);
    const subs = ['행사활동'].concat(d.subjects);
    const cell = s => s === '행사활동' ? '<td>행사활동(학사일정)</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td>' : `<td>${esc(disp(s))}</td><td>${std[s] || 0}</td><td>${tot[s] || 0}</td><td>${acc[s] || 0}</td><td>${(tot[s] || 0) - (std[s] || 0)}</td><td>${wk[s] || 0}</td>`;
    let sum = ''; for (let i = 0; i < subs.length; i += 4) sum += `<tr>${[0, 1, 2, 3].map(j => subs[i + j] ? cell(subs[i + j]) : '<td></td><td></td><td></td><td></td><td></td><td></td>').join('')}</tr>`;
    const dates = [...Array(7)].map((x, i) => addDays(w.mon, i));
    let body = '';
    for (let p = 0; p < 7; p++) body += `<tr><td>${p + 1}교시</td>${dates.map(k => { const h = hol(k); if (h && dow(k) < 5) return `<td style="color:#e0262c">${esc(h.t)}</td>`; const e = ((src && src[k]) || day(k))[p]; return `<td>${e ? `${e.mark ? `(${e.mark})` : ''}${esc(disp(e.s))}<br>(${esc(e.subT || e.t)})` : ''}</td>`; }).join('')}</tr>`;
    return `<h2 style="font-size:24px;letter-spacing:4px;margin-top:10px">학급별 시간표</h2><p>2026학년도 2학기 5학년 2반</p><p style="text-align:right;font-size:12px"><b>※ 시수순서:</b> 편제시수 · 전체시간표 총시수 · 현재까지 누계시수 · 시수 편차 · 주간시수</p>
      <table><tr>${[0, 1, 2, 3].map(() => '<th>교과</th><th>편제</th><th>시간표</th><th>누계</th><th>편차</th><th>주간</th>').join('')}</tr>${sum}</table><br>
      <table><tr><th style="width:70px">교시 \\ 일자</th>${dates.map(k => `<th>${dot(k)}<br>(${DAYS[dow(k)]})</th>`).join('')}</tr>${body}</table>`;
  }

  /* ================= 학급시간표관리 ================= */
  S['학급시간표관리'] = function (page, title, app) {
    const d = D(); tt(); bogang(); headerExtras(page);
    H.$('.app-tit', page).textContent = '학급시간표 관리';
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학기', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.sf('학년', `<select class="sel">${app.opts(['5'])}</select>`, true)}${app.sf('반', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.searchBtn()}</div>
      <div class="tt-wrap"><div class="wk"></div><div class="mn"><div class="sum"></div>
        <div class="toolbar" style="margin:10px 0 4px;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:8px"><div class="tt-legend"><span class="bx" style="background:#ff1f1f"></span>행사 <span class="bx" style="background:#ff1aa3"></span>교사중복 <span class="bx" style="background:#0a8a0a"></span><span class="g">(보)</span> 결보강</div><div class="tt-legend"><span class="g">(현)</span> 현장체험학습 보강</div></div><span class="sp"></span>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><div style="display:flex;gap:6px"><button class="btn primary b-base">기초시간표</button><button class="btn primary b-sem">학기별시간표관리</button><button class="btn primary b-ev">행사처리</button><button class="btn primary b-bulk">일괄변경</button></div><div style="display:flex;gap:6px"><button class="btn primary b-save">저장</button><button class="btn primary b-print">학급시간표 출력</button></div></div></div>
        <div class="tbl"></div></div></div>`);
    const wk = H.$('.wk', page), sum = H.$('.sum', page), tbl = H.$('.tbl', page);
    const sumHead = `<table class="grid sum"><thead><tr><th colspan="2">구분</th><th colspan="${d.subjects.length - 3}">교과</th><th colspan="3">창의적체험활동</th><th rowspan="2">합계</th></tr><tr><th style="width:52px">기준</th><th style="width:70px">내용</th>${d.subjects.map(s => `<th>${esc(disp(s))}</th>`).join('')}</tr></thead>`;
    const empty = (n, msg) => `<div class="grid-wrap"><table class="grid">${n || ''}<tbody><tr><td style="height:auto;border:none">${app.nodata(msg)}</td></tr></tbody></table></div>`;
    wk.innerHTML = empty('<thead><tr><th>주차</th><th>주요행사</th></tr></thead>'); sum.innerHTML = `<div class="grid-wrap">${sumHead}<tbody><tr><td colspan="${d.subjects.length + 3}" style="height:auto;border:none">${app.nodata()}</td></tr></tbody></table></div>`;
    tbl.innerHTML = empty(`<thead><tr><th style="width:74px">교시</th>${DAYS.map((x, i) => `<th class="${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${x}</th>`).join('')}</tr></thead>`);
    let queried = false, W = null, work = null, dirty = false;
    const weeks = semWeeks();
    const loadWeek = w => { W = w; work = {}; for (let k = w.mon; k <= addDays(w.mon, 6); k = addDays(k, 1)) if (tt().days[k]) work[k] = clone(tt().days[k]); dirty = false; };
    const drawWeeks = () => { wk.innerHTML = H.grid([{ t: '주차<span class="sort">△</span>', w: 215 }, { t: '주요행사' }], weeks.map(w => `<tr data-n="${w.no}" class="${W && W.no === w.no ? 'sel' : ''}"><td>${w.no}주차 (${dot(w.start)}~${dot(w.end)})</td><td title="${esc(weekEvents(w))}">${esc(weekEvents(w))}</td></tr>`).join(''), { h: 640, cls: 'wkl' }); H.$$('tr[data-n]', wk).forEach(tr => { tr.onclick = () => { const go = () => { loadWeek(weeks.find(w => w.no === +tr.dataset.n)); drawAll(); }; if (dirty) app.confirmBox('저장하지 않은 변경 내용이 있습니다.\n다른 주차로 이동하시겠습니까?', go); else go(); }; }); const sel = H.$('tr.sel', wk); if (sel) sel.scrollIntoView({ block: 'nearest' }); };
    const drawSum = () => {
      const std = stdHours(); const all = countRange(SEM_START, SEM_END, Object.assign({}, tt().days, work)); const w = countRange(W.start, W.end, work); const acc = countRange(SEM_START, W.end, Object.assign({}, tt().days, work));
      const row = (a, b, f) => { let t = 0; const tds = d.subjects.map(s => { const v = f(s); t += v; return `<td>${v}</td>`; }).join(''); return `<tr><td>${a}</td><td>${b}</td>${tds}<td>${t}</td></tr>`; };
      sum.innerHTML = `<div class="grid-wrap">${sumHead}<tbody>${row('2학기', '기준시수', s => std[s] || 0)}${row('2학기', '편차', s => (all[s] || 0) - (std[s] || 0))}${row(W.no + '주차', '입력시수', s => w[s] || 0)}${row(W.no + '주차', '누적시수', s => acc[s] || 0)}</tbody></table></div>`;
    };
    const cellHtml = (e, k, p) => {
      if (!e) return '';
      const lab = `${e.mark ? `(${e.mark})` : ''}${esc(disp(e.s))}`;
      const who = e.mark ? tLabel(e.subT) : tLabel(e.t) + (e.t2 ? ', ' + tLabel(e.t2) : '');
      return `${e.ev ? `${esc(e.ev)}<br>` : ''}${lab}<br>(${esc(who)})`;
    };
    const drawTable = () => {
      const dates = [...Array(7)].map((x, i) => addDays(W.mon, i));
      const lunch = dates.map(k => tt().lunch[k]).find(x => x != null);
      let rows = '';
      for (let p = 0; p < 7; p++) {
        rows += `<tr><td style="background:#f7f8fa">${p + 1}교시</td>${dates.map((k, di) => {
          const h = hol(k);
          if (h && di < 5) return `<td class="hol">${esc(h.t)}</td>`;
          if (k < SEM_START || k > SEM_END) return '<td class="hol" style="color:#aaa"></td>';
          const e = (work[k] || [])[p];
          const cls = [e && dupOf(e, di, p) ? 'dup' : '', e && e.mark ? 'bo' : '', e && e.ev ? 'evc' : ''].join(' ');
          return `<td class="c ${cls}" data-k="${k}" data-p="${p}">${cellHtml(e, k, p)}</td>`;
        }).join('')}</tr>`;
        if (lunch === p + 1) rows += `<tr class="lunch"><td>점심</td><td colspan="7">점심시간</td></tr>`;
      }
      tbl.innerHTML = H.grid([{ t: '교시', w: 74 }].concat(dates.map((k, i) => ({ t: `<span>${DAYS[i]}</span><br><span style="font-weight:400">(${dot(k)})</span>` }))), rows, { cls: 'tt2', h: 600 }).replace(/<th>(<span>토<\/span>)/, '<th class="sat">$1').replace(/<th>(<span>일<\/span>)/, '<th class="sun">$1');
      H.$$('td.c', tbl).forEach(td => { td.oncontextmenu = e => cellMenu(e, td.dataset.k, +td.dataset.p); });
      H.$$('td.hol', tbl).forEach(td => { td.oncontextmenu = e => { e.preventDefault(); app.alertBox('공휴일·휴업일에는 시간표를 편성할 수 없습니다.'); }; });
    };
    const drawAll = () => { drawWeeks(); drawSum(); drawTable(); };
    const touch = () => { dirty = true; drawSum(); drawTable(); };
    const cellMenu = (e, k, p) => {
      const col = work[k] = work[k] || [];
      const items = OPTS().map(o => [`${disp(o.s)}(${tLabel(o.t)})`, () => { col[p] = { s: o.s, t: o.t }; touch(); }]);
      items.push(['결보강처리', () => bogangReg(k, false)]);
      items.push(['보강등록(현장체험학습)', () => bogangReg(k, true)]);
      items.push(['행사처리', () => eventPopup(k, p)]);
      items.push(['공백삽입', () => { col.splice(p, 0, null); col.length = Math.min(col.length, NP); touch(); }]);
      items.push(['공백삭제', () => { if (col[p]) { app.alertBox('공백(빈 교시)에서만 공백삭제를 할 수 있습니다.'); return; } col.splice(p, 1); touch(); }]);
      items.push(['수업삭제', () => { col[p] = null; touch(); }]);
      items.push(['전체 수업삭제', () => app.confirmBox(`${dot(k)} (${DAYS[dow(k)]}) 전체 수업을 삭제하시겠습니까?`, () => { work[k] = []; touch(); })]);
      items.push(['교사추가', () => { if (!col[p]) { app.alertBox('수업이 편성된 교시에서만 교사를 추가할 수 있습니다.'); return; } const m = app.modal({ title: '교사추가', width: 380, body: `<select class="sel v" style="width:100%">${app.opts(D().staff.filter(s => s.name !== col[p].t && /교사/.test(s.pos)).map(s => [s.name, tLabel(s.name)]))}</select>`, buttons: [{ text: '추가', cls: 'primary', onClick: () => { col[p].t2 = H.$('.v', m.pop).value; touch(); } }, { text: '닫기' }] }); }]);
      items.push(['취소', () => { }]);
      ctx(e, items);
    };
    page.__refresh = () => { if (queried && !dirty) { loadWeek(W); drawAll(); } };
    H.$('.b-search', page).onclick = () => { const go = () => { queried = true; loadWeek(W || curWeek()); drawAll(); }; if (dirty) app.confirmBox('저장하지 않은 변경 내용이 있습니다. 다시 조회하시겠습니까?', go); else go(); };
    const need = () => { if (!queried) { app.alertBox('조회 후 사용하십시오.'); return false; } return true; };
    H.$('.b-save', page).onclick = () => { if (!need()) return; if (!dirty) { app.alertBox('변경된 내용이 없습니다.'); return; } const dups = []; Object.keys(work).forEach(k => work[k].forEach((e, p) => { if (dupOf(e, dow(k), p)) dups.push(`${md(k)} ${p + 1}교시 ${e.t}`); })); const go = () => { Object.assign(tt().days, clone(work)); dirty = false; H.save(); drawAll(); }; if (dups.length) app.confirmBox(`교사중복 수업이 있습니다.\n${dups.join('\n')}\n\n그대로 저장하시겠습니까?`, go); else go(); };
    H.$('.b-print', page).onclick = () => { if (!need()) return; const m = app.modal({ title: '학급시간표 출력', width: 1100, body: '<div class="vw"></div>' }); viewer(H.$('.vw', m.pop), [classReport(W, work)]); };
    H.$('.b-base', page).onclick = () => { if (!need()) return; baseTTPopup(() => { loadWeek(W); drawAll(); }); };
    H.$('.b-sem', page).onclick = () => { if (!need()) return; semPopup(() => { loadWeek(W); drawAll(); }); };
    H.$('.b-ev', page).onclick = () => { if (!need()) return; eventPopup(key(A().today()), null); };
    H.$('.b-bulk', page).onclick = () => { if (!need()) return; bulkPopup(); };

    /* --- 기초시간표 작성 및 반영 --- */
    function baseTTPopup(after) {
      const list = baseTTs(); let cur = 0; let changed = false;
      const m = app.modal({ title: '학급시간표 관리 - 기초시간표 작성 및 반영', width: 1400, body: '<div class="bp"></div>', beforeClose: close => confirmClose(() => { close(); after(); }), buttons: [{ text: '닫기', onClick: () => { after(); } }] });
      const bp = H.$('.bp', m.pop);
      const conflict = (e, c, r) => !!(e && e.t && e.t !== me() && otherBusy(e.t, c, r));
      const draw = () => {
        const b = list[cur];
        bp.innerHTML = `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">기초시간표 작성 및 반영</h1></div>
          <div class="split"><div class="left" style="width:420px"><div class="toolbar"><span class="total">Total <b>${OPTS().length}</b></span><span class="gear">${app.I.gearSm}</span></div>${H.grid([{ t: '과목' }, { t: '교사', w: 100 }, { t: '교사 ID', w: 110 }], OPTS().map((o, i) => `<tr draggable="true" data-i="${i}" style="cursor:grab"><td>${esc(disp(o.s))}</td><td>${esc(o.t)}</td><td>${esc(tid(o.t))}</td></tr>`).join(''), { h: 560, cls: 'tlist' })}</div>
          <div class="right"><div style="font-size:20px;font-weight:700;margin:4px 0 10px">2026 학년도 2 학기 5 학년 2 반</div>
            <div class="bt-tabs">${list.map((x, i) => `<a class="${i === cur ? 'on' : ''}" data-i="${i}">${i === 0 ? '(기본) ' : ''}${esc(x.name)}${i ? '<span class="x" data-x="' + i + '">✕</span>' : ' <span class="x">✕</span>'}</a>`).join('')}<a class="add">+</a></div>
            <div class="toolbar"><span style="width:110px">시간표명 :</span><input class="inp nm" style="width:320px" value="${esc(b.name)}"><span class="sp"></span><button class="btn primary b-bs">저장</button><button class="btn primary b-bp">출력</button></div>
            ${H.grid([{ t: '', w: 70 }].concat(DAYS.map((x, i) => ({ t: i === 6 ? '<span style="color:#e0262c">일</span>' : x }))), b.grid.map((row, r) => `<tr><td>${r + 1}교시</td>${row.map((e, c) => `<td class="bc ${conflict(e, c, r) ? 'cf' : ''}" data-r="${r}" data-c="${c}">${e ? `${esc(disp(e.s))}(${esc(e.t)})` : ''}</td>`).join('')}</tr>${b.lunch === r + 1 ? '<tr class="lunch"><td>점심</td><td colspan="7" style="background:#fff8e1;color:#8a5a00">점심시간</td></tr>' : ''}`).join(''), { h: 420, cls: 'bt' })}
            <div class="toolbar" style="margin-top:10px"><span class="sp"></span><span class="tt-legend"><span class="bx" style="background:#ff2a2a"></span>교사겹침</span><span class="sp"></span><button class="btn primary b-ref">반영</button><button class="btn primary b-info">학년별 학기 날짜정보 보기</button></div>
            <div class="toolbar"><span class="sp"></span><button class="btn primary b-imp">가져오기</button></div>
            <div class="sub-tit" style="margin-top:4px">기초시간표 반영</div>
            <table class="form"><tr><th>학년도</th><td>2026 학년도</td><th>학년</th><td>5 학년</td><th>학기</th><td>2 학기</td><th>반</th><td>2 반</td></tr>
              <tr><th>반영기간</th><td colspan="3">${dateStep('r1', SEM_START)} ~ ${dateStep('r2', SEM_END)}</td><th>선택한<br>기초시간표</th><td colspan="3"><select class="sel rs" style="width:240px">${app.opts(list.map((x, i) => [i, x.name]), cur)}</select></td></tr></table></div></div>`;
        bindSteps(bp);
        H.$$('.tlist tr[draggable]', bp).forEach(tr => { tr.ondragstart = ev => ev.dataTransfer.setData('text/plain', tr.dataset.i); });
        H.$$('td.bc', bp).forEach(td => {
          td.ondragover = ev => { ev.preventDefault(); td.classList.add('drag-over'); }; td.ondragleave = () => td.classList.remove('drag-over');
          td.ondrop = ev => { ev.preventDefault(); const o = OPTS()[+ev.dataTransfer.getData('text/plain')]; if (!o) return; b.grid[+td.dataset.r][+td.dataset.c] = { s: o.s, t: o.t }; changed = true; draw(); };
          td.oncontextmenu = ev => { const r = +td.dataset.r, c = +td.dataset.c; ctx(ev, [
            ['점심시간추가', () => { const mm = app.modal({ title: '점심시간추가', width: 420, body: `<table class="form"><tr><th>위치</th><td><select class="sel v">${app.opts([1, 2, 3, 4, 5, 6].map(x => [x, `${x}교시 다음`]), r + 1)}</select></td></tr><tr><th>시간</th><td><input type="time" class="inp" value="12:10"> ~ <input type="time" class="inp" value="13:00"></td></tr></table>`, buttons: [{ text: '확인', cls: 'primary', onClick: () => { b.lunch = +H.$('.v', mm.pop).value; changed = true; draw(); } }, { text: '점심시간 삭제', onClick: () => { b.lunch = null; changed = true; draw(); } }, { text: '닫기' }] }); }],
            ['공백삽입', () => { const col = b.grid.map(x => x[c]); col.splice(r, 0, null); col.length = NP; col.forEach((v, i) => { b.grid[i][c] = v; }); changed = true; draw(); }],
            ['공백삭제', () => { if (b.grid[r][c]) { app.alertBox('공백(빈 교시)에서만 공백삭제를 할 수 있습니다.'); return; } const col = b.grid.map(x => x[c]); col.splice(r, 1); col.push(null); col.forEach((v, i) => { b.grid[i][c] = v; }); changed = true; draw(); }],
            ['삭제', () => { b.grid[r][c] = null; changed = true; draw(); }],
            ['일괄변경', () => { const e0 = b.grid[r][c]; if (!e0) { app.alertBox('과목이 있는 칸에서 사용하십시오.'); return; } const mm = app.modal({ title: '일괄변경', width: 440, body: `<p>기초시간표의 <b>${esc(disp(e0.s))}(${esc(e0.t)})</b>를 모두 아래 과목으로 변경합니다.</p><select class="sel v" style="width:100%">${app.opts(OPTS().map((o, i) => [i, `${disp(o.s)}(${o.t})`]))}</select>`, buttons: [{ text: '변경', cls: 'primary', onClick: () => { const o = OPTS()[+H.$('.v', mm.pop).value]; b.grid.forEach(row => row.forEach((x, j) => { if (x && x.s === e0.s && x.t === e0.t) row[j] = { s: o.s, t: o.t }; })); changed = true; draw(); } }, { text: '닫기' }] }); }]
          ]); };
        });
        H.$$('.bt-tabs a[data-i]', bp).forEach(a => { a.onclick = ev => { if (ev.target.dataset.x) { const i = +ev.target.dataset.x; app.confirmBox(`'${list[i].name}'을(를) 삭제하시겠습니까?`, () => { list.splice(i, 1); cur = 0; app.Store.save(); draw(); }); return; } cur = +a.dataset.i; draw(); }; });
        H.$('.bt-tabs .add', bp).onclick = () => { list.push({ name: `기초시간표${list.length + 1}`, grid: [...Array(NP)].map(() => [...Array(7)].map(() => null)), lunch: null }); cur = list.length - 1; draw(); };
        H.$('.nm', bp).oninput = e => { b.name = e.target.value; };
        H.$('.b-bs', bp).onclick = () => { if (!b.name.trim()) { app.alertBox('시간표명을 입력하십시오.'); return; } app.Store.save(); changed = false; app.alertBox('기초시간표가 저장되었습니다.'); draw(); };
        H.$('.b-bp', bp).onclick = () => { const mm = app.modal({ title: '기초시간표 출력', width: 1000, body: '<div class="vw"></div>' }); viewer(H.$('.vw', mm.pop), [`<h2 style="font-size:22px">기초시간표 (${esc(b.name)})</h2><p>2026학년도 2학기 5학년 2반</p><table><tr><th>교시</th>${DAYS.slice(0, 5).map(x => `<th>${x}</th>`).join('')}</tr>${b.grid.slice(0, 7).map((row, r) => `<tr><td>${r + 1}교시</td>${row.slice(0, 5).map(e => `<td>${e ? `${esc(disp(e.s))}<br>(${esc(e.t)})` : ''}</td>`).join('')}</tr>`).join('')}</table>`]); };
        H.$('.b-info', bp).onclick = () => { const hs = D().schedule.filter(x => x.d >= SEM_START && x.d <= SEM_END && x.k === 'hol'); let n = 0; for (let k = SEM_START; k <= SEM_END; k = addDays(k, 1)) if (schoolDay(k)) n++; app.modal({ title: '학년별 학기 날짜정보', width: 560, body: `<table class="form"><tr><th>학기 시작일</th><td>${dot(SEM_START)}</td></tr><tr><th>학기 종료일</th><td>${dot(SEM_END)}</td></tr><tr><th>주차 수</th><td>${semWeeks().length}주</td></tr><tr><th>수업일수</th><td>${n}일</td></tr></table><div class="sub-tit" style="font-size:15px">공휴일·휴업일</div>` + H.grid([{ t: '일자', w: 130 }, { t: '내용' }], hs.map(x => `<tr><td>${dot(x.d)}</td><td>${esc(x.t)}</td></tr>`).join(''), { h: 260 }) }); };
        H.$('.b-imp', bp).onclick = () => { const mm = app.modal({ title: '기초시간표 가져오기', width: 460, body: `<table class="form"><tr><th>가져올 시간표</th><td><select class="sel v" style="width:100%">${app.opts([['base', '1학기 기초시간표(연수용 예시)']].concat(list.map((x, i) => [i, x.name]).filter(x => x[0] !== cur)))}</select></td></tr></table><div class="info-box warn" style="margin-top:8px;font-size:12px">현재 탭의 기초시간표가 덮어쓰기 됩니다.</div>`, buttons: [{ text: '가져오기', cls: 'primary', onClick: () => { const v = H.$('.v', mm.pop).value; b.grid = v === 'base' ? baseTTsDefault() : clone(list[+v].grid); changed = true; draw(); app.toast('가져왔습니다. {저장}을 누르십시오.'); } }, { text: '닫기' }] }); };
        H.$('.b-ref', bp).onclick = () => {
          const a = H.$('.r1', bp).value, z = H.$('.r2', bp).value, src = list[+H.$('.rs', bp).value];
          if (!a || !z || a > z) { app.alertBox('반영기간을 올바르게 입력하십시오.'); return; }
          if (changed) { app.alertBox('기초시간표를 먼저 {저장}하십시오.'); return; }
          app.confirmBox(`${dot(a)} ~ ${dot(z)} 기간의 학급시간표를\n'${src.name}'(으)로 반영하시겠습니까?\n\n※ 해당 기간에 입력된 시간표(결보강·행사 처리 포함)가 덮어쓰기 됩니다.`, () => {
            let n = 0; for (let k = a < SEM_START ? SEM_START : a; k <= z && k <= SEM_END; k = addDays(k, 1)) { if (!schoolDay(k)) continue; tt().days[k] = src.grid.map(r => r[dow(k)] ? clone(r[dow(k)]) : null); if (src.lunch) tt().lunch[k] = src.lunch; else delete tt().lunch[k]; n++; }
            H.save(`${n}일의 학급시간표에 기초시간표가 반영되었습니다.`);
          });
        };
      };
      draw();
    }
    function baseTTsDefault() { const g = [...Array(NP)].map(() => [...Array(7)].map(() => null)); D().baseTimetable.forEach((row, r) => row.forEach((s, c) => { if (s) g[r][c] = { s, t: s === '영어' ? '마이콜' : me() }; })); return g; }

    /* --- 학기별 시간표 관리 --- */
    function semPopup(after) {
      let sw = null, q = false;
      const m = app.modal({ title: '학급시간표 관리 - 학기별시간표 관리', width: 1500, body: '<div class="sp2"></div>', beforeClose: close => confirmClose(() => { close(); after(); }) });
      const box = H.$('.sp2', m.pop);
      const std = stdHours(); const subs = d.subjects;
      const shell = () => `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">학기별 시간표 관리</h1></div><div class="search-box">${app.sf('학년도', '<input class="inp" value="2026" readonly style="width:110px">', true)}${app.sf('학기', '<input class="inp" value="2" readonly style="width:110px">', true)}${app.sf('학년', '<input class="inp" value="5" readonly style="width:110px">', true)}${app.sf('반', '<input class="inp" value="2" readonly style="width:110px">', true)}<span class="sp"></span><button class="btn primary b-q">${app.I.searchSm}조회</button></div>
        <div class="toolbar"><span class="total">Total <b class="ct">0</b></span><span class="gear">${app.I.gearSm}</span><span class="sp"></span><button class="btn primary b-s">저장</button><button class="btn primary b-p">출력</button></div><div class="t1"></div><div class="t2" style="margin-top:12px"></div>`;
      box.innerHTML = shell();
      const head1 = `<thead><tr><th rowspan="2" style="width:70px">기준<span class="sort">△</span></th><th rowspan="2" style="width:140px">구분<span class="sort">△</span></th><th colspan="${subs.length - 3}">교과</th><th colspan="3">창의적체험활동</th><th rowspan="2">합계</th></tr><tr>${subs.map(s => `<th>${esc(disp(s))}</th>`).join('')}</tr></thead>`;
      const head2 = `<thead><tr><th rowspan="2" style="width:50px">월</th><th rowspan="2" style="width:240px">주</th>${DAYS.slice(0, 5).map(x => `<th colspan="8">${x}</th>`).join('')}</tr><tr>${DAYS.slice(0, 5).map(() => [1, 2, 3, 4, 5, 6, 7, 8].map(n => `<th>${n}</th>`).join('')).join('')}</tr></thead>`;
      H.$('.t1', box).innerHTML = `<div class="grid-wrap"><table class="grid">${head1}<tbody><tr><td colspan="${subs.length + 3}" style="height:auto;border:none">${app.nodata()}</td></tr></tbody></table></div>`;
      H.$('.t2', box).innerHTML = `<div class="grid-wrap"><table class="grid sem">${head2}<tbody><tr><td colspan="42" style="height:auto;border:none">${app.nodata()}</td></tr></tbody></table></div>`;
      const draw = () => {
        const all = countRange(SEM_START, SEM_END, sw); const c1 = (D().curri || {})[5];
        const s1 = s => c1 ? ((c1.subj[s] || c1.cha[s] || [0])[0]) : (std[s] || 0);
        const row = (a, b, f, rs) => { let t = 0; const tds = subs.map(s => { const v = f(s); t += v; return `<td>${v}</td>`; }).join(''); return `<tr>${rs != null ? (rs ? `<td rowspan="${rs}">${a}</td>` : '') : `<td>${a}</td>`}<td>${b}</td>${tds}<td>${t}</td></tr>`; };
        H.$('.ct', box).textContent = 5;
        H.$('.t1', box).innerHTML = `<div class="grid-wrap" style="max-height:230px"><table class="grid">${head1}<tbody>${row('1학기', '편성 시수(편제)', s1, 2)}${row('', '편차', () => 0, 0)}${row('2학기', '편성 시수(편제)', s => std[s] || 0, 2)}${row('', '편차', s => (all[s] || 0) - (std[s] || 0), 0)}${row('연간', '연간 편성 시수', s => s1(s) + (std[s] || 0))}</tbody></table></div>`;
        const weeks = semWeeks(); let last = '', body = '';
        weeks.forEach(w => {
          const mo = +w.start.slice(5, 7); const rs = weeks.filter(x => +x.start.slice(5, 7) === mo).length;
          body += `<tr>${last !== mo ? `<td rowspan="${rs}">${mo}월</td>` : ''}<td style="text-align:left;padding-left:6px">${w.no}주차 (${dot(w.start)}~${dot(w.end)})</td>`;
          last = mo;
          for (let di = 0; di < 5; di++) {
            const k = addDays(w.mon, di);
            const h = hol(k);
            if (k < SEM_START || k > SEM_END) { body += '<td></td>'.repeat(8); continue; }
            if (h) { const ch = [...h.t.replace(/\s/g, '')]; body += [...Array(8)].map((x, i) => `<td class="h">${esc(ch[i] || '')}</td>`).join(''); continue; }
            const col = (sw[k] || []);
            body += [...Array(8)].map((x, p) => { const e = col[p]; return `<td class="${e && e.t !== me() ? 'g' : ''}" data-k="${k}" data-p="${p}" title="${e ? esc(disp(e.s) + '(' + e.t + ')') : ''}">${e ? esc(ABBR[e.s] || e.s[0]) : ''}</td>`; }).join('');
          }
          body += '</tr>';
        });
        H.$('.t2', box).innerHTML = `<div class="grid-wrap" style="max-height:470px"><table class="grid sem">${head2}<tbody>${body}</tbody></table></div>`;
        H.$$('.t2 td[data-k]', box).forEach(td => { const menu = e => { const k = td.dataset.k, p = +td.dataset.p; ctx(e, OPTS().map(o => [`${disp(o.s)}(${o.t})`, () => { sw[k] = sw[k] || []; sw[k][p] = { s: o.s, t: o.t }; draw(); }]).concat([['(공란)', () => { if (sw[k]) sw[k][p] = null; draw(); }], ['취소', () => { }]])); }; td.oncontextmenu = menu; td.onclick = menu; });
      };
      H.$('.b-q', box).onclick = () => { sw = clone(tt().days); q = true; draw(); };
      H.$('.b-s', box).onclick = () => { if (!q) { app.alertBox('조회 후 저장하십시오.'); return; } tt().days = clone(sw); H.save(); };
      H.$('.b-p', box).onclick = () => { if (!q) { app.alertBox('조회 후 출력하십시오.'); return; } const mm = app.modal({ title: '학기별 시간표 출력', width: 1400, body: '<div class="vw"></div>' }); viewer(H.$('.vw', mm.pop), [`<h2 style="font-size:22px">학기별 시간표</h2><p>2026학년도 2학기 5학년 2반</p>${H.$('.t2 table', box).outerHTML}`]); };
    }

    /* --- 행사처리 --- */
    function eventPopup(k0, p0) {
      const evs = [{ t: '2학기 중간평가', k: 'sch' }, { t: '현장체험학습', k: 'sch' }, { t: '학예발표회', k: 'sch' }, { t: '가을 운동회', k: 'sch' }, { t: '임시공휴일', k: 'hol' }, { t: '재량휴업일', k: 'off' }].concat(D().schedule.filter(x => x.d >= SEM_START && x.d <= SEM_END).map(x => ({ t: x.t, k: x.k })));
      const uniq = []; evs.forEach(e => { if (!uniq.some(u => u.t === e.t)) uniq.push(e); });
      const m = app.modal({ title: '학급시간표 관리 - 행사처리', width: 1260, body: `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">행사처리</h1></div><div class="split"><div class="left" style="width:520px"><div class="sub-tit" style="margin-top:0">행사내역 <small>Total ${uniq.length}</small></div>${H.grid([{ t: '순번', w: 60 }, { t: '행사명<span class="sort">△</span>' }, { t: '행사일여부<span class="sort">△</span>', w: 110 }, { t: '학생부특별활동', w: 120 }], uniq.map((e, i) => `<tr data-i="${i}" style="cursor:pointer"><td>${i + 1}</td><td class="l">${esc(e.t)}</td><td>${{ hol: '공휴일', off: '휴업일' }[e.k] || '행사일'}</td><td>미반영</td></tr>`).join(''), { h: 480 })}</div>
        <div class="right"><div class="sub-tit" style="margin-top:0">행사정보</div><table class="form"><colgroup><col style="width:150px"><col></colgroup>
          <tr><th>학년도</th><td>2026 학년도</td></tr><tr><th>학기</th><td>2 학기</td></tr><tr><th>학년</th><td>5 학년</td></tr><tr><th>반</th><td>2 반</td></tr>
          <tr><th>적용범위</th><td><select class="sel e-sc" style="width:100%">${app.opts(['반', '학년', '학교'])}</select></td></tr>
          <tr><th class="req">*날짜</th><td>${dateStep('e-a', k0)} ~ ${dateStep('e-b', k0)}</td></tr>
          <tr><th class="req">*교시</th><td><select class="sel e-p1">${app.opts([['0', '전교시']].concat([1, 2, 3, 4, 5, 6, 7].map(n => [n, n + '교시'])), p0 != null ? p0 + 1 : 0)}</select> ~ <select class="sel e-p2">${app.opts([['0', '전교시']].concat([1, 2, 3, 4, 5, 6, 7].map(n => [n, n + '교시'])), p0 != null ? p0 + 1 : 0)}</select></td></tr>
          <tr><th class="req">*행사명</th><td><input class="inp e-n" style="width:100%" readonly placeholder="좌측 행사내역에서 선택"></td></tr>
          <tr><th class="req">*과목</th><td><input class="inp e-s" style="width:calc(100% - 80px)" readonly> <button class="btn primary e-f">찾기</button></td></tr>
          <tr><th class="req">*담당교사</th><td><input class="inp e-t" style="width:100%" readonly></td></tr>
          <tr><th class="req">*처리구분</th><td><select class="sel e-k" style="width:100%">${app.opts(['현재수업 삭제 후 처리', '현재수업 유지 후 처리'])}</select></td></tr></table></div></div>`,
        buttons: [{ text: '반영', cls: 'primary', onClick: () => {
          const q = c => H.$('.' + c, m.pop).value; const a = q('e-a'), b = q('e-b'), n = q('e-n'), s = H.$('.e-s', m.pop).dataset.s, t = H.$('.e-t', m.pop).dataset.t;
          if (!a || !b || a > b) { app.alertBox('날짜를 올바르게 입력하십시오.'); return false; }
          if (!n) { app.alertBox('행사명을 선택하십시오.'); return false; }
          if (!s || !t) { app.alertBox('과목과 담당교사를 {찾기}로 선택하십시오.'); return false; }
          let p1 = +q('e-p1'), p2 = +q('e-p2'); if (!p1 || !p2) { p1 = 1; p2 = 7; } if (p1 > p2) [p1, p2] = [p2, p1];
          const del = q('e-k').startsWith('현재수업 삭제'); let cnt = 0;
          for (let k = a; k <= b; k = addDays(k, 1)) { if (!schoolDay(k)) continue; const col = tt().days[k] = tt().days[k] || []; for (let p = p1 - 1; p <= p2 - 1; p++) { if (del) col[p] = { s, t, ev: n }; else if (col[p]) col[p].ev = n; else col[p] = { s, t, ev: n }; cnt++; } }
          H.save(`${cnt}개 교시에 '${n}' 행사가 반영되었습니다.${q('e-sc') !== '반' ? '\n(연수용: 5학년 2반 시간표에만 반영됩니다)' : ''}`);
          loadWeek(W); drawAll();
        } }, { text: '닫기' }] });
      bindSteps(m.pop);
      H.$$('tr[data-i]', m.pop).forEach(tr => { tr.onclick = () => { H.$$('tr[data-i]', m.pop).forEach(x => x.classList.toggle('sel', x === tr)); const e = uniq[+tr.dataset.i]; H.$('.e-n', m.pop).value = e.t; const sd = D().schedule.find(x => x.t === e.t && x.d >= SEM_START); if (sd) { H.$('.e-a', m.pop).value = sd.d; H.$('.e-b', m.pop).value = sd.d; } }; });
      H.$('.e-f', m.pop).onclick = () => { const mm = app.modal({ title: '과목찾기', width: 520, body: H.grid([{ t: '', w: 40 }, { t: '과목' }, { t: '교사', w: 100 }, { t: '교사ID', w: 110 }], OPTS().map((o, i) => `<tr><td><input type="radio" name="of" value="${i}"></td><td>${esc(disp(o.s))}</td><td>${esc(o.t)}</td><td>${esc(tid(o.t))}</td></tr>`).join(''), { h: 380 }), buttons: [{ text: '확인', cls: 'primary', onClick: () => { const r = H.$('input[name=of]:checked', mm.pop); if (!r) { app.alertBox('과목을 선택하십시오.'); return false; } const o = OPTS()[+r.value]; const se = H.$('.e-s', m.pop), te = H.$('.e-t', m.pop); se.value = disp(o.s); se.dataset.s = o.s; te.value = tLabel(o.t); te.dataset.t = o.t; } }, { text: '닫기' }] }); };
    }

    /* --- 일괄변경 --- */
    function bulkPopup() {
      const weeks = semWeeks();
      const m = app.modal({ title: '일괄변경', width: 1180, body: `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">일괄변경</h1></div><div class="search-box">${app.sf('학년도', '<select class="sel" disabled><option>2026</option></select>', true)}${app.sf('학기', '<select class="sel" disabled><option>2</option></select>', true)}${app.sf('학년', '<select class="sel" disabled><option>5</option></select>', true)}</div>
        <table class="form"><colgroup><col style="width:150px"><col></colgroup>
          <tr><th>변경구분</th><td>${['교체', '복사', '삭제', '교사교체'].map((x, i) => `<label style="margin-right:22px"><input type="radio" name="bk" value="${x}" ${i === 0 ? 'checked' : ''}> ${x}</label>`).join('')}</td></tr>
          <tr><th>반</th><td>2</td></tr><tr><th>적용범위</th><td><select class="sel" style="width:250px">${app.opts(['반'])}</select></td></tr>
          <tr><th>처리단위</th><td>${['일자', '기간', '주일', '월', '일자:일자'].map((x, i) => `<label style="margin-right:22px"><input type="radio" name="bu" value="${x}" ${i === 0 ? 'checked' : ''}> ${x}</label>`).join('')}</td></tr>
          <tr><th>기간</th><td class="bperiod"></td></tr>
          <tr class="r-a"><th class="la">교체대상▽</th><td class="ca"></td></tr><tr class="r-b"><th class="lb">교체대상△</th><td class="cb"></td></tr></table>`,
        buttons: [{ text: '저장', cls: 'primary', onClick: () => apply() }, { text: '닫기' }] });
      const q = s => H.$(s, m.pop);
      const pSel = cls => `교시: <select class="sel ${cls}">${app.opts([['0', '전교시']].concat([1, 2, 3, 4, 5, 6, 7].map(n => [n, n + '교시'])))}</select>`;
      const tSel = cls => `<select class="sel ${cls}">${app.opts(D().staff.filter(s => /교사/.test(s.pos)).map(s => [s.name, tLabel(s.name)]))}</select>`;
      const render = () => {
        const k = q('input[name=bk]:checked').value, u = q('input[name=bu]:checked').value;
        const today = key(A().today());
        q('.bperiod').innerHTML = u === '일자' ? dateStep('d1', today) : u === '기간' ? `${dateStep('d1', today)} ~ ${dateStep('d2', today)}` : u === '주일' ? `<select class="sel wkk" style="width:320px">${app.opts(weeks.map(w => [w.no, `${w.no}주차 (${dot(w.start)}~${dot(w.end)})`]), curWeek().no)}</select>` : u === '월' ? `<select class="sel mo">${app.opts([8, 9, 10, 11, 12].map(x => [x, x + '월']), 9)}</select>` : `원본 ${dateStep('d1', today)} → 대상 ${dateStep('d2', addDays(today, 1))}`;
        bindSteps(q('.bperiod'));
        const dd = u === '일자:일자';
        if (k === '교사교체') { q('.la').textContent = '변경 전 교사'; q('.lb').textContent = '변경 후 교사'; q('.ca').innerHTML = tSel('ta') + ' &nbsp; ' + pSel('pa'); q('.cb').innerHTML = tSel('tb'); q('.r-b').style.display = ''; }
        else if (k === '삭제') { q('.la').textContent = '삭제대상'; q('.ca').innerHTML = dd ? '대상 일자 전체' : pSel('pa'); q('.r-b').style.display = 'none'; }
        else { q('.la').textContent = k === '복사' ? '원본▽' : '교체대상▽'; q('.lb').textContent = k === '복사' ? '대상△' : '교체대상△'; q('.ca').innerHTML = dd ? '원본 일자의 전교시' : pSel('pa'); q('.cb').innerHTML = dd ? '대상 일자의 전교시' : pSel('pb'); q('.r-b').style.display = ''; }
      };
      H.$$('input[name=bk], input[name=bu]', m.pop).forEach(r => { r.onchange = render; });
      render();
      const dates = () => { const u = q('input[name=bu]:checked').value; const out = []; const rng = (a, b) => { for (let k = a; k <= b; k = addDays(k, 1)) if (schoolDay(k)) out.push(k); }; if (u === '일자') rng(q('.d1').value, q('.d1').value); else if (u === '기간') rng(q('.d1').value, q('.d2').value); else if (u === '주일') { const w = weeks.find(x => x.no === +q('.wkk').value); rng(w.start, w.end); } else if (u === '월') { const mo = pad(q('.mo').value); rng(`2026-${mo}-01`, `2026-${mo}-31`); } return out; };
      const apply = () => {
        const k = q('input[name=bk]:checked').value, u = q('input[name=bu]:checked').value; const days = tt().days;
        if (u === '일자:일자') { const a = q('.d1').value, b = q('.d2').value; if (!schoolDay(a) || !schoolDay(b)) { app.alertBox('원본과 대상 모두 수업일이어야 합니다.'); return false; } if (k === '교체') [days[a], days[b]] = [days[b] || [], days[a] || []]; else if (k === '복사') days[b] = clone(days[a] || []); else if (k === '삭제') days[b] = []; else { app.alertBox("교사교체는 '일자:일자' 단위를 지원하지 않습니다."); return false; } H.save(`${dot(a)} ↔ ${dot(b)} ${k} 처리되었습니다.`); loadWeek(W); drawAll(); return; }
        const ds = dates(); if (!ds.length) { app.alertBox('선택한 기간에 수업일이 없습니다.'); return false; }
        const pa = +(q('.pa') || {}).value || 0, pb = +(q('.pb') || {}).value || 0;
        if ((k === '교체' || k === '복사') && (!pa || !pb)) { app.alertBox('교시를 각각 선택하십시오. (교체·복사는 전교시를 선택할 수 없습니다)'); return false; }
        if ((k === '교체' || k === '복사') && pa === pb) { app.alertBox('서로 다른 교시를 선택하십시오.'); return false; }
        let n = 0;
        ds.forEach(dk => { const col = days[dk] = days[dk] || []; if (k === '교체') { [col[pa - 1], col[pb - 1]] = [col[pb - 1] || null, col[pa - 1] || null]; n++; } else if (k === '복사') { col[pb - 1] = col[pa - 1] ? clone(col[pa - 1]) : null; n++; } else if (k === '삭제') { if (pa) col[pa - 1] = null; else col.length = 0; n++; } else { const ta = q('.ta').value, tb = q('.tb').value; col.forEach((e, p) => { if (e && e.t === ta && (!pa || p === pa - 1)) { e.t = tb; n++; } }); } });
        H.save(`${ds.length}일 ${k} 처리되었습니다. (${n}건)`); loadWeek(W); drawAll();
      };
    }
  };

  /* ================= 학급별 / 전체 시간표 조회 ================= */
  S['학급별시간표조회'] = function (page, title, app) {
    tt(); headerExtras(page); H.$('.app-tit', page).textContent = '학급별 시간표 조회';
    const weeks = semWeeks();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학기', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.sf('학년', `<select class="sel">${app.opts(['5'])}</select>`, true)}${app.sf('반', `<select class="sel">${app.opts(['2'])}</select>`, true)}<div style="flex-basis:100%;height:0"></div>${app.sf('주차', `<select class="sel s-w" style="width:250px">${app.opts(weeks.map(w => [w.no, `${w.no} 주차(${dot(w.mon < SEM_START ? w.start : w.mon)})`]), curWeek().no)}</select>`, true)}${app.searchBtn()}</div><div class="vw"></div>`);
    H.$('.b-search', page).onclick = () => viewer(H.$('.vw', page), [classReport(weeks.find(w => w.no === +H.$('.s-w', page).value))]);
  };
  // 다른 학급(가상) 시간표: 담임·전담교사 이름으로 구성
  function otherClassDay(g, c, k) {
    const hr = (D().homerooms || {})[`${g}-${c}`] || (g === 5 ? ['나미리', window.NEIS_ME, '변태수'] : ['설까치', '엄지', '마동탁'])[c - 1];
    const di = dow(k); const len = OTHER_LEN[di] - (g <= 2 ? 1 : 0);
    const subs = g <= 2 ? ['국어', '수학', '바른생활', '슬기로운생활', '즐거운생활'] : ['국어', '수학', '사회', '과학', '체육', '음악', '미술', '도덕', '영어'];
    return [...Array(len)].map((x, p) => {
      const cls = `${g}-${c}`; for (const t of ['마이콜', '봉미선']) if ((OTHER[t][cls] || []).some(([a, b]) => a === di && b === p)) return { s: t === '마이콜' ? '영어' : '체육', t };
      return { s: subs[(di * 3 + p + g + c) % subs.length], t: hr };
    });
  }
  S['전체시간표조회'] = function (page, title, app) {
    tt(); headerExtras(page); H.$('.app-tit', page).textContent = '전체시간표 조회';
    const today = key(A().today());
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학기', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([['', '전체'], 1, 2, 3, 4, 5, 6].map(x => Array.isArray(x) ? x : [x, x + '학년']))}</select>`, true)}<div style="flex-basis:100%;height:0"></div>${app.sf('기간', `${dateStep('a', today)} ~ ${dateStep('b', today)}`, true)}${app.searchBtn()}</div><div class="vw"></div>`);
    bindSteps(page);
    H.$('.b-search', page).onclick = () => {
      const a = H.$('.a', page).value, b = H.$('.b', page).value, g = H.$('.s-g', page).value;
      if (!a || !b || a > b) { app.alertBox('기간을 올바르게 입력하십시오.'); return; }
      const grades = g ? [+g] : [1, 2, 3, 4, 5, 6];
      const classes = grades.flatMap(gr => [1, 2, 3].map(c => [gr, c]));
      const pages = [];
      for (let k = a; k <= b; k = addDays(k, 1)) {
        if (dow(k) >= 5) continue;
        const h = hol(k);
        const cols = classes.map(([gr, c]) => { if (h) return []; if (gr === 5 && c === 2) return day(k); return otherClassDay(gr, c, k); });
        const rows = [0, 1, 2, 3, 4, 5].map(p => `<tr>${p === 0 ? `<td rowspan="6">${dot(k)}<br>(${DAYS[dow(k)]})</td>` : ''}<td>${p + 1}교시</td>${cols.map(col => { const e = col[p]; return `<td style="font-size:12px">${h ? (p === 0 ? `<span style="color:#e0262c">${esc(h.t)}</span>` : '') : e ? `${e.mark ? `(${e.mark})` : ''}${esc(disp(e.s))}(${esc(e.mark ? e.subT : e.t)})` : ''}</td>`; }).join('')}</tr>`).join('');
        pages.push(`<div style="min-width:${grades.length > 2 ? 1700 : 900}px"><p style="text-align:right">${dot(key(A().today()))}</p><h2 style="font-size:26px;letter-spacing:6px">전체시간표</h2><p>2026학년도 2학기 ${g ? g + '학년' : '전학년'}</p><table><tr><th rowspan="2" style="width:90px">일자</th><th rowspan="2" style="width:50px">교시</th>${grades.map(gr => `<th colspan="3">${gr} 학년</th>`).join('')}</tr><tr>${classes.map(([gr, c]) => `<th>${c}</th>`).join('')}</tr>${rows}</table></div>`);
      }
      viewer(H.$('.vw', page), pages);
    };
  };

  /* ================= 결보강처리 ================= */
  function teacherRows(k, p, subj, mode, delIncl) {
    const di = dow(k); const bg = bogang();
    const pool = (mode === '전체' ? D().staff.map(s => s.name) : D().staff.filter(s => /교사/.test(s.pos) && s.pos !== '보건교사').map(s => s.name)).filter(n => n !== me());
    return pool.map(n => {
      const gubun = p == null ? '기타' : (n === '마이콜' && subj === '영어') || (n === '봉미선' && subj === '체육') ? '과목' : !otherBusy(n, di, p) ? '공강' : '기타';
      const assign = [0, 1, 2, 3, 4, 5].filter(pp => otherBusy(n, di, pp)).length;
      return { n, gubun, abs: bg.filter(r => r.absT === n).length, sub: bg.filter(r => r.subT === n).length, assign, yel: gubun === '과목' };
    }).sort((x, y) => ['과목', '공강', '기타'].indexOf(x.gubun) - ['과목', '공강', '기타'].indexOf(y.gubun));
  }
  function bogangReg(k0, field, after) {
    const app = A(); let rows = null, picked = null;
    const lab = field ? '보강' : '결보강';
    const m = app.modal({ title: field ? '현장체험학습 보강등록' : '결보강등록', width: 1500, body: `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">${field ? '현장체험학습 보강등록' : '결보강등록'}</h1></div>
      <div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학기', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.sf('학년', `<select class="sel">${app.opts(['5'])}</select>`, true)}${app.sf('반', `<select class="sel">${app.opts(['2'])}</select>`, true)}${app.sf(lab + '일', dateStep('bd', k0 || key(A().today())), true)}<span class="sp"></span><button class="btn primary b-q">${app.I.searchSm}조회</button></div>
      <div class="split"><div class="left" style="flex:1"><div class="toolbar"><span class="total">Total <b class="c1">0</b></span><span class="gear">${app.I.gearSm}</span><span class="sp"></span><button class="btn b-del2" style="display:none">삭제</button><button class="btn primary b-sv" disabled>저장</button></div><div class="lg"></div></div>
        <div class="right" style="flex:1"><div class="toolbar"><span class="total">Total <b class="c2">0</b></span><span class="gear">${app.I.gearSm}</span></div>
          <div class="search-box" style="margin-bottom:10px"><div class="sf"><label class="req">*교사검색 구분</label><label><input type="radio" name="tm" value="교원만" checked> 교원만</label>&nbsp;&nbsp;<label><input type="radio" name="tm" value="전체"> 전체</label></div>${app.sf('교사명', '<input class="inp tq" style="width:150px">')}<span class="sp"></span><button class="btn primary b-tq">${app.I.searchSm}조회</button><div style="flex-basis:100%"></div><label><input type="checkbox" class="tdel"> 삭제된 교사포함</label></div>
          <div class="rg"></div><div class="red-note"><span>과목 : 동일학년에 동일한 과목을 가르치는 교사</span><span>공강 : 해당 교시에 수업이 없는 교사</span><span>기타 : 나머지 교사</span><span>노란색배경 : 선택한 개설과목에 편성된 담당</span></div></div></div>
      <table class="form" style="margin-top:10px"><colgroup><col style="width:150px"><col></colgroup><tr><th class="req">*${lab}사유</th><td><input class="inp rs" style="width:100%" placeholder="${field ? '예) 5학년 현장체험학습 미참여 학생 지도' : '예) 출장(학년부장 협의회)'}"></td></tr></table>`,
      beforeClose: close => confirmClose(close) });
    bindSteps(m.pop);
    const q = s => H.$(s, m.pop);
    q('.lg').innerHTML = H.grid(field ? [{ t: '교시', w: 70 }, { t: '보강교과' }, { t: '교사' }, { t: '보강교과 교사' }] : [{ t: '교시', w: 70 }, { t: '보강교과' }, { t: '결강교사' }, { t: '보강교사' }], `<tr><td colspan="4" style="height:auto;border:none">${app.nodata()}</td></tr>`, { h: 420 });
    q('.rg').innerHTML = H.grid([{ t: '구분', w: 70 }, { t: '교사ID' }, { t: '교사명' }, { t: '결강수', w: 70 }, { t: '보강수', w: 70 }, { t: '수업배정', w: 80 }], `<tr><td colspan="6" style="height:auto;border:none">${app.nodata()}</td></tr>`, { h: 300 });
    const drawRight = () => {
      if (!rows) return;
      const r = picked != null ? rows[picked] : null; const qn = q('.tq').value.trim();
      const ts = teacherRows(q('.bd').value, r ? r.p : null, r ? r.s : null, q('input[name=tm]:checked').value).filter(x => !qn || x.n.includes(qn));
      q('.c2').textContent = ts.length;
      q('.rg').innerHTML = H.grid([{ t: '구분<span class="sort">△</span>', w: 70 }, { t: '교사ID<span class="sort">△</span>' }, { t: '교사명<span class="sort">△</span>' }, { t: '결강수', w: 70 }, { t: '보강수', w: 70 }, { t: '수업배정', w: 80 }], ts.map(x => `<tr draggable="true" data-n="${esc(x.n)}" class="${x.yel ? 'yel' : ''}"><td>${x.gubun}</td><td>${esc(tid(x.n))}</td><td>${esc(x.n)}</td><td>${x.abs}</td><td>${x.sub}</td><td>${x.assign}</td></tr>`).join(''), { h: 300, cls: 'tlist' });
      H.$$('.rg tr[draggable]', m.pop).forEach(tr => { tr.ondragstart = e => e.dataTransfer.setData('text/plain', tr.dataset.n); tr.ondblclick = () => { if (picked == null) { app.alertBox('왼쪽에서 교시를 먼저 선택하십시오.'); return; } rows[picked].subT = tr.dataset.n; drawLeft(); }; });
    };
    const drawLeft = () => {
      q('.c1').textContent = rows.length;
      q('.lg').innerHTML = H.grid(field ? [{ t: '교시<span class="sort">△</span>', w: 70 }, { t: '보강교과<span class="sort">△</span>' }, { t: '교사<span class="sort">△</span>' }, { t: '보강교과 교사<span class="sort">△</span>' }] : [{ t: '교시<span class="sort">△</span>', w: 70 }, { t: '보강교과<span class="sort">△</span>' }, { t: '결강교사<span class="sort">△</span>' }, { t: '보강교사<span class="sort">△</span>' }], rows.map((r, i) => `<tr data-i="${i}" class="${i === picked ? 'sel' : ''}" style="cursor:pointer"><td>${r.p + 1}</td><td>${esc(disp(r.s))}</td><td>${esc(tLabel(r.t))}</td><td class="drop" data-i="${i}" style="background:#f7faff">${r.subT ? esc(tLabel(r.subT)) + ` <span class="rm" data-i="${i}" style="color:#e0262c;cursor:pointer">✕</span>` : '<span style="color:#9aa6ba">교사를 끌어다 놓으세요</span>'}</td></tr>`).join('') || `<tr><td colspan="4" style="height:auto;border:none">${app.nodata(`해당 일자에 ${field ? '' : '결강할 '}수업이 없습니다.`)}</td></tr>`, { h: 420 });
      H.$$('.lg tr[data-i]', m.pop).forEach(tr => { tr.onclick = e => { if (e.target.classList.contains('rm')) return; picked = +tr.dataset.i; drawLeft(); drawRight(); }; });
      H.$$('.lg td.drop', m.pop).forEach(td => { td.ondragover = e => { e.preventDefault(); td.classList.add('drag-over'); }; td.ondragleave = () => td.classList.remove('drag-over'); td.ondrop = e => { e.preventDefault(); const n = e.dataTransfer.getData('text/plain'); const r = rows[+td.dataset.i]; if (n === r.t) { app.alertBox('결강교사와 보강교사가 같습니다.'); return; } r.subT = n; picked = +td.dataset.i; drawLeft(); drawRight(); }; });
      H.$$('.lg .rm', m.pop).forEach(x => { x.onclick = () => { rows[+x.dataset.i].subT = ''; drawLeft(); }; });
      q('.b-sv').disabled = false;
    };
    q('.b-q').onclick = () => {
      const k = q('.bd').value;
      if (!schoolDay(k)) { rows = []; picked = null; drawLeft(); q('.rg').innerHTML = app.nodata('수업일이 아닙니다.'); return; }
      rows = day(k).map((e, p) => e ? { p, s: e.s, t: e.t, subT: e.mark ? e.subT : '', locked: !!e.mark } : null).filter(Boolean).filter(r => !r.locked);
      picked = rows.length ? 0 : null; drawLeft(); drawRight();
    };
    q('.b-tq').onclick = drawRight; H.$$('input[name=tm]', m.pop).forEach(r => { r.onchange = drawRight; });
    q('.b-sv').onclick = () => {
      const sel = (rows || []).filter(r => r.subT); const reason = q('.rs').value.trim(); const k = q('.bd').value;
      if (!sel.length) { app.alertBox('보강교사를 1명 이상 지정하십시오.\n(오른쪽 교사 목록에서 끌어다 놓거나 더블클릭)'); return; }
      if (!reason) { app.alertBox(`${lab}사유를 입력하십시오.`); return; }
      const bg = bogang(); const col = tt().days[k];
      sel.forEach(r => { bg.push({ id: bg.reduce((a, x) => Math.max(a, x.id), 0) + 1, date: k, grade: 5, cls: 2, period: r.p + 1, subj: r.s, absT: field ? '' : r.t, orgT: r.t, subT: r.subT, reason, field, status: '저장' }); if (col && col[r.p]) { col[r.p].mark = field ? '현' : '보'; col[r.p].subT = r.subT; } });
      m.close(); Ap.refresh(); app.alertBox(`${sel.length}건의 ${lab}이(가) 저장되었습니다.\n[결보강처리]에서 {승인요청}하여 결재를 받으십시오.`); if (after) after();
    };
    if (k0) q('.b-q').click();
  }
  S['결보강처리'] = function (page, title, app) {
    bogang(); tt();
    const today = key(A().today());
    page.insertAdjacentHTML('beforeend', `<div class="tabs"><a class="on" data-i="0">결보강처리</a><a data-i="1">결보강조회</a></div>
      <div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([['', '전체'], 1, 2, 3, 4, 5, 6].map(x => Array.isArray(x) ? x : [x, String(x)]))}</select>`, true)}<label style="margin-right:14px"><input type="radio" name="bm" value="기간" checked> 기간별</label><label style="margin-right:10px"><input type="radio" name="bm" value="날짜"> 날짜별</label>${dateStep('a', today)} <span class="tilde">~</span> <span class="bto">${dateStep('b', today)}</span>
        <div style="flex-basis:100%;height:0"></div><label style="margin:0 14px 0 20px"><input type="radio" name="bk" value="결강" checked> 결강</label><label style="margin-right:40px"><input type="radio" name="bk" value="보강"> 보강</label>${app.sf('결강교사', '<input class="inp s-t" style="width:250px">')}${app.searchBtn()}</div>
      <div class="body"></div>`);
    bindSteps(page);
    H.$$('input[name=bm]', page).forEach(r => { r.onchange = () => { const one = H.$('input[name=bm]:checked', page).value === '날짜'; H.$('.bto', page).style.display = one ? 'none' : ''; H.$('.tilde', page).style.display = one ? 'none' : ''; }; });
    H.$$('input[name=bk]', page).forEach(r => { r.onchange = () => { H.$('.search-box .sf:last-of-type label', page).textContent = H.$('input[name=bk]:checked', page).value + '교사'; }; });
    const body = H.$('.body', page); let tab = 0, queried = false;
    const filt = () => { const a = H.$('.a', page).value, one = H.$('input[name=bm]:checked', page).value === '날짜', b = one ? a : H.$('.b', page).value, g = H.$('.s-g', page).value, kind = H.$('input[name=bk]:checked', page).value, t = H.$('.s-t', page).value.trim(); return bogang().filter(r => r.date >= a && r.date <= b && (!g || String(r.grade) === g) && (!t || (kind === '결강' ? (r.absT || r.orgT) : r.subT).includes(t))).sort((x, y) => (x.date + pad(x.period)).localeCompare(y.date + pad(y.period))); };
    const drawList = () => {
      body.innerHTML = `<div class="toolbar"><span class="total">Total <b>${queried ? filt().length : 0}</b></span><span class="gear">${app.I.gearSm}</span><span class="sp"></span><button class="btn primary b-work">근무상황변동</button><button class="btn primary b-reg">결보강 등록</button><button class="btn primary b-fld">보강 등록(현장체험학습)</button><button class="btn dark b-del">삭제</button><button class="btn primary b-req">승인요청</button></div>` +
        H.grid([{ t: '<input type="checkbox" class="all">', w: 50 }, { t: '일자<span class="sort">△</span>', w: 130 }, { t: '학년<span class="sort">△</span>', w: 70 }, { t: '반<span class="sort">△</span>', w: 70 }, { t: '교시<span class="sort">△</span>', w: 70 }, { t: '교과', w: 150 }, { t: '현장체험학습<br>보강여부', w: 150 }, { t: '결강교사<span class="sort">△</span>', w: 130 }, { t: '사유<span class="sort">△</span>' }, { t: '보강교사<span class="sort">△</span>', w: 130 }, { t: '결재상태<span class="sort">△</span>', w: 110 }],
          queried ? (filt().map(r => `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${dot(r.date)}</td><td>${r.grade}</td><td>${r.cls}</td><td>${r.period}</td><td>${esc(disp(r.subj))}</td><td>${r.field ? 'Y' : 'N'}</td><td>${esc(r.absT)}</td><td class="l">${esc(r.reason)}</td><td>${esc(r.subT)}</td><td class="link stt">${Ap.badge(bgStatus(r))}</td></tr>`).join('') || `<tr><td colspan="11" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`) : `<tr><td colspan="11" style="height:auto;border:none">${app.nodata()}</td></tr>`, { h: 470 });
      const all = H.$('.all', body); if (all) all.onchange = () => H.$$('.ck', body).forEach(c => { c.checked = all.checked; });
      H.$$('.stt', body).forEach(td => { td.onclick = () => { const r = bogang().find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
      const picked = () => H.$$('tbody tr[data-id]', body).filter(tr => H.$('.ck', tr).checked).map(tr => bogang().find(x => String(x.id) === tr.dataset.id));
      H.$('.b-reg', body).onclick = () => bogangReg(null, false, () => { queried = true; drawList(); });
      H.$('.b-fld', body).onclick = () => bogangReg(null, true, () => { queried = true; drawList(); });
      H.$('.b-work', body).onclick = () => workPopup();
      H.$('.b-del', body).onclick = () => { const s = picked(); if (!s.length) { app.alertBox('삭제할 자료를 선택하십시오.'); return; } if (s.some(r => ['결재중', '완결'].includes(bgStatus(r)))) { app.alertBox('결재 중이거나 완결된 자료는 삭제할 수 없습니다.'); return; } app.confirmBox(`${s.length}건을 삭제하시겠습니까?\n(학급시간표의 결보강 표시도 함께 해제됩니다)`, () => { s.forEach(r => { const e = (tt().days[r.date] || [])[r.period - 1]; if (e && e.mark) { delete e.mark; delete e.subT; } }); D().bogang = bogang().filter(r => !s.includes(r)); Ap.refresh(); }); };
      H.$('.b-req', body).onclick = () => { const s = picked().filter(r => ['저장', '회수', '반려'].includes(bgStatus(r))); if (!s.length) { app.alertBox('승인요청할 결보강(저장·회수·반려 상태)을 선택하십시오.'); return; } const dates = [...new Set(s.map(r => dot(r.date)))]; Ap.submit({ area: '교육과정', form: '결보강처리', title: `결보강처리 - 5학년 2반 ${dates.join(', ')} (${s.length}시간)`, content: s.map(r => [`${dot(r.date)} ${r.period}교시`, `${disp(r.subj)} · ${r.field ? '현장체험학습 보강' : '결강: ' + r.absT} · 보강: ${r.subT} · 사유: ${r.reason}`]), ref: { type: 'bogang' }, onDone: doc => { s.forEach(r => { r.docId = doc.id; }); drawList(); } }); };
    };
    const drawReport = () => {
      body.innerHTML = '<div class="vw"></div>';
      if (!queried) { viewer(H.$('.vw', body), []); return; }
      const rs = filt(); const a = H.$('.a', page).value, b = H.$('input[name=bm]:checked', page).value === '날짜' ? a : H.$('.b', page).value;
      viewer(H.$('.vw', body), [`<h2 style="font-size:24px;letter-spacing:6px">보 결 수 업 대 장</h2><p>기간 : ${dot(a)} ~ ${dot(b)} · ${esc(D().org.school)}</p><table><tr><th>일자</th><th>교시</th><th>학년-반</th><th>교과</th><th>결강교사</th><th>사유</th><th>보강교사</th><th>구분</th><th>결재상황</th></tr>${rs.map(r => `<tr><td>${dot(r.date)}</td><td>${r.period}</td><td>${r.grade}-${r.cls}</td><td>${esc(disp(r.subj))}</td><td>${esc(r.absT || '-')}</td><td style="text-align:left">${esc(r.reason)}</td><td>${esc(r.subT)}</td><td>${r.field ? '현장체험학습 보강' : '보결'}</td><td>${bgStatus(r)}</td></tr>`).join('') || '<tr><td colspan="9">자료가 없습니다.</td></tr>'}</table>`]);
    };
    const draw = () => (tab === 0 ? drawList() : drawReport());
    page.__refresh = draw;
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { tab = +a.dataset.i; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); draw(); }; });
    H.$('.b-search', page).onclick = () => { queried = true; draw(); };
    draw();
    function workPopup() {
      const m = app.modal({ title: '결보강처리-근무상황변동', width: 1400, body: `<div class="app-hd" style="margin-bottom:6px"><h1 class="app-tit">근무상황변동</h1></div><div class="search-box">${app.sf('기간', `${dateStep('w1', key(A().today()))} ~ ${dateStep('w2', key(A().today()))}`)}<span class="sp"></span><button class="btn primary b-q">${app.I.searchSm}조회</button></div><div class="sub-tit">근무상황내역 <small class="tc">Total 0</small><span class="sp"></span><button class="btn primary b-xl">엑셀 다운로드</button></div><div class="wl"></div><div class="info-box" style="margin-top:8px;font-size:12px">행을 더블클릭하면 해당 일자로 [결보강등록]을 엽니다.</div>`, beforeClose: close => confirmClose(close) });
      bindSteps(m.pop);
      const cols = [{ t: '교사번호' }, { t: '교사명' }, { t: '근무상황명' }, { t: '행선지명' }, { t: '시작 일자' }, { t: '시작 시간', w: 110 }, { t: '종료 일자' }, { t: '종료 시간', w: 110 }];
      H.$('.wl', m.pop).innerHTML = H.grid(cols, `<tr><td colspan="8" style="height:auto;border:none">${app.nodata()}</td></tr>`, { h: 440 });
      H.$('.b-q', m.pop).onclick = () => {
        const a = H.$('.w1', m.pop).value, b = H.$('.w2', m.pop).value; const out = [];
        D().staffLeaves.filter(x => x.date >= a && x.date <= b).forEach(x => { const [s, e] = x.time.split('~'); out.push([tid(x.name), x.name, x.kind, x.place, x.date, s, x.date, e]); });
        const act = r => r.docId && ['결재중', '완결'].includes(Ap.statusOf(r.docId));
        D().leaves.filter(l => act(l) && l.from.slice(0, 10) <= b && l.to.slice(0, 10) >= a).forEach(l => out.push([tid(me()), me(), `${l.cat}(${l.sub})`, l.place || '', l.from.slice(0, 10), l.from.slice(11), l.to.slice(0, 10), l.to.slice(11)]));
        D().bizTrips.filter(l => !l.deleted && act(l) && l.from.slice(0, 10) <= b && l.to.slice(0, 10) >= a).forEach(l => out.push([tid(me()), me(), '출장', l.place, l.from.slice(0, 10), l.from.slice(11), l.to.slice(0, 10), l.to.slice(11)]));
        H.$('.tc', m.pop).textContent = `Total ${out.length}`;
        H.$('.wl', m.pop).innerHTML = H.grid(cols, out.map(r => `<tr data-d="${r[4]}" style="cursor:pointer">${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="8" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 440 });
        H.$$('tr[data-d]', m.pop).forEach(tr => { tr.ondblclick = () => { m.close(); bogangReg(tr.dataset.d, false, () => { queried = true; drawList(); }); }; });
      };
      H.$('.b-xl', m.pop).onclick = () => app.alertBox('연수용 환경에서는 엑셀 다운로드를 지원하지 않습니다.');
    }
  };
})();
