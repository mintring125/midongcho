/* 업무 화면 (3) — 복무(근무상황·출장·초과근무 신청 및 상신), 담임 결재 업무(체험학습·결보강·월말출결·정정대장) */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const Ap = window.Approval;
  const pad = n => String(n).padStart(2, '0');

  /* ---------- 공통 계산 ---------- */
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  function workdays(a, b) { let n = 0; const d = parseD(a); const e = parseD(b); while (d <= e) { if (d.getDay() % 6 !== 0 && !H.holiday(H.key(d))) n++; d.setDate(d.getDate() + 1); } return n; }
  function calcDur(fd, ft, td, tt) {
    if (!fd || !td || fd > td) return null;
    if (fd === td) { const m = toMin(tt) - toMin(ft); if (m <= 0) return null; if (m >= 480) return { d: 1, h: 0, m: 0 }; return { d: 0, h: Math.floor(m / 60), m: m % 60 }; }
    const n = workdays(fd, td); return n ? { d: n, h: 0, m: 0 } : null;
  }
  const durStr = x => x ? `${x.d}일 ${x.h}시간 ${x.m}분` : '';
  const durShort = x => x ? (x.h || x.m ? `${x.d}일${x.h}시간${x.m}분` : `${x.d}일`) : '';
  const durMin = x => x ? x.d * 480 + x.h * 60 + x.m : 0;
  const fmtDHM = m => `${pad(Math.floor(m / 480))}일 ${pad(Math.floor((m % 480) / 60))}시 ${pad(m % 60)}분`;
  const HOURS = [...Array(16)].map((x, i) => pad(i + 7));
  const MINS = ['00', '10', '20', '30', '40', '50'];
  const timeSel = (cls, v) => { const [h, m] = (v || '08:40').split(':'); return `<select class="sel ${cls}-h" style="min-width:64px">${A().opts(HOURS, h)}</select> 시 <select class="sel ${cls}-m" style="min-width:64px">${A().opts(MINS, m)}</select> 분`; };
  const readTime = (root, cls) => `${root.querySelector('.' + cls + '-h').value}:${root.querySelector('.' + cls + '-m').value}`;
  const selRows = (root, arr) => H.$$('tbody tr[data-id]', root).filter(tr => H.$('.ck', tr).checked).map(tr => arr.find(x => String(x.id) === tr.dataset.id));
  const nextId = arr => arr.reduce((a, x) => Math.max(a, +x.id || 0), 0) + 1;
  const dstr = s => s.replace(/-/g, '.');

  // 기록의 결재상태 (저장/결재중/완결/반려/회수/취소결재중/기결취소/변경)
  function recStatus(rec, arr) {
    if (rec.deleted) return '삭제';
    if (arr && arr.some(x => x.replaces === rec.id && x.docId && Ap.statusOf(x.docId) === '완결')) return '변경';
    return rec.docId ? Ap.statusOf(rec.docId) : (rec.status || '저장');
  }
  const active = st => ['결재중', '완결', '취소결재중'].includes(st);
  function overlaps(arr, fromTs, toTs, skipId) {
    return arr.find(r => r.id !== skipId && active(recStatus(r, arr)) && !(toTs <= r.from || fromTs >= r.to));
  }
  // 수업시간(08:40~15:00, 수업일)과 겹치면 결보강 안내
  function classCheck(fd, ft, td, tt) {
    let hit = false; const d = parseD(fd); const e = parseD(td);
    while (d <= e) { if (d.getDay() % 6 !== 0 && !H.holiday(H.key(d))) { const k = H.key(d); const s = k === fd ? toMin(ft) : 0; const en = k === td ? toMin(tt) : 1440; if (s < toMin('15:00') && en > toMin('08:40')) hit = true; } d.setDate(d.getDate() + 1); }
    if (hit) A().confirmBox('신청한 기간이 수업 시간과 겹칩니다.\n[학급담임]-[교육과정]-[결보강관리]-[결보강처리]에서\n결강·보강을 등록하시겠습니까?', () => A().openLeaf('결보강처리'));
  }
  function infoTable() {
    const u = D().user; const org = D().org;
    return `<table class="form" style="margin-bottom:14px"><colgroup><col style="width:100px"><col><col style="width:110px"><col><col style="width:100px"><col><col style="width:100px"><col></colgroup>
      <tr><th>이름/소속</th><td colspan="3">${H.esc(u.name)}/${H.esc(org.office)} 태백교육지원청 ${H.esc(org.school)}</td><th>직위/호봉</th><td>교사(초등)/15호봉</td><th>재직상태</th><td>재직</td></tr>
      <tr><th>교원구분</th><td>교사(초등학급담임)</td><th>직급</th><td>초등학교교사</td><th>보직구분</th><td>담임</td><th>담당과목</th><td></td></tr>
      <tr><th>최초임용일</th><td>2015-03-01</td><th>현소속교육청<br>임용일</th><td>2024-03-01</td><th>현기관임용일</th><td>2024-03-01</td><th>현직위임용일</th><td></td></tr></table>`;
  }

  /* ================= 복무: 개인근무상황관리 ================= */
  const CATS = {
    '연가': ['연가', '반일연가(오전)', '반일연가(오후)', '조퇴', '외출', '지각'],
    '병가': ['병가', '조퇴', '외출', '지각'],
    '공가': ['공가(건강검진)', '공가(예비군)', '공가(투표)', '공가(기타)'],
    '특별휴가': ['경조사휴가', '자녀돌봄휴가', '육아시간', '모성보호시간', '포상휴가'],
    '교육공무원법제41조연수': ['교육공무원법제41조연수']
  };
  const REASONS = ['개인용무', '가사', '병원진료', '자녀 학교행사 참석', '경조사', '기타'];
  function leaveUsage() {
    const ls = D().leaves.filter(r => r.cat === '연가' && recStatus(r, D().leaves) === '완결');
    const sum = f => ls.filter(f).reduce((a, r) => a + durMin(r.dur), 0);
    const used = sum(() => true);
    return { total: 21 * 480, used, day: sum(r => r.sub === '연가'), half: sum(r => r.sub.startsWith('반일')), late: sum(r => r.sub === '지각'), early: sum(r => r.sub === '조퇴'), out: sum(r => r.sub === '외출') };
  }
  function usageTable() {
    const u = leaveUsage(); const dd = m => (m / 480).toFixed(1);
    return `<div class="sub-tit" style="margin-top:14px">근무상황사용현황<span class="sp"></span><small>재직기간기준일자 : 2026-12-31</small></div>
      <table class="grid" style="border-top:2px solid #172f57"><colgroup><col style="width:150px"></colgroup>
        <tr><th rowspan="4" style="background:#eef0f5">개인연가사용현황<br>(2026)</th><th>가용연가일수</th><th>연가사용일수</th><th>연가잔여일수</th><th>저축연가<br>사용가능일수</th><th>저축연가<br>사용일수</th><th>연가당겨쓰기<br>가능일수</th><th>연가당겨쓰기<br>일수</th></tr>
        <tr><td>${fmtDHM(u.total)}</td><td>${fmtDHM(u.used)}</td><td>${fmtDHM(u.total - u.used)}</td><td>0일</td><td>00일 00시 00분</td><td>10일</td><td>00일 00시 00분</td></tr>
        <tr><th>연가일수</th><th>반일연가일수</th><th>지각</th><th>조퇴</th><th colspan="3">외출</th></tr>
        <tr><td>${dd(u.day)}</td><td>${dd(u.half)}</td><td>${dd(u.late)}</td><td>${dd(u.early)}</td><td colspan="3">${dd(u.out)}</td></tr></table>
      <div class="notice-red" style="font-size:12px;margin-top:6px">※ 조퇴·외출·지각은 8시간을 1일로 환산하여 연가일수에서 차감됩니다. (연수용 가상 수치)</div>`;
  }
  function leaveForm(page, draw, pref, mode) {
    const app = A(); const d = D(); const p = pref || {};
    const [pfd, pft] = (p.from || '2026-10-05 08:40').split(' ');
    const [ptd, ptt] = (p.to || '2026-10-05 16:40').split(' ');
    const m = app.modal({ title: '근무상황신청', width: 1100, body: `
      <div class="app-hd" style="margin-bottom:8px"><h1 class="app-tit">근무상황신청${mode === 'change' ? ' (변경신청)' : ''}</h1></div>
      <div class="notice-red">※ 근무상황은 사전에 신청하여 결재권자의 승인을 받아야 합니다.<br>※ 조퇴·외출·지각은 8시간을 연가 1일로 환산하여 차감됩니다.<br>※ 수업 시간 중 근무상황을 신청하는 경우 [결보강처리]에서 결강·보강을 함께 등록하십시오.<br>※ 연수용 가상 환경으로 실제 결재가 이루어지지 않습니다.</div>
      ${mode === 'change' ? `<div class="info-box warn">변경 대상 : ${H.esc(p.cat)}-${H.esc(p.sub)} ${H.esc(p.from)} ~ ${H.esc(p.to)} (변경신청이 완결되면 기존 근무상황은 '변경' 처리됩니다)</div>` : ''}
      ${usageTable()}
      <div class="sub-tit">근무상황신청입력</div>
      <table class="form"><colgroup><col style="width:130px"><col><col style="width:130px"><col style="width:260px"></colgroup>
        <tr><th class="req">*근무상황</th><td><span class="req-mark"><select class="sel f-cat">${app.opts(Object.keys(CATS), p.cat || '연가')}</select></span> <span class="req-mark"><select class="sel f-sub"></select></span></td><th>연가종류</th><td><select class="sel f-y" style="width:100%">${app.opts(['금년도연가', '저축연가'], p.ykind || '금년도연가')}</select></td></tr>
        <tr class="f-childrow" hidden><th class="req">*대상자녀</th><td colspan="3"><select class="sel f-child" aria-label="대상자녀">${app.opts([['', '선택']].concat((d.children || []).map(c => [c.name, `${c.name} (${c.birth} 생)`])), p.child || '')}</select> <span style="font-size:12px;color:#5d6b82">※ 육아시간은 자녀별로 1일 최대 2시간까지 신청합니다.</span></td></tr>
        <tr><th class="req">*기간</th><td colspan="3">
          <div style="margin-bottom:6px"><input type="date" class="inp f-fd" value="${pfd}"> 일 ${timeSel('f-ft', pft)} 부터</div>
          <div><input type="date" class="inp f-td" value="${ptd}"> 일 ${timeSel('f-tt', ptt)} 까지 &nbsp; <input class="inp f-dd" style="width:50px;text-align:right" readonly> 일 <input class="inp f-dh" style="width:50px;text-align:right" readonly> 시간 <input class="inp f-dm" style="width:50px;text-align:right" readonly> 분</div></td></tr>
        <tr><th>연락처</th><td colspan="3"><input class="inp f-tel" style="width:200px" placeholder="010-0000-0000" value="${H.esc(p.tel || '010-0000-1000')}"></td></tr>
        <tr><th class="req">*사유</th><td colspan="3"><input class="inp f-reason" style="width:340px" value="${H.esc(p.reason || '')}" placeholder="예) 자녀 병원 진료 동행"> <select class="sel f-rc">${app.opts([['', '선택']].concat(REASONS), p.rcode || '')}</select></td></tr>
        <tr><th>목적지</th><td colspan="3"><input class="inp f-place" style="width:340px" value="${H.esc(p.place || '')}" placeholder="(외출·연가 시 선택 입력)"></td></tr>
        <tr><th>비공개여부</th><td colspan="3"><label><input type="checkbox" class="f-h1" ${p.hideTime ? 'checked' : ''}> 기간</label> &nbsp; <label><input type="checkbox" class="f-h2" ${p.hideReason ? 'checked' : ''}> 사유</label><div class="notice-red" style="margin:4px 0 0;font-size:12px">※ 기간, 사유 옆에 체크를 한 경우에는 일일근무상황에 공개되지 않습니다.</div></td></tr></table>`,
      buttons: [{ text: '승인요청', cls: 'primary', onClick: () => { request(); return false; } }, { text: '닫기' }] });
    const q = c => m.pop.querySelector('.' + c);
    const fillSub = () => { q('f-sub').innerHTML = app.opts(CATS[q('f-cat').value], p.sub); q('f-y').disabled = q('f-cat').value !== '연가'; upd(); };
    const upd = () => {
      const sub = q('f-sub').value;
      if (sub === '반일연가(오전)') { q('f-ft-h').value = '08'; q('f-ft-m').value = '40'; q('f-tt-h').value = '12'; q('f-tt-m').value = '40'; q('f-td').value = q('f-fd').value; }
      if (sub === '반일연가(오후)') { q('f-ft-h').value = '12'; q('f-ft-m').value = '40'; q('f-tt-h').value = '16'; q('f-tt-m').value = '40'; q('f-td').value = q('f-fd').value; }
      q('f-childrow').hidden = sub !== '육아시간';
      const du = calcDur(q('f-fd').value, readTime(m.pop, 'f-ft'), q('f-td').value, readTime(m.pop, 'f-tt'));
      q('f-dd').value = du ? du.d : ''; q('f-dh').value = du ? du.h : ''; q('f-dm').value = du ? du.m : '';
    };
    q('f-cat').onchange = () => { p.sub = null; fillSub(); };
    q('f-sub').onchange = upd;
    H.$$('input[type=date], select', m.pop).forEach(x => { if (!x.classList.contains('f-cat') && !x.classList.contains('f-sub')) x.addEventListener('change', upd); });
    fillSub();
    const request = () => {
      const cat = q('f-cat').value, sub = q('f-sub').value;
      const fd = q('f-fd').value, ft = readTime(m.pop, 'f-ft'), td = q('f-td').value, tt = readTime(m.pop, 'f-tt');
      const du = calcDur(fd, ft, td, tt);
      if (!du) { app.alertBox('기간을 올바르게 입력하십시오.\n(종료일시가 시작일시보다 늦어야 하며, 여러 날인 경우 근무일이 포함되어야 합니다)'); return; }
      if (['조퇴', '외출', '지각'].includes(sub) && fd !== td) { app.alertBox(`${sub}는 하루 안에서만 신청할 수 있습니다.`); return; }
      if (['조퇴', '외출', '지각'].includes(sub) && du.d >= 1) { app.alertBox(`${sub} 시간이 8시간 이상입니다. '연가'로 신청하십시오.`); return; }
      if (sub === '육아시간') {
        if (!q('f-child').value) { app.alertBox('육아시간 대상자녀를 선택하십시오.'); return; }
        if (fd !== td) { app.alertBox('육아시간은 하루 안에서만 신청할 수 있습니다.'); return; }
        if (durMin(du) > 120) { app.alertBox('육아시간은 1일 최대 2시간까지 사용할 수 있습니다.'); return; }
      }
      const reason = q('f-reason').value.trim(), rc = q('f-rc').value;
      if (!reason && !rc) { app.alertBox('사유를 입력하거나 선택하십시오.'); return; }
      const from = `${fd} ${ft}`, to = `${td} ${tt}`;
      const dup = overlaps(d.leaves, from, to, mode === 'change' ? p.id : null);
      if (dup) { app.alertBox(`신청 기간이 이미 신청한 근무상황과 겹칩니다.\n(${dup.cat}-${dup.sub} ${dup.from} ~ ${dup.to})`); return; }
      if (cat === '연가' && q('f-y').value === '금년도연가') { const u = leaveUsage(); if (u.used + durMin(du) > u.total) { app.alertBox('연가 잔여일수를 초과합니다.'); return; } }
      const rec = { id: nextId(d.leaves), cat, sub, ykind: cat === '연가' ? q('f-y').value : '', from, to, dur: du, reason: reason || rc, rcode: rc, tel: q('f-tel').value, place: q('f-place').value, child: sub === '육아시간' ? q('f-child').value : '', hideTime: q('f-h1').checked, hideReason: q('f-h2').checked };
      if (mode === 'change') rec.replaces = p.id;
      Ap.submit({ area: '복무', form: '근무상황신청', title: `근무상황신청(${cat}-${sub})${mode === 'change' ? '[변경]' : ''} - ${d.user.name} ${dstr(fd)}`,
        content: [['근무상황', `${cat} / ${sub}`], ['연가종류', rec.ykind || '-'], ['기간', `${from} ~ ${to}`], ['일수/기간', durStr(du)], ['사유', rec.reason], ['목적지', rec.place || '-'], ['연락처', rec.tel || '-']].concat(rec.child ? [['대상자녀', rec.child]] : []).concat(mode === 'change' ? [['변경대상', `${p.from} ~ ${p.to}`]] : []),
        ref: { type: 'leave', id: rec.id },
        onDone: doc => { rec.docId = doc.id; d.leaves.push(rec); m.close(); draw(); },
        after: () => classCheck(fd, ft, td, tt) });
    };
  }
  S['개인근무상황관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('기간', '<input type="date" class="inp s-a" value="2026-08-01"> ~ <input type="date" class="inp s-b" value="2026-12-31">', true)}${app.sf('근무상황', `<select class="sel s-cat">${app.opts([['', '전체']].concat(Object.keys(CATS)))}</select>`)}
        ${app.sf('결재상태', `<select class="sel s-st">${app.opts([['', '전체'], '저장', '결재중', '완결', '반려', '회수', '취소결재중', '기결취소', '변경'])}</select>`)}<label><input type="checkbox" class="s-proxy"> 대리신청 조회</label>${app.searchBtn()}</div>
      ${infoTable()}
      <div class="sub-tit" style="margin-top:0">근무상황목록 <small>Total <b class="cnt" style="color:#3772ff;font-weight:500">0</b></small><span class="sp"></span>
        <button class="btn green b-x">엑셀내려받기</button><button class="btn primary b-copy">복사</button><button class="btn primary b-x">출퇴근관리</button><button class="btn primary b-det">상세조회</button><button class="btn primary b-x">대리신청</button><button class="btn primary b-new">신청</button><button class="btn primary b-chg">변경신청</button>
        <button class="btn dark b-print">출력</button><button class="btn dark b-ret">회수</button><button class="btn dark b-cancel">기결취소</button><button class="btn dark b-del">삭제</button></div>
      <div class="area"></div>`);
    const draw = () => {
      const a = H.$('.s-a', page).value, b = H.$('.s-b', page).value, cat = H.$('.s-cat', page).value, st = H.$('.s-st', page).value;
      const rows = H.$('.s-proxy', page).checked ? [] : d.leaves.filter(r => r.from.slice(0, 10) <= b && r.to.slice(0, 10) >= a && (!cat || r.cat === cat) && (!st || recStatus(r, d.leaves) === st)).sort((x, y) => y.from.localeCompare(x.from));
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '선택', w: 44 }, { t: '신청당시 부서명', w: 120 }, { t: '성명', w: 70 }, { t: '근무상황', w: 110 }, { t: '기간', w: 190 }, { t: '일수/기간', w: 100 }, { t: '사유 또는 용무' }, { t: '목적지', w: 100 }, { t: '연가신청구분', w: 100 }, { t: '신청자', w: 70 }, { t: '결재상태', w: 90 }, { t: '삭제여부', w: 70 }, { t: '첨부파일', w: 70 }],
        rows.map(r => `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${H.esc(d.org.school)}</td><td>${H.esc(d.user.name)}</td><td>${H.esc(r.sub === r.cat ? r.cat : r.cat + '-' + r.sub)}</td><td style="font-size:12px">${H.esc(r.from)} ~<br>${H.esc(r.to)}</td><td>${durShort(r.dur)}</td><td class="l">${H.esc(r.reason)}</td><td>${H.esc(r.place || '')}</td><td>${H.esc(r.ykind || '')}</td><td>${H.esc(d.user.name)}</td><td class="link st">${Ap.badge(recStatus(r, d.leaves))}</td><td>${r.deleted ? '삭제' : '미삭제'}</td><td><button class="btn primary b-att" style="height:24px">등록</button></td></tr>`).join('') || `<tr><td colspan="13" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 420 });
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.leaves.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
      H.$$('.b-att', page).forEach(b => { b.onclick = () => app.alertBox('연수용 환경에서는 첨부파일 등록을 지원하지 않습니다.'); });
    };
    page.__refresh = draw;
    draw();
    const one = () => { const s = selRows(page, d.leaves); if (s.length !== 1) { app.alertBox('근무상황을 1건 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-search', page).onclick = draw;
    H.$('.b-new', page).onclick = () => leaveForm(page, draw, null, 'new');
    H.$('.b-copy', page).onclick = () => { const r = one(); if (r) leaveForm(page, draw, Object.assign({}, r, { id: null }), 'copy'); };
    H.$('.b-chg', page).onclick = () => { const r = one(); if (!r) return; if (recStatus(r, d.leaves) !== '완결') { app.alertBox("결재가 '완결'된 근무상황만 변경신청할 수 있습니다.\n결재중인 문서는 {회수} 후 다시 신청하십시오."); return; } leaveForm(page, draw, r, 'change'); };
    H.$('.b-det', page).onclick = () => { const r = one(); if (!r) return; if (!r.docId) { app.alertBox('상신되지 않은 근무상황입니다.'); return; } Ap.detail(Ap.get(r.docId)); };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (!r) return; if (!r.docId) return; app.confirmBox('선택한 근무상황 신청을 회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-cancel', page).onclick = () => { const r = one(); if (!r) return; if (recStatus(r, d.leaves) !== '완결') { app.alertBox("'완결'된 근무상황만 기결취소할 수 있습니다."); return; } Ap.cancelDoc(Ap.get(r.docId)); };
    H.$('.b-del', page).onclick = () => { const s = selRows(page, d.leaves); if (!s.length) { app.alertBox('삭제할 근무상황을 선택하십시오.'); return; } if (s.some(r => !['저장', '회수', '반려'].includes(recStatus(r, d.leaves)))) { app.alertBox('저장·회수·반려 상태의 근무상황만 삭제할 수 있습니다.'); return; } app.confirmBox(`${s.length}건을 삭제하시겠습니까?`, () => { s.forEach(r => { r.deleted = true; }); Ap.refresh(); }); };
    H.$('.b-print', page).onclick = () => { const rows = d.leaves.filter(r => !r.deleted); app.modal({ title: '근무상황부 출력', width: 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:19px">근 무 상 황 부</h2><p>소속: ${H.esc(d.org.school)} · 성명: ${H.esc(d.user.name)}</p><table><tr><th>근무상황</th><th>기간</th><th>일수/기간</th><th>사유</th><th>결재상태</th></tr>${rows.map(r => `<tr><td>${H.esc(r.cat + '-' + r.sub)}</td><td>${H.esc(r.from)} ~ ${H.esc(r.to)}</td><td>${durShort(r.dur)}</td><td>${H.esc(r.reason)}</td><td>${recStatus(r, d.leaves)}</td></tr>`).join('')}</table></div></div>` }); };
    H.$$('.b-x', page).forEach(b => { b.onclick = () => app.alertBox(`[${b.textContent}] 기능은 연수용 환경에서 제공하지 않습니다.`); });
  };

  /* ================= 복무: 개인출장관리 ================= */
  function tripForm(draw, pref, mode) {
    const app = A(); const d = D(); const p = pref || {};
    const [pfd, pft] = (p.from || '2026-10-07 13:00').split(' ');
    const [ptd, ptt] = (p.to || '2026-10-07 17:00').split(' ');
    const m = app.modal({ title: '출장신청', width: 960, body: `
      <div class="app-hd" style="margin-bottom:8px"><h1 class="app-tit">출장신청${mode === 'change' ? ' (변경신청)' : ''}</h1></div>
      <div class="notice-red">※ 여비가 지급되는 출장은 결재선에 행정실장(협조)이 자동으로 포함됩니다.<br>※ 출장 완료 후 {복명서작성}으로 출장 결과를 보고하십시오.</div>
      <table class="form"><colgroup><col style="width:130px"><col><col style="width:130px"><col></colgroup>
        <tr><th class="req">*출장구분</th><td><select class="sel t-kind">${app.opts(['관내출장(4시간 미만)', '관내출장(4시간 이상)', '관외출장'], p.kind || '관외출장')}</select></td><th class="req">*여비지급</th><td><select class="sel t-pay">${app.opts(['여비지급', '여비부지급'], p.pay || '여비지급')}</select></td></tr>
        <tr><th class="req">*기간</th><td colspan="3"><div style="margin-bottom:6px"><input type="date" class="inp t-fd" value="${pfd}"> 일 ${timeSel('t-ft', pft)} 부터</div><div><input type="date" class="inp t-td" value="${ptd}"> 일 ${timeSel('t-tt', ptt)} 까지</div></td></tr>
        <tr><th class="req">*출장지</th><td><input class="inp t-place" style="width:100%" value="${H.esc(p.place || '')}" placeholder="예) 태백교육지원청"></td><th class="req">*교통수단</th><td><select class="sel t-tr">${app.opts(['대중교통', '자가용', '공용차량', '도보'], p.transport || '대중교통')}</select></td></tr>
        <tr><th class="req">*출장목적</th><td colspan="3"><input class="inp t-purpose" style="width:100%" value="${H.esc(p.purpose || '')}" placeholder="예) 2026 학교생활기록부 담당자 연수 참석"></td></tr>
        <tr><th>동행자</th><td><input class="inp t-comp" style="width:100%" value="${H.esc(p.companion || '')}" placeholder="(선택)"></td><th>연락처</th><td><input class="inp t-tel" value="010-0000-1000"></td></tr></table>`,
      buttons: [{ text: '승인요청', cls: 'primary', onClick: () => { request(); return false; } }, { text: '닫기' }] });
    const q = c => m.pop.querySelector('.' + c);
    const request = () => {
      const fd = q('t-fd').value, ft = readTime(m.pop, 't-ft'), td = q('t-td').value, tt = readTime(m.pop, 't-tt');
      const du = calcDur(fd, ft, td, tt);
      if (!du) { app.alertBox('기간을 올바르게 입력하십시오.'); return; }
      if (!q('t-place').value.trim() || !q('t-purpose').value.trim()) { app.alertBox('출장지와 출장목적을 입력하십시오.'); return; }
      const from = `${fd} ${ft}`, to = `${td} ${tt}`;
      const dup = overlaps(d.bizTrips, from, to, mode === 'change' ? p.id : null) || overlaps(d.leaves, from, to);
      if (dup) { app.alertBox('신청 기간이 이미 신청한 출장 또는 근무상황과 겹칩니다.'); return; }
      const rec = { id: nextId(d.bizTrips), kind: q('t-kind').value, from, to, dur: du, place: q('t-place').value.trim(), purpose: q('t-purpose').value.trim(), transport: q('t-tr').value, pay: q('t-pay').value, companion: q('t-comp').value };
      if (mode === 'change') rec.replaces = p.id;
      Ap.submit({ area: '복무', form: '출장신청', title: `출장신청${mode === 'change' ? '[변경]' : ''} - ${rec.purpose}`,
        content: [['출장구분', rec.kind], ['기간', `${from} ~ ${to}`], ['출장지', rec.place], ['출장목적', rec.purpose], ['교통수단', rec.transport], ['여비', rec.pay], ['동행자', rec.companion || '-']],
        ref: { type: 'trip', id: rec.id }, coop: rec.pay === '여비지급',
        onDone: doc => { rec.docId = doc.id; d.bizTrips.push(rec); m.close(); draw(); },
        after: () => classCheck(fd, ft, td, tt) });
    };
  }
  S['개인출장관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('기간', '<input type="date" class="inp s-a" value="2026-08-01"> ~ <input type="date" class="inp s-b" value="2026-12-31">', true)}${app.sf('결재상태', `<select class="sel s-st">${app.opts([['', '전체'], '결재중', '완결', '반려', '회수', '취소결재중', '기결취소', '변경'])}</select>`)}${app.searchBtn()}</div>
      ${infoTable()}
      <div class="sub-tit" style="margin-top:0">출장목록 <small>Total <b class="cnt" style="color:#3772ff;font-weight:500">0</b></small><span class="sp"></span>
        <button class="btn primary b-det">상세조회</button><button class="btn primary b-new">신청</button><button class="btn primary b-chg">변경신청</button><button class="btn green b-rep">복명서작성</button><button class="btn dark b-ret">회수</button><button class="btn dark b-cancel">기결취소</button><button class="btn dark b-del">삭제</button></div>
      <div class="area"></div>`);
    const draw = () => {
      const a = H.$('.s-a', page).value, b = H.$('.s-b', page).value, st = H.$('.s-st', page).value;
      const rows = d.bizTrips.filter(r => !r.deleted && r.from.slice(0, 10) <= b && r.to.slice(0, 10) >= a && (!st || recStatus(r, d.bizTrips) === st)).sort((x, y) => y.from.localeCompare(x.from));
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '선택', w: 44 }, { t: '출장구분', w: 140 }, { t: '기간', w: 190 }, { t: '출장지', w: 150 }, { t: '출장목적' }, { t: '교통수단', w: 80 }, { t: '여비', w: 80 }, { t: '결재상태', w: 90 }, { t: '복명서', w: 80 }],
        rows.map(r => { const st = recStatus(r, d.bizTrips); return `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${H.esc(r.kind)}</td><td style="font-size:12px">${H.esc(r.from)} ~<br>${H.esc(r.to)}</td><td>${H.esc(r.place)}</td><td class="l">${H.esc(r.purpose)}</td><td>${H.esc(r.transport)}</td><td>${H.esc(r.pay)}</td><td class="link st">${Ap.badge(st)}</td><td>${r.report ? '<span class="badge green">작성</span>' : st === '완결' ? '<span class="badge red">미작성</span>' : '-'}</td></tr>`; }).join('') || `<tr><td colspan="9" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 420 });
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.bizTrips.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
    };
    page.__refresh = draw; draw();
    const one = () => { const s = selRows(page, d.bizTrips); if (s.length !== 1) { app.alertBox('출장을 1건 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-search', page).onclick = draw;
    H.$('.b-new', page).onclick = () => tripForm(draw, null, 'new');
    H.$('.b-chg', page).onclick = () => { const r = one(); if (!r) return; if (recStatus(r, d.bizTrips) !== '완결') { app.alertBox("'완결'된 출장만 변경신청할 수 있습니다."); return; } tripForm(draw, r, 'change'); };
    H.$('.b-det', page).onclick = () => { const r = one(); if (r && r.docId) Ap.detail(Ap.get(r.docId)); };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (r && r.docId) app.confirmBox('선택한 출장 신청을 회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-cancel', page).onclick = () => { const r = one(); if (!r) return; if (recStatus(r, d.bizTrips) !== '완결') { app.alertBox("'완결'된 출장만 기결취소할 수 있습니다."); return; } Ap.cancelDoc(Ap.get(r.docId)); };
    H.$('.b-del', page).onclick = () => { const s = selRows(page, d.bizTrips); if (!s.length) { app.alertBox('삭제할 출장을 선택하십시오.'); return; } if (s.some(r => !['회수', '반려'].includes(recStatus(r, d.bizTrips)))) { app.alertBox('회수·반려 상태의 출장만 삭제할 수 있습니다.'); return; } s.forEach(r => { r.deleted = true; }); Ap.refresh(); };
    H.$('.b-rep', page).onclick = () => {
      const r = one(); if (!r) return;
      if (recStatus(r, d.bizTrips) !== '완결') { app.alertBox("결재가 '완결'된 출장만 복명서를 작성할 수 있습니다."); return; }
      const m = app.modal({ title: '복명서 작성', width: 640, body: `<table class="form"><tr><th>출장기간</th><td>${H.esc(r.from)} ~ ${H.esc(r.to)}</td></tr><tr><th>출장지</th><td>${H.esc(r.place)}</td></tr><tr><th>출장목적</th><td>${H.esc(r.purpose)}</td></tr><tr><th class="req">*출장결과</th><td><textarea class="ta rp" style="min-height:140px" placeholder="예) 연수 주요 내용을 정리하여 동학년 협의회에서 공유함.">${H.esc(r.report || '')}</textarea></td></tr></table>`,
        buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = m.pop.querySelector('.rp').value.trim(); if (!v) { app.alertBox('출장결과를 입력하십시오.'); return false; } r.report = v; Ap.refresh(); app.toast('복명서가 저장되었습니다.'); } }, { text: '닫기' }] });
    };
  };

  /* ================= 복무: 개인초과근무관리 ================= */
  S['개인초과근무관리'] = function (page, title, app) {
    const d = D(); d.overtime = d.overtime || [];
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('근무월', `<select class="sel s-m">${app.opts(['2026-09', '2026-10', '2026-11', '2026-12'].map(v => [v, v.replace('-', '년 ') + '월']), '2026-10')}</select>`, true)}${app.searchBtn()}</div>
      <div class="info-box">초과근무는 <b>사전에 신청</b>하여 결재를 받아야 하며, 실적은 출퇴근 기록(연수용: 신청시간 기준)으로 산정됩니다. 평일 1일 최대 4시간까지 인정됩니다. 결재선에는 행정실장(협조)이 포함됩니다.</div>
      <div class="sub-tit" style="margin-top:0">초과근무목록 <small>Total <b class="cnt" style="color:#3772ff;font-weight:500">0</b></small><span class="sp"></span><button class="btn primary b-det">상세조회</button><button class="btn primary b-new">사전신청</button><button class="btn dark b-ret">회수</button><button class="btn dark b-del">삭제</button></div>
      <div class="area"></div>`);
    const draw = () => {
      const ym = H.$('.s-m', page).value;
      const rows = d.overtime.filter(r => !r.deleted && r.date.startsWith(ym));
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '선택', w: 44 }, { t: '근무일자', w: 110 }, { t: '구분', w: 70 }, { t: '신청시간', w: 140 }, { t: '업무내용' }, { t: '인정시간(실적)', w: 120 }, { t: '결재상태', w: 90 }],
        rows.map(r => { const st = recStatus(r); const mins = Math.min(toMin(r.to) - toMin(r.from), r.kind === '평일' ? 240 : 480); return `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${r.date}</td><td>${r.kind}</td><td>${r.from} ~ ${r.to}</td><td class="l">${H.esc(r.work)}</td><td>${st === '완결' ? `${Math.floor(mins / 60)}시간 ${mins % 60}분` : '-'}</td><td class="link st">${Ap.badge(st)}</td></tr>`; }).join('') || `<tr><td colspan="7" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 420 });
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.overtime.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    const one = () => { const s = selRows(page, d.overtime); if (s.length !== 1) { app.alertBox('1건을 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-det', page).onclick = () => { const r = one(); if (r && r.docId) Ap.detail(Ap.get(r.docId)); };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (r && r.docId) app.confirmBox('회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-del', page).onclick = () => { const s = selRows(page, d.overtime); if (s.some(r => !['회수', '반려'].includes(recStatus(r)))) { app.alertBox('회수·반려 상태만 삭제할 수 있습니다.'); return; } s.forEach(r => { r.deleted = true; }); Ap.refresh(); };
    H.$('.b-new', page).onclick = () => {
      const m = app.modal({ title: '초과근무 사전신청', width: 720, body: `<table class="form"><colgroup><col style="width:130px"><col></colgroup>
        <tr><th class="req">*근무일자</th><td><input type="date" class="inp o-d" value="2026-10-06"> <span class="o-k badge"></span></td></tr>
        <tr><th class="req">*신청시간</th><td>${timeSel('o-f', '16:40')} ~ ${timeSel('o-t', '18:40')}</td></tr>
        <tr><th class="req">*업무내용</th><td><input class="inp o-w" style="width:100%" placeholder="예) 2학기 교과평가 결과 입력 및 학생부 기재"></td></tr></table>`,
        buttons: [{ text: '승인요청', cls: 'primary', onClick: () => {
          const q = c => m.pop.querySelector('.' + c);
          const date = q('o-d').value, f = readTime(m.pop, 'o-f'), t = readTime(m.pop, 'o-t'), w = q('o-w').value.trim();
          const dt = parseD(date); const kind = dt.getDay() % 6 === 0 || H.holiday(date) ? '휴일' : '평일';
          if (toMin(t) <= toMin(f)) { app.alertBox('종료시간이 시작시간보다 늦어야 합니다.'); return false; }
          if (kind === '평일' && toMin(f) < toMin('16:40')) { app.alertBox('평일 초과근무는 정규 근무시간(08:40~16:40) 이후부터 신청할 수 있습니다.'); return false; }
          if (!w) { app.alertBox('업무내용을 입력하십시오.'); return false; }
          const rec = { id: nextId(d.overtime), date, kind, from: f, to: t, work: w };
          if (kind === '평일' && toMin(t) - toMin(f) > 240) app.toast('평일 초과근무는 최대 4시간까지만 인정됩니다.');
          Ap.submit({ area: '복무', form: '초과근무신청', title: `초과근무 사전신청 - ${D().user.name} ${dstr(date)}`, content: [['근무일자', `${date} (${kind})`], ['신청시간', `${f} ~ ${t}`], ['업무내용', w]], ref: { type: 'overtime', id: rec.id }, coop: true,
            onDone: doc => { rec.docId = doc.id; d.overtime.push(rec); H.$('.s-m', page).value = date.slice(0, 7); draw(); } });
        } }, { text: '닫기' }] });
      const upd = () => { const v = m.pop.querySelector('.o-d').value; const k = m.pop.querySelector('.o-k'); if (!v) return; k.textContent = parseD(v).getDay() % 6 === 0 || H.holiday(v) ? '휴일' : '평일'; };
      m.pop.querySelector('.o-d').onchange = upd; upd();
    };
  };

  /* ================= 복무: 조회 화면 ================= */
  S['일일근무상황조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('일자', '<input type="date" class="inp s-d" value="2026-09-30">', true)}${app.sf('부서', `<select class="sel">${app.opts(['전체'])}</select>`)}${app.searchBtn()}</div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">결재 중이거나 완결된 근무상황·출장이 표시됩니다. 신청 시 ‘비공개’를 체크한 항목은 표시되지 않습니다.</div>`);
    const draw = () => {
      const day = H.$('.s-d', page).value; const rows = [];
      d.staffLeaves.filter(x => x.date === day).forEach(x => { const s = Ap.staff(x.name); rows.push([s.dept, s.pos, x.name, x.kind, x.time, x.place, x.open ? x.reason : '(비공개)']); });
      const me = Ap.me();
      d.leaves.filter(r => active(recStatus(r, d.leaves)) && recStatus(r, d.leaves) !== '취소결재중' && r.from.slice(0, 10) <= day && r.to.slice(0, 10) >= day).forEach(r => rows.push([me.dept, me.pos, me.name, `${r.cat}(${r.sub})`, r.hideTime ? '(비공개)' : `${r.from.slice(11)}~${r.to.slice(11)}`, r.place || '', r.hideReason ? '(비공개)' : r.reason]));
      d.bizTrips.filter(r => !r.deleted && active(recStatus(r, d.bizTrips)) && r.from.slice(0, 10) <= day && r.to.slice(0, 10) >= day).forEach(r => rows.push([me.dept, me.pos, me.name, '출장', `${r.from.slice(11)}~${r.to.slice(11)}`, r.place, r.purpose]));
      H.$('.area', page).innerHTML = H.grid([{ t: '순번', w: 50 }, { t: '부서', w: 110 }, { t: '직위', w: 90 }, { t: '성명', w: 80 }, { t: '근무상황', w: 130 }, { t: '시간', w: 120 }, { t: '목적지', w: 140 }, { t: '사유' }], rows.map((r, i) => `<tr><td>${i + 1}</td>${r.map((v, j) => `<td class="${j === 6 ? 'l' : ''}">${H.esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="8" style="height:auto;border:none">${app.nodata('해당 일자의 근무상황이 없습니다.')}</td></tr>`);
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
  };
  S['연가일수관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => {
      const ls = d.leaves.filter(r => r.cat === '연가' && recStatus(r, d.leaves) === '완결');
      H.$('.area', page).innerHTML = `<table class="form"><colgroup><col style="width:160px"><col><col style="width:160px"><col></colgroup><tr><th>재직기간</th><td>11년 7개월 (최초임용 2015-03-01)</td><th>연가일수 산정기준</th><td>재직기간 6년 이상 : 21일 (연수용 예시)</td></tr></table>` + usageTable() + `<div class="sub-tit">연가 사용 내역</div>` + H.grid([{ t: '순번', w: 50 }, { t: '근무상황', w: 140 }, { t: '기간' }, { t: '일수/기간', w: 130 }, { t: '연가종류', w: 110 }], ls.map((r, i) => `<tr><td>${i + 1}</td><td>${H.esc(r.cat + '-' + r.sub)}</td><td>${H.esc(r.from)} ~ ${H.esc(r.to)}</td><td>${durShort(r.dur)}</td><td>${H.esc(r.ykind)}</td></tr>`).join('') || '<tr><td colspan="5">사용 내역이 없습니다.</td></tr>');
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
  };

  /* ================= 담임: 결보강처리 ================= */
  S['결보강처리'] = function (page, title, app) {
    const d = D(); d.subs = d.subs || [];
    const TEACHERS = ['나미리', '변태수', '마이콜', '봉미선', '안한수'];
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.sf('학년', `<select class="sel">${app.opts([['5', '5학년']])}</select>`, true)}${app.sf('기간', '<input type="date" class="inp s-a" value="2026-09-01"> ~ <input type="date" class="inp s-b" value="2026-12-31">', true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn outline b-add">결강등록</button><button class="btn primary b-det">상세조회</button><button class="btn primary b-sub">결재상신</button><button class="btn dark b-ret">회수</button><button class="btn dark b-del">삭제</button></div>
      <div class="area"></div>
      <div class="info-box" style="margin-top:10px">① {결강등록}으로 결강 일자·교시와 보강교사를 지정 → ② 목록에서 선택 후 {결재상신} → ③ 관리자(교감·교장) 승인 순서로 처리합니다. 같은 날짜의 여러 교시를 한 번에 선택하여 상신할 수 있습니다.</div>`);
    const subjAt = (date, p) => { const dt = parseD(date); const dow = dt.getDay(); if (dow % 6 === 0) return ''; const mon = new Date(dt); mon.setDate(dt.getDate() - (dow - 1)); return H.timetable(H.key(mon))[p - 1][dow - 1] || ''; };
    const draw = () => {
      const a = H.$('.s-a', page).value, b = H.$('.s-b', page).value;
      const rows = d.subs.filter(r => !r.deleted && r.date >= a && r.date <= b).sort((x, y) => (x.date + x.period).localeCompare(y.date + y.period));
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '결강일자', w: 110 }, { t: '교시', w: 60 }, { t: '학급', w: 70 }, { t: '과목', w: 80 }, { t: '결강교사', w: 90 }, { t: '결강사유' }, { t: '보강교사', w: 90 }, { t: '보강구분', w: 90 }, { t: '결재상태', w: 90 }],
        rows.map(r => `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${r.date}</td><td>${r.period}</td><td>5-2</td><td>${H.esc(r.subj)}</td><td>${H.esc(D().user.name)}</td><td class="l">${H.esc(r.reason)}</td><td>${H.esc(r.teacher)}</td><td>${H.esc(r.type)}</td><td class="link st">${Ap.badge(recStatus(r))}</td></tr>`).join('') || `<tr><td colspan="10" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`, { h: 460 });
      const all = H.$('.all', page); all.onchange = () => H.$$('.ck', page).forEach(c => { c.checked = all.checked; });
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.subs.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => {
      const related = d.leaves.filter(r => active(recStatus(r, d.leaves))).map(r => [`근무상황:${r.id}`, `${r.cat}-${r.sub} ${r.from}~${r.to.slice(11)}`]).concat(d.bizTrips.filter(r => !r.deleted && active(recStatus(r, d.bizTrips))).map(r => [`출장:${r.id}`, `출장 ${r.from}~${r.to.slice(11)} ${r.place}`]));
      const m = app.modal({ title: '결강등록', width: 760, body: `<table class="form"><colgroup><col style="width:130px"><col></colgroup>
        <tr><th class="req">*결강일자</th><td><input type="date" class="inp s-date" value="2026-10-05"></td></tr>
        <tr><th class="req">*교시</th><td class="pers"></td></tr>
        <tr><th class="req">*결강사유</th><td><select class="sel s-rs">${app.opts(['연가', '병가', '출장', '공가', '연수', '기타'])}</select> <select class="sel s-rel" style="width:380px">${app.opts([['', '관련 근무상황/출장 선택(선택사항)']].concat(related))}</select></td></tr>
        <tr><th class="req">*보강교사</th><td><select class="sel s-t">${app.opts(TEACHERS.map(n => [n, `${n} (${Ap.staff(n).role})`]))}</select></td></tr>
        <tr><th class="req">*보강구분</th><td>${['보결', '시간교체', '자습지도'].map((x, i) => `<label style="margin-right:12px"><input type="radio" name="bt" value="${x}" ${i === 0 ? 'checked' : ''}> ${x}</label>`).join('')}</td></tr></table>`,
        buttons: [{ text: '저장', cls: 'primary', onClick: () => {
          const q = c => m.pop.querySelector('.' + c);
          const date = q('s-date').value; const ps = H.$$('.pk', m.pop).filter(c => c.checked).map(c => +c.value);
          if (!ps.length) { app.alertBox('결강 교시를 선택하십시오.'); return false; }
          if (ps.some(p => d.subs.some(r => !r.deleted && r.date === date && r.period === p && !['회수', '반려'].includes(recStatus(r))))) { app.alertBox('이미 등록된 교시가 있습니다.'); return false; }
          const relTxt = q('s-rel').value ? ` (${q('s-rel').selectedOptions[0].textContent})` : '';
          ps.forEach(p => d.subs.push({ id: nextId(d.subs), date, period: p, subj: subjAt(date, p), reason: q('s-rs').value + relTxt, teacher: q('s-t').value, type: m.pop.querySelector('input[name=bt]:checked').value, status: '저장' }));
          app.Store.save(); draw(); app.toast(`${ps.length}개 교시가 등록되었습니다. {결재상신}으로 승인을 요청하세요.`);
        } }, { text: '닫기' }] });
      const pers = () => { const date = m.pop.querySelector('.s-date').value; const dt = date ? parseD(date) : null; m.pop.querySelector('.pers').innerHTML = !dt || dt.getDay() % 6 === 0 || H.holiday(date) ? '<span style="color:#b8264c">수업일이 아닙니다.</span>' : [1, 2, 3, 4, 5, 6].map(p => { const s = subjAt(date, p); return s ? `<label style="display:inline-block;margin-right:12px"><input type="checkbox" class="pk" value="${p}"> ${p}교시(${H.esc(s)})</label>` : ''; }).join(''); };
      m.pop.querySelector('.s-date').onchange = pers; pers();
    };
    H.$('.b-sub', page).onclick = () => {
      const s = selRows(page, d.subs);
      if (!s.length) { app.alertBox('상신할 결강을 선택하십시오.'); return; }
      if (s.some(r => !['저장', '회수', '반려'].includes(recStatus(r)))) { app.alertBox('이미 상신되었거나 완결된 건이 포함되어 있습니다.'); return; }
      const dates = [...new Set(s.map(r => r.date))];
      Ap.submit({ area: '교육과정', form: '결보강처리', title: `결보강처리 - 5학년 2반 ${dates.map(dstr).join(', ')} (${s.length}시간)`,
        content: s.map(r => [`${dstr(r.date)} ${r.period}교시`, `${r.subj} · 결강사유: ${r.reason} · 보강: ${r.teacher}(${r.type})`]),
        ref: { type: 'subs', ids: s.map(r => r.id) }, onDone: doc => { s.forEach(r => { r.docId = doc.id; }); draw(); } });
    };
    const one = () => { const s = selRows(page, d.subs); if (s.length !== 1) { app.alertBox('1건을 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-det', page).onclick = () => { const r = one(); if (!r) return; if (!r.docId) { app.alertBox('상신되지 않은 건입니다.'); return; } Ap.detail(Ap.get(r.docId)); };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (r && r.docId) app.confirmBox('결보강 결재를 회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-del', page).onclick = () => { const s = selRows(page, d.subs); if (!s.length) { app.alertBox('삭제할 건을 선택하십시오.'); return; } if (s.some(r => !['저장', '회수', '반려'].includes(recStatus(r)))) { app.alertBox('저장·회수·반려 상태만 삭제할 수 있습니다.'); return; } s.forEach(r => { r.deleted = true; }); Ap.refresh(); };
  };

  /* ================= 담임: 교외체험학습·결석신고서 접수 및 결재 ================= */
  function tripStatus(r) { return r.docId ? Ap.statusOf(r.docId) : r.status; }
  function fieldTripDetail(r) {
    const s = H.stu(r.no);
    A().modal({ title: r.form, width: 640, body: `<table class="form"><colgroup><col style="width:130px"><col></colgroup>
      <tr><th>학생</th><td>5학년 2반 ${s.no}번 ${H.esc(s.name)}</td></tr><tr><th>기간</th><td>${r.from} ~ ${r.to} (${workdays(r.from, r.to)}일)</td></tr>
      <tr><th>${r.form === '결석신고서' ? '결석종류' : '학습형태'}</th><td>${H.esc(r.kind)}</td></tr>${r.place ? `<tr><th>장소</th><td>${H.esc(r.place)}</td></tr>` : ''}
      <tr><th>${r.form === '결석신고서' ? '결석사유' : '학습계획'}</th><td>${H.esc(r.plan)}</td></tr><tr><th>신청인(보호자)</th><td>${H.esc(r.guide)}</td></tr><tr><th>신청일</th><td>${r.applied} (나이스 학부모서비스)</td></tr>
      <tr><th>처리상태</th><td>${Ap.badge(tripStatus(r))}${r.rejectReason ? ` 반려사유: ${H.esc(r.rejectReason)}` : ''}</td></tr></table><div class="info-box" style="margin-top:10px;font-size:12px">※ 보호자 이름은 가상의 값이며 일부를 ○로 가렸습니다.</div>` });
  }
  S['교외체험학습관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.sf('신청서', `<select class="sel s-f">${app.opts([['', '전체'], '교외체험학습 신청서', '결석신고서'])}</select>`)}${app.searchBtn()}</div>
      <div class="flow"><div class="step"><span class="no">1</span>학부모 신청(학부모서비스)</div><div class="step"><span class="no">2</span>담임 접수</div><div class="step"><span class="no">3</span>결재상신</div><div class="step"><span class="no">4</span>승인(완결) → 출결 반영</div></div>
      <div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn primary b-det">상세조회</button><button class="btn primary b-rcv">접수</button><button class="btn primary b-sub">결재상신</button><button class="btn red b-rej">반려(학부모)</button><button class="btn green b-att">출결반영</button><button class="btn dark b-ret">회수</button></div>
      <div class="area"></div>`);
    const draw = () => {
      const f = H.$('.s-f', page).value;
      const rows = d.fieldTrips.filter(r => !f || r.form === f);
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '번호', w: 50 }, { t: '학생', w: 80 }, { t: '신청서', w: 150 }, { t: '기간', w: 190 }, { t: '일수', w: 50 }, { t: '유형', w: 110 }, { t: '장소 / 사유' }, { t: '신청일', w: 100 }, { t: '처리상태', w: 90 }, { t: '출결', w: 70 }],
        rows.map(r => { const s = H.stu(r.no); return `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td class="link nm">${H.esc(s.name)}</td><td>${H.esc(r.form)}</td><td>${r.from} ~ ${r.to}</td><td>${workdays(r.from, r.to)}</td><td>${H.esc(r.kind)}</td><td class="l">${H.esc(r.place || r.plan)}</td><td>${r.applied}</td><td class="link st">${Ap.badge(tripStatus(r))}</td><td>${r.attDone ? '<span class="badge green">반영</span>' : ''}</td></tr>`; }).join(''));
      H.$$('td.nm', page).forEach(td => { td.onclick = () => fieldTripDetail(d.fieldTrips.find(x => String(x.id) === td.parentElement.dataset.id)); });
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.fieldTrips.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; });
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    const one = () => { const s = selRows(page, d.fieldTrips); if (s.length !== 1) { app.alertBox('신청서를 1건 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-det', page).onclick = () => { const r = one(); if (r) fieldTripDetail(r); };
    H.$('.b-rcv', page).onclick = () => { const r = one(); if (!r) return; if (tripStatus(r) !== '신청') { app.alertBox("'신청' 상태의 신청서만 접수할 수 있습니다."); return; } r.status = '접수'; Ap.refresh(); app.toast('접수되었습니다. {결재상신}으로 승인을 요청하세요.'); };
    H.$('.b-rej', page).onclick = () => {
      const r = one(); if (!r) return;
      if (!['신청', '접수'].includes(tripStatus(r))) { app.alertBox("'신청' 또는 '접수' 상태만 반려할 수 있습니다."); return; }
      const m = app.modal({ title: '신청서 반려', width: 460, body: '<input class="inp v" style="width:100%" placeholder="예) 체험학습 계획을 구체적으로 작성해 주세요.">', buttons: [{ text: '반려', cls: 'red', onClick: () => { const v = m.pop.querySelector('.v').value.trim(); if (!v) { app.alertBox('반려 사유를 입력하십시오.'); return false; } r.status = '반려'; r.rejectReason = v; Ap.refresh(); } }, { text: '닫기' }] });
    };
    H.$('.b-sub', page).onclick = () => {
      const r = one(); if (!r) return;
      const st = tripStatus(r);
      if (st === '신청') { app.alertBox('먼저 {접수} 처리하십시오.'); return; }
      if (!['접수', '회수', '반려'].includes(st) || (st === '반려' && !r.docId)) { app.alertBox('접수된 신청서만 결재상신할 수 있습니다.'); return; }
      const s = H.stu(r.no);
      const isTrip = r.form !== '결석신고서';
      Ap.submit({ area: '학적', form: isTrip ? '교외체험학습 승인' : '결석신고서 확인', title: `${isTrip ? '교외체험학습 승인' : '결석신고서 확인'} - 5학년 2반 ${s.name}(${dstr(r.from).slice(5)}~${dstr(r.to).slice(5)})`,
        content: [['학생', `5학년 2반 ${s.no}번 ${s.name}`], ['기간', `${r.from} ~ ${r.to} (${workdays(r.from, r.to)}일)`], [isTrip ? '학습형태' : '결석종류', r.kind], [isTrip ? '학습계획' : '결석사유', r.plan]].concat(r.place ? [['장소', r.place]] : []),
        ref: { type: 'fieldTrip', id: r.id }, onDone: doc => { r.docId = doc.id; draw(); } });
    };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (r && r.docId) app.confirmBox('회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-att', page).onclick = () => {
      const r = one(); if (!r) return;
      if (tripStatus(r) !== '완결') { app.alertBox("결재가 '완결'된 신청서만 출결에 반영할 수 있습니다."); return; }
      const code = r.form === '결석신고서' ? (r.kind || '질병결석') : '출석인정결석';
      const reason = r.form === '결석신고서' ? r.plan : `교외체험학습(${r.kind})`;
      const dd = parseD(r.from); const e = parseD(r.to); let n = 0, closed = [];
      while (dd <= e) { const k = H.key(dd); if (dd.getDay() % 6 !== 0 && !H.holiday(k)) { const ym = k.slice(0, 7); if (H.attClosed(ym)) closed.push(ym); else { H.attMonth(ym)[`${r.no}-${dd.getDate()}`] = { code, reason }; n++; } } dd.setDate(dd.getDate() + 1); }
      if (closed.length) { app.alertBox(`${[...new Set(closed)].join(', ')} 출결이 마감되어 반영할 수 없습니다.\n[출결관리]에서 마감취소 후 다시 시도하십시오.`); return; }
      r.attDone = true; Ap.refresh();
      app.alertBox(`[출결관리]에 ${n}일이 '${code}'(으)로 반영되었습니다.\n사유: ${reason}`);
    };
  };

  /* ================= 담임: 출결현황및통계 (월말출결통계 결재상신) ================= */
  const baseAttStats = S['출결현황및통계'];
  S['출결현황및통계'] = function (page, title, app) {
    baseAttStats(page, title, app);
    const d = D(); d.attReports = d.attReports || {};
    page.insertAdjacentHTML('beforeend', `<div class="sub-tit">월말출결통계 결재상신<span class="sp"></span><select class="sel s-rm">${app.opts(['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].map(v => [v, (+v.slice(5)) + '월']), '2026-09')}</select><button class="btn primary b-rsub">월말출결통계 결재상신</button></div><div class="rarea"></div>`);
    const draw = () => {
      const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
      H.$('.rarea', page).innerHTML = H.grid([{ t: '월', w: 80 }, { t: '출결마감', w: 100 }, { t: '결석(연)', w: 90 }, { t: '지각', w: 80 }, { t: '조퇴', w: 80 }, { t: '결과', w: 80 }, { t: '결재상태', w: 110 }, { t: '비고' }], months.map(ym => { const c = stat(ym); const r = d.attReports[ym]; return `<tr data-ym="${ym}"><td>${+ym.slice(5)}월</td><td>${H.attClosed(ym) ? '<span class="badge red">마감</span>' : '<span class="badge">미마감</span>'}</td><td>${c.결석}</td><td>${c.지각}</td><td>${c.조퇴}</td><td>${c.결과}</td><td class="link st">${r ? Ap.badge(Ap.statusOf(r)) : '-'}</td><td class="l" style="font-size:12px">${H.attClosed(ym) ? '' : '출결 마감 후 상신할 수 있습니다.'}</td></tr>`; }).join(''));
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const r = d.attReports[td.parentElement.dataset.ym]; if (r) Ap.detail(Ap.get(r)); }; });
    };
    const stat = ym => { const c = { 결석: 0, 지각: 0, 조퇴: 0, 결과: 0 }; Object.values((d.attendance || {})[ym] || {}).forEach(r => { c[r.code.slice(-2)]++; }); return c; };
    page.__refresh = draw; draw();
    H.$('.b-rsub', page).onclick = () => {
      const ym = H.$('.s-rm', page).value;
      if (!H.attClosed(ym)) { app.alertBox(`${+ym.slice(5)}월 출결이 마감되지 않았습니다.\n[출결관리]에서 {마감} 후 상신하십시오.`); return; }
      const cur = d.attReports[ym]; if (cur && ['결재중', '완결', '취소결재중'].includes(Ap.statusOf(cur))) { app.alertBox('이미 상신된 월입니다.'); return; }
      const c = stat(ym);
      Ap.submit({ area: '학적', form: '월말출결통계', title: `${ym.slice(0, 4)}년 ${+ym.slice(5)}월 5학년 2반 월말 출결통계`, content: [['학급', `5학년 2반 (재적 ${D().students.length}명)`], ['대상월', `${ym.slice(0, 4)}년 ${+ym.slice(5)}월`], ['결석(연인원)', `${c.결석}명`], ['지각', `${c.지각}명`], ['조퇴', `${c.조퇴}명`], ['결과', `${c.결과}명`]], ref: { type: 'attReport', ym }, onDone: doc => { d.attReports[ym] = doc.id; draw(); } });
    };
  };

  /* ================= 담임: 정정대장작성 (결재상신) ================= */
  S['정정대장작성'] = function (page, title, app) {
    const d = D(); d.corrections = d.corrections || [];
    d.corrections.forEach((c, i) => { if (!c.id) c.id = i + 1; });
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn outline b-add">정정대장 작성</button><button class="btn primary b-det">상세조회</button><button class="btn primary b-sub">결재상신</button><button class="btn dark b-ret">회수</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">학년도가 지난 학생부 자료는 정정대장을 작성하고 <b>학교장 결재</b>를 받아 정정합니다. 작성 → 결재상신 → 완결 순서로 진행하세요.</div>`);
    const draw = () => {
      const rows = d.corrections.filter(c => !c.deleted);
      H.$('.cnt', page).textContent = rows.length;
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '순번', w: 50 }, { t: '학생', w: 90 }, { t: '정정항목', w: 150 }, { t: '정정 전' }, { t: '정정 후' }, { t: '정정사유', w: 160 }, { t: '작성일', w: 100 }, { t: '결재상태', w: 90 }], rows.map((c, i) => `<tr data-id="${c.id}"><td><input type="checkbox" class="ck"></td><td>${i + 1}</td><td>${H.esc(H.stu(c.no).name)}</td><td>${H.esc(c.item)}</td><td class="l">${H.esc(c.before)}</td><td class="l">${H.esc(c.after)}</td><td class="l">${H.esc(c.reason)}</td><td>${c.date}</td><td class="link st">${Ap.badge(recStatus(c))}</td></tr>`).join('') || '<tr><td colspan="9">작성된 정정대장이 없습니다.</td></tr>');
      H.$$('td.st', page).forEach(td => { td.onclick = () => { const c = d.corrections.find(x => String(x.id) === td.parentElement.dataset.id); if (c.docId) Ap.detail(Ap.get(c.docId)); }; });
    };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { const m = app.modal({ title: '정정대장 작성', width: 640, body: `<table class="form"><tr><th class="req">*학생</th><td><select class="sel c1">${app.opts(d.students.map(s => [s.no, `${s.no} ${s.name}`]))}</select></td></tr><tr><th class="req">*정정항목</th><td><select class="sel c2">${app.opts(['출결상황', '창의적체험활동상황', '교과학습발달상황', '행동특성및종합의견', '인적·학적사항'])}</select></td></tr><tr><th>정정 전</th><td><textarea class="ta c3"></textarea></td></tr><tr><th class="req">*정정 후</th><td><textarea class="ta c4"></textarea></td></tr><tr><th class="req">*정정사유</th><td><input class="inp c5" style="width:100%" placeholder="예) 입력 오류로 인한 정정"></td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = k => m.pop.querySelector('.' + k).value.trim(); if (!v('c4') || !v('c5')) { app.alertBox('필수 항목을 입력하십시오.'); return false; } d.corrections.push({ id: nextId(d.corrections), no: +v('c1'), item: v('c2'), before: v('c3'), after: v('c4'), reason: v('c5'), date: H.dateStr(app.today()), status: '저장' }); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
    const one = () => { const s = selRows(page, d.corrections); if (s.length !== 1) { app.alertBox('정정대장을 1건 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-sub', page).onclick = () => {
      const c = one(); if (!c) return;
      if (!['저장', '회수', '반려'].includes(recStatus(c))) { app.alertBox('이미 상신되었거나 완결된 정정대장입니다.'); return; }
      const s = H.stu(c.no);
      Ap.submit({ area: '학생부', form: '학생부 정정대장', title: `학교생활기록부 정정대장 - 5학년 2반 ${s.name}(${c.item})`, content: [['학생', `5학년 2반 ${s.no}번 ${s.name}`], ['정정항목', c.item], ['정정 전', c.before || '-'], ['정정 후', c.after], ['정정사유', c.reason]], ref: { type: 'correction', id: c.id }, onDone: doc => { c.docId = doc.id; draw(); } });
    };
    H.$('.b-det', page).onclick = () => { const c = one(); if (!c) return; if (!c.docId) { app.alertBox('상신되지 않은 정정대장입니다.'); return; } Ap.detail(Ap.get(c.docId)); };
    H.$('.b-ret', page).onclick = () => { const c = one(); if (c && c.docId) app.confirmBox('회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(c.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-del', page).onclick = () => { const s = selRows(page, d.corrections); if (s.some(c => !['저장', '회수', '반려'].includes(recStatus(c)))) { app.alertBox('저장·회수·반려 상태만 삭제할 수 있습니다.'); return; } s.forEach(c => { c.deleted = true; }); Ap.refresh(); };
  };
})();
