/* 업무 화면 (5) — 성적(학교자율시간), 학생부(정정공개), 개별화교육, 보건, 설문·검사, PAPS, 생활부장 업무, 복무(기타) */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const X = window.SH4;
  const Ap = window.Approval;
  const esc = s => H.esc(s);
  const { st, nextId, sel, nodataRow, flow, bindFlow, tabsHtml, bindTabs, ckAll, printDoc } = X;
  const stuOpts = (app, v) => app.opts(D().students.map(s => [s.no, `${s.no} ${s.name}`]), v);

  /* =============== 성적: 학교자율시간 =============== */
  const AUTO = '미동 마을 탐구(활동)';
  function transfers() {
    const d = D();
    if (!d.transfers) d.transfers = [{ no: 7, date: '2026-09-01', from: '눈마을초등학교', prev: { eval: [['[눈마을-자율01] 우리 마을 생태 지도 만들기', '잘함', '마을의 생태 자원을 조사하여 지도로 표현함.']], sem: '마을 생태 조사 활동에 적극 참여하며 친구들과 협력함.', dev: '우리 마을의 자연환경을 조사하고 생태 지도를 완성하여 발표함.', obs: [['2026.06.12', '관찰 결과를 그림과 글로 꼼꼼하게 기록함.']] }, taken: {} }];
    return d.transfers;
  }
  S['학교자율시간관리(전입생용)'] = function (page, title, app) {
    const d = D(); const tr = transfers(); d.autoRec = d.autoRec || {};
    const tabs = ['교과평가', '학기말종합의견', '교과학습발달상황', '관찰내용관리'];
    page.insertAdjacentHTML('beforeend', `${tabsHtml(tabs)}<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><div class="split"><div class="left" style="width:260px"><div class="lst"></div></div><div class="right"><div class="det">${app.nodata('전입생을 선택하십시오.')}</div></div></div>`);
    let tab = 0, cur = null;
    const drawList = () => { H.$('.lst', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명' }, { t: '전입일', w: 100 }], tr.map(t => `<tr data-no="${t.no}" class="${cur === t.no ? 'sel' : ''}" style="cursor:pointer"><td>${t.no}</td><td class="link">${esc(H.stu(t.no).name)}</td><td>${t.date}</td></tr>`).join('') || nodataRow(3, '전입생이 없습니다.')); H.$$('tr[data-no]', page).forEach(r => { r.onclick = () => { cur = +r.dataset.no; drawList(); det(); }; }); };
    const det = () => {
      const box = H.$('.det', page); const t = tr.find(x => x.no === cur); if (!t) return;
      const key = ['eval', 'sem', 'dev', 'obs'][tab]; const mine = (d.autoRec[cur] || {})[key];
      const val = mine != null ? mine : '';
      const readonly = tab === 0;
      box.innerHTML = `<div class="sub-tit" style="margin-top:0">${esc(H.stu(cur).name)} · ${AUTO} <small>전입 ${t.date} (${esc(t.from)})</small><span class="sp"></span><button class="btn outline b-prev">이전학교성적</button>${readonly ? '' : '<button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button>'}<button class="btn b-print">${app.I.print}출력</button></div>` +
        (tab === 0 ? H.grid([{ t: '평가영역/성취기준' }, { t: '단계', w: 90 }, { t: '평가결과' }], t.prev.eval.map(r => `<tr><td class="l">${esc(r[0])} <span class="badge">이전학교</span></td><td>${r[1]}</td><td class="l">${esc(r[2])}</td></tr>`).join('')) + '<div class="info-box" style="margin-top:8px;font-size:12px">교과평가는 이전 학교 결과를 가져올 수 없고 조회만 가능합니다.</div>'
          : tab === 3 ? `${H.grid([{ t: '일자', w: 110 }, { t: '관찰내용' }], (Array.isArray(val) ? val : []).map(r => `<tr><td>${r[0]}</td><td class="l">${esc(r[1])}</td></tr>`).join('') || nodataRow(2, '가져온 관찰내용이 없습니다. {이전학교성적}에서 가져오십시오.'))}`
            : `<textarea class="ta v" data-bytes style="min-height:160px">${esc(val)}</textarea>${H.bytesHtml(val, 1500)}`);
      H.bindBytes(box, 1500);
      H.$('.b-prev', box).onclick = () => { const src = t.prev[key]; const m = app.modal({ title: `이전 학교 성적자료 - ${t.from}`, width: 620, body: tab === 0 || tab === 3 ? H.grid([{ t: '', w: 40 }, { t: '내용' }], (tab === 0 ? src.map(r => `${r[0]} : ${r[1]}`) : src.map(r => `${r[0]} ${r[1]}`)).map((x, i) => `<tr><td><input type="checkbox" class="k" value="${i}" ${tab === 0 ? 'disabled' : ''}></td><td class="l">${esc(x)}</td></tr>`).join('')) : `<label><input type="checkbox" class="k" value="0"> ${esc(src)}</label>`, buttons: tab === 0 ? [{ text: '닫기' }] : [{ text: '가져오기', cls: 'primary', onClick: () => { const ks = H.$$('.k', m.pop).filter(c => c.checked); if (!ks.length) { app.alertBox('반영할 성적자료를 선택하십시오.'); return false; } d.autoRec[cur] = d.autoRec[cur] || {}; d.autoRec[cur][key] = tab === 3 ? ks.map(c => src[+c.value]) : src; app.Store.save(); det(); app.toast('이전 학교 성적자료를 반영했습니다. 수정 후 {저장}하십시오.'); } }, { text: '닫기' }] }); };
      const sv = H.$('.b-save', box); if (sv) sv.onclick = () => { const v = H.$('.v', box); d.autoRec[cur] = d.autoRec[cur] || {}; if (v) d.autoRec[cur][key] = v.value; H.save(); };
      const dl = H.$('.b-del', box); if (dl) dl.onclick = () => { if (d.autoRec[cur]) delete d.autoRec[cur][key]; app.Store.save(); det(); };
      H.$('.b-print', box).onclick = () => window.print();
    };
    H.$('.b-search', page).onclick = drawList;
    bindTabs(page, [0, 1, 2, 3].map(i => () => { tab = i; drawList(); det(); }));
  };
  S['학교자율시간반별조회'] = function (page, title, app) {
    const d = D(); transfers();
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['교과평가', '학기말종합의견', '교과학습발달상황', '관찰내용관리'])}<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('학생구분', `<select class="sel s-k">${app.opts(['전체', '전편입'])}</select>`)}${app.searchBtn()}</div><div class="area"></div>`);
    let tab = 0;
    const draw = () => {
      const only = H.$('.s-k', page).value === '전편입'; const tr = d.transfers.map(t => t.no);
      const rows = d.students.filter(s => !only || tr.includes(s.no));
      const key = ['eval', 'sem', 'dev', 'obs'][tab];
      H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 90 }, { t: '구분', w: 80 }, { t: `${AUTO} ${['교과평가', '학기말종합의견', '교과학습발달상황', '관찰내용'][tab]}` }], rows.map(s => { const r = ((d.autoRec || {})[s.no] || {})[key]; const isT = tr.includes(s.no); let v = ''; if (tab === 0) v = isT ? '(이전학교) 잘함' : (((d.autoEval || {})[s.no]) || ''); else v = Array.isArray(r) ? r.map(x => x.join(' ')).join(' / ') : (r || ''); return `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${isT ? '<span class="badge blue">전입</span>' : '재학'}</td><td class="l">${esc(v)}</td></tr>`; }).join(''), { h: 560 });
    };
    H.$('.b-search', page).onclick = draw;
    bindTabs(page, [0, 1, 2, 3].map(i => () => { tab = i; draw(); }));
  };

  /* =============== 학생부: 정정대장공개여부관리 =============== */
  S['정정대장공개여부관리'] = function (page, title, app) {
    const d = D(); d.corrections = d.corrections || [];
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.sf('항목', `<select class="sel s-it">${app.opts([['', '전체'], '인적·학적사항', '출결상황', '행동특성및종합의견'])}</select>`)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">결재가 <b>완결</b>된 정정대장 중 인적사항·누가주소·학적사항·출결상황·행동특성및종합의견·학교폭력조치상황관리 항목의 공개여부를 관리합니다. 밑줄이 있는 항목을 클릭하면 정정 세부 내역을 볼 수 있습니다.</div>`);
    const OPEN = ['인적·학적사항', '출결상황', '행동특성및종합의견'];
    const draw = () => { const it = H.$('.s-it', page).value; const rows = d.corrections.filter(c => !c.deleted && OPEN.includes(c.item) && (!it || c.item === it) && st(c) === '완결'); H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 90 }, { t: '항목', w: 170 }, { t: '정정일', w: 110 }, { t: '공개여부', w: 110 }, { t: '변경사유' }], rows.map(c => `<tr data-id="${c.id}"><td>${c.no}</td><td>${esc(H.stu(c.no).name)}</td><td class="link it">${esc(c.item)}</td><td>${c.date}</td><td><select class="sel op">${app.opts(['공개', '비공개'], c.open || '공개')}</select></td><td><input class="inp rs" value="${esc(c.openReason || '')}"></td></tr>`).join('') || nodataRow(6, '공개여부를 관리할 정정대장이 없습니다. (정정대장작성 → 결재 완결 후 표시)')); H.$$('.it', page).forEach(td => { td.onclick = () => { const c = d.corrections.find(x => String(x.id) === td.parentElement.dataset.id); app.modal({ title: '정정대장 작성내역 확인', width: 560, body: `<table class="form"><tr><th>항목</th><td>${esc(c.item)}</td></tr><tr><th>정정 전</th><td>${esc(c.before)}</td></tr><tr><th>정정 후</th><td>${esc(c.after)}</td></tr><tr><th>정정사유</th><td>${esc(c.reason)}</td></tr></table>` }); }; }); };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { const trs = H.$$('tbody tr[data-id]', page); for (const tr of trs) { const c = d.corrections.find(x => String(x.id) === tr.dataset.id); const op = H.$('.op', tr).value, rs = H.$('.rs', tr).value.trim(); if (op !== (c.open || '공개') && !rs) { app.alertBox('공개여부를 변경한 경우 변경사유를 입력하십시오.'); return; } c.open = op; c.openReason = rs; } H.save(); };
  };

  /* =============== 개별화교육계획 (예시 데이터 없음) =============== */
  S['개별화교육계획관리'] = function (page, title, app) {
    const d = D(); d.iep = d.iep || [];
    page.insertAdjacentHTML('beforeend', `<div class="info-box warn">개별화교육계획은 특수교육대상자의 민감한 정보이므로 예시 데이터를 넣지 않았습니다. 연수 시 가상의 대상자를 등록해 절차를 실습하세요.</div><div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">대상학생 등록</button></div><div class="split"><div class="left" style="width:240px"><div class="lst"></div></div><div class="right"><div class="det">${app.nodata('대상학생을 선택하십시오.')}</div></div></div>`);
    let cur = null;
    const draw = () => { H.$('.lst', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명' }], d.iep.map(x => `<tr data-no="${x.no}" class="${cur === x.no ? 'sel' : ''}" style="cursor:pointer"><td>${x.no}</td><td class="link">${esc(H.stu(x.no).name)}</td></tr>`).join('') || nodataRow(2, '대상학생이 없습니다.')); H.$$('tr[data-no]', page).forEach(r => { r.onclick = () => { cur = +r.dataset.no; draw(); det(); }; }); };
    const F = [['level', '현재 수행수준'], ['goal', '교육목표'], ['content', '교육내용'], ['method', '교육방법'], ['eval', '평가계획']];
    const det = () => { const x = d.iep.find(y => y.no === cur); if (!x) return; H.$('.det', page).innerHTML = `<div class="sub-tit" style="margin-top:0">${esc(H.stu(cur).name)} 2학기 개별화교육계획<span class="sp"></span><button class="btn primary b-save">저장</button></div><table class="form">${F.map(([k, l]) => `<tr><th>${l}</th><td><textarea class="ta f" data-k="${k}">${esc(x[k] || '')}</textarea></td></tr>`).join('')}</table>`; H.$('.b-save', page).onclick = () => { H.$$('.f', page).forEach(t => { x[t.dataset.k] = t.value; }); H.save(); }; };
    H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { const m = app.modal({ title: '대상학생 등록', width: 420, body: `<select class="sel v" style="width:100%">${stuOpts(app)}</select>`, buttons: [{ text: '등록', cls: 'primary', onClick: () => { const no = +H.$('.v', m.pop).value; if (!d.iep.some(x => x.no === no)) d.iep.push({ no }); app.Store.save(); cur = no; draw(); det(); } }, { text: '닫기' }] }); };
    draw();
  };
  S['개별화교육조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = H.grid([{ t: '성명', w: 90 }, { t: '교육목표' }, { t: '평가계획' }], (d.iep || []).map(x => `<tr><td>${esc(H.stu(x.no).name)}</td><td class="l">${esc(x.goal || '')}</td><td class="l">${esc(x.eval || '')}</td></tr>`).join('') || nodataRow(3, '개별화교육계획 대상학생이 없습니다.')); };
  };

  /* =============== 보건 =============== */
  const VAC_PRE = ['디프테리아·파상풍·백일해', '홍역·유행성이하선염·풍진', '폴리오', '결핵(BCG)', '일본뇌염', '수두', 'B형 간염'];
  const VAC_POST = ['인플루엔자', '일본뇌염(추가)', 'Tdap', '사람유두종바이러스(1차)'];
  function health() {
    const d = D(); d.health = d.health || {};
    if (!d.hx) {
      d.hx = { vacPre: {}, vacPost: {}, ability: {}, checkup: {}, extra: {}, corr: [], link: [], closed: false };
      d.students.forEach(s => { d.hx.vacPre[s.no] = Object.fromEntries(VAC_PRE.map(v => [v, '완료'])); });
      d.hx.vacPre[6]['수두'] = '미접종';
    }
    return d.hx;
  }
  S['연계대상학생관리'] = function (page, title, app) {
    const d = D(); const hx = health();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-gen">연계요청학생생성</button><button class="btn primary b-req">승인요청</button><button class="btn primary b-bulk">일괄승인요청(학년별)</button><button class="btn green b-send">연계요청</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">① 연계요청학생생성 → ② 승인요청(결재) → ③ 결재 완결 학생 선택 후 {연계요청}으로 질병관리청(가상)에 전송 → ④ [예방접종수신관리]에서 수신 내역 확인·반영</div>`);
    const stt = r => r.sent ? '요청완료' : r.docId ? Ap.statusOf(r.docId) : '생성';
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 90 }, { t: '생년월일', w: 110 }, { t: '결재상태', w: 100 }, { t: '송신상태', w: 100 }], hx.link.map(r => { const s = H.stu(r.no); return `<tr data-id="${r.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td>${s.birth}</td><td>${Ap.badge(r.docId ? Ap.statusOf(r.docId) : '저장')}</td><td>${r.sent ? '<span class="badge green">요청완료</span>' : '-'}</td></tr>`; }).join('') || nodataRow(6, '연계요청학생을 생성하십시오.'), { h: 480 }); ckAll(page); };
    page.__refresh = draw; draw();
    const picked = () => H.$$('tbody tr[data-id]', page).filter(tr => H.$('.ck', tr).checked).map(tr => hx.link.find(r => String(r.no) === tr.dataset.id));
    H.$('.b-search', page).onclick = draw;
    H.$('.b-gen', page).onclick = () => { d.students.forEach(s => { if (!hx.link.some(r => r.no === s.no)) hx.link.push({ no: s.no }); }); app.Store.save(); draw(); app.toast(`${d.students.length}명의 연계요청학생이 생성되었습니다.`); };
    const req = rs => { rs = rs.filter(r => !r.docId || ['회수', '반려'].includes(Ap.statusOf(r.docId))); if (!rs.length) { app.alertBox('승인요청할 학생을 선택하십시오.'); return; } Ap.submit({ area: '학생생활', form: '예방접종 연계요청', title: `예방접종 정보 연계요청 - 5학년 2반 ${rs.length}명`, content: [['대상', rs.map(r => H.stu(r.no).name).join(', ')], ['연계기관', '질병관리청(가상)']], ref: { type: 'vacLink' }, onDone: doc => { rs.forEach(r => { r.docId = doc.id; }); draw(); } }); };
    H.$('.b-req', page).onclick = () => req(picked());
    H.$('.b-bulk', page).onclick = () => req(hx.link.slice());
    H.$('.b-send', page).onclick = () => { const rs = picked(); if (!rs.length) { app.alertBox('학생을 선택하십시오.'); return; } if (rs.some(r => !r.docId || Ap.statusOf(r.docId) !== '완결')) { app.alertBox('결재가 완결된 학생만 연계요청할 수 있습니다.'); return; } rs.forEach(r => { r.sent = Ap.now(); }); app.Store.save(); draw(); app.alertBox(`${rs.length}명의 연계요청을 질병관리청(가상)으로 전송했습니다.\n[예방접종수신관리]에서 수신 결과를 확인하십시오.`); };
  };
  S['예방접종수신관리'] = function (page, title, app) {
    const hx = health();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn green b-xl">엑셀다운로드</button><button class="btn outline b-inc">미완료예방접종현황 조회</button><button class="btn primary b-apply">건강기록부반영</button></div><div class="split"><div class="left" style="width:320px"><div class="lst"></div></div><div class="right"><div class="det">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    const recv = no => VAC_PRE.map(v => [v, no === 6 && v === '수두' ? '미완료' : '완료']).concat([['인플루엔자', no % 3 ? '2025-10-15' : '미접종']]);
    const draw = () => { const rs = hx.link.filter(r => r.sent); H.$('.lst', page).innerHTML = H.grid([{ t: '', w: 36 }, { t: '번호', w: 50 }, { t: '성명' }, { t: '반영', w: 60 }], rs.map(r => `<tr data-no="${r.no}" style="cursor:pointer"><td><input type="checkbox" class="ck"></td><td>${r.no}</td><td class="link">${esc(H.stu(r.no).name)}</td><td>${r.applied ? 'Y' : 'N'}</td></tr>`).join('') || nodataRow(4, '수신된 자료가 없습니다. [연계대상학생관리]에서 연계요청하십시오.'), { h: 480 }); H.$$('td.link', page).forEach(td => { td.onclick = () => { const no = +td.parentElement.dataset.no; H.$('.det', page).innerHTML = `<div class="sub-tit" style="margin-top:0">${esc(H.stu(no).name)} 예방접종내역 (질병관리청 수신·가상)</div>` + H.grid([{ t: '접종명' }, { t: '상태/일자', w: 140 }], recv(no).map(v => `<tr><td class="l">${v[0]}</td><td style="${/미/.test(v[1]) ? 'color:#e0262c;font-weight:700' : ''}">${v[1]}</td></tr>`).join('')) + `<table class="form" style="margin-top:8px"><tr><th>특이사항</th><td><input class="inp" style="width:100%"></td></tr></table>`; }; }); };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-xl', page).onclick = () => app.alertBox('연수용 환경에서는 엑셀 다운로드를 지원하지 않습니다.');
    H.$('.b-inc', page).onclick = () => { const rs = hx.link.filter(r => r.sent); app.modal({ title: '미완료예방접종현황', width: 520, body: H.grid([{ t: '성명', w: 100 }, { t: '미완료 접종' }], rs.map(r => { const m = recv(r.no).filter(v => /미/.test(v[1])).map(v => v[0]); return m.length ? `<tr><td>${esc(H.stu(r.no).name)}</td><td class="l">${m.join(', ')}</td></tr>` : ''; }).join('') || nodataRow(2, '미완료 접종이 없습니다.')) }); };
    H.$('.b-apply', page).onclick = () => { const nos = H.$$('tr[data-no]', page).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.no); if (!nos.length) { app.alertBox('반영할 학생을 선택하십시오.'); return; } nos.forEach(no => { const r = hx.link.find(x => x.no === no); r.applied = true; recv(no).forEach(([v, s]) => { if (VAC_PRE.includes(v)) { hx.vacPre[no] = hx.vacPre[no] || {}; hx.vacPre[no][v] = s === '완료' ? '완료' : '미접종'; } else if (!/미/.test(s)) { hx.vacPost[no] = hx.vacPost[no] || {}; hx.vacPost[no][v] = s; } }); }); H.save(`${nos.length}명의 예방접종 내역을 건강기록부에 반영했습니다.`); draw(); };
  };
  function healthDoc(s) {
    const d = D(); const hx = health(); const h = d.health[s.no] || {}; const ab = hx.ability[s.no] || {};
    const bmi = h.h && h.w ? (h.w / ((h.h / 100) ** 2)).toFixed(1) : '';
    return `<div class="print-doc"><h2 style="font-size:19px">학 생 건 강 기 록 부</h2><table><tr><th>학교</th><td>${esc(d.org.school)}</td><th>학년/반/번호</th><td>5 / 2 / ${s.no}</td><th>성명</th><td>${esc(s.name)}</td></tr></table>
      <h4>■ 예방접종(취학전)</h4><table><tr>${VAC_PRE.map(v => `<th style="font-size:11px">${v}</th>`).join('')}</tr><tr>${VAC_PRE.map(v => `<td style="text-align:center">${esc(((hx.vacPre[s.no] || {})[v]) || '')}</td>`).join('')}</tr></table>
      <h4>■ 신체의 발달상황</h4><table><tr><th>검사일</th><th>키(cm)</th><th>몸무게(kg)</th><th>체질량지수</th></tr><tr><td style="text-align:center">${h.date || ''}</td><td style="text-align:center">${h.h || ''}</td><td style="text-align:center">${h.w || ''}</td><td style="text-align:center">${bmi}</td></tr></table>
      <h4>■ 신체의 능력</h4><table><tr><th>심폐지구력</th><th>유연성</th><th>근력·근지구력</th><th>순발력</th><th>체질량지수</th></tr><tr>${['c', 'f', 's', 'p', 'b'].map(k => `<td style="text-align:center">${esc(ab[k] || '')}</td>`).join('')}</tr></table>
      <h4>■ 별도검사</h4><table><tr><th>시력(좌/우)</th><th>청력</th><th>비고</th></tr><tr><td style="text-align:center">${h.eyeL || ''} / ${h.eyeR || ''}</td><td style="text-align:center">${h.hear || ''}</td><td>${esc(h.note || '')}</td></tr></table></div>`;
  }
  S['반별출력'] = function (page, title, app) {
    const d = D(); health();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><label><input type="radio" name="pp" checked> 양면출력</label>&nbsp;<label><input type="radio" name="pp"> 단면출력</label><span class="sp"></span><button class="btn primary b-print">${app.I.print}출력</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 60 }, { t: '성명' }, { t: '신체발달 입력', w: 120 }], d.students.map(s => `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td>${d.health[s.no] ? 'Y' : 'N'}</td></tr>`).join('')); ckAll(page); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-print', page).onclick = () => { const nos = H.$$('tr[data-no]', page).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.no); if (!nos.length) { app.alertBox('출력할 학생을 선택하십시오.'); return; } app.modal({ title: '학생건강기록부', width: 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div>${nos.map(n => healthDoc(H.stu(n))).join('<div style="height:16px"></div>')}</div>` }); };
  };
  S['항목별등록'] = function (page, title, app) {
    const d = D(); const hx = health();
    const TABS = ['취학전예방접종', '취학후예방접종', '신체발달', '신체능력', '건강검진', '별도검사'];
    page.insertAdjacentHTML('beforeend', `${tabsHtml(TABS)}<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="body"></div>`);
    const body = H.$('.body', page); let tab = 0;
    const draw = () => {
      if (tab === 0 || tab === 1) {
        const list = tab === 0 ? VAC_PRE : VAC_POST; const store = tab === 0 ? hx.vacPre : hx.vacPost;
        body.innerHTML = `<div class="toolbar"><span>접종명</span><select class="sel s-v">${app.opts(list)}</select><span>${tab === 0 ? '접종구분' : '접종일자'}</span>${tab === 0 ? `<select class="sel s-x">${app.opts(['완료', '미접종', '면제'])}</select>` : '<input type="date" class="inp s-x" value="2026-10-15">'}<button class="btn outline b-apply">일괄적용</button><span class="sp"></span><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(list.map(v => ({ t: `<span style="font-size:11px">${v}</span>` }))), d.students.map(s => `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td>${list.map(v => `<td class="cv" data-v="${esc(v)}" style="font-size:12px">${esc(((store[s.no] || {})[v]) || '')}</td>`).join('')}</tr>`).join(''), { h: 520 });
        ckAll(body);
        H.$('.b-apply', body).onclick = () => { const v = H.$('.s-v', body).value, x = H.$('.s-x', body).value; const trs = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked); if (!trs.length) { app.alertBox('적용할 학생을 선택하십시오.'); return; } trs.forEach(tr => { H.$(`.cv[data-v="${CSS.escape(v)}"]`, tr).textContent = x; }); app.toast('일괄적용했습니다. {저장}을 누르십시오.'); };
        H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { const o = store[tr.dataset.no] = store[tr.dataset.no] || {}; H.$$('.cv', tr).forEach(c => { if (c.textContent) o[c.dataset.v] = c.textContent; }); }); H.save(); };
      } else if (tab === 2) {
        body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn outline b-paps">PAPS자료불러오기</button><button class="btn outline b-prev">전년도비교</button><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '검사일', w: 150 }, { t: '키(cm)' }, { t: '몸무게(kg)' }, { t: '체질량지수', w: 100 }], d.students.map(s => { const h = d.health[s.no] || {}; const b = h.h && h.w ? (h.w / ((h.h / 100) ** 2)).toFixed(1) : ''; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td><input type="date" class="inp f" data-f="date" value="${h.date || '2026-05-20'}"></td><td><input class="inp f" data-f="h" value="${esc(h.h || '')}"></td><td><input class="inp f" data-f="w" value="${esc(h.w || '')}"></td><td>${b}</td></tr>`; }).join(''), { h: 520 });
        H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { const o = {}; H.$$('.f', tr).forEach(f => { o[f.dataset.f] = f.value; }); if (o.h || o.w) d.health[tr.dataset.no] = Object.assign(d.health[tr.dataset.no] || {}, o); }); H.save(); draw(); };
        H.$('.b-paps', body).onclick = () => { const p = d.paps || {}; let n = 0; H.$$('tr[data-no]', body).forEach(tr => { const x = p[tr.dataset.no]; if (x && x.h) { H.$('.f[data-f=h]', tr).value = x.h; H.$('.f[data-f=w]', tr).value = x.w; n++; } }); app.alertBox(n ? `${n}명의 PAPS 자료를 불러왔습니다.` : 'PAPS 정시측정 신장·체중 자료가 없습니다.\n([측정결과입력]에서 키·몸무게를 입력하면 불러올 수 있습니다)'); };
        H.$('.b-prev', body).onclick = () => { const trs = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked); if (trs.length !== 1) { app.alertBox('학생을 1명 선택하십시오.'); return; } const no = +trs[0].dataset.no; const h = d.health[no] || {}; app.modal({ title: '전년도 비교', width: 460, body: H.grid([{ t: '구분' }, { t: '2025(가상)', w: 110 }, { t: '2026', w: 110 }], `<tr><td>키</td><td>${h.h ? (h.h - 5.8).toFixed(1) : ''}</td><td>${h.h || ''}</td></tr><tr><td>몸무게</td><td>${h.w ? (h.w - 3.2).toFixed(1) : ''}</td><td>${h.w || ''}</td></tr>`) }); };
      } else if (tab === 3) {
        const K = [['c', '심폐지구력'], ['f', '유연성'], ['s', '근력·근지구력'], ['p', '순발력'], ['b', '체질량지수']];
        body.innerHTML = `<div class="toolbar"><label><input type="checkbox" class="noall"> 미실시여부일괄적용</label><span class="sp"></span><button class="btn outline b-paps">PAPS자료불러오기</button><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(K.map(k => ({ t: k[1] }))), d.students.map(s => { const a = hx.ability[s.no] || {}; return `<tr data-no="${s.no}"><td>${s.no}</td><td>${esc(s.name)}</td>${K.map(k => `<td><select class="sel f" data-f="${k[0]}" style="min-width:0">${app.opts(['', '1등급', '2등급', '3등급', '4등급', '5등급', '미실시'], a[k[0]] || '')}</select></td>`).join('')}</tr>`; }).join(''), { h: 520 });
        H.$('.noall', body).onchange = e => { H.$$('.f', body).forEach(f => { f.value = e.target.checked ? '미실시' : ''; }); };
        H.$('.b-paps', body).onclick = () => { const p = D().paps || {}; let n = 0; H.$$('tr[data-no]', body).forEach(tr => { const x = p[tr.dataset.no]; if (!x) return; const g = v => v ? `${Math.min(5, Math.max(1, v))}등급` : ''; H.$('.f[data-f=c]', tr).value = g(x.run ? 6 - Math.ceil(x.run / 20) : 0); H.$('.f[data-f=f]', tr).value = g(x.flex ? 6 - Math.ceil(x.flex / 4) : 0); H.$('.f[data-f=p]', tr).value = g(x.jump ? 6 - Math.ceil(x.jump / 40) : 0); n++; }); app.alertBox(n ? `${n}명의 PAPS 측정 자료를 불러왔습니다.` : 'PAPS 측정 자료가 없습니다.'); };
        H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { const o = {}; H.$$('.f', tr).forEach(f => { o[f.dataset.f] = f.value; }); hx.ability[tr.dataset.no] = o; }); H.save(); };
      } else if (tab === 4) {
        body.innerHTML = '<div class="info-box">건강검진은 <b>1학년·4학년</b>만 실시하므로, 5학년은 건강검진 입력 칸이 활성화되지 않습니다. (구강검진은 전 학년)</div>' + `<div class="toolbar"><span>구강검진일</span><input type="date" class="inp s-d" value="2026-05-27"><span>검진기관</span><input class="inp s-o" value="미동치과의원(가상)"><button class="btn outline b-apply">일괄적용</button><span class="sp"></span><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '건강검진', w: 110 }, { t: '구강검진일', w: 130 }, { t: '검진기관' }, { t: '결과', w: 110 }], d.students.map(s => { const c = hx.checkup[s.no] || {}; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td style="color:#9aa6ba">해당없음</td><td class="cd">${c.date || ''}</td><td class="co">${esc(c.org || '')}</td><td><select class="sel cr" style="min-width:0">${app.opts(['', '정상', '충치', '치주질환', '기타'], c.res || '')}</select></td></tr>`; }).join(''), { h: 480 });
        ckAll(body);
        H.$('.b-apply', body).onclick = () => { const trs = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked); if (!trs.length) { app.alertBox('적용할 학생을 선택하십시오.'); return; } trs.forEach(tr => { H.$('.cd', tr).textContent = H.$('.s-d', body).value; H.$('.co', tr).textContent = H.$('.s-o', body).value; }); };
        H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { hx.checkup[tr.dataset.no] = { date: H.$('.cd', tr).textContent, org: H.$('.co', tr).textContent, res: H.$('.cr', tr).value }; }); H.save(); };
      } else {
        const E = ['소변검사', '결핵검사', '시력검사'];
        body.innerHTML = `<div class="toolbar"><span>검사명</span><select class="sel s-e">${app.opts(E)}</select><span>검사일</span><input type="date" class="inp s-d" value="2026-05-20"><span>검사기관</span><input class="inp s-o" value="학교자체"><button class="btn outline b-apply">일괄적용</button><span class="sp"></span><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(E.map(e => ({ t: e }))), d.students.map(s => `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td>${E.map(e => `<td class="ce" data-e="${e}" style="font-size:12px">${esc(((hx.extra[s.no] || {})[e]) || '')}</td>`).join('')}</tr>`).join(''), { h: 480 });
        ckAll(body);
        H.$('.b-apply', body).onclick = () => { const e = H.$('.s-e', body).value; const v = `${H.$('.s-d', body).value} ${H.$('.s-o', body).value}`; const trs = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked); if (!trs.length) { app.alertBox('적용할 학생을 선택하십시오.'); return; } trs.forEach(tr => { H.$(`.ce[data-e="${e}"]`, tr).textContent = v; }); };
        H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { const o = hx.extra[tr.dataset.no] = hx.extra[tr.dataset.no] || {}; H.$$('.ce', tr).forEach(c => { if (c.textContent) o[c.dataset.e] = c.textContent; }); }); H.save(); };
      }
    };
    H.$('.b-search', page).onclick = draw;
    bindTabs(page, TABS.map((x, i) => () => { tab = i; draw(); }));
  };
  S['건강기록부항목별조회'] = function (page, title, app) {
    const d = D(); const hx = health();
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['예방접종', '신체발달', '건강검진', '별도검사'])}<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area"></div>`);
    let tab = 0;
    const draw = () => {
      const a = H.$('.area', page);
      if (tab === 0) a.innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '취학전 미완료' }, { t: '취학후 접종' }], d.students.map(s => `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td class="l">${esc(Object.entries(hx.vacPre[s.no] || {}).filter(([k, v]) => v !== '완료').map(([k, v]) => `${k}(${v})`).join(', '))}</td><td class="l">${esc(Object.entries(hx.vacPost[s.no] || {}).map(([k, v]) => `${k} ${v}`).join(', '))}</td></tr>`).join(''), { h: 560 });
      else if (tab === 1) a.innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '검사일', w: 110 }, { t: '키' }, { t: '몸무게' }, { t: '체질량지수' }], d.students.map(s => { const h = d.health[s.no] || {}; return `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${h.date || ''}</td><td>${h.h || ''}</td><td>${h.w || ''}</td><td>${h.h && h.w ? (h.w / ((h.h / 100) ** 2)).toFixed(1) : ''}</td></tr>`; }).join(''), { h: 560 });
      else if (tab === 2) a.innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '구강검진일', w: 120 }, { t: '검진기관' }, { t: '결과', w: 100 }], d.students.map(s => { const c = hx.checkup[s.no] || {}; return `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${c.date || ''}</td><td>${esc(c.org || '')}</td><td>${esc(c.res || '')}</td></tr>`; }).join(''), { h: 560 });
      else a.innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '소변검사' }, { t: '결핵검사' }, { t: '시력검사' }], d.students.map(s => `<tr><td>${s.no}</td><td>${esc(s.name)}</td>${['소변검사', '결핵검사', '시력검사'].map(e => `<td>${esc(((hx.extra[s.no] || {})[e]) || '')}</td>`).join('')}</tr>`).join(''), { h: 560 });
    };
    H.$('.b-search', page).onclick = draw;
    bindTabs(page, [0, 1, 2, 3].map(i => () => { tab = i; draw(); }));
  };
  S['건강기록부전송관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['건강기록부전송승인', '건강기록부전송현황'])}<div class="body"></div>`);
    const body = H.$('.body', page);
    bindTabs(page, [
      () => { body.innerHTML = '<div class="info-box">상급학교(중학교)의 건강기록부 전송 요청에 대해 사전승인 여부를 정합니다. 졸업 학년(6학년)이 대상이며, 5학년 2반은 해당 학생이 없습니다.</div>' + H.grid([{ t: '졸업학년도', w: 110 }, { t: '진학학교' }, { t: '요청일자', w: 120 }, { t: '사전승인', w: 120 }], nodataRow(4, '전송 요청이 없습니다.')); },
      () => { body.innerHTML = `<div class="search-box">${app.sf('졸업학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('요청일자', '<input type="date" class="inp" value="2026-09-01"> ~ <input type="date" class="inp" value="2026-09-30">')}${app.searchBtn()}</div>${app.nodata()}`; H.$('.b-search', body).onclick = () => app.toast('전송내역이 없습니다.'); }
    ]);
  };
  S['정정대장등록'] = function (page, title, app) {
    const d = D(); const hx = health();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false })}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">등록</button><button class="btn primary b-req">승인요청</button><button class="btn green b-apply">완결자료반영</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">① {등록}으로 정정 대상·항목·오류/정정내용·사유 입력 → ② {승인요청}(결재) → ③ 결재 완결 후 {완결자료반영}으로 건강기록부에 실제 반영합니다.</div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '정정일자', w: 110 }, { t: '성명', w: 80 }, { t: '항목', w: 120 }, { t: '오류내용' }, { t: '정정내용' }, { t: '정정사유', w: 160 }, { t: '결재상태', w: 90 }, { t: '반영', w: 60 }], hx.corr.filter(c => !c.deleted).map(c => `<tr data-id="${c.id}"><td><input type="checkbox" class="ck"></td><td>${c.date}</td><td>${esc(H.stu(c.no).name)}</td><td>${esc(c.item)}</td><td class="l">${esc(c.before)}</td><td class="l">${esc(c.after)}</td><td class="l">${esc(c.reason)}</td><td>${Ap.badge(st(c))}</td><td>${c.applied ? 'Y' : 'N'}</td></tr>`).join('') || nodataRow(9, '등록된 정정대장이 없습니다.')); };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { const m = app.modal({ title: '건강기록부 정정대장 등록', width: 600, body: `<table class="form"><tr><th class="req">*학생</th><td><select class="sel c1">${stuOpts(app)}</select></td></tr><tr><th class="req">*항목</th><td><select class="sel c2">${app.opts(['키', '몸무게', '시력(좌)', '시력(우)'])}</select></td></tr><tr><th>오류내용</th><td><input class="inp c3" style="width:100%"></td></tr><tr><th class="req">*정정내용</th><td><input class="inp c4" style="width:100%" placeholder="예) 146.5"></td></tr><tr><th class="req">*정정사유</th><td><input class="inp c5" style="width:100%" placeholder="예) 측정값 입력 오류"></td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = k => H.$('.' + k, m.pop).value.trim(); if (!v('c4') || !v('c5')) { app.alertBox('필수 항목을 입력하십시오.'); return false; } const no = +v('c1'); const h = d.health[no] || {}; const key = { '키': 'h', '몸무게': 'w', '시력(좌)': 'eyeL', '시력(우)': 'eyeR' }[v('c2')]; hx.corr.push({ id: nextId(hx.corr), no, item: v('c2'), key, before: v('c3') || h[key] || '', after: v('c4'), reason: v('c5'), date: H.dateStr(app.today()), status: '저장' }); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
    H.$('.b-req', page).onclick = () => { const s = sel(page, hx.corr).filter(c => ['저장', '회수', '반려'].includes(st(c))); if (!s.length) { app.alertBox('승인요청할 정정대장을 선택하십시오.'); return; } Ap.submit({ area: '학생생활', form: '건강기록부 정정대장', title: `건강기록부 정정대장 - 5학년 2반 ${s.length}건`, content: s.map(c => [`${H.stu(c.no).name} ${c.item}`, `${c.before} → ${c.after} (${c.reason})`]), ref: { type: 'healthCorr' }, onDone: doc => { s.forEach(c => { c.docId = doc.id; }); draw(); } }); };
    H.$('.b-apply', page).onclick = () => { const s = hx.corr.filter(c => !c.deleted && !c.applied && st(c) === '완결'); if (!s.length) { app.alertBox('반영할 완결 자료가 없습니다.'); return; } s.forEach(c => { d.health[c.no] = d.health[c.no] || {}; d.health[c.no][c.key] = c.after; c.applied = true; }); H.save(`${s.length}건의 정정사항을 건강기록부에 반영했습니다.`); draw(); };
    H.$('.b-del', page).onclick = () => { const s = sel(page, hx.corr); if (s.some(c => !['저장', '회수', '반려'].includes(st(c)))) { app.alertBox('저장·회수·반려 상태만 삭제할 수 있습니다.'); return; } s.forEach(c => { c.deleted = true; }); app.Store.save(); draw(); };
  };
  S['정정대장조회'] = function (page, title, app) {
    const hx = health();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('정정일자', '<input type="date" class="inp" value="2026-03-01"> ~ <input type="date" class="inp" value="2026-12-31">')}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const rs = hx.corr.filter(c => !c.deleted); H.$('.area', page).innerHTML = `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:18px">학생건강기록부 정정대장</h2><table><tr><th>정정일자</th><th>성명</th><th>항목</th><th>오류내용</th><th>정정내용</th><th>사유</th><th>결재</th></tr>${rs.map(c => `<tr><td>${c.date}</td><td>${esc(H.stu(c.no).name)}</td><td>${esc(c.item)}</td><td>${esc(c.before)}</td><td>${esc(c.after)}</td><td>${esc(c.reason)}</td><td>${st(c)}</td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center">자료 없음</td></tr>'}</table></div></div>`; };
  };
  S['건강기록부마감'] = function (page, title, app) {
    const hx = health(); const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년', `<select class="sel">${app.opts([['5', '5학년']])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-gen">인적사항생성</button><button class="btn outline b-ver">자료검증</button><button class="btn dark b-close">마감</button><button class="btn b-open">마감취소</button><button class="btn primary b-req">승인요청</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '학급', w: 80 }, { t: '인적사항', w: 100 }, { t: '신체발달 입력', w: 120 }, { t: '마감', w: 90 }, { t: '결재상태', w: 100 }], [1, 2, 3].map(c => `<tr><td>5-${c}</td><td>${hx.personal ? '생성' : '-'}</td><td>${c === 2 ? `${Object.keys(d.health).length}/${d.students.length}` : '-'}</td><td>${hx.closed ? '마감' : '미마감'}</td><td>${hx.docId ? Ap.badge(Ap.statusOf(hx.docId)) : '-'}</td></tr>`).join('')); };
    page.__refresh = draw; draw();
    H.$('.b-gen', page).onclick = () => { hx.personal = true; app.Store.save(); draw(); app.toast('인적사항이 생성되었습니다.'); };
    H.$('.b-ver', page).onclick = () => { if (!hx.personal) { app.alertBox('{인적사항생성}을 먼저 하십시오.'); return; } const miss = d.students.filter(s => !d.health[s.no]); app.modal({ title: '건강기록부 자료검증', width: 480, body: miss.length ? H.grid([{ t: '성명' }, { t: '검증내역' }], miss.map(s => `<tr><td>${esc(s.name)}</td><td style="color:#b8264c">신체발달 미입력</td></tr>`).join('')) : '<div class="nodata" style="padding:30px">검증 오류가 없습니다.</div>' }); };
    H.$('.b-close', page).onclick = () => { hx.closed = true; app.Store.save(); draw(); };
    H.$('.b-open', page).onclick = () => { if (hx.docId && ['결재중', '완결'].includes(Ap.statusOf(hx.docId))) { app.alertBox('결재 진행 중이거나 완결된 경우 마감을 취소할 수 없습니다.'); return; } hx.closed = false; app.Store.save(); draw(); };
    H.$('.b-req', page).onclick = () => { if (!hx.closed) { app.alertBox('마감 후 승인요청할 수 있습니다.'); return; } Ap.submit({ area: '학생생활', form: '건강기록부마감', title: '2026학년도 5학년 학생건강기록부 마감', content: [['대상', '5학년 1~3반'], ['마감일', H.dateStr(app.today())]], ref: { type: 'healthClose' }, onDone: doc => { hx.docId = doc.id; draw(); } }); };
  };

  /* =============== 학교폭력실태조사 / 정서행동특성검사 / 교육활동 =============== */
  S['설문대상관리'] = function (page, title, app) {
    const d = D(); d.survey = d.survey || {};
    page.insertAdjacentHTML('beforeend', `<div class="info-box">학교폭력 실태조사는 초등 4학년 이상이 대상입니다. 담임은 대상 학생을 확인·생성하고 참여 여부를 확인합니다. (조사 응답 내용은 담임이 열람할 수 없습니다)</div><div class="search-box">${app.sf('차수', `<select class="sel">${app.opts(['2026년 2차(9~10월)'])}</select>`, true)}${app.commonSearch({ year: false })}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-gen">대상자생성</button><button class="btn dark b-ex">대상제외</button><button class="btn outline b-inc">대상포함</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명' }, { t: '대상여부', w: 100 }, { t: '참여여부', w: 100 }, { t: '제외사유', w: 200 }], d.students.map(s => { const x = d.survey[s.no]; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td>${x ? (x.ex ? '제외' : '대상') : '-'}</td><td>${x && !x.ex ? (s.no % 4 ? '<span class="badge green">참여</span>' : '<span class="badge">미참여</span>') : '-'}</td><td>${esc((x && x.ex) || '')}</td></tr>`; }).join('')); ckAll(page); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-gen', page).onclick = () => { d.students.forEach(s => { d.survey[s.no] = d.survey[s.no] || { ex: '' }; }); app.Store.save(); draw(); };
    const picked = () => H.$$('tr[data-no]', page).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.no);
    H.$('.b-ex', page).onclick = () => { const nos = picked(); if (!nos.length) { app.alertBox('학생을 선택하십시오.'); return; } const m = app.modal({ title: '대상제외', width: 420, body: `<select class="sel v" style="width:100%">${app.opts(['장기결석', '특수교육대상(보호자 요청)', '기타'])}</select>`, buttons: [{ text: '적용', cls: 'primary', onClick: () => { nos.forEach(n => { d.survey[n] = { ex: H.$('.v', m.pop).value }; }); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
    H.$('.b-inc', page).onclick = () => { picked().forEach(n => { d.survey[n] = { ex: '' }; }); app.Store.save(); draw(); };
  };
  const emoNote = '<div class="info-box">학생정서·행동특성검사는 <b>초등 1학년·4학년</b>이 정규 대상입니다. 5학년 2반은 정규 대상이 아니며, 필요한 경우 추가 검사 대상으로 등록할 수 있습니다. 검사 결과는 매우 민감한 정보이므로 연수용 환경에는 결과 예시를 넣지 않았습니다.</div>';
  S['자료관리'] = function (page, title, app) {
    const d = D(); d.emo = d.emo || { add: [] };
    page.insertAdjacentHTML('beforeend', `${emoNote}<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">추가검사대상 등록</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명' }, { t: '구분', w: 120 }, { t: '학부모 동의', w: 110 }, { t: '검사상태', w: 110 }], d.emo.add.map(no => `<tr><td>${no}</td><td>${esc(H.stu(no).name)}</td><td>추가검사</td><td>대기</td><td>미실시</td></tr>`).join('') || nodataRow(5, '검사 대상 학생이 없습니다.')); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { const m = app.modal({ title: '추가검사대상 등록', width: 420, body: `<select class="sel v" style="width:100%">${stuOpts(app)}</select><div class="info-box" style="margin-top:8px;font-size:12px">학부모 동의 후 검사를 진행합니다.</div>`, buttons: [{ text: '등록', cls: 'primary', onClick: () => { const n = +H.$('.v', m.pop).value; if (!d.emo.add.includes(n)) d.emo.add.push(n); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
  };
  S['기본사항관리'] = function (page, title, app) {
    const d = D(); d.emoSet = d.emoSet || { from: '2026-04-06', to: '2026-04-24', how: '학부모 온라인 응답', note: '' };
    page.insertAdjacentHTML('beforeend', `${emoNote}<table class="form"><tr><th>검사기간</th><td><input type="date" class="inp a" value="${d.emoSet.from}"> ~ <input type="date" class="inp b" value="${d.emoSet.to}"></td></tr><tr><th>검사방법</th><td><select class="sel c">${app.opts(['학부모 온라인 응답', '학생 온라인 응답', '서면'], d.emoSet.how)}</select></td></tr><tr><th>안내사항</th><td><textarea class="ta n">${esc(d.emoSet.note)}</textarea></td></tr></table><div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn primary b-save">저장</button></div>`);
    H.$('.b-save', page).onclick = () => { d.emoSet = { from: H.$('.a', page).value, to: H.$('.b', page).value, how: H.$('.c', page).value, note: H.$('.n', page).value }; H.save(); };
  };
  S['검사진행현황'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${emoNote}<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => { const n = ((D().emo || {}).add || []).length; H.$('.area', page).innerHTML = H.grid([{ t: '학급' }, { t: '대상', w: 90 }, { t: '동의', w: 90 }, { t: '검사완료', w: 90 }, { t: '진행률', w: 90 }], `<tr><td>5학년 2반</td><td>${n}</td><td>0</td><td>0</td><td>0%</td></tr>`); };
    draw(); H.$('.b-search', page).onclick = draw;
  };
  S['검사결과관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${emoNote}<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('검사가 완료된 학생이 없습니다.'); };
  };
  S['교육활동출결관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-go">교외체험학습관리로 이동</button></div><div class="area"></div><div class="info-box" style="margin-top:10px">결재가 완결된 교육활동 신청서(교외체험학습·결석신고서)와 출결 반영 여부를 확인합니다. 출결 반영은 [교외체험학습관리]의 {출결반영} 또는 [출결관리]에서 직접 입력합니다.</div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '학생', w: 90 }, { t: '신청서', w: 150 }, { t: '기간', w: 190 }, { t: '종류', w: 120 }, { t: '결재', w: 90 }, { t: '출결반영', w: 90 }], (d.fieldTrips || []).map(f => `<tr><td>${esc(H.stu(f.no).name)}</td><td>${esc(f.form)}</td><td>${f.from} ~ ${f.to}</td><td>${esc(f.kind)}</td><td>${Ap.badge(f.docId ? Ap.statusOf(f.docId) : f.status)}</td><td>${f.attDone ? 'Y' : 'N'}</td></tr>`).join('') || nodataRow(6)); };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-go', page).onclick = () => app.openLeaf('교외체험학습관리');
  };

  /* =============== PAPS =============== */
  const papsGrade = p => { if (!p) return ''; const sc = (+p.run || 0) / 10 + (+p.flex || 0) / 5 + (p.dash ? (12 - p.dash) : 0) + (+p.jump || 0) / 40; return sc > 16 ? 1 : sc > 13 ? 2 : sc > 10 ? 3 : sc > 7 ? 4 : 5; };
  S['PAPS마감관리'] = function (page, title, app) {
    const d = D(); d.papsClosed = d.papsClosed || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('측정회차', `<select class="sel s-r">${app.opts(['1회차(정시)', '2회차(수시)'])}</select>`, true)}${app.commonSearch({ year: false })}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn dark b-c">마감</button><button class="btn b-o">마감취소</button></div><div class="area"></div>`);
    const draw = () => { const r = H.$('.s-r', page).value; const n = Object.keys(d.paps || {}).length; H.$('.area', page).innerHTML = H.grid([{ t: '측정회차' }, { t: '학급', w: 90 }, { t: '입력', w: 110 }, { t: '마감', w: 90 }], `<tr><td>${r}</td><td>5-2</td><td>${n}/${d.students.length}</td><td>${d.papsClosed[r] ? '<span class="badge red">마감</span>' : '<span class="badge">미마감</span>'}</td></tr>`); };
    draw(); H.$('.b-search', page).onclick = draw; H.$('.s-r', page).onchange = draw;
    H.$('.b-c', page).onclick = () => { const n = Object.keys(d.paps || {}).length; if (n < d.students.length) { app.alertBox(`측정결과 미입력 학생이 ${d.students.length - n}명 있습니다.\n[측정결과입력]에서 입력하십시오.`); return; } d.papsClosed[H.$('.s-r', page).value] = true; app.Store.save(); draw(); };
    H.$('.b-o', page).onclick = () => { d.papsClosed[H.$('.s-r', page).value] = false; app.Store.save(); draw(); };
  };
  S['평가결과조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn b-p">${app.I.print}결과표 출력</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '왕복오래달리기' }, { t: '앉아윗몸앞으로굽히기' }, { t: '50m달리기' }, { t: '제자리멀리뛰기' }, { t: '종합등급(간이)', w: 120 }], d.students.map(s => { const p = (d.paps || {})[s.no] || {}; const g = papsGrade((d.paps || {})[s.no]); return `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${p.run || ''}</td><td>${p.flex || ''}</td><td>${p.dash || ''}</td><td>${p.jump || ''}</td><td>${g ? `<span class="badge ${g >= 4 ? 'red' : 'green'}">${g}등급</span>` : ''}</td></tr>`; }).join(''), { h: 560 }); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-p', page).onclick = () => window.print();
  };
  S['관심학생조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area"></div><div class="info-box" style="margin-top:10px">종합 4~5등급 학생은 건강체력 관심학생으로 관리하며, [신체활동관리]에서 신체활동 처방을 입력합니다. (연수용 간이 등급)</div>`);
    const draw = () => { const rs = d.students.filter(s => papsGrade((d.paps || {})[s.no]) >= 4); H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 90 }, { t: '종합등급', w: 100 }, { t: '신체활동 처방' }], rs.map(s => `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${papsGrade(d.paps[s.no])}등급</td><td class="l">${esc(((d.papsRx || {})[s.no]) || '')}</td></tr>`).join('') || nodataRow(4, '관심학생이 없습니다. ([측정결과입력]에서 측정값을 입력하십시오)')); };
    draw(); H.$('.b-search', page).onclick = draw;
  };
  S['신체활동관리'] = function (page, title, app) {
    const d = D(); d.papsRx = d.papsRx || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 90 }, { t: '등급', w: 80 }, { t: '신체활동 처방(운동 계획)' }], d.students.map(s => { const g = papsGrade((d.paps || {})[s.no]); return `<tr data-no="${s.no}"><td>${s.no}</td><td>${esc(s.name)}</td><td>${g ? g + '등급' : ''}</td><td><input class="inp rx" value="${esc(d.papsRx[s.no] || '')}" placeholder="예) 주 3회 줄넘기 10분, 스트레칭"></td></tr>`; }).join(''), { h: 560 }); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { H.$$('tr[data-no]', page).forEach(tr => { d.papsRx[tr.dataset.no] = H.$('.rx', tr).value; }); H.save(); };
  };
  S['통계및현황'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => { const c = [0, 0, 0, 0, 0, 0]; d.students.forEach(s => { c[papsGrade((d.paps || {})[s.no]) || 0]++; }); const max = Math.max(1, ...c.slice(1)); H.$('.area', page).innerHTML = H.grid([{ t: '등급', w: 90 }, { t: '인원', w: 80 }, { t: '분포' }], [1, 2, 3, 4, 5].map(g => `<tr><td>${g}등급</td><td>${c[g]}</td><td class="l"><div style="height:14px;width:${c[g] / max * 100}%;background:${g >= 4 ? '#f87171' : '#3772ff'};border-radius:3px"></div></td></tr>`).join('') + `<tr><td>미측정</td><td>${c[0]}</td><td></td></tr>`); };
    draw(); H.$('.b-search', page).onclick = draw;
  };
  S['PAPS자료실'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', H.grid([{ t: '번호', w: 60 }, { t: '제목' }, { t: '등록일', w: 110 }], [['2026 학생건강체력평가(PAPS) 운영 안내(연수용 예시)', '2026.03.10'], ['측정 종목별 측정 방법 안내(연수용 예시)', '2026.03.10'], ['건강체력교실 운영 예시 자료(연수용 예시)', '2026.04.02']].map((r, i) => `<tr><td>${i + 1}</td><td class="l link">${r[0]}</td><td>${r[1]}</td></tr>`).join('')));
    H.$$('td.link', page).forEach(td => { td.onclick = () => app.alertBox('연수용 예시 게시물입니다. 첨부파일은 제공되지 않습니다.'); });
  };

  /* =============== 생활부장 업무 =============== */
  S['학적현황조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['학적현황', '학적현황통계표'])}<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.sf('학년', `<select class="sel">${app.opts([['5', '5학년']])}</select>`)}${app.sf('재학구분', `<select class="sel">${app.opts(['재학', '전체'])}</select>`)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn b-p">${app.I.print}출력</button></div><div class="area"></div>`);
    let tab = 0;
    const draw = () => { if (tab === 0) H.$('.area', page).innerHTML = H.grid([{ t: '학년/반', w: 90 }, { t: '번호', w: 60 }, { t: '성명', w: 90 }, { t: '성별', w: 60 }, { t: '학적상태', w: 90 }, { t: '학적변동', w: 110 }, { t: '변동일자', w: 110 }], d.students.map(s => { const t = (d.transfers || []).find(x => x.no === s.no); return `<tr><td>5-2</td><td>${s.no}</td><td>${esc(s.name)}</td><td>${s.sex}</td><td>재학</td><td>${t ? '전입' : '진급'}</td><td>${t ? t.date : '2026-03-03'}</td></tr>`; }).join(''), { h: 540 }); else { const m = d.students.filter(s => s.sex === '남').length; H.$('.area', page).innerHTML = H.grid([{ t: '학급' }, { t: '남', w: 80 }, { t: '여', w: 80 }, { t: '계', w: 80 }, { t: '전입', w: 80 }, { t: '전출', w: 80 }], [1, 2, 3].map(c => c === 2 ? `<tr><td>5-2</td><td>${m}</td><td>${d.students.length - m}</td><td>${d.students.length}</td><td>${(d.transfers || []).length}</td><td>0</td></tr>` : `<tr><td>5-${c}</td><td>5</td><td>5</td><td>10</td><td>0</td><td>0</td></tr>`).join('')); } };
    H.$('.b-search', page).onclick = draw; H.$('.b-p', page).onclick = () => window.print();
    bindTabs(page, [0, 1].map(i => () => { tab = i; draw(); }));
  };
  S['학생자료종합검색'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('조회구분', `<select class="sel">${app.opts(['학급별', '개인별'])}</select>`)}${app.commonSearch({ year: false })}${app.searchBtn()}</div><div class="split"><div class="left" style="width:240px"><div class="lst"></div></div><div class="right"><div class="tabs">${['인적·학적', '출결', '창체', '교과학습발달', '행동특성', '수상'].map((t, i) => `<a data-i="${i}" class="${i === 0 ? 'on' : ''}">${t}</a>`).join('')}</div><div class="det">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    let cur = null, area = 0;
    const det = () => { if (!cur) return; const s = H.stu(cur); const box = H.$('.det', page); const map = [() => `<table class="form"><tr><th>사진</th><td>${H.avatar(s, 72)}</td></tr><tr><th>성명</th><td>${esc(s.name)} (${s.sex}) ${s.birth}</td></tr><tr><th>주소</th><td>${esc(s.addr)}</td></tr><tr><th>보호자</th><td>${esc(s.guardian)} (${s.rel})</td></tr></table>`, () => { const rs = []; Object.keys(d.attendance || {}).forEach(ym => Object.entries(d.attendance[ym]).forEach(([k, r]) => { const [n, dd] = k.split('-'); if (+n === cur) rs.push([`${ym}-${String(dd).padStart(2, '0')}`, r.code, r.reason]); })); return H.grid([{ t: '일자', w: 110 }, { t: '출결', w: 120 }, { t: '사유' }], rs.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="l">${esc(r[2])}</td></tr>`).join('') || nodataRow(3, '출결 기록이 없습니다.')); }, () => H.grid([{ t: '영역', w: 110 }, { t: '특기사항' }], ['자율·자치', '동아리', '진로'].map(k => `<tr><td>${k}</td><td class="l">${esc(((d.records[k] || {})[cur]) || '')}</td></tr>`).join('')), () => H.grid([{ t: '교과', w: 90 }, { t: '성취수준 및 특기사항' }], Object.keys(d.dev || {}).map(sj => d.dev[sj][cur] ? `<tr><td>${sj}</td><td class="l">${esc(d.dev[sj][cur])}</td></tr>` : '').join('') || nodataRow(2)), () => `<div class="info-box">${esc(((d.records['행특'] || {})[cur]) || '입력된 내용이 없습니다.')}</div>`, () => H.grid([{ t: '수상명' }, { t: '등급', w: 100 }, { t: '일자', w: 110 }], d.awards.filter(a => a.students.includes(cur)).map(a => `<tr><td class="l">${esc(a.name)}</td><td>${esc(a.grade)}</td><td>${a.date}</td></tr>`).join('') || nodataRow(3))]; box.innerHTML = map[area](); };
    const draw = () => { H.$('.lst', page).innerHTML = H.stuList(cur); H.$$('.lst tr[data-no]', page).forEach(tr => { tr.onclick = () => { cur = +tr.dataset.no; draw(); det(); }; }); };
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { area = +a.dataset.i; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); det(); }; });
    H.$('.b-search', page).onclick = draw; draw();
  };
  S['재학생동의여부관리'] = function (page, title, app) {
    const d = D(); d.careerAgree = d.careerAgree || {};
    page.insertAdjacentHTML('beforeend', `<div class="info-box">진로정보(진로희망·진로활동 등)를 커리어넷 등 진로정보망으로 전송하기 위한 학부모 동의 여부를 관리합니다.</div><div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span>일괄적용</span><select class="sel s-v">${app.opts(['동의', '미동의'])}</select><button class="btn outline b-apply">적용</button><span class="sp"></span><span class="lk"></span><button class="btn primary b-save">저장</button></div><div class="area"></div>`);
    const draw = () => { const lock = (d.careerLock || {})['5-2']; H.$('.lk', page).innerHTML = lock ? '<span class="badge red">마감</span>' : ''; H.$('.area', page).innerHTML = H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명' }, { t: '동의여부', w: 150 }, { t: '동의일자', w: 120 }], d.students.map(s => { const a = d.careerAgree[s.no] || {}; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td><select class="sel v" ${lock ? 'disabled' : ''}>${app.opts(['', '동의', '미동의'], a.v || '')}</select></td><td>${a.at || ''}</td></tr>`; }).join('')); ckAll(page); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-apply', page).onclick = () => { H.$$('tr[data-no]', page).filter(tr => H.$('.ck', tr).checked).forEach(tr => { H.$('.v', tr).value = H.$('.s-v', page).value; }); };
    H.$('.b-save', page).onclick = () => { if ((d.careerLock || {})['5-2']) { app.alertBox('마감되어 수정할 수 없습니다.'); return; } H.$$('tr[data-no]', page).forEach(tr => { const v = H.$('.v', tr).value; if (v) d.careerAgree[tr.dataset.no] = { v, at: (d.careerAgree[tr.dataset.no] || {}).v === v ? d.careerAgree[tr.dataset.no].at : H.dateStr(app.today()) }; }); H.save(); draw(); };
  };
  S['동의여부마감관리'] = function (page, title, app) {
    const d = D(); d.careerLock = d.careerLock || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년', `<select class="sel">${app.opts([['5', '5학년']])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn dark b-c">마감</button><button class="btn b-o">마감취소</button></div><div class="area"></div>`);
    const draw = () => { const ag = d.careerAgree || {}; H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '학급', w: 80 }, { t: '동의', w: 80 }, { t: '미동의', w: 80 }, { t: '미입력', w: 80 }, { t: '마감', w: 90 }], [1, 2, 3].map(c => { const k = `5-${c}`; const mine = c === 2; const y = mine ? Object.values(ag).filter(a => a.v === '동의').length : 0, n = mine ? Object.values(ag).filter(a => a.v === '미동의').length : 0; return `<tr data-k="${k}"><td><input type="checkbox" class="ck"></td><td>${k}</td><td>${y}</td><td>${n}</td><td>${mine ? d.students.length - y - n : '-'}</td><td>${d.careerLock[k] ? '<span class="badge red">마감</span>' : '미마감'}</td></tr>`; }).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    const pk = () => H.$$('tr[data-k]', page).filter(tr => H.$('.ck', tr).checked).map(tr => tr.dataset.k);
    H.$('.b-c', page).onclick = () => { const ks = pk(); if (!ks.length) { app.alertBox('학급을 선택하십시오.'); return; } ks.forEach(k => { d.careerLock[k] = true; }); app.Store.save(); draw(); };
    H.$('.b-o', page).onclick = () => { pk().forEach(k => { d.careerLock[k] = false; }); app.Store.save(); draw(); };
  };
  function disclosure() {
    const d = D();
    if (!d.disc) d.disc = [
      { id: 1, cat: '학교 교육과정', item: '학교 교육과정 편성·운영 및 평가에 관한 사항', owner: '안한수', due: '2026-04', value: '', status: '저장' },
      { id: 2, cat: '학생 현황', item: '학년별·학급별 학생 수', owner: '안한수', due: '2026-04', value: '', status: '저장' },
      { id: 3, cat: '학교폭력', item: '학교폭력 예방교육 실적', owner: '봉미선', due: '2026-10', value: '', status: '저장' },
      { id: 4, cat: '학생 건강', item: '학생 건강검사 결과 현황', owner: '도라미', due: '2026-10', value: '', status: '저장' }
    ];
    return d.disc;
  }
  S['공시항목관리'] = function (page, title, app) {
    const ls = disclosure();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('공시연도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div><div class="info-box" style="margin-top:10px">학교알리미 공시항목별 담당자와 공시 시기를 지정합니다. (항목은 연수용 예시)</div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '영역', w: 130 }, { t: '공시항목' }, { t: '공시시기', w: 100 }, { t: '담당자', w: 140 }], ls.map(x => `<tr data-id="${x.id}"><td>${esc(x.cat)}</td><td class="l">${esc(x.item)}</td><td>${x.due}</td><td><select class="sel ow">${app.opts(D().staff.map(s => s.name), x.owner)}</select></td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { H.$$('tr[data-id]', page).forEach(tr => { ls.find(x => String(x.id) === tr.dataset.id).owner = H.$('.ow', tr).value; }); H.save(); };
  };
  S['공시자료관리'] = function (page, title, app) {
    const ls = disclosure();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('공시연도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button><button class="btn primary b-req">승인요청</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '공시항목' }, { t: '담당자', w: 90 }, { t: '공시내용(입력)', w: 360 }, { t: '결재상태', w: 100 }], ls.map(x => `<tr data-id="${x.id}"><td><input type="checkbox" class="ck"></td><td class="l">${esc(x.item)}</td><td>${esc(x.owner)}</td><td><input class="inp v" value="${esc(x.value)}" placeholder="예) 학교 교육과정 운영계획서 첨부"></td><td>${Ap.badge(st(x))}</td></tr>`).join('')); };
    page.__refresh = draw; draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { H.$$('tr[data-id]', page).forEach(tr => { ls.find(x => String(x.id) === tr.dataset.id).value = H.$('.v', tr).value; }); H.save(); draw(); };
    H.$('.b-req', page).onclick = () => { const s = sel(page, ls).filter(x => ['저장', '회수', '반려'].includes(st(x))); if (!s.length) { app.alertBox('승인요청할 항목을 선택하십시오.'); return; } if (s.some(x => !x.value.trim())) { app.alertBox('공시내용을 입력하고 저장한 후 승인요청하십시오.'); return; } Ap.submit({ area: '교육과정', form: '정보공시', title: `학교정보공시 자료 승인요청 (${s.length}건)`, content: s.map(x => [x.item, x.value]), ref: { type: 'disc' }, onDone: doc => { s.forEach(x => { x.docId = doc.id; }); draw(); } }); };
  };
  S['상담현황(관리자)'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년', `<select class="sel">${app.opts([['', '전체'], ['5', '5학년']])}</select>`)}${app.sf('상담영역', `<select class="sel s-t">${app.opts([['', '전체'], '학업', '교우관계', '생활습관', '진로', '기타'])}</select>`)}${app.searchBtn()}</div><div class="area"></div><div class="info-box" style="margin-top:10px">관리자용 화면은 학교 전체 상담 건수와 영역을 확인합니다. 상담 세부 내용은 담당 교사만 열람합니다.</div>`);
    const draw = () => { const t = H.$('.s-t', page).value; H.$('.area', page).innerHTML = H.grid([{ t: '상담일', w: 110 }, { t: '학급', w: 80 }, { t: '상담교사', w: 100 }, { t: '대상', w: 80 }, { t: '방법', w: 80 }, { t: '상담영역' }], d.counsel.filter(c => !t || c.topic === t).map(c => `<tr><td>${c.date}</td><td>5-2</td><td>${esc(d.user.name)}</td><td>${c.type}</td><td>${c.method}</td><td>${c.topic}</td></tr>`).join('') || nodataRow(6)); };
    draw(); H.$('.b-search', page).onclick = draw;
  };
  S['담당자관리'] = function (page, title, app) {
    const d = D(); d.dropMgr = d.dropMgr || [{ role: '학업중단 업무 담당자', name: '봉미선' }, { role: '학교밖청소년지원센터 연계 담당자', name: '봉미선' }, { role: '취학관리전담기구 담당자', name: '안한수' }];
    page.insertAdjacentHTML('beforeend', `<div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div>`);
    H.$('.area', page).innerHTML = H.grid([{ t: '구분' }, { t: '담당자', w: 200 }], d.dropMgr.map((x, i) => `<tr><td class="l">${x.role}</td><td><select class="sel v" data-i="${i}">${app.opts(D().staff.map(s => s.name), x.name)}</select></td></tr>`).join(''));
    H.$('.b-save', page).onclick = () => { H.$$('.v', page).forEach(s => { d.dropMgr[+s.dataset.i].name = s.value; }); H.save(); };
  };
  S['통계관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '구분' }, { t: '1학년', w: 70 }, { t: '2학년', w: 70 }, { t: '3학년', w: 70 }, { t: '4학년', w: 70 }, { t: '5학년', w: 70 }, { t: '6학년', w: 70 }, { t: '계', w: 70 }], ['장기결석(정원외)', '유예', '면제', '학업중단 숙려제 참여'].map(r => `<tr><td class="l">${r}</td>${[1, 2, 3, 4, 5, 6].map(() => '<td>0</td>').join('')}<td>0</td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
  };

  /* =============== 복무(기타) — 신청 → 상신 =============== */
  function applyScreen(page, app, cfg) {
    const d = D(); const arr = d[cfg.key] = d[cfg.key] || (cfg.seed ? cfg.seed() : []);
    page.insertAdjacentHTML('beforeend', `${cfg.note ? `<div class="info-box">${cfg.note}</div>` : ''}<div class="search-box">${app.sf('년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn primary b-det">상세조회</button>${cfg.noApply ? '' : `<button class="btn primary b-new">${cfg.btn || '신청'}</button>`}<button class="btn dark b-ret">회수</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>`);
    const draw = () => { const rs = arr.filter(r => !r.deleted); H.$('.cnt', page).textContent = rs.length; H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }].concat(cfg.cols.map(c => ({ t: c[1], w: c[2] }))).concat([{ t: '결재상태', w: 100 }]), rs.map(r => `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td>${cfg.cols.map(c => `<td class="${c[3] || ''}">${esc(typeof c[0] === 'function' ? c[0](r) : r[c[0]])}</td>`).join('')}<td class="link stt">${Ap.badge(st(r))}</td></tr>`).join('') || nodataRow(cfg.cols.length + 2), { h: 480 }); H.$$('.stt', page).forEach(td => { td.onclick = () => { const r = arr.find(x => String(x.id) === td.parentElement.dataset.id); if (r.docId) Ap.detail(Ap.get(r.docId)); }; }); };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw;
    const one = () => { const s = sel(page, arr); if (s.length !== 1) { app.alertBox('1건을 선택하십시오.'); return null; } return s[0]; };
    H.$('.b-det', page).onclick = () => { const r = one(); if (r && r.docId) Ap.detail(Ap.get(r.docId)); };
    H.$('.b-ret', page).onclick = () => { const r = one(); if (r && r.docId) app.confirmBox('회수하시겠습니까?', () => { if (Ap.retrieve(Ap.get(r.docId))) app.toast('회수되었습니다.'); }); };
    H.$('.b-del', page).onclick = () => { const s = sel(page, arr); if (!s.length) return; if (s.some(r => !['저장', '회수', '반려'].includes(st(r)))) { app.alertBox('회수·반려 상태만 삭제할 수 있습니다.'); return; } s.forEach(r => { r.deleted = true; }); Ap.refresh(); };
    const nb = H.$('.b-new', page);
    if (nb) nb.onclick = () => {
      const m = app.modal({ title: cfg.title, width: 640, body: `${cfg.formNote ? `<div class="notice-red">${cfg.formNote}</div>` : ''}<table class="form">${cfg.fields.map(f => `<tr><th class="${f.req ? 'req' : ''}">${f.req ? '*' : ''}${f.label}</th><td>${f.type === 'select' ? `<select class="sel f" data-k="${f.k}">${app.opts(f.opts, f.v)}</select>` : f.type === 'ta' ? `<textarea class="ta f" data-k="${f.k}" placeholder="${esc(f.ph || '')}">${esc(f.v || '')}</textarea>` : `<input class="inp f" data-k="${f.k}" type="${f.type || 'text'}" value="${esc(f.v || '')}" placeholder="${esc(f.ph || '')}" style="${f.type === 'date' || f.type === 'time' ? '' : 'width:100%'}">`}</td></tr>`).join('')}</table>`,
        buttons: [{ text: '승인요청', cls: 'primary', onClick: () => { const o = {}; H.$$('.f', m.pop).forEach(f => { o[f.dataset.k] = f.value.trim(); }); const miss = cfg.fields.find(f => f.req && !o[f.k]); if (miss) { app.alertBox(`${miss.label}을(를) 입력하십시오.`); return false; } const err = cfg.validate && cfg.validate(o); if (err) { app.alertBox(err); return false; } const rec = Object.assign({ id: nextId(arr) }, o); Ap.submit({ area: '복무', form: cfg.form, title: cfg.docTitle(rec), content: cfg.fields.map(f => [f.label, o[f.k] || '-']), ref: { type: cfg.key, id: rec.id }, coop: !!cfg.coop, onDone: doc => { rec.docId = doc.id; arr.push(rec); draw(); } }); } }, { text: '닫기' }] });
    };
  }
  S['개인유연근무관리'] = (p, t, app) => applyScreen(p, app, {
    key: 'flexWork', form: '유연근무신청', title: '유연근무 신청', note: '유연근무(시차출퇴근 등)는 기관 운영 여건에 따라 승인됩니다. 학교는 수업 시간 확보를 위해 제한될 수 있습니다.',
    cols: [['type', '유형', 150], [r => `${r.from} ~ ${r.to}`, '기간', 220], [r => `${r.start} ~ ${r.end}`, '근무시간', 150], ['reason', '사유', null, 'l']],
    fields: [{ k: 'type', label: '유형', type: 'select', opts: ['시차출퇴근형', '근무시간선택형', '집약근무형'], req: true }, { k: 'from', label: '시작일', type: 'date', v: '2026-10-05', req: true }, { k: 'to', label: '종료일', type: 'date', v: '2026-10-30', req: true }, { k: 'start', label: '출근시각', type: 'time', v: '08:00', req: true }, { k: 'end', label: '퇴근시각', type: 'time', v: '16:00', req: true }, { k: 'reason', label: '사유', ph: '예) 자녀 등원 지도', req: true }],
    validate: o => o.from > o.to ? '종료일이 시작일보다 빠릅니다.' : '', docTitle: r => `유연근무 신청(${r.type}) - ${D().user.name}`
  });
  S['개인당직관리'] = (p, t, app) => applyScreen(p, app, {
    key: 'dutyNight', form: '당직변경신청', title: '당직(일직) 변경 신청', btn: '변경신청', note: '학교 일직·당직 배정 내역을 확인하고, 부득이한 경우 교대(변경)를 신청합니다. (연수용 가상 배정)',
    seed: () => [{ id: 1, date: '2026-10-10', kind: '토요 일직', with: '', reason: '배정', status: '완결' }],
    cols: [['date', '일자', 120], ['kind', '구분', 120], ['with', '교대자', 110], ['reason', '사유', null, 'l']],
    fields: [{ k: 'date', label: '변경 대상일', type: 'date', v: '2026-10-10', req: true }, { k: 'kind', label: '구분', type: 'select', opts: ['토요 일직', '공휴일 일직'], req: true }, { k: 'with', label: '교대자', type: 'select', opts: ['나미리', '변태수', '마이콜', '봉미선', '안한수'], req: true }, { k: 'reason', label: '사유', ph: '예) 가족 행사', req: true }],
    docTitle: r => `일직 교대 신청 ${r.date} (${D().user.name} → ${r.with})`
  });
  S['개인항공마일리지관리'] = (p, t, app) => applyScreen(p, app, {
    key: 'mileage', form: '항공마일리지 등록', title: '공무 항공마일리지 등록', btn: '등록', note: '공무로 국외출장 등에서 적립한 항공마일리지를 등록합니다. 해당 사항이 없으면 등록하지 않습니다.',
    cols: [['date', '탑승일', 120], ['route', '구간', 180], ['air', '항공사', 120], ['mile', '적립마일', 100]],
    fields: [{ k: 'date', label: '탑승일', type: 'date', req: true }, { k: 'route', label: '구간', ph: '예) 인천-싱가포르', req: true }, { k: 'air', label: '항공사', req: true }, { k: 'mile', label: '적립마일', type: 'number', req: true }],
    docTitle: r => `공무 항공마일리지 등록 - ${r.route}`
  });
  S['개인연가저축신청'] = (p, t, app) => applyScreen(p, app, {
    key: 'leaveSave', form: '연가저축신청', title: '연가저축 신청', note: '당해 연도에 사용하지 않은 연가를 저축하여 다음 연도 이후에 사용할 수 있습니다. 저축한 연가는 다음 해부터 사용 가능합니다.',
    cols: [['year', '저축연도', 100], ['days', '저축일수', 100], ['reason', '비고', null, 'l']],
    fields: [{ k: 'year', label: '저축연도', type: 'select', opts: ['2026'], req: true }, { k: 'days', label: '저축일수', type: 'number', v: '3', req: true }, { k: 'reason', label: '비고', ph: '(선택)' }],
    validate: o => (+o.days <= 0 || +o.days > 10) ? '저축일수는 1~10일 범위로 입력하십시오. (연수용 기준)' : '', docTitle: r => `연가저축 신청 ${r.days}일 - ${D().user.name}`
  });
  S['재택근무보고'] = (p, t, app) => applyScreen(p, app, {
    key: 'remote', form: '재택근무보고', title: '재택근무 보고', btn: '보고서 작성', note: '재택근무(원격근무)를 실시한 경우 업무 수행 결과를 보고합니다.',
    cols: [['date', '근무일', 120], ['work', '수행업무', null, 'l']],
    fields: [{ k: 'date', label: '근무일', type: 'date', req: true }, { k: 'work', label: '수행업무', type: 'ta', ph: '예) 2학기 평가계획 수정, 학부모 상담 일정 정리', req: true }],
    docTitle: r => `재택근무 보고 ${r.date} - ${D().user.name}`
  });
  S['공무원증발급신청'] = (p, t, app) => applyScreen(p, app, {
    key: 'idCard', form: '공무원증발급신청', title: '공무원증 발급 신청', note: '공무원증 신규·재발급을 신청합니다. 사진은 최근 6개월 이내 촬영본이어야 합니다. (연수용: 사진 첨부 생략)',
    cols: [['kind', '구분', 120], ['reason', '사유', null, 'l']],
    fields: [{ k: 'kind', label: '구분', type: 'select', opts: ['신규', '재발급(분실)', '재발급(훼손)', '재발급(정보변경)'], req: true }, { k: 'reason', label: '사유', ph: '예) 분실', req: true }],
    docTitle: r => `공무원증 발급 신청(${r.kind}) - ${D().user.name}`
  });
  S['육아시간신청조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="info-box">육아시간은 [개인근무상황관리]에서 근무상황 ‘특별휴가 &gt; 육아시간’으로 신청합니다. 이 화면은 신청 내역을 조회합니다.</div><div class="search-box">${app.sf('년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-go">개인근무상황관리로 이동</button></div><div class="area"></div>`);
    const draw = () => { const rs = d.leaves.filter(l => l.sub === '육아시간'); H.$('.area', page).innerHTML = H.grid([{ t: '기간', w: 260 }, { t: '시간' }, { t: '대상자녀', w: 110 }, { t: '결재상태', w: 100 }], rs.map(l => `<tr><td>${l.from} ~ ${l.to}</td><td>${l.dur.h}시간 ${l.dur.m}분</td><td>${H.esc(l.child || '-')}</td><td>${Ap.badge(l.docId ? Ap.statusOf(l.docId) : '저장')}</td></tr>`).join('') || nodataRow(4, '육아시간 신청 내역이 없습니다.')); };
    page.__refresh = draw; draw();
    H.$('.b-search', page).onclick = draw; H.$('.b-go', page).onclick = () => app.openLeaf('개인근무상황관리');
  };
  S['육아시간실적조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('년도', `<select class="sel">${app.opts(['2026'])}</select>`, true)}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => { const by = {}; d.leaves.filter(l => l.sub === '육아시간' && l.docId && Ap.statusOf(l.docId) === '완결').forEach(l => { const m = l.from.slice(0, 7); by[m] = (by[m] || 0) + l.dur.h * 60 + l.dur.m; }); H.$('.area', page).innerHTML = H.grid([{ t: '월' }, { t: '사용시간', w: 160 }], Object.keys(by).sort().map(m => `<tr><td>${m}</td><td>${Math.floor(by[m] / 60)}시간 ${by[m] % 60}분</td></tr>`).join('') || nodataRow(2, '완결된 육아시간 실적이 없습니다.')); };
    page.__refresh = draw; draw(); H.$('.b-search', page).onclick = draw;
  };
})();
