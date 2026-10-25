/* 업무 화면 (1) — 공통 도우미, 교육과정, 학적 */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS = window.SCREENS || {};
  const H = window.SH = {};  // 화면 공통 도우미

  H.$ = (s, r) => r.querySelector(s);
  H.$$ = (s, r) => Array.from(r.querySelectorAll(s));
  H.esc = s => A().esc(s);
  H.save = (msg) => { A().Store.save(); A().alertBox(msg || '저장되었습니다.'); };
  H.stu = no => D().students.find(s => s.no === +no);
  H.dateStr = dt => `${dt.getFullYear()}.${A().pad(dt.getMonth() + 1)}.${A().pad(dt.getDate())}`;
  H.key = dt => `${dt.getFullYear()}-${A().pad(dt.getMonth() + 1)}-${A().pad(dt.getDate())}`;
  H.holiday = key => D().schedule.find(s => s.d === key && s.k === 'hol');
  H.bytesHtml = (txt, max) => { const b = A().nbytes(txt); return `<div class="bytes ${b > max ? 'over' : ''}">${b.toLocaleString()} / ${max.toLocaleString()} Byte</div>`; };
  H.bindBytes = (root, max) => {
    H.$$('textarea[data-bytes]', root).forEach(ta => {
      const upd = () => { const bx = ta.parentElement.querySelector('.bytes'); if (bx) bx.outerHTML = H.bytesHtml(ta.value, max); };
      ta.addEventListener('input', upd);
    });
  };
  H.grid = (cols, rowsHtml, opt) => {
    opt = opt || {};
    const cg = cols.map(c => `<col${c.w ? ` style="width:${c.w}px"` : ''}>`).join('');
    const th = cols.map(c => `<th>${c.t}${c.sort ? '<span class="sort">△</span>' : ''}</th>`).join('');
    return `<div class="grid-wrap" style="${opt.h ? `max-height:${opt.h}px` : ''}"><table class="grid ${opt.cls || ''}"><colgroup>${cg}</colgroup><thead><tr>${th}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  };
  H.weeks = () => {
    const arr = []; const base = new Date(2026, 2, 2);
    for (let i = 0; i < 44; i++) {
      const s = new Date(base); s.setDate(base.getDate() + i * 7);
      const e = new Date(s); e.setDate(s.getDate() + 4);
      if (s < new Date(2026, 7, 17)) continue;
      arr.push({ no: i + 1, start: s, end: e, key: H.key(s), label: `${i + 1}주 (${A().pad(s.getMonth() + 1)}.${A().pad(s.getDate())}~${A().pad(e.getMonth() + 1)}.${A().pad(e.getDate())})` });
    }
    return arr;
  };
  H.curWeek = () => { const t = A().today(); return H.weeks().find(w => t >= w.start && t <= new Date(w.end.getTime() + 2 * 864e5)) || H.weeks()[0]; };
  H.timetable = wkKey => {
    const d = D();
    d.tt = d.tt || {};
    return d.tt[wkKey] || d.baseTimetable.map(r => r.slice());
  };
  // 학생 목록(좌측) 공통
  H.stuList = (sel, extraCol) => {
    const rows = D().students.map(s => `<tr data-no="${s.no}" class="${+sel === s.no ? 'sel' : ''}"><td>${s.no}</td><td class="link">${H.esc(s.name)}</td>${extraCol ? `<td>${extraCol(s)}</td>` : ''}</tr>`).join('');
    return H.grid([{ t: '번호', w: 50 }, { t: '성명' }].concat(extraCol ? [{ t: '상태', w: 70 }] : []), rows, { h: 620 });
  };
  H.subjOpts = (sel, withCha) => A().opts(D().subjects.filter(s => withCha || !['자율·자치', '동아리', '진로'].includes(s)), sel);

  /* =============== 범용 화면 =============== */
  S.__generic = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>
      <div class="toolbar"><span class="total">Total <b>0</b></span><span class="sp"></span><button class="btn primary">저장</button><button class="btn dark">삭제</button></div>
      ${H.grid([{ t: '', w: 44 }, { t: '순번', w: 60 }, { t: '구분', sort: 1 }, { t: '내용', sort: 1 }, { t: '등록일', w: 120 }, { t: '비고', w: 140 }], `<tr><td colspan="6" style="height:auto;border:none">${app.nodata()}</td></tr>`)}`);
    H.$('.b-search', page).onclick = () => { H.$('tbody', page).innerHTML = `<tr><td colspan="6" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`; app.toast('연수용 환경에서는 예시 데이터가 없는 화면입니다.'); };
    H.$$('.toolbar .btn', page).forEach(b => { b.onclick = () => app.alertBox('처리할 데이터가 없습니다.'); });
  };

  /* =============== 교육과정 =============== */
  S['교과별학습내용등록'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('학기', `<select class="sel s-sem">${app.opts([['1', '1학기'], ['2', '2학기']], '2')}</select>`, true)}${app.sf('학년', `<select class="sel s-grade">${app.opts([['5', '5학년']], '5')}</select>`, true)}${app.sf('편제', `<select class="sel s-subj" style="width:250px">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="gear">${app.I.gearSm}</span><span class="sp"></span>
        <button class="btn outline b-up">▲ 한줄위로</button><button class="btn outline b-down">▼ 한줄아래</button><button class="btn outline b-add">행추가</button>
        <button class="btn primary b-reg">편제등록</button><button class="btn green b-upl">${app.I.up}파일올리기</button><button class="btn green b-dl">${app.I.down}파일내리기</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div>
      <div class="gridarea"></div>
      <div class="sub-tit">학습내용상세</div>
      <table class="form"><tr><th class="req">*학기</th><td colspan="3"><select class="sel f-sem"><option value=""></option><option value="1">1학기</option><option value="2">2학기</option></select></td></tr>
        <tr><th class="req">*단원</th><td><textarea class="ta f-unit" rows="3"></textarea></td><th>학습내용</th><td><textarea class="ta f-content" rows="3"></textarea></td></tr>
        <tr><th>쪽수</th><td><input class="inp f-page" style="width:160px"> 보조쪽수 <input class="inp f-sub" style="width:160px"></td><th>차시</th><td><input class="inp f-cur" style="width:60px"> / <input class="inp f-total" style="width:60px"> 준비물 <input class="inp f-prep" style="width:200px"></td></tr></table>`);
    const cols = [{ t: '<input type="checkbox" class="all">', w: 44 }, { t: '순번', w: 50 }, { t: '학년', w: 50, sort: 1 }, { t: '학기', w: 50, sort: 1 }, { t: '편제', w: 90, sort: 1 }, { t: '단원', sort: 1 }, { t: '학습내용', sort: 1 }, { t: '쪽수', w: 70, sort: 1 }, { t: '보조쪽수', w: 80, sort: 1 }, { t: '해당차시', w: 70, sort: 1 }, { t: '전체차시', w: 70, sort: 1 }, { t: '준비물', w: 110, sort: 1 }];
    let rows = null, selIdx = -1;
    const area = H.$('.gridarea', page);
    const draw = () => {
      if (!rows) { area.innerHTML = H.grid(cols, `<tr><td colspan="12" style="height:auto;border:none">${app.nodata()}</td></tr>`); return; }
      H.$('.cnt', page).textContent = rows.length;
      area.innerHTML = H.grid(cols, rows.length ? rows.map((r, i) => `<tr data-i="${i}" class="${i === selIdx ? 'sel' : ''}"><td><input type="checkbox" class="ck"></td><td>${i + 1}</td><td>${r.grade}</td><td>${r.sem}</td><td>${H.esc(r.subj)}</td><td class="l">${H.esc(r.unit)}</td><td class="l">${H.esc(r.content)}</td><td>${H.esc(r.page)}</td><td>${H.esc(r.sub)}</td><td>${H.esc(r.cur)}</td><td>${H.esc(r.total)}</td><td>${H.esc(r.prep)}</td></tr>`).join('') : `<tr><td colspan="12" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 330 });
      H.$$('tbody tr[data-i]', area).forEach(tr => { tr.onclick = e => { if (e.target.type === 'checkbox') return; selIdx = +tr.dataset.i; draw(); fill(); }; });
      const all = H.$('.all', area); if (all) all.onchange = () => H.$$('.ck', area).forEach(c => { c.checked = all.checked; });
    };
    const F = n => H.$('.f-' + n, page);
    const fill = () => { const r = rows[selIdx] || {}; F('sem').value = r.sem || ''; F('unit').value = r.unit || ''; F('content').value = r.content || ''; F('page').value = r.page || ''; F('sub').value = r.sub || ''; F('cur').value = r.cur || ''; F('total').value = r.total || ''; F('prep').value = r.prep || ''; };
    ['sem', 'unit', 'content', 'page', 'sub', 'cur', 'total', 'prep'].forEach(n => F(n).addEventListener('input', () => { if (rows && rows[selIdx]) rows[selIdx][n] = F(n).value; }));
    ['sem', 'unit', 'content', 'page', 'sub', 'cur', 'total', 'prep'].forEach(n => F(n).addEventListener('change', draw));
    draw();
    H.$('.b-search', page).onclick = () => { const subj = H.$('.s-subj', page).value; rows = d.learning.filter(r => r.subj === subj && String(r.sem) === H.$('.s-sem', page).value); selIdx = rows.length ? 0 : -1; draw(); if (rows.length) fill(); };
    const need = () => { if (!rows) { app.alertBox('먼저 조회하십시오.'); return false; } return true; };
    H.$('.b-add', page).onclick = () => { if (!need()) return; rows.push({ grade: 5, sem: +H.$('.s-sem', page).value, subj: H.$('.s-subj', page).value, unit: '', content: '', page: '', sub: '', cur: '', total: '', prep: '' }); selIdx = rows.length - 1; draw(); fill(); F('unit').focus(); };
    const move = dir => { if (!need() || selIdx < 0) return; const j = selIdx + dir; if (j < 0 || j >= rows.length) return; [rows[selIdx], rows[j]] = [rows[j], rows[selIdx]]; selIdx = j; draw(); };
    H.$('.b-up', page).onclick = () => move(-1);
    H.$('.b-down', page).onclick = () => move(1);
    H.$('.b-save', page).onclick = () => {
      if (!need()) return;
      if (rows.some(r => !r.unit)) { app.alertBox('단원은 필수 입력 항목입니다.'); return; }
      const subj = H.$('.s-subj', page).value, sem = H.$('.s-sem', page).value;
      d.learning = d.learning.filter(r => !(r.subj === subj && String(r.sem) === sem)).concat(rows);
      H.save();
    };
    H.$('.b-del', page).onclick = () => {
      if (!need()) return;
      const idx = H.$$('.ck', area).map((c, i) => c.checked ? i : -1).filter(i => i >= 0);
      if (!idx.length) { app.alertBox('삭제할 행을 선택하십시오.'); return; }
      app.confirmBox(`선택한 ${idx.length}건을 삭제하시겠습니까?\n(저장 버튼을 눌러야 최종 반영됩니다.)`, () => { rows = rows.filter((r, i) => !idx.includes(i)); selIdx = -1; draw(); fill(); });
    };
    H.$('.b-reg', page).onclick = () => app.alertBox('편제등록은 [학교교육과정편제및시간배당관리]에서 담당자가 등록합니다.');
    H.$('.b-upl', page).onclick = H.$('.b-dl', page).onclick = () => app.alertBox('연수용 환경에서는 파일 올리기/내리기를 지원하지 않습니다.');
  };

  function ttTable(tt, week, editable) {
    const days = ['월', '화', '수', '목', '금'];
    const heads = days.map((dn, i) => { const dt = new Date(week.start); dt.setDate(dt.getDate() + i); return `${dn}(${A().pad(dt.getMonth() + 1)}.${A().pad(dt.getDate())})`; });
    const hol = days.map((dn, i) => { const dt = new Date(week.start); dt.setDate(dt.getDate() + i); return H.holiday(H.key(dt)); });
    let body = '';
    for (let r = 0; r < 6; r++) {
      body += `<tr><td style="background:#f7f8fa">${r + 1}교시</td>`;
      for (let c = 0; c < 5; c++) {
        body += hol[c] ? (r === 0 ? `<td rowspan="6" style="background:#fdf3f5;color:#b8264c">${H.esc(hol[c].t)}</td>` : '') : `<td class="subj" data-r="${r}" data-c="${c}">${H.esc(tt[r][c])}</td>`;
      }
      body += '</tr>';
    }
    const sums = {}; tt.forEach((row, r) => row.forEach((s, c) => { if (s && !hol[c]) sums[s] = (sums[s] || 0) + 1; }));
    return `${H.grid([{ t: '교시', w: 80 }].concat(heads.map(h => ({ t: h }))), body, { cls: 'tt' })}
      <div class="info-box" style="margin-top:10px"><b>주간 시수</b> : ${Object.keys(sums).map(k => `${H.esc(k)} ${sums[k]}`).join(' · ') || '-'}${editable ? '<br>※ 교과(또는 공란) 위에서 <b>마우스 우클릭</b>하여 교과를 변경한 후 저장합니다.' : ''}</div>`;
  }
  S['학급시간표관리'] = function (page, title, app) {
    const d = D();
    const weeks = H.weeks();
    let wk = H.curWeek();
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.commonSearch({ year: false, sem: true })}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-base">기초시간표</button><button class="btn outline b-sem">학기별시간표관리</button><button class="btn primary b-save">저장</button></div>
      <div class="split"><div class="left" style="width:220px">${H.grid([{ t: '주차' }], weeks.map(w => `<tr data-k="${w.key}" class="${w.key === wk.key ? 'sel' : ''}"><td class="link">${w.label}</td></tr>`).join(''), { h: 560 })}</div>
      <div class="right"><div class="sub-tit" style="margin-top:0"><span class="wlabel"></span></div><div class="tt-area"></div></div></div>`);
    let cur = null;
    const draw = () => {
      cur = H.timetable(wk.key).map(r => r.slice());
      H.$('.wlabel', page).textContent = `5학년 2반 ${wk.label} 학급시간표`;
      H.$('.tt-area', page).innerHTML = ttTable(cur, wk, true);
    };
    const bindCtx = () => {
      H.$$('td.subj', page).forEach(td => {
        td.oncontextmenu = e => {
          e.preventDefault();
          document.querySelectorAll('.ctx').forEach(x => x.remove());
          const m = app.el(`<div class="ctx">${d.subjects.concat(['(공란)']).map(s => `<div>${H.esc(s)}</div>`).join('')}</div>`);
          m.style.left = e.clientX + 'px'; m.style.top = Math.min(e.clientY, window.innerHeight - 380) + 'px';
          H.$$('div', m).forEach(x => { x.onclick = () => { cur[+td.dataset.r][+td.dataset.c] = x.textContent === '(공란)' ? '' : x.textContent; m.remove(); H.$('.tt-area', page).innerHTML = ttTable(cur, wk, true); bindCtx(); }; });
          document.body.appendChild(m);
        };
      });
    };
    draw(); bindCtx();
    H.$$('.left tr[data-k]', page).forEach(tr => { tr.onclick = () => { wk = weeks.find(w => w.key === tr.dataset.k); H.$$('.left tr', page).forEach(x => x.classList.toggle('sel', x === tr)); draw(); bindCtx(); }; });
    H.$('.b-search', page).onclick = () => { draw(); bindCtx(); };
    H.$('.b-save', page).onclick = () => { d.tt = d.tt || {}; d.tt[wk.key] = cur; H.save(); };
    H.$('.b-base', page).onclick = () => {
      const base = d.baseTimetable.map(r => r.slice());
      const m = app.modal({ title: '기초시간표 작성 및 반영', width: 860, body: `<div class="info-box">교과 칸에서 우클릭하여 기초시간표를 작성하고, 반영기간을 지정하여 {반영}하면 해당 기간의 주별 시간표에 일괄 적용됩니다.</div><div class="bt"></div>
        <table class="form" style="margin-top:12px"><tr><th>반영기간</th><td><select class="sel w1">${app.opts(weeks.map(w => [w.key, w.label]), H.curWeek().key)}</select> ~ <select class="sel w2">${app.opts(weeks.map(w => [w.key, w.label]), weeks[weeks.length - 1].key)}</select></td></tr></table>`,
        buttons: [{ text: '저장', cls: 'primary', keep: true, onClick: () => { d.baseTimetable = base; app.Store.save(); app.toast('기초시간표가 저장되었습니다.'); } },
          { text: '반영', cls: 'green', onClick: () => { const a = H.$('.w1', m.pop).value, b = H.$('.w2', m.pop).value; d.tt = d.tt || {}; weeks.filter(w => w.key >= a && w.key <= b).forEach(w => { d.tt[w.key] = base.map(r => r.slice()); }); d.baseTimetable = base; app.Store.save(); draw(); bindCtx(); app.alertBox('기초시간표가 선택한 기간에 반영되었습니다.'); } },
          { text: '닫기' }] });
      const drawB = () => {
        const days = ['월', '화', '수', '목', '금'];
        H.$('.bt', m.pop).innerHTML = H.grid([{ t: '교시', w: 70 }].concat(days.map(x => ({ t: x }))), base.map((row, r) => `<tr><td>${r + 1}교시</td>${row.map((s, c) => `<td class="subj" data-r="${r}" data-c="${c}" style="cursor:context-menu">${H.esc(s)}</td>`).join('')}</tr>`).join(''), { cls: 'tt' });
        H.$$('td.subj', m.pop).forEach(td => {
          td.oncontextmenu = e => {
            e.preventDefault(); document.querySelectorAll('.ctx').forEach(x => x.remove());
            const cm = app.el(`<div class="ctx">${d.subjects.concat(['(공란)']).map(s => `<div>${H.esc(s)}</div>`).join('')}</div>`);
            cm.style.left = e.clientX + 'px'; cm.style.top = Math.min(e.clientY, window.innerHeight - 380) + 'px';
            H.$$('div', cm).forEach(x => { x.onclick = () => { base[+td.dataset.r][+td.dataset.c] = x.textContent === '(공란)' ? '' : x.textContent; cm.remove(); drawB(); }; });
            document.body.appendChild(cm);
          };
        });
      };
      drawB();
    };
    H.$('.b-sem', page).onclick = () => {
      const sums = {}; let wksCnt = 0;
      weeks.forEach(w => { wksCnt++; const t = H.timetable(w.key); for (let c = 0; c < 5; c++) { const dt = new Date(w.start); dt.setDate(dt.getDate() + c); if (H.holiday(H.key(dt))) continue; for (let r = 0; r < 6; r++) { const s = t[r][c]; if (s) sums[s] = (sums[s] || 0) + 1; } } });
      app.modal({ title: '학기별시간표관리 (2학기 편제 시수 확인)', width: 560, body: H.grid([{ t: '교과' }, { t: '편성 시수', w: 110 }, { t: '기준 시수', w: 110 }, { t: '편차', w: 90 }], d.subjects.map(s => { const v = sums[s] || 0; const std = { '국어': 102, '수학': 68, '사회': 51, '과학': 51, '영어': 51, '체육': 51, '음악': 34, '미술': 34, '도덕': 17, '실과': 34 }[s] || 17; const diff = v - std; return `<tr><td>${s}</td><td>${v}</td><td>${std}</td><td style="color:${diff ? '#b8264c' : '#0f7d58'}">${diff > 0 ? '+' : ''}${diff}</td></tr>`; }).join(''), { h: 420 }) + '<div class="info-box" style="margin-top:10px">※ 편차를 0으로 맞추도록 시간표를 조정합니다. (기준 시수는 연수용 예시값)</div>' });
    };
  };
  S['학급별시간표조회'] = function (page, title, app) {
    const weeks = H.weeks();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false, sem: true })}${app.sf('주차', `<select class="sel s-wk">${app.opts(weeks.map(w => [w.key, w.label]), H.curWeek().key)}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn b-print">${app.I.print}출력</button></div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const w = weeks.find(x => x.key === H.$('.s-wk', page).value); H.$('.area', page).innerHTML = ttTable(H.timetable(w.key), w, false); };
    H.$('.b-print', page).onclick = () => window.print();
  };
  S['전체시간표조회'] = function (page, title, app) {
    const weeks = H.weeks();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false, sem: true, cls: false })}${app.sf('기간', `<select class="sel s-wk">${app.opts(weeks.map(w => [w.key, w.label]), H.curWeek().key)}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => {
      const w = weeks.find(x => x.key === H.$('.s-wk', page).value);
      const days = ['월', '화', '수', '목', '금'];
      const mine = H.timetable(w.key);
      const other = (shift) => mine.map(r => r.map((s, i) => r[(i + shift) % 5]));
      const classes = [['5-1', other(1), '나미리'], ['5-2', mine, window.NEIS_ME], ['5-3', other(2), '변태수']];
      const cols = [{ t: '학급', w: 80 }, { t: '담임', w: 80 }].concat(days.flatMap(dn => [1, 2, 3, 4, 5, 6].map(p => ({ t: dn + p, w: 44 }))));
      H.$('.area', page).innerHTML = H.grid(cols, classes.map(([c, t, n]) => `<tr><td>${c}</td><td>${n}</td>${[0, 1, 2, 3, 4].map(ci => [0, 1, 2, 3, 4, 5].map(ri => `<td style="font-size:12px">${H.esc((t[ri][ci] || '').slice(0, 2))}</td>`).join('')).join('')}</tr>`).join(''));
    };
  };
  S['주간학습안내작성'] = function (page, title, app) {
    const d = D();
    const weeks = H.weeks();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false, sem: true })}${app.sf('주차', `<select class="sel s-wk">${app.opts(weeks.map(w => [w.key, w.label]), H.curWeek().key)}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-all">전체 교과진도표 가져오기</button><button class="btn outline b-wk">주차별 교과진도표 가져오기</button><button class="btn primary b-save">저장</button><button class="btn b-print">${app.I.print}출력</button></div><div class="area">${app.nodata()}</div>`);
    let w = null, cells = null, notes = null;
    const draw = () => {
      const tt = H.timetable(w.key);
      const days = ['월', '화', '수', '목', '금'];
      let body = '';
      for (let r = 0; r < 6; r++) {
        body += `<tr><td style="background:#f7f8fa">${r + 1}</td>` + [0, 1, 2, 3, 4].map(c => { const dt = new Date(w.start); dt.setDate(dt.getDate() + c); const hol = H.holiday(H.key(dt)); if (hol) return r === 0 ? `<td rowspan="6" style="background:#fdf3f5;color:#b8264c">${H.esc(hol.t)}</td>` : ''; return `<td class="l" style="vertical-align:top"><b style="color:#1644d8">${H.esc(tt[r][c])}</b><textarea class="ta cell" data-k="${r}-${c}" style="min-height:48px;margin-top:3px">${H.esc(cells[r + '-' + c] || '')}</textarea></td>`; }).join('') + '</tr>';
      }
      body += `<tr><td style="background:#f7f8fa">알림</td><td colspan="5" class="l"><textarea class="ta note" style="min-height:60px">${H.esc(notes)}</textarea></td></tr>`;
      H.$('.area', page).innerHTML = `<div class="sub-tit" style="margin-top:0">${w.label} 주간학습안내 <small>5학년 2반 · 담임 ${H.esc(d.user.name)}</small></div>` + H.grid([{ t: '교시', w: 60 }].concat(days.map((dn, i) => { const dt = new Date(w.start); dt.setDate(dt.getDate() + i); return { t: `${dn}(${dt.getMonth() + 1}/${dt.getDate()})` }; })), body);
    };
    const collect = () => { H.$$('.cell', page).forEach(t => { cells[t.dataset.k] = t.value; }); const n = H.$('.note', page); if (n) notes = n.value; };
    H.$('.b-search', page).onclick = () => { w = weeks.find(x => x.key === H.$('.s-wk', page).value); d.weekly = d.weekly || {}; const s = d.weekly[w.key] || {}; cells = Object.assign({}, s.cells || {}); notes = s.notes || '· 준비물: 실내화, 개인 물병\n· 이번 주는 독서 주간입니다. 읽고 싶은 책을 한 권씩 준비해 주세요.'; draw(); };
    const pull = () => {
      if (!w) { app.alertBox('먼저 조회하십시오.'); return; }
      collect();
      const tt = H.timetable(w.key); const counters = {};
      for (let c = 0; c < 5; c++) for (let r = 0; r < 6; r++) { const s = tt[r][c]; const list = d.learning.filter(x => x.subj === s); if (!list.length) continue; counters[s] = counters[s] || 0; const it = list[counters[s] % list.length]; counters[s]++; if (!cells[r + '-' + c]) cells[r + '-' + c] = `${it.unit}\n- ${it.content}${it.page ? ` (${it.page}쪽)` : ''}`; }
      draw(); app.toast('교과진도표 내용을 가져왔습니다.');
    };
    H.$('.b-all', page).onclick = pull; H.$('.b-wk', page).onclick = pull;
    H.$('.b-save', page).onclick = () => { if (!w) { app.alertBox('먼저 조회하십시오.'); return; } collect(); d.weekly[w.key] = { cells, notes }; H.save(); };
    H.$('.b-print', page).onclick = () => { if (!w) { app.alertBox('먼저 조회하십시오.'); return; } collect(); printWeekly(w, cells, notes); };
  };
  function printWeekly(w, cells, notes) {
    const d = D(); const tt = H.timetable(w.key);
    const days = ['월', '화', '수', '목', '금'];
    const rows = [0, 1, 2, 3, 4, 5].map(r => `<tr><th>${r + 1}</th>${[0, 1, 2, 3, 4].map(c => `<td style="vertical-align:top;font-size:12px"><b>${H.esc(tt[r][c])}</b><br>${H.esc(cells[r + '-' + c] || '').replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('');
    A().modal({ title: '주간학습안내 출력 미리보기', width: 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2>주간학습안내</h2><p style="text-align:right">${H.esc(d.org.school)} 5학년 2반 담임 ${H.esc(d.user.name)} · ${w.label}</p><table><tr><th style="width:40px">교시</th>${days.map(x => `<th>${x}</th>`).join('')}</tr>${rows}<tr><th>알림</th><td colspan="5">${H.esc(notes).replace(/\n/g, '<br>')}</td></tr></table></div></div>` });
  }
  S['주간학습안내조회'] = function (page, title, app) {
    const d = D(); const weeks = H.weeks();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false, sem: true })}${app.sf('주차', `<select class="sel s-wk">${app.opts(weeks.map(w => [w.key, w.label]), H.curWeek().key)}</select>`, true)}<div class="sf"><label>출력옵션</label><label><input type="checkbox" checked> 학교</label>&nbsp;<label><input type="checkbox" checked> 담임명</label>&nbsp;<label><input type="checkbox"> 시수표</label></div>${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const w = weeks.find(x => x.key === H.$('.s-wk', page).value); const s = (d.weekly || {})[w.key]; if (!s) { H.$('.area', page).innerHTML = app.nodata('작성된 주간학습안내가 없습니다. [주간학습안내작성]에서 먼저 작성하세요.'); return; } H.$('.area', page).innerHTML = ''; printWeekly(w, s.cells, s.notes); };
  };
  S['학사일정관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([[d.year, d.year + '학년도']], d.year)}</select>`, true)}${app.sf('월', `<select class="sel s-m">${app.opts([['', '전체']].concat([...Array(12)].map((x, i) => [A().pad(i + 1), (i + 1) + '월'])), '09')}</select>`)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">※ 저장한 학사일정은 <b>초기화면 월간일정</b>과 시간표(휴업일)에 반영됩니다.</div>`);
    let rows = [];
    const draw = () => {
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '일자', w: 160 }, { t: '행사명' }, { t: '구분', w: 150 }], rows.map((r, i) => `<tr data-i="${i}"><td><input type="checkbox" class="ck"></td><td><input type="date" class="inp f-d" value="${r.d}"></td><td><input class="inp f-t" value="${H.esc(r.t)}"></td><td><select class="sel f-k">${app.opts([['sch', '학사일정'], ['hol', '공휴일/휴업일'], ['etc', '기타일정']], r.k)}</select></td></tr>`).join(''), { h: 480 });
      H.$$('tbody tr', page).forEach(tr => { const r = rows[+tr.dataset.i]; H.$('.f-d', tr).onchange = e => { r.d = e.target.value; }; H.$('.f-t', tr).oninput = e => { r.t = e.target.value; }; H.$('.f-k', tr).onchange = e => { r.k = e.target.value; }; });
    };
    const load = () => { const m = H.$('.s-m', page).value; rows = d.schedule.filter(s => !m || s.d.slice(5, 7) === m).map(s => Object.assign({}, s)); draw(); };
    load();
    H.$('.b-search', page).onclick = load;
    H.$('.b-add', page).onclick = () => { const m = H.$('.s-m', page).value || '09'; rows.push({ d: `2026-${m}-01`, t: '', k: 'sch' }); draw(); };
    H.$('.b-del', page).onclick = () => { const idx = H.$$('.ck', page).map((c, i) => c.checked ? i : -1).filter(i => i >= 0); if (!idx.length) { app.alertBox('삭제할 행을 선택하십시오.'); return; } rows = rows.filter((r, i) => !idx.includes(i)); draw(); };
    H.$('.b-save', page).onclick = () => { const m = H.$('.s-m', page).value; if (rows.some(r => !r.t || !r.d)) { app.alertBox('일자와 행사명을 모두 입력하십시오.'); return; } d.schedule = d.schedule.filter(s => m && s.d.slice(5, 7) !== m).concat(rows).sort((a, b) => a.d.localeCompare(b.d)); H.save(); app.renderHome(); };
  };

  /* =============== 학적 =============== */
  S['기본신상관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>
      <div class="split"><div class="left" style="width:240px"><div class="sub-tit" style="margin-top:0">학생목록</div><div class="list">${app.nodata()}</div></div>
      <div class="right"><div class="tabs"><a class="on" data-t="base">기본신상</a><a data-t="addr">누가주소등록</a><a data-t="hist">학적사항</a><a data-t="cls">학년반이력조회</a><a data-t="num">번호수정</a></div><div class="detail">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    let sel = null, tab = 'base';
    const drawList = () => { H.$('.list', page).innerHTML = H.stuList(sel); H.$$('.list tr[data-no]', page).forEach(tr => { tr.onclick = () => { sel = +tr.dataset.no; drawList(); drawDetail(); }; }); };
    const drawDetail = () => {
      const box = H.$('.detail', page);
      if (tab === 'num') {
        box.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn primary b-numsave">저장</button></div>` + H.grid([{ t: '현재번호', w: 90 }, { t: '성명' }, { t: '변경번호', w: 120 }], d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td><input class="inp nn" data-no="${s.no}" value="${s.no}"></td></tr>`).join(''), { h: 560 });
        H.$('.b-numsave', box).onclick = () => { const map = {}; H.$$('.nn', box).forEach(i => { map[i.dataset.no] = +i.value; }); const vals = Object.values(map); if (new Set(vals).size !== vals.length || vals.some(v => !v)) { app.alertBox('번호가 중복되었거나 비어 있습니다.'); return; } app.alertBox('연수용 환경에서는 번호 변경 결과를 확인만 합니다.\n(실제 나이스에서는 학적변동이 있었던 번호의 재사용을 권장하지 않습니다.)'); };
        return;
      }
      if (!sel) { box.innerHTML = app.nodata('학생을 선택하십시오.'); return; }
      const s = H.stu(sel);
      if (tab === 'base') {
        box.innerHTML = `<table class="form"><tr><th>사진</th><td rowspan="1" style="width:130px">${H.avatar(s, 90)}</td><th>성명</th><td>${H.esc(s.name)}</td></tr>
          <tr><th>학년/반/번호</th><td>5학년 2반 ${s.no}번</td><th>성별</th><td>${s.sex}</td></tr>
          <tr><th>생년월일</th><td>${s.birth} <span class="badge">수정불가</span></td><th>학적상태</th><td>재학</td></tr>
          <tr><th>주소</th><td colspan="3">${H.esc(s.addr)}</td></tr>
          <tr><th>보호자</th><td>${H.esc(s.guardian)} (${H.esc(s.rel)})</td><th>연락처</th><td>${H.esc(s.tel)}</td></tr>
          <tr><th>특기사항</th><td colspan="3"><textarea class="ta f-note">${H.esc(s.note || '')}</textarea></td></tr></table>
          <div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn green b-photo">사진등록</button><button class="btn primary b-save">저장</button></div>
          <div class="info-box">※ 모든 학생 정보는 연수용 가상 데이터입니다(만화 캐릭터). 생년월일은 주민등록번호 기준으로 자동 입력되며 수정할 수 없습니다.</div>`;
        H.$('.b-save', box).onclick = () => { s.note = H.$('.f-note', box).value; H.save(); };
        H.$('.b-photo', box).onclick = () => app.openLeaf('사진일괄입력');
      } else if (tab === 'addr') {
        s.addrs = s.addrs || [{ from: '2023.03.02', addr: s.addr }];
        box.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn outline b-reg">등록</button><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '순번', w: 60 }, { t: '변동일자', w: 130 }, { t: '주소' }], s.addrs.map((a, i) => `<tr><td>${i + 1}</td><td><input class="inp ad" data-i="${i}" data-f="from" value="${H.esc(a.from)}"></td><td><input class="inp ad" data-i="${i}" data-f="addr" value="${H.esc(a.addr)}"></td></tr>`).join(''));
        H.$('.b-reg', box).onclick = () => { s.addrs.push({ from: H.dateStr(A().today()), addr: '' }); drawDetail(); };
        H.$('.b-save', box).onclick = () => { H.$$('.ad', box).forEach(i => { s.addrs[+i.dataset.i][i.dataset.f] = i.value; }); const last = s.addrs[s.addrs.length - 1]; if (last.addr) s.addr = last.addr; H.save(); };
      } else if (tab === 'hist') {
        box.innerHTML = H.grid([{ t: '일자', w: 120 }, { t: '학적변동', w: 110 }, { t: '학년', w: 70 }, { t: '내용' }], `<tr><td>2022.03.02</td><td>입학</td><td>1</td><td class="l">${H.esc(d.org.school)} 제1학년 입학</td></tr><tr><td>2026.03.03</td><td>진급</td><td>5</td><td class="l">제5학년 진급</td></tr>`) + `<table class="form" style="margin-top:12px"><tr><th>학적특기사항</th><td><label><input type="radio" name="ip${sel}" checked> 개별입력</label> <label><input type="radio" name="ip${sel}"> 일괄입력</label><textarea class="ta" style="margin-top:6px"></textarea></td></tr></table>`;
      } else {
        box.innerHTML = H.grid([{ t: '학년도', w: 90 }, { t: '학년', w: 60 }, { t: '반', w: 60 }, { t: '번호', w: 60 }, { t: '담임' }], [2022, 2023, 2024, 2025, 2026].map((y, i) => `<tr><td>${y}</td><td>${i + 1}</td><td>${(i % 3) + 1}</td><td>${s.no}</td><td>${i === 4 ? H.esc(d.user.name) : ['나미리', '안한수', '변태수', '봉미선'][i]}</td></tr>`).join(''));
      }
    };
    H.$('.b-search', page).onclick = () => { drawList(); drawDetail(); };
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { tab = a.dataset.t; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); drawDetail(); }; });
    drawList();
  };
  S['명렬표출력'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.sf('양식', `<select class="sel s-f">${app.opts(['기본명렬표', '출석부용', '성별구분'], '기본명렬표')}</select>`)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => {
      const f = H.$('.s-f', page).value;
      const list = f === '성별구분' ? d.students.slice().sort((a, b) => a.sex.localeCompare(b.sex)) : d.students;
      H.$('.area', page).innerHTML = `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2>${d.year}학년도 5학년 2반 명렬표</h2><p style="text-align:right">담임 : ${H.esc(d.user.name)}</p><table><tr><th>번호</th><th>성명</th><th>성별</th>${f === '출석부용' ? [...Array(10)].map(() => '<th style="width:32px"></th>').join('') : '<th>비고</th>'}</tr>${list.map(s => `<tr><td style="text-align:center">${s.no}</td><td style="text-align:center">${H.esc(s.name)}</td><td style="text-align:center">${s.sex}</td>${f === '출석부용' ? [...Array(10)].map(() => '<td></td>').join('') : '<td></td>'}</tr>`).join('')}</table><p>남 ${list.filter(s => s.sex === '남').length}명 · 여 ${list.filter(s => s.sex === '여').length}명 · 계 ${list.length}명</p></div></div>`;
    };
  };

  /* ---- 출결 ---- */
  const ATT = {
    '질병결석': '♡', '미인정결석': '♥', '기타결석': '▲', '출석인정결석': '△',
    '질병지각': '#', '미인정지각': 'X', '기타지각': '@', '출석인정지각': '◐',
    '질병조퇴': '◁', '미인정조퇴': '◎', '기타조퇴': '▷', '출석인정조퇴': '◑',
    '질병결과': '☆', '미인정결과': '◇', '기타결과': '▽', '출석인정결과': '◆'
  };
  H.ATT = ATT;
  H.attMonth = ym => { const d = D(); d.attendance = d.attendance || {}; return d.attendance[ym] || (d.attendance[ym] = {}); };
  H.attClosed = ym => ((D().locks || {}).att || {})[ym];
  S['출결관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="flow"><div class="step on" data-s="daily"><span class="no">1</span>일일출결관리</div><div class="step" data-s="note"><span class="no">2</span>출결특기사항등록</div></div><div class="body"></div>`);
    let step = 'daily', ym = '2026-09';
    const body = H.$('.body', page);
    const daily = () => {
      body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.sf('월', `<select class="sel s-m">${app.opts(['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'].map(v => [v, (+v.slice(5)) + '월']), ym)}</select>`, true)}${app.searchBtn()}</div>
        <div class="legend-att">${Object.keys(ATT).map(k => `<span><b>${ATT[k]}</b>${k}</span>`).join('')}</div>
        <div class="toolbar"><label><input type="radio" name="im" value="one" checked> 개별입력</label>&nbsp;&nbsp;<label><input type="radio" name="im" value="multi"> 연속입력(결석)</label>&nbsp;<select class="sel s-multi" style="min-width:130px">${app.opts(['질병결석', '미인정결석', '기타결석', '출석인정결석'])}</select>
          <span class="st" style="margin-left:14px"></span><span class="sp"></span><button class="btn outline b-note">비고등록</button><button class="btn dark b-close">마감</button><button class="btn b-unclose">마감취소</button></div>
        <div class="grid-area"></div>`;
      H.$('.b-search', body).onclick = () => { ym = H.$('.s-m', body).value; drawGrid(); };
      H.$('.b-close', body).onclick = () => closeMonth(true);
      H.$('.b-unclose', body).onclick = () => closeMonth(false);
      H.$('.b-note', body).onclick = notePopup;
      drawGrid();
    };
    const drawGrid = () => {
      const [y, m] = ym.split('-').map(Number);
      const days = new Date(y, m, 0).getDate();
      const recs = H.attMonth(ym);
      const closed = H.attClosed(ym);
      H.$('.st', body).innerHTML = closed ? '<span class="badge red">마감</span>' : '<span class="badge blue">미마감</span>';
      const cols = [{ t: '번호', w: 44 }, { t: '성명', w: 70 }];
      const dinfo = [];
      for (let i = 1; i <= days; i++) { const dt = new Date(y, m - 1, i); const k = H.key(dt); const hol = H.holiday(k); dinfo.push({ i, dow: dt.getDay(), hol }); cols.push({ t: `<span title="${hol ? H.esc(hol.t) : ''}">${i}</span>`, w: 30 }); }
      cols.push({ t: '결석', w: 44 }, { t: '지각', w: 44 }, { t: '조퇴', w: 44 }, { t: '결과', w: 44 });
      const rows = d.students.map(s => {
        const cnt = { 결석: 0, 지각: 0, 조퇴: 0, 결과: 0 };
        const tds = dinfo.map(x => {
          const r = recs[`${s.no}-${x.i}`];
          if (r) cnt[r.code.slice(-2)]++;
          const cls = [x.dow === 0 ? 'sun' : '', x.dow === 6 ? 'sat' : '', (x.hol || x.dow === 0 || x.dow === 6) ? 'hol' : '', r ? 'mk' : '', closed ? 'closed' : ''].join(' ');
          return `<td class="${cls}" data-no="${s.no}" data-d="${x.i}" title="${r ? H.esc(r.code + ' : ' + (r.reason || '')) : ''}">${r ? ATT[r.code] : ''}</td>`;
        }).join('');
        const apps = (d.fieldTrips || []).filter(f => f.no === s.no && f.docId && window.Approval.statusOf(f.docId) === '완결' && f.from.slice(0, 7) <= ym && f.to.slice(0, 7) >= ym);
        return `<tr><td class="nm">${s.no}</td><td class="nm">${H.esc(s.name)}${apps.length ? `<span class="star-ic" data-no="${s.no}" title="교육활동신청내역">★</span>` : ''}</td>${tds}<td class="nm">${cnt.결석 || ''}</td><td class="nm">${cnt.지각 || ''}</td><td class="nm">${cnt.조퇴 || ''}</td><td class="nm">${cnt.결과 || ''}</td></tr>`;
      }).join('');
      H.$('.grid-area', body).innerHTML = H.grid(cols, rows, { cls: 'att', h: 600 }).replace('<table class="grid att">', '<table class="grid att" style="width:auto;min-width:100%">');
      H.$$('.grid-area .star-ic', body).forEach(st => {
        st.onclick = () => {
          const no = +st.dataset.no; const list = d.fieldTrips.filter(f => f.no === no && f.docId && window.Approval.statusOf(f.docId) === '완결');
          app.modal({ title: `교육활동신청내역 - ${H.stu(no).name}`, width: 680, body: H.grid([{ t: '교육활동', w: 150 }, { t: '일자', w: 190 }, { t: '종류', w: 110 }, { t: '장소/사유' }], list.map(f => `<tr><td>${H.esc(f.form)}</td><td>${f.from} ~ ${f.to}</td><td>${H.esc(f.kind)}</td><td class="l">${H.esc(f.place || f.plan)}</td></tr>`).join('')) + '<div class="info-box" style="margin-top:10px;font-size:12px">※ 접수 및 결재가 완료된 교육활동 신청 내역입니다. 출결은 자동 입력되지 않으므로 [교외체험학습관리]의 {출결반영} 또는 직접 입력하십시오.</div>' });
        };
      });
      H.$$('.grid-area td[data-no]', body).forEach(td => {
        td.onclick = () => {
          if (td.classList.contains('hol')) return;
          if (closed) { app.alertBox('마감된 월입니다. 수정하려면 {마감취소} 후 입력하십시오.'); return; }
          const mode = H.$('input[name=im]:checked', body).value;
          const key = `${td.dataset.no}-${td.dataset.d}`;
          if (mode === 'multi') { const code = H.$('.s-multi', body).value; if (recs[key] && recs[key].code === code) delete recs[key]; else recs[key] = { code, reason: '' }; app.Store.save(); drawGrid(); return; }
          attPopup(+td.dataset.no, +td.dataset.d, recs, key);
        };
      });
    };
    const attPopup = (no, day, recs, key) => {
      const s = H.stu(no); const r = recs[key] || {};
      const kinds = ['결석', '지각', '조퇴', '결과'], types = ['질병', '미인정', '기타', '출석인정'];
      const m = app.modal({ title: `일일출결 입력 - ${s.no}번 ${s.name} (${ym.replace('-', '.')}.${A().pad(day)})`, width: 760, body: `
        <table class="form"><colgroup><col style="width:110px"><col></colgroup><tr><th class="req">*출결구분</th><td>${H.grid([{ t: '', w: 70 }].concat(types.map(t => ({ t }))), kinds.map(k => `<tr><td>${k}</td>${types.map(t => `<td><label><input type="radio" name="ac" value="${t + k}" ${r.code === t + k ? 'checked' : ''}> ${ATT[t + k]}</label></td>`).join('')}</tr>`).join(''))}</td></tr>
        <tr><th>세부사항</th><td><select class="sel f-detail">${app.opts(['', '1교시', '2교시', '3교시', '4교시', '5교시', '6교시'], r.detail || '')}</select> <span style="font-size:12px;color:#5d6b82">(지각·조퇴·결과 교시 등 선택사항)</span></td></tr>
        <tr><th class="req">*사유</th><td><input class="inp f-reason" style="width:100%" value="${H.esc(r.reason || '')}" placeholder="예) 감기(병원 진료확인서 제출)"></td></tr></table>
        <div class="info-box" style="margin-top:10px;font-size:12px">※ 입력한 결석·지각·조퇴·결과 내역은 창의적체험활동 누가기록 일자에 자동 연동됩니다(실제 나이스 기준).</div>`,
        buttons: [
          { text: '저장', cls: 'primary', onClick: () => { const c = H.$('input[name=ac]:checked', m.pop); if (!c) { app.alertBox('출결구분을 선택하십시오.'); return false; } const reason = H.$('.f-reason', m.pop).value.trim(); if (!reason) { app.alertBox('사유를 입력하십시오.'); return false; } recs[key] = { code: c.value, reason, detail: H.$('.f-detail', m.pop).value }; app.Store.save(); drawGrid(); app.toast('저장되었습니다.'); } },
          { text: '초기화', onClick: () => { delete recs[key]; app.Store.save(); drawGrid(); app.toast('출결 내용이 삭제되었습니다.'); } },
          { text: '닫기' }] });
    };
    const closeMonth = (on) => {
      const [y, m] = ym.split('-').map(Number);
      app.modal({ title: '일일 출결 마감관리', width: 460, body: `<table class="form"><tr><th>마감기간</th><td>${y}.${A().pad(m)}.01 ~ ${y}.${A().pad(m)}.${new Date(y, m, 0).getDate()}</td></tr><tr><th>현재상태</th><td>${H.attClosed(ym) ? '마감' : '미마감'}</td></tr></table><div class="info-box" style="margin-top:10px;font-size:12px">※ 월말로 마감하지 않으면 출결 통계에 반영되지 않습니다. 방학으로 수업일이 없는 달도 마감해야 합니다.</div>`,
        buttons: [{ text: on ? '마감' : '마감취소', cls: on ? 'dark' : 'primary', onClick: () => { d.locks = d.locks || {}; d.locks.att = d.locks.att || {}; d.locks.att[ym] = on; app.Store.save(); drawGrid(); app.alertBox(on ? `${m}월 출결이 마감되었습니다.` : `${m}월 출결 마감이 취소되었습니다.`); } }, { text: '닫기' }] });
    };
    const notePopup = () => {
      d.attNote = d.attNote || {};
      const m = app.modal({ title: '출결비고입력', width: 640, body: `<div class="info-box" style="font-size:12px">출결비고는 교사 참고용이며 학교생활기록부 출결 특기사항에 자동 기록되지 않습니다.</div>` + H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '비고' }], d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td><input class="inp nt" data-no="${s.no}" value="${H.esc(d.attNote[s.no] || '')}"></td></tr>`).join(''), { h: 420 }),
        buttons: [{ text: '저장', cls: 'primary', onClick: () => { H.$$('.nt', m.pop).forEach(i => { d.attNote[i.dataset.no] = i.value; }); app.Store.save(); app.toast('저장되었습니다.'); } }, { text: '닫기' }] });
    };
    const noteStep = () => {
      d.attSpecial = d.attSpecial || {};
      body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>
        <div class="toolbar"><span class="sp"></span><button class="btn outline b-bulk">일괄입력</button><button class="btn outline b-etc">기타결석사유 가져오기</button><button class="btn outline b-perfect">개근 일괄입력</button><button class="btn green b-dl">결석사유다운로드</button><button class="btn primary b-save">저장</button></div><div class="area"></div>
        <div class="info-box" style="margin-top:10px">※ 출결 일수는 <b>월 출결이 마감된 월</b>의 자료만 집계됩니다. 2026학년도부터 필수 기재 내용은 ‘개근’, ‘기타결석의 사유’입니다.</div>`;
      const draw = () => {
        const tot = {}; d.students.forEach(s => { tot[s.no] = { 결석: 0, 지각: 0, 조퇴: 0, 결과: 0, etc: [] }; });
        Object.keys(d.attendance || {}).forEach(ymk => { if (!H.attClosed(ymk)) return; Object.entries(d.attendance[ymk]).forEach(([k, r]) => { const no = +k.split('-')[0]; if (!tot[no]) return; if (r.code.startsWith('출석인정')) return; tot[no][r.code.slice(-2)]++; if (r.code === '기타결석') tot[no].etc.push(r.reason); }); });
        H.$('.area', body).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '결석', w: 50 }, { t: '지각', w: 50 }, { t: '조퇴', w: 50 }, { t: '결과', w: 50 }, { t: '특기사항' }], d.students.map(s => { const t = tot[s.no]; return `<tr data-no="${s.no}" data-etc="${H.esc(t.etc.join(', '))}" data-sum="${t.결석 + t.지각 + t.조퇴 + t.결과}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td class="link">${H.esc(s.name)}</td><td>${t.결석}</td><td>${t.지각}</td><td>${t.조퇴}</td><td>${t.결과}</td><td><input class="inp sp-in" value="${H.esc(d.attSpecial[s.no] || '')}"></td></tr>`; }).join(''), { h: 520 });
        const all = H.$('.all', body); all.onchange = () => H.$$('.ck', body).forEach(c => { c.checked = all.checked; });
        H.$$('td.link', body).forEach(td => { td.onclick = () => { const no = +td.parentElement.dataset.no; const list = []; Object.keys(d.attendance || {}).forEach(ymk => Object.entries(d.attendance[ymk]).forEach(([k, r]) => { const [n, dd] = k.split('-'); if (+n === no) list.push({ date: `${ymk.replace('-', '.')}.${A().pad(dd)}`, ...r, closed: H.attClosed(ymk) }); })); app.modal({ title: `일일출결 상세조회 - ${H.stu(no).name}`, width: 620, body: H.grid([{ t: '일자', w: 110 }, { t: '출결유형', w: 110 }, { t: '교시', w: 70 }, { t: '사유' }, { t: '마감', w: 60 }], list.map(x => `<tr><td>${x.date}</td><td>${x.code}</td><td>${x.detail || ''}</td><td class="l">${H.esc(x.reason)}</td><td>${x.closed ? 'Y' : 'N'}</td></tr>`).join('') || '<tr><td colspan="5">출결 기록이 없습니다.</td></tr>') }); }; });
      };
      H.$('.b-search', body).onclick = draw;
      H.$('.b-perfect', body).onclick = () => { let n = 0; H.$$('tbody tr', body).forEach(tr => { if (tr.dataset.sum === '0') { const i = H.$('.sp-in', tr); if (!i.value.includes('개근')) { i.value = '개근'; n++; } } }); app.alertBox(`${n}명에게 '개근'이 일괄 입력되었습니다.\n저장 버튼을 눌러 저장하십시오.\n\n※ 반드시 각 월별 출결을 마감한 후 진행해야 합니다.`); };
      H.$('.b-etc', body).onclick = () => { const sel = H.$$('tbody tr', body).filter(tr => H.$('.ck', tr).checked); if (!sel.length) { app.alertBox('학생을 선택하십시오.'); return; } sel.forEach(tr => { if (tr.dataset.etc) H.$('.sp-in', tr).value = `기타결석(${tr.dataset.etc})`; }); app.toast('기타결석사유를 가져왔습니다.'); };
      H.$('.b-bulk', body).onclick = () => { const sel = H.$$('tbody tr', body).filter(tr => H.$('.ck', tr).checked); if (!sel.length) { app.alertBox('학생을 선택하십시오.'); return; } const m = app.modal({ title: '일괄입력', width: 480, body: `<textarea class="ta v"></textarea><div style="margin-top:8px"><label><input type="radio" name="bm" value="over" checked> 덮어쓰기</label> <label><input type="radio" name="bm" value="add"> 이어쓰기</label></div>`, buttons: [{ text: '적용', cls: 'primary', onClick: () => { const v = H.$('.v', m.pop).value; const add = H.$('input[name=bm]:checked', m.pop).value === 'add'; sel.forEach(tr => { const i = H.$('.sp-in', tr); i.value = add && i.value ? i.value + ' ' + v : v; }); } }, { text: '닫기' }] }); };
      H.$('.b-dl', body).onclick = () => app.alertBox('연수용 환경에서는 엑셀 다운로드를 지원하지 않습니다.');
      H.$('.b-save', body).onclick = () => { H.$$('tbody tr', body).forEach(tr => { d.attSpecial[tr.dataset.no] = H.$('.sp-in', tr).value; }); H.save(); };
      draw();
    };
    H.$$('.flow .step', page).forEach(st => { st.onclick = () => { step = st.dataset.s; H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === st)); step === 'daily' ? daily() : noteStep(); }; });
    daily();
  };
  S['교과시간별출결관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('일자', `<input type="date" class="inp s-d" value="2026-09-30">`, true)}${app.sf('교시', `<select class="sel s-p">${app.opts(['1', '2', '3', '4', '5', '6'].map(x => [x, x + '교시']), '1')}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="st"></span><span class="sp"></span><button class="btn outline b-mon">월별출결마감현황</button><button class="btn b-init">초기화</button><button class="btn primary b-save">저장</button><button class="btn dark b-close">출결마감</button><button class="btn b-open">마감취소</button></div><div class="area">${app.nodata()}</div>
      <div class="info-box" style="margin-top:10px">※ ‘출석상태’ 칸을 클릭하여 ○(출석) / ×(미출석)를 표시합니다. 일일출결관리의 결석·지각 등에는 자동 등록되지 않습니다. 초등은 교시별 출결마감이 필수사항은 아닙니다.</div>`);
    d.periodAtt = d.periodAtt || {};
    let key = null, cur = null;
    const draw = () => {
      const closed = (d.periodAtt[key] || {}).closed;
      H.$('.st', page).innerHTML = closed ? '<span class="badge red">마감</span>' : '<span class="badge blue">미마감</span>';
      H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 60 }, { t: '성명' }, { t: '출석상태', w: 120 }, { t: '일일출결', w: 160 }], d.students.map(s => { const ym = key.slice(0, 7); const day = +key.slice(8, 10); const r = (d.attendance[ym] || {})[`${s.no}-${day}`]; return `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td class="pst" data-no="${s.no}" style="cursor:pointer;font-size:16px;color:${cur[s.no] === '×' ? '#b8264c' : '#1644d8'}">${cur[s.no] || ''}</td><td>${r ? r.code : ''}</td></tr>`; }).join(''), { h: 560 });
      H.$$('.pst', page).forEach(td => { td.onclick = () => { if (closed) { app.alertBox('마감된 교시입니다.'); return; } const v = cur[td.dataset.no]; cur[td.dataset.no] = v === '○' ? '×' : v === '×' ? '' : '○'; draw(); }; });
    };
    H.$('.b-search', page).onclick = () => { key = H.$('.s-d', page).value + '-' + H.$('.s-p', page).value; cur = Object.assign({}, (d.periodAtt[key] || {}).marks || {}); draw(); };
    const need = () => { if (!key) { app.alertBox('먼저 조회하십시오.'); return false; } return true; };
    H.$('.b-init', page).onclick = () => { if (!need()) return; cur = {}; draw(); };
    H.$('.b-save', page).onclick = () => { if (!need()) return; d.periodAtt[key] = Object.assign(d.periodAtt[key] || {}, { marks: cur }); H.save(); };
    H.$('.b-close', page).onclick = () => { if (!need()) return; d.periodAtt[key] = Object.assign(d.periodAtt[key] || {}, { marks: cur, closed: true }); app.Store.save(); draw(); app.alertBox('해당 교시 출결이 마감되었습니다.'); };
    H.$('.b-open', page).onclick = () => { if (!need()) return; if (d.periodAtt[key]) d.periodAtt[key].closed = false; app.Store.save(); draw(); app.alertBox('마감이 취소되었습니다.'); };
    H.$('.b-mon', page).onclick = () => { const ks = Object.keys(d.periodAtt).filter(k => d.periodAtt[k].closed); app.modal({ title: '월별 출결마감 현황 조회', width: 440, body: H.grid([{ t: '일자' }, { t: '교시', w: 80 }, { t: '상태', w: 80 }], ks.map(k => `<tr><td>${k.slice(0, 10)}</td><td>${k.slice(11)}교시</td><td>마감</td></tr>`).join('') || '<tr><td colspan="3">마감된 교시가 없습니다.</td></tr>') }); };
  };
  S['출결현황및통계'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="tabs"><a class="on">학급별출결현황</a><a class="off">반별연간출결통계</a><a class="off">결석자및개인별출결현황</a></div>
      <div class="search-box">${app.commonSearch()}${app.sf('기간', `<input type="date" class="inp s-a" value="2026-09-01"> ~ <input type="date" class="inp s-b" value="2026-09-30">`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn b-p1">${app.I.print}개인별출력</button><button class="btn b-p2">${app.I.print}학급별출력</button></div><div class="area">${app.nodata()}</div>`);
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); H.$('.b-search', page).click(); }; });
    H.$('.b-search', page).onclick = () => {
      const a = H.$('.s-a', page).value, b = H.$('.s-b', page).value;
      const types = ['질병', '미인정', '기타', '출석인정'], kinds = ['결석', '지각', '조퇴', '결과'];
      const tot = {}; d.students.forEach(s => { tot[s.no] = {}; });
      Object.keys(d.attendance || {}).forEach(ym => Object.entries(d.attendance[ym]).forEach(([k, r]) => { const [no, day] = k.split('-'); const dt = `${ym}-${A().pad(day)}`; if (dt < a || dt > b) return; tot[no][r.code] = (tot[no][r.code] || 0) + 1; }));
      const cols = [{ t: '번호', w: 44 }, { t: '성명', w: 70 }].concat(kinds.flatMap(k => types.map(t => ({ t: `<span style="font-size:11px">${k}<br>${t}</span>`, w: 46 }))));
      H.$('.area', page).innerHTML = H.grid(cols, d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td>${kinds.flatMap(k => types.map(t => `<td>${tot[s.no][t + k] || ''}</td>`)).join('')}</tr>`).join(''), { h: 560 });
    };
    H.$('.b-p1', page).onclick = H.$('.b-p2', page).onclick = () => window.print();
  };
  S['교과시간별출석부출력'] = function (page, title, app) {
    S['명렬표출력'](page, title, app);
  };
  S['미인정결석학생관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-reg">등록</button></div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('등록된 미인정결석학생이 없습니다.'); };
    H.$('.b-reg', page).onclick = () => app.alertBox('연수용 환경: 장기 미인정결석 학생이 발생한 경우 {등록} 후 최초미인정결석일자와 관리항목을 입력합니다.');
  };
})();
