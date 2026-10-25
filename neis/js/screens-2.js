/* 업무 화면 (2) — 학생생활(창체·행특·수상), 성적, 학생부, 생활통지표, 보건, 기타 */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const MAXB = 1500;
  const locked = () => !!((D().locks || {}).record);
  const lockMsg = () => A().alertBox('학교생활기록부 반마감 상태입니다.\n수정하려면 [학교생활기록부]-[자료검증 및 반마감]에서 마감을 취소하십시오.');

  /* ---------- 맞춤법·기재요령 점검(연수용 간이 검사) ---------- */
  const SPELL = [
    [/되요/g, '돼요'], [/할께/g, '할게'], [/몇일/g, '며칠'], [/않되/g, '안 되'], [/어의없/g, '어이없'], [/금새/g, '금세'], [/왠만/g, '웬만'], [/댓가/g, '대가'], [/역활/g, '역할'], [/희안/g, '희한'], [/  +/g, ' ']
  ];
  const BANNED = ['토익', 'TOEIC', '토플', '학원', '어학연수', '해외', '논문', '특허', '출간', '교외 수상', '부모님 직업', '아버지 직업', '어머니 직업'];
  function spellIssues(txt) {
    const out = [];
    SPELL.forEach(([re, fix]) => { const m = txt.match(re); if (m) out.push({ type: '맞춤법', found: m[0] === ' '.repeat(m[0].length) ? '연속 공백' : m[0], fix: fix === ' ' ? '공백 1칸' : fix }); });
    BANNED.forEach(w => { if (txt.includes(w)) out.push({ type: '기재요령', found: w, fix: '기재 금지 항목인지 확인 필요' }); });
    txt.split(/(?<=[.!?])\s+/).forEach(sn => { const t = sn.trim(); if (/(했다|하였다|이다|였다)\.?$/.test(t)) out.push({ type: '문체', found: t.slice(-6), fix: "명사형 종결어미(~함., ~임., ~음.) 권장" }); });
    return out;
  }
  function spellPopup(ta) {
    const app = A(); const orig = ta.value;
    const iss = spellIssues(ta.value);
    app.modal({ title: '맞춤법 검사 (연수용 간이 검사)', width: 640, body: (iss.length ? H.grid([{ t: '구분', w: 90 }, { t: '오류의심', w: 150 }, { t: '추천' }], iss.map(i => `<tr><td>${i.type}</td><td style="color:#b8264c">${H.esc(i.found)}</td><td class="l">${H.esc(i.fix)}</td></tr>`).join('')) : '<div class="nodata" style="padding:30px">오류가 의심되는 내용이 없습니다.</div>') + '<div class="info-box" style="margin-top:10px;font-size:12px">※ 연수용 간이 검사로, 실제 나이스 맞춤법 검사기와 결과가 다를 수 있습니다.</div>',
      buttons: [{ text: '추천 적용', cls: 'primary', onClick: () => { let v = ta.value; SPELL.forEach(([re, fix]) => { v = v.replace(re, fix); }); ta.value = v; ta.dispatchEvent(new Event('input')); app.toast('맞춤법 추천이 적용되었습니다.'); } }, { text: '원본복원', onClick: () => { ta.value = orig; ta.dispatchEvent(new Event('input')); } }, { text: '닫기' }] });
  }
  function ctxMenu(e, items) {
    e.preventDefault();
    document.querySelectorAll('.ctx').forEach(x => x.remove());
    const m = A().el(`<div class="ctx">${items.map(i => `<div>${H.esc(i[0])}</div>`).join('')}</div>`);
    m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
    H.$$('div', m).forEach((x, i) => { x.onclick = () => { m.remove(); items[i][1](); }; });
    document.body.appendChild(m);
  }
  function hunryeong(area) {
    const guide = {
      '자율·자치': '자율·자치활동 특기사항은 학생의 활동 참여도, 협력도, 활동 실적 등을 평가하여 실제적인 활동과 역할 위주로 구체적으로 기록한다.',
      '동아리': '동아리활동 특기사항은 학생의 참여도, 협력도, 열성도, 특별한 활동 실적 등을 평가하여 기록한다.',
      '진로': '진로활동 특기사항은 학생의 진로 희망 분야, 활동 참여 내용 및 결과를 중심으로 기록한다.',
      '행특': '행동특성 및 종합의견은 학생의 행동 특성과 학습·생활 전반에 대한 담임교사의 종합 의견을 누가기록된 내용을 바탕으로 문장으로 입력한다.'
    }[area] || '학교생활기록부 기재요령을 참고하여 입력한다.';
    A().modal({ title: '훈령정보조회', width: 560, body: `<div class="info-box"><b>[학교생활기록부 기재요령 — 연수용 요약]</b><br>${H.esc(guide)}<br><br>· 특기사항은 명사형 어미(~함., ~임., ~음.)로 종결하는 것을 원칙으로 함.<br>· 교외 수상, 어학시험 성적, 부모의 사회·경제적 지위 암시 내용 등은 기재할 수 없음.</div>` });
  }

  /* ---------- 창체/행특 공통 기록 화면 ---------- */
  function recordScreen(page, app, area, label) {
    const d = D();
    d.records[area] = d.records[area] || {};
    d.nuga = d.nuga || {}; d.nuga[area] = d.nuga[area] || [];
    d.nugaOn = d.nugaOn || {};
    if (d.nugaOn[area] === undefined) d.nugaOn[area] = true;
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">${app.commonSearch()}<div class="sf"><label>누가기록 작성</label><label><input type="radio" name="ng-${area}" value="1" ${d.nugaOn[area] ? 'checked' : ''}> ON</label>&nbsp;<label><input type="radio" name="ng-${area}" value="0" ${d.nugaOn[area] ? '' : 'checked'}> OFF</label></div>${app.searchBtn()}</div>
      <div class="tabs"><a class="on" data-t="rec">학생부자료기록</a><a data-t="nuga" ${d.nugaOn[area] ? '' : 'style="display:none"'}>누가기록</a></div>
      <div class="body"></div>`);
    let tab = 'rec';
    const body = H.$('.body', page);
    H.$$(`input[name="ng-${area}"]`, page).forEach(r => { r.onchange = () => { d.nugaOn[area] = r.value === '1'; app.Store.save(); H.$('.tabs a[data-t=nuga]', page).style.display = d.nugaOn[area] ? '' : 'none'; if (!d.nugaOn[area] && tab === 'nuga') { tab = 'rec'; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x.dataset.t === 'rec')); draw(); } }; });
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { tab = a.dataset.t; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); draw(); }; });
    const historyPopup = (no, ta) => {
      const s = H.stu(no);
      const list = d.nuga[area].filter(x => x.no === no);
      const hist = (d.recHist || []).filter(x => x.area === area && x.no === no);
      const m = app.modal({ title: `기록 및 이력 조회 - ${s.no}번 ${s.name}`, width: 760, body: `
        <div class="tabs"><a class="on" data-p="n">누가기록</a><a data-p="h">학생부수정이력</a>${area === '행특' ? '<a data-p="g">교과학습발달상황</a>' : ''}</div>
        <div class="pn">${H.grid([{ t: '', w: 40 }, { t: '일자', w: 110 }, { t: '내용' }], list.map((x, i) => `<tr><td><input type="checkbox" class="nk" data-i="${i}"></td><td>${x.date}</td><td class="l">${H.esc(x.text)}</td></tr>`).join('') || '<tr><td colspan="3">누가기록이 없습니다.</td></tr>', { h: 300 })}</div>
        <div class="ph" style="display:none">${H.grid([{ t: '수정일시', w: 150 }, { t: '내용' }], hist.map(x => `<tr><td>${x.at}</td><td class="l">${H.esc(x.text)}</td></tr>`).join('') || '<tr><td colspan="2">수정이력이 없습니다.</td></tr>', { h: 300 })}</div>
        <div class="pg" style="display:none">${H.grid([{ t: '교과', w: 90 }, { t: '성취수준 및 특기사항' }], Object.keys(d.dev || {}).map(sj => (d.dev[sj] || {})[no] ? `<tr><td>${sj}</td><td class="l">${H.esc(d.dev[sj][no])}</td></tr>` : '').join('') || '<tr><td colspan="2">입력된 교과학습발달상황이 없습니다.</td></tr>', { h: 300 })}</div>`,
        buttons: ta ? [{ text: '누가기록복사', cls: 'primary', onClick: () => copy('\n') }, { text: '누가기록복사(줄바꿈 없음)', cls: 'outline', onClick: () => copy(' ') }, { text: '닫기' }] : [{ text: '닫기' }] });
      const copy = sep => { const sel = H.$$('.nk', m.pop).filter(c => c.checked).map(c => list[+c.dataset.i].text); if (!sel.length) { app.alertBox('복사할 누가기록을 선택하십시오.'); return false; } ta.value = (ta.value ? ta.value + sep : '') + sel.join(sep); ta.dispatchEvent(new Event('input')); };
      H.$$('.tabs a', m.pop).forEach(a => { a.onclick = () => { H.$$('.tabs a', m.pop).forEach(x => x.classList.toggle('on', x === a)); ['n', 'h', 'g'].forEach(k => { const p = H.$('.p' + k, m.pop); if (p) p.style.display = a.dataset.p === k ? '' : 'none'; }); }; });
    };
    const drawRec = () => {
      body.innerHTML = `<div class="toolbar"><span class="total">Total <b>${d.students.length}</b></span>${locked() ? '<span class="badge red">반마감</span>' : ''}<span class="sp"></span>
        <button class="btn outline b-bulk">일괄적용</button><button class="btn outline b-rep">문자열바꾸기</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button><button class="btn b-print">${app.I.print}출력</button></div>
        ${H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: `${label} 특기사항 <span style="font-size:11px;color:#5d6b82">(최대 ${MAXB.toLocaleString()} Byte)</span>` }], d.students.map(s => { const v = d.records[area][s.no] || ''; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td class="link">${H.esc(s.name)}</td><td class="l"><textarea class="ta rec" data-bytes ${locked() ? 'readonly' : ''}>${H.esc(v)}</textarea>${H.bytesHtml(v, MAXB)}</td></tr>`; }).join(''), { h: 640 })}
        <div class="info-box" style="margin-top:10px;font-size:12px">※ 특기사항 입력란에서 <b>마우스 우클릭</b> 시 훈령정보조회·기록및이력조회·맞춤법검사를 사용할 수 있습니다. 한글 1자 = 3Byte, 영문·숫자·공백 = 1Byte, 줄바꿈 = 2Byte</div>`;
      H.bindBytes(body, MAXB);
      const all = H.$('.all', body); all.onchange = () => H.$$('.ck', body).forEach(c => { c.checked = all.checked; });
      H.$$('td.link', body).forEach(td => { td.onclick = () => historyPopup(+td.parentElement.dataset.no, H.$('.rec', td.parentElement)); });
      H.$$('.rec', body).forEach(ta => { ta.oncontextmenu = e => ctxMenu(e, [['훈령정보조회', () => hunryeong(area)], ['기록 및 이력조회', () => historyPopup(+ta.closest('tr').dataset.no, ta)], ['맞춤법검사', () => spellPopup(ta)]]); });
      H.$('.b-save', body).onclick = () => {
        if (locked()) { lockMsg(); return; }
        const over = H.$$('.rec', body).find(ta => app.nbytes(ta.value) > MAXB);
        if (over) { app.alertBox(`${H.stu(over.closest('tr').dataset.no).name} 학생의 입력 내용이 최대 입력 가능 Byte(${MAXB})를 초과하였습니다.`); return; }
        d.recHist = d.recHist || [];
        const now = new Date(); const at = `${H.dateStr(A().today())} ${A().pad(now.getHours())}:${A().pad(now.getMinutes())}`;
        H.$$('tbody tr', body).forEach(tr => { const no = +tr.dataset.no; const v = H.$('.rec', tr).value; if ((d.records[area][no] || '') !== v) { d.recHist.push({ area, no, at, text: d.records[area][no] || '(없음)' }); } if (v) d.records[area][no] = v; else delete d.records[area][no]; });
        H.save();
      };
      H.$('.b-del', body).onclick = () => { if (locked()) { lockMsg(); return; } const sel = H.$$('tbody tr', body).filter(tr => H.$('.ck', tr).checked); if (!sel.length) { app.alertBox('삭제할 학생을 선택하십시오.'); return; } app.confirmBox(`선택한 ${sel.length}명의 기록을 삭제하시겠습니까?`, () => { sel.forEach(tr => { delete d.records[area][tr.dataset.no]; }); app.Store.save(); drawRec(); app.toast('삭제되었습니다.'); }); };
      H.$('.b-bulk', body).onclick = () => {
        if (locked()) { lockMsg(); return; }
        const m = app.modal({ title: '일괄적용', width: 720, body: `<div class="info-box warn" style="font-size:12px">※ 기입력된 내용이 있는 경우 일괄적용한 내용으로 <b>덮어쓰기</b> 되므로 주의하십시오.</div><div class="split"><div class="left" style="width:220px">${H.grid([{ t: '<input type="checkbox" class="ba">', w: 40 }, { t: '번호', w: 50 }, { t: '성명' }], d.students.map(s => `<tr><td><input type="checkbox" class="bk" data-no="${s.no}"></td><td>${s.no}</td><td>${H.esc(s.name)}</td></tr>`).join(''), { h: 380 })}</div><div class="right"><textarea class="ta bv" data-bytes style="min-height:200px" placeholder="예) 학교 폭력 예방 캠페인에 참여하여 친구 사랑 서약서를 작성하고 실천 다짐을 발표함."></textarea>${H.bytesHtml('', MAXB)}</div></div>`,
          buttons: [{ text: '저장', cls: 'primary', onClick: () => { const nos = H.$$('.bk', m.pop).filter(c => c.checked).map(c => c.dataset.no); const v = H.$('.bv', m.pop).value; if (!nos.length) { app.alertBox('대상 학생을 선택하십시오.'); return false; } if (!v.trim()) { app.alertBox('특기사항 내용을 입력하십시오.'); return false; } nos.forEach(no => { const ta = H.$(`tr[data-no="${no}"] .rec`, body); ta.value = v; ta.dispatchEvent(new Event('input')); }); app.alertBox(`${nos.length}명에게 적용되었습니다.\n화면의 {저장} 버튼을 눌러 최종 저장하십시오.`); } }, { text: '닫기' }] });
        H.bindBytes(m.pop, MAXB);
        const ba = H.$('.ba', m.pop); ba.onchange = () => H.$$('.bk', m.pop).forEach(c => { c.checked = ba.checked; });
      };
      H.$('.b-rep', body).onclick = () => {
        if (locked()) { lockMsg(); return; }
        const m = app.modal({ title: '문자열바꾸기', width: 460, body: `<table class="form"><tr><th>찾을 내용</th><td><input class="inp f1" style="width:100%"></td></tr><tr><th>바꿀 내용</th><td><input class="inp f2" style="width:100%"></td></tr></table>`,
          buttons: [{ text: '적용', cls: 'primary', onClick: () => { const a = H.$('.f1', m.pop).value, b = H.$('.f2', m.pop).value; if (!a) { app.alertBox('찾을 내용을 입력하십시오.'); return false; } let n = 0; H.$$('.rec', body).forEach(ta => { if (ta.value.includes(a)) { ta.value = ta.value.split(a).join(b); ta.dispatchEvent(new Event('input')); n++; } }); app.alertBox(n ? `${n}명의 기록이 변경되었습니다.\n{저장} 버튼을 눌러 저장하십시오.` : '찾는 문자열이 없습니다.'); } }, { text: '닫기' }] });
      };
      H.$('.b-print', body).onclick = () => { const rows = d.students.map(s => `<tr><td style="text-align:center;width:50px">${s.no}</td><td style="text-align:center;width:80px">${H.esc(s.name)}</td><td>${H.esc(d.records[area][s.no] || '')}</td></tr>`).join(''); app.modal({ title: `${label} 학생부자료기록`, width: 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:18px;letter-spacing:2px">${label} 학생부자료기록</h2><p style="text-align:right">${d.year}학년도 5학년 2반</p><table><tr><th>번호</th><th>성명</th><th>특기사항</th></tr>${rows}</table></div></div>` }); };
    };
    let nSel = null;
    const drawNuga = () => {
      body.innerHTML = `<div class="split"><div class="left" style="width:240px">${H.stuList(nSel, s => d.nuga[area].filter(x => x.no === s.no).length + '건')}</div><div class="right"><div class="nbox">${app.nodata('학생을 선택하십시오.')}</div></div></div>`;
      H.$$('.left tr[data-no]', body).forEach(tr => { tr.onclick = () => { nSel = +tr.dataset.no; drawNuga(); }; });
      if (!nSel) return;
      const list = d.nuga[area].filter(x => x.no === nSel);
      H.$('.nbox', body).innerHTML = `<div class="sub-tit" style="margin-top:0">${H.esc(H.stu(nSel).name)} 누가기록 <small>${list.length}건</small></div>
        ${H.grid([{ t: '', w: 40 }, { t: '일자', w: 140 }, { t: '내용' }], list.map(x => `<tr><td><input type="checkbox" class="nk" data-id="${x.id}"></td><td>${x.date}</td><td class="l">${H.esc(x.text)}</td></tr>`).join('') || '<tr><td colspan="3">누가기록이 없습니다.</td></tr>', { h: 300 })}
        <div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn dark b-ndel">삭제</button></div>
        <table class="form"><tr><th class="req">*일자</th><td><input type="date" class="inp nd" value="2026-09-30"></td></tr><tr><th class="req">*내용</th><td><textarea class="ta nt" placeholder="관찰한 내용을 입력하세요. 예) 모둠 토의에서 사회자 역할을 맡아 친구들의 발언 기회를 골고루 배분함."></textarea></td></tr></table>
        <div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn primary b-nadd">저장</button></div>`;
      H.$('.b-nadd', body).onclick = () => { const t = H.$('.nt', body).value.trim(); const dt = H.$('.nd', body).value; if (!t || !dt) { app.alertBox('일자와 내용을 입력하십시오.'); return; } d.nuga[area].push({ id: Date.now(), no: nSel, date: dt.replace(/-/g, '.'), text: t }); d.nuga[area].sort((a, b) => a.date.localeCompare(b.date)); app.Store.save(); drawNuga(); app.toast('저장되었습니다.'); };
      H.$('.b-ndel', body).onclick = () => { const ids = H.$$('.nk', body).filter(c => c.checked).map(c => +c.dataset.id); if (!ids.length) { app.alertBox('삭제할 기록을 선택하십시오.'); return; } d.nuga[area] = d.nuga[area].filter(x => !ids.includes(x.id)); app.Store.save(); drawNuga(); };
    };
    const draw = () => (tab === 'rec' ? drawRec() : drawNuga());
    H.$('.b-search', page).onclick = draw;
    draw();
  }
  S['자율·자치활동관리'] = (p, t, app) => recordScreen(p, app, '자율·자치', '자율·자치활동');
  S['진로활동관리'] = (p, t, app) => recordScreen(p, app, '진로', '진로활동');
  S['동아리활동관리'] = (p, t, app) => recordScreen(p, app, '동아리', '동아리활동');
  S['동아리활동관리(전입생용)'] = (p, t, app) => recordScreen(p, app, '동아리', '동아리활동(전입생)');
  S['행동특성및종합의견'] = (p, t, app) => recordScreen(p, app, '행특', '행동특성 및 종합의견');
  const CLUBS = ['농구부', '코딩부', '합창부', '미술부', '과학탐구부', '독서토론부'];
  S['동아리활동반별조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 60 }, { t: '성명', w: 100 }, { t: '동아리부서', w: 140 }, { t: '담당교사', w: 110 }, { t: '특기사항' }], d.students.map((s, i) => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td>${CLUBS[i % CLUBS.length]}</td><td>${['안한수', '마이콜', '나미리', '변태수', '봉미선', window.NEIS_ME][i % 6]}</td><td class="l">${H.esc((d.records['동아리'] || {})[s.no] || '')}</td></tr>`).join(''), { h: 620 }); };
  };
  S['학생부자료기록'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.sf('영역', `<select class="sel s-a">${app.opts(['자율·자치', '동아리', '진로'])}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const a = H.$('.s-a', page).value; H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 60 }, { t: '성명', w: 100 }, { t: '특기사항' }, { t: 'Byte', w: 90 }], d.students.map(s => { const v = (d.records[a] || {})[s.no] || ''; return `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td class="l">${H.esc(v)}</td><td>${app.nbytes(v)}</td></tr>`; }).join(''), { h: 620 }); };
  };
  S['봉사활동실적관리'] = function (page, title, app) {
    const d = D(); d.volunteer = d.volunteer || [{ no: 8, date: '2026.09.16', org: '(학교)미동초등학교', content: '교내 환경 정화 활동', hours: 2 }];
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>`);
    let rows = d.volunteer.map(x => Object.assign({}, x));
    const draw = () => {
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '학생', w: 140 }, { t: '일자', w: 150 }, { t: '장소 또는 주관기관명', w: 220 }, { t: '활동내용' }, { t: '시간', w: 80 }], rows.map((r, i) => `<tr data-i="${i}"><td><input type="checkbox" class="ck"></td><td><select class="sel f" data-f="no">${app.opts(d.students.map(s => [s.no, `${s.no} ${s.name}`]), r.no)}</select></td><td><input class="inp f" data-f="date" value="${H.esc(r.date)}"></td><td><input class="inp f" data-f="org" value="${H.esc(r.org)}"></td><td><input class="inp f" data-f="content" value="${H.esc(r.content)}"></td><td><input class="inp f" data-f="hours" value="${H.esc(r.hours)}"></td></tr>`).join('') || '<tr><td colspan="6">등록된 봉사활동실적이 없습니다.</td></tr>');
      H.$$('.f', page).forEach(f => { f.onchange = () => { rows[+f.closest('tr').dataset.i][f.dataset.f] = f.dataset.f === 'no' ? +f.value : f.value; }; });
    };
    draw();
    H.$('.b-search', page).onclick = () => { rows = d.volunteer.map(x => Object.assign({}, x)); draw(); };
    H.$('.b-add', page).onclick = () => { rows.push({ no: 1, date: '2026.09.30', org: '(학교)미동초등학교', content: '', hours: 1 }); draw(); };
    H.$('.b-del', page).onclick = () => { const idx = H.$$('.ck', page).map((c, i) => c.checked ? i : -1).filter(i => i >= 0); rows = rows.filter((r, i) => !idx.includes(i)); draw(); };
    H.$('.b-save', page).onclick = () => { d.volunteer = rows; H.save(); };
  };
  S['학급별수상관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="info-box">수상대장은 [생활부장]-[학생생활]-[수상경력]-[수상대장관리]에서 담당자가 등록하며, 학급담임은 소속 학생의 수상 내역을 확인합니다.</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const rows = []; d.awards.forEach(a => a.students.forEach(no => rows.push({ a, s: H.stu(no) }))); H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 60 }, { t: '성명', w: 90 }, { t: '수상명' }, { t: '등급(위)', w: 100 }, { t: '수상연월일', w: 110 }, { t: '수여기관', w: 140 }, { t: '참가대상(참가인원)', w: 150 }], rows.sort((x, y) => x.s.no - y.s.no).map(({ a, s }) => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td class="l">${H.esc(a.name)}</td><td>${H.esc(a.grade)}</td><td>${a.date}</td><td>${H.esc(a.org)}</td><td>${H.esc(a.target)}</td></tr>`).join('')); };
  };
  S['수상대장관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ grade: false, cls: false })}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">수상등록</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '순번', w: 60 }, { t: '수상명' }, { t: '등급(위)', w: 100 }, { t: '수상일자', w: 110 }, { t: '수여기관', w: 140 }, { t: '참가대상', w: 140 }, { t: '수상자', w: 200 }], d.awards.map((a, i) => `<tr><td>${i + 1}</td><td class="l">${H.esc(a.name)}</td><td>${H.esc(a.grade)}</td><td>${a.date}</td><td>${H.esc(a.org)}</td><td>${H.esc(a.target)}</td><td class="l">${a.students.map(no => H.stu(no).name).join(', ')}</td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => {
      const m = app.modal({ title: '수상 등록', width: 620, body: `<table class="form"><tr><th class="req">*수상명</th><td><input class="inp a1" style="width:100%" placeholder="예) 교내 글짓기 대회"></td></tr><tr><th class="req">*등급(위)</th><td><input class="inp a2" placeholder="예) 최우수상"></td></tr><tr><th class="req">*수상일자</th><td><input type="date" class="inp a3" value="2026-09-30"></td></tr><tr><th>수여기관</th><td><input class="inp a4" value="미동초등학교장"></td></tr><tr><th>참가대상</th><td><input class="inp a5" value="5학년(45명)"></td></tr><tr><th class="req">*수상자</th><td>${d.students.map(s => `<label style="display:inline-block;width:92px"><input type="checkbox" class="ak" value="${s.no}"> ${H.esc(s.name)}</label>`).join('')}</td></tr></table>`,
        buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = k => H.$('.' + k, m.pop).value.trim(); const st = H.$$('.ak', m.pop).filter(c => c.checked).map(c => +c.value); if (!v('a1') || !v('a2') || !st.length) { app.alertBox('필수 항목을 입력하십시오.'); return false; } d.awards.push({ name: v('a1'), grade: v('a2'), date: v('a3').replace(/-/g, '.'), org: v('a4'), target: v('a5'), students: st }); app.Store.save(); draw(); app.toast('저장되었습니다.'); } }, { text: '닫기' }] });
    };
  };

  /* =============== 성적 =============== */
  const STEPS = ['매우잘함', '잘함', '보통', '노력요함'];
  S['평가계획(안)관리'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="flow"><div class="step on"><span class="no">1</span>평가준거 성취기준관리</div><div class="step on"><span class="no">2</span>평가기준관리</div><div class="step"><span class="no">3</span>평가계획(안) 확인</div></div>
      <div class="search-box">${app.commonSearch({ cls: false, sem: true })}${app.sf('교과', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn primary b-save">저장</button></div>
      <div class="area"></div><div class="sub-tit">평가기준 <small>성취기준을 선택하면 단계별 평가기준을 입력할 수 있습니다.</small></div><div class="crit">${app.nodata('성취기준을 선택하십시오.')}</div>`);
    let rows = [], sel = -1;
    const draw = () => {
      H.$('.area', page).innerHTML = H.grid([{ t: '순번', w: 60 }, { t: '영역', w: 130 }, { t: '성취기준코드', w: 130 }, { t: '성취기준' }], rows.map((r, i) => `<tr data-i="${i}" class="${i === sel ? 'sel' : ''}"><td>${i + 1}</td><td><input class="inp f" data-f="area" value="${H.esc(r.area)}"></td><td><input class="inp f" data-f="code" value="${H.esc(r.code)}"></td><td><input class="inp f" data-f="text" value="${H.esc(r.text)}"></td></tr>`).join('') || '<tr><td colspan="4">등록된 성취기준이 없습니다.</td></tr>');
      H.$$('tbody tr[data-i]', page).forEach(tr => { tr.onclick = () => { sel = +tr.dataset.i; H.$$('tbody tr', page).forEach(x => x.classList.toggle('sel', x === tr)); crit(); }; });
      H.$$('.f', page).forEach(f => { f.oninput = () => { rows[+f.closest('tr').dataset.i][f.dataset.f] = f.value; }; });
    };
    const crit = () => { const r = rows[sel]; if (!r) { H.$('.crit', page).innerHTML = app.nodata('성취기준을 선택하십시오.'); return; } r.steps = r.steps || {}; H.$('.crit', page).innerHTML = `<table class="form">${STEPS.map(s => `<tr><th>${s}</th><td><input class="inp st" data-s="${s}" style="width:100%" value="${H.esc(r.steps[s] || '')}"></td></tr>`).join('')}</table>`; H.$$('.st', page).forEach(i => { i.oninput = () => { r.steps[i.dataset.s] = i.value; }; }); };
    const load = () => { const sj = H.$('.s-subj', page).value; rows = d.standards.filter(x => x.subj === sj).map(x => JSON.parse(JSON.stringify(x))); sel = -1; draw(); crit(); };
    load();
    H.$('.b-search', page).onclick = load;
    H.$('.b-add', page).onclick = () => { rows.push({ subj: H.$('.s-subj', page).value, area: '', code: '', text: '', steps: {} }); sel = rows.length - 1; draw(); crit(); };
    H.$('.b-save', page).onclick = () => { const sj = H.$('.s-subj', page).value; if (rows.some(r => !r.code || !r.text)) { app.alertBox('성취기준코드와 성취기준을 입력하십시오.'); return; } d.standards = d.standards.filter(x => x.subj !== sj).concat(rows); H.save(); };
  };
  S['평가계획(안)관리(반별)'] = S['평가계획(안)관리'];
  S['예시문'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('구분', `<select class="sel s-c">${app.opts([['', '전체'], '교과', '행특', '창체'], '')}</select>`)}${app.sf('검색어', '<input class="inp s-q" style="width:220px">')}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>`);
    let rows = d.examples.map((x, i) => Object.assign({ i }, x));
    const draw = () => {
      const c = H.$('.s-c', page).value, q = H.$('.s-q', page).value.trim();
      const view = rows.filter(r => (!c || r.cat === c) && (!q || r.text.includes(q)));
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '구분', w: 100 }, { t: '교과', w: 100 }, { t: '예시문' }], view.map(r => `<tr data-i="${rows.indexOf(r)}"><td><input type="checkbox" class="ck"></td><td><select class="sel f" data-f="cat">${app.opts(['교과', '행특', '창체'], r.cat)}</select></td><td><input class="inp f" data-f="subj" value="${H.esc(r.subj)}"></td><td><input class="inp f" data-f="text" value="${H.esc(r.text)}"></td></tr>`).join(''), { h: 560 });
      H.$$('.f', page).forEach(f => { f.oninput = f.onchange = () => { rows[+f.closest('tr').dataset.i][f.dataset.f] = f.value; }; });
    };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { rows.push({ cat: '교과', subj: '', text: '' }); H.$('.s-c', page).value = ''; H.$('.s-q', page).value = ''; draw(); };
    H.$('.b-del', page).onclick = () => { const idx = H.$$('tbody tr', page).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.i); rows = rows.filter((r, i) => !idx.includes(i)); draw(); };
    H.$('.b-save', page).onclick = () => { d.examples = rows.filter(r => r.text).map(r => ({ cat: r.cat, subj: r.subj, text: r.text })); H.save(); };
  };
  function examplePopup(app, cat, subj, onPick) {
    const d = D();
    const list = d.examples.filter(x => x.cat === cat && (!subj || !x.subj || x.subj === subj));
    const m = app.modal({ title: '예시문 검색', width: 680, body: H.grid([{ t: '', w: 40 }, { t: '교과', w: 80 }, { t: '예시문' }], list.map((x, i) => `<tr><td><input type="radio" name="ex" value="${i}"></td><td>${H.esc(x.subj)}</td><td class="l">${H.esc(x.text)}</td></tr>`).join('') || '<tr><td colspan="3">예시문이 없습니다. [성적]-[평가계획]-[예시문]에서 등록하세요.</td></tr>', { h: 360 }),
      buttons: [{ text: '반영', cls: 'primary', onClick: () => { const r = H.$('input[name=ex]:checked', m.pop); if (!r) { app.alertBox('예시문을 선택하십시오.'); return false; } onPick(list[+r.value].text); } }, { text: '닫기' }] });
  }
  S['교과평가'] = function (page, title, app) {
    const d = D(); d.grades = d.grades || {};
    page.insertAdjacentHTML('beforeend', `<div class="tabs"><a class="on" data-t="std">성취기준별 평가</a><a data-t="area">영역별 평가</a><a data-t="subj">교과별 평가</a></div>
      <div class="search-box">${app.commonSearch({ sem: true })}${app.sf('교과(목)', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}<span class="std-f">${app.sf('성취기준', '<select class="sel s-std" style="width:320px"></select>', true)}</span>${app.searchBtn()}</div>
      <div class="body">${app.nodata()}</div>`);
    let tab = 'std';
    const fillStd = () => { const sj = H.$('.s-subj', page).value; H.$('.s-std', page).innerHTML = app.opts(d.standards.filter(x => x.subj === sj).map(x => [x.code, `${x.code} ${x.text}`])) || '<option value="">(평가계획에 등록된 성취기준 없음)</option>'; };
    fillStd();
    H.$('.s-subj', page).onchange = fillStd;
    H.$$('.tabs a', page).forEach(a => { a.onclick = () => { tab = a.dataset.t; H.$$('.tabs a', page).forEach(x => x.classList.toggle('on', x === a)); H.$('.std-f', page).style.display = tab === 'std' ? '' : 'none'; H.$('.body', page).innerHTML = app.nodata(); }; });
    const body = H.$('.body', page);
    const drawStd = () => {
      const code = H.$('.s-std', page).value; const std = d.standards.find(x => x.code === code);
      if (!std) { body.innerHTML = app.nodata('선택한 교과에 등록된 성취기준이 없습니다. [평가계획(안)관리]를 먼저 입력하십시오.'); return; }
      const g = d.grades[code] = d.grades[code] || {};
      body.innerHTML = `<div class="info-box"><b>${H.esc(std.code)}</b> ${H.esc(std.text)} <span class="badge">${H.esc(std.area)}</span></div>
        <div class="toolbar"><span class="total">Total <b>${d.students.length}</b></span><span style="margin-left:14px">일괄적용 단계</span><select class="sel s-bstep" style="min-width:120px">${app.opts(STEPS)}</select><button class="btn outline b-apply">선택적용</button><span class="sp"></span><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button><button class="btn b-print">${app.I.print}출력</button><button class="btn green b-svc">학생/학부모서비스 반영</button></div>
        ${H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '단계', w: 130 }, { t: '평가결과' }], d.students.map(s => { const r = g[s.no] || {}; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${H.esc(s.name)}</td><td><select class="sel stp">${app.opts([['', '선택']].concat(STEPS).concat(['임의입력']), r.step || '')}</select></td><td><input class="inp res" value="${H.esc(r.text || '')}" ${r.step === '임의입력' ? '' : 'readonly'}></td></tr>`; }).join(''), { h: 560 })}`;
      const all = H.$('.all', body); all.onchange = () => H.$$('.ck', body).forEach(c => { c.checked = all.checked; });
      const setRow = (tr, step) => { H.$('.stp', tr).value = step; const res = H.$('.res', tr); if (step === '임의입력') { res.readOnly = false; res.focus(); } else { res.readOnly = true; res.value = step ? (std.steps[step] || '') : ''; } };
      H.$$('.stp', body).forEach(s => { s.onchange = () => setRow(s.closest('tr'), s.value); });
      H.$('.b-apply', body).onclick = () => { const sel = H.$$('tbody tr', body).filter(tr => H.$('.ck', tr).checked); if (!sel.length) { app.alertBox('평가결과를 적용할 학생을 선택하십시오.'); return; } sel.forEach(tr => setRow(tr, H.$('.s-bstep', body).value)); app.toast(`${sel.length}명에게 적용되었습니다.`); };
      H.$('.b-save', body).onclick = () => { H.$$('tbody tr', body).forEach(tr => { const st = H.$('.stp', tr).value; if (st) g[tr.dataset.no] = { step: st, text: H.$('.res', tr).value }; else delete g[tr.dataset.no]; }); H.save(); };
      H.$('.b-del', body).onclick = () => { const sel = H.$$('tbody tr', body).filter(tr => H.$('.ck', tr).checked); if (!sel.length) { app.alertBox('삭제할 학생을 선택하십시오.'); return; } sel.forEach(tr => { delete g[tr.dataset.no]; setRow(tr, ''); }); app.Store.save(); app.toast('삭제되었습니다.'); };
      H.$('.b-print', body).onclick = () => window.print();
      H.$('.b-svc', body).onclick = () => { const n = Object.keys(g).length; if (!n) { app.alertBox('교과평가 결과가 한 명도 입력되지 않아 학생/학부모서비스에 반영할 수 없습니다.'); return; } app.alertBox(`학생/학부모서비스에 ${n}명의 교과평가 결과가 반영되었습니다.(연수용)`); };
    };
    const drawAgg = byArea => {
      const sj = H.$('.s-subj', page).value; const stds = d.standards.filter(x => x.subj === sj);
      if (!stds.length) { body.innerHTML = app.nodata('등록된 성취기준이 없습니다.'); return; }
      const groups = byArea ? [...new Set(stds.map(x => x.area))] : [sj];
      body.innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(stds.map(x => ({ t: `<span style="font-size:11px">${H.esc(x.code)}</span>` }))), d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td>${stds.map(x => `<td>${H.esc(((d.grades[x.code] || {})[s.no] || {}).step || '')}</td>`).join('')}</tr>`).join(''), { h: 560 }) + `<div class="info-box" style="margin-top:10px">${byArea ? '영역' : '교과'}: ${groups.map(H.esc).join(', ')} — 성취기준별 평가 결과를 모아 보여 줍니다.</div>`;
    };
    H.$('.b-search', page).onclick = () => (tab === 'std' ? drawStd() : drawAgg(tab === 'area'));
  };
  S['학기말종합의견'] = function (page, title, app) {
    const d = D(); d.semOp = d.semOp || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('교과', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div><div class="body">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => {
      const sj = H.$('.s-subj', page).value; const op = d.semOp[sj] = d.semOp[sj] || {};
      const body = H.$('.body', page);
      body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn outline b-pull">교과평가 가져오기</button><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: `${sj} 학기말종합의견` }], d.students.map(s => `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${H.esc(s.name)}</td><td class="l"><textarea class="ta v" data-bytes>${H.esc(op[s.no] || '')}</textarea>${H.bytesHtml(op[s.no] || '', MAXB)}</td></tr>`).join(''), { h: 600 });
      H.bindBytes(body, MAXB);
      const all = H.$('.all', body); all.onchange = () => H.$$('.ck', body).forEach(c => { c.checked = all.checked; });
      H.$('.b-pull', body).onclick = () => { const stds = d.standards.filter(x => x.subj === sj); let n = 0; H.$$('tbody tr', body).forEach(tr => { if (!H.$('.ck', tr).checked) return; const txt = stds.map(x => ((d.grades || {})[x.code] || {})[tr.dataset.no]).filter(Boolean).map(r => r.text).join(' '); if (txt) { const ta = H.$('.v', tr); ta.value = txt; ta.dispatchEvent(new Event('input')); n++; } }); app.alertBox(n ? `${n}명의 교과평가 결과를 가져왔습니다.` : '선택한 학생 중 교과평가 결과가 입력된 학생이 없습니다.\n(학생을 체크한 후 사용하십시오.)'); };
      H.$('.b-save', body).onclick = () => { H.$$('tbody tr', body).forEach(tr => { const v = H.$('.v', tr).value; if (v) op[tr.dataset.no] = v; else delete op[tr.dataset.no]; }); H.save(); };
    };
  };
  S['교과학습발달상황'] = function (page, title, app) {
    const d = D(); d.dev = d.dev || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('교과', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-miss">등록누락자조회</button><button class="btn outline b-bulk">일괄저장</button><button class="btn b-print">${app.I.print}출력</button></div>
      <div class="split"><div class="left" style="width:240px"><div class="list">${app.nodata()}</div></div><div class="right"><div class="det">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    let sj = null, sel = null;
    const drawList = () => { const dv = d.dev[sj] || {}; H.$('.list', page).innerHTML = H.stuList(sel, s => dv[s.no] ? '<span class="badge green">입력</span>' : '<span class="badge">미입력</span>'); H.$$('.list tr[data-no]', page).forEach(tr => { tr.onclick = () => { sel = +tr.dataset.no; drawList(); drawDet(); }; }); };
    const drawDet = () => {
      const box = H.$('.det', page); if (!sel) { box.innerHTML = app.nodata('학생을 선택하십시오.'); return; }
      const dv = d.dev[sj] = d.dev[sj] || {}; const s = H.stu(sel); const v = dv[sel] || '';
      box.innerHTML = `<div class="sub-tit" style="margin-top:0">${s.no}번 ${H.esc(s.name)} <small>${sj}</small>${locked() ? '<span class="badge red">반마감</span>' : ''}<span class="sp"></span><button class="btn outline b-ex">예시문</button><button class="btn outline b-edit">평가자료편집입력</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div>
        <table class="form"><tr><th>교과</th><td>${sj}</td></tr><tr><th class="req">*성취수준 및<br>특기사항</th><td><textarea class="ta v" data-bytes style="min-height:180px" ${locked() ? 'readonly' : ''}>${H.esc(v)}</textarea>${H.bytesHtml(v, MAXB)}</td></tr></table>
        <div class="info-box" style="margin-top:10px;font-size:12px">※ 2026학년도부터 ‘세부능력 및 특기사항’ 항목명이 ‘성취수준 및 특기사항’으로 변경되었습니다. 입력란 우클릭 시 맞춤법검사를 사용할 수 있습니다.</div>`;
      H.bindBytes(box, MAXB);
      const ta = H.$('.v', box);
      ta.oncontextmenu = e => ctxMenu(e, [['훈령정보조회', () => hunryeong('교과')], ['맞춤법검사', () => spellPopup(ta)]]);
      H.$('.b-save', box).onclick = () => { if (locked()) { lockMsg(); return; } if (app.nbytes(ta.value) > MAXB) { app.alertBox('최대 입력 가능 Byte를 초과하였습니다.'); return; } if (ta.value) dv[sel] = ta.value; else delete dv[sel]; H.save(); drawList(); };
      H.$('.b-del', box).onclick = () => { if (locked()) { lockMsg(); return; } app.confirmBox('해당 학생의 교과학습발달상황을 삭제하시겠습니까?', () => { delete dv[sel]; app.Store.save(); drawList(); drawDet(); }); };
      H.$('.b-ex', box).onclick = () => examplePopup(app, '교과', sj, t => { ta.value = ta.value ? ta.value + ' ' + t : t; ta.dispatchEvent(new Event('input')); });
      H.$('.b-edit', box).onclick = () => {
        const stds = d.standards.filter(x => x.subj === sj);
        const items = [];
        const op = ((d.semOp || {})[sj] || {})[sel]; if (op) items.push(['학기말종합의견', op]);
        (d.obs || []).filter(o => o.no === sel && o.subj === sj).forEach(o => items.push([`관찰내용(${o.date})`, o.text]));
        stds.forEach(x => { const r = ((d.grades || {})[x.code] || {})[sel]; if (r) items.push([`교과평가 ${x.code} (${r.step})`, r.text]); });
        const m = app.modal({ title: `평가자료 편집입력 - ${s.name} (${sj})`, width: 900, body: `<div class="split"><div class="left" style="width:430px">${H.grid([{ t: '', w: 36 }, { t: '구분', w: 130 }, { t: '내용' }], items.map((it, i) => `<tr><td><input type="checkbox" class="ik" data-i="${i}"></td><td style="font-size:12px">${H.esc(it[0])}</td><td class="l" style="font-size:12px">${H.esc(it[1])}</td></tr>`).join('') || '<tr><td colspan="3">학기말종합의견·관찰내용·교과평가 자료가 없습니다.</td></tr>', { h: 400 })}</div><div class="right"><b>성취수준 및 특기사항</b><textarea class="ta pv" data-bytes style="min-height:330px;margin-top:6px">${H.esc(ta.value)}</textarea>${H.bytesHtml(ta.value, MAXB)}</div></div>`,
          buttons: [{ text: '반영', cls: 'primary', onClick: () => { ta.value = H.$('.pv', m.pop).value; ta.dispatchEvent(new Event('input')); app.toast('반영되었습니다. {저장}을 눌러 저장하십시오.'); } }, { text: '닫기' }] });
        H.bindBytes(m.pop, MAXB);
        H.$$('.ik', m.pop).forEach(c => { c.onchange = () => { if (!c.checked) return; const pv = H.$('.pv', m.pop); pv.value = (pv.value ? pv.value + ' ' : '') + items[+c.dataset.i][1]; pv.dispatchEvent(new Event('input')); }; });
      };
    };
    H.$('.b-search', page).onclick = () => { sj = H.$('.s-subj', page).value; sel = null; drawList(); drawDet(); };
    H.$('.b-miss', page).onclick = () => { if (!sj) { app.alertBox('먼저 조회하십시오.'); return; } const dv = d.dev[sj] || {}; const miss = d.students.filter(s => !dv[s.no]); app.modal({ title: '교과학습발달상황 누락자 조회', width: 420, body: H.grid([{ t: '번호', w: 60 }, { t: '성명' }, { t: '교과', w: 90 }], miss.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td>${sj}</td></tr>`).join('') || '<tr><td colspan="3">누락자가 없습니다.</td></tr>', { h: 400 }) }); };
    H.$('.b-bulk', page).onclick = () => { if (!sj) { app.alertBox('먼저 조회하십시오.'); return; } if (locked()) { lockMsg(); return; } const op = (d.semOp || {})[sj] || {}; const nos = Object.keys(op); if (!nos.length) { app.alertBox(`${sj} 학기말종합의견이 입력된 학생이 없습니다.\n[학기말종합의견]을 먼저 입력하십시오.`); return; } app.confirmBox(`${sj} 학기말종합의견을 ${nos.length}명의 교과학습발달상황으로 일괄저장하시겠습니까?\n(기존 입력 내용은 덮어쓰기 됩니다.)`, () => { d.dev[sj] = d.dev[sj] || {}; nos.forEach(no => { d.dev[sj][no] = op[no]; }); app.Store.save(); drawList(); drawDet(); app.alertBox('일괄저장되었습니다.'); }); };
    H.$('.b-print', page).onclick = () => { if (!sj) { app.alertBox('먼저 조회하십시오.'); return; } const dv = d.dev[sj] || {}; app.modal({ title: `교과학습발달상황 출력 (${sj})`, width: 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:18px">교과학습발달상황 (${sj})</h2><table><tr><th style="width:50px">번호</th><th style="width:80px">성명</th><th>성취수준 및 특기사항</th></tr>${d.students.map(s => `<tr><td style="text-align:center">${s.no}</td><td style="text-align:center">${H.esc(s.name)}</td><td>${H.esc(dv[s.no] || '')}</td></tr>`).join('')}</table></div></div>` }); };
  };
  S['관찰내용관리'] = function (page, title, app) {
    const d = D(); d.obs = d.obs || [{ id: 1, no: 8, subj: '국어', date: '2026.09.15', text: '토의 수업에서 엉뚱하지만 참신한 해결 방안을 제시하여 친구들의 호응을 얻음.' }];
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('교과', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div><div class="split"><div class="left" style="width:240px"><div class="list"></div></div><div class="right"><div class="det">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    let sel = null;
    const sj = () => H.$('.s-subj', page).value;
    const drawList = () => { H.$('.list', page).innerHTML = H.stuList(sel, s => d.obs.filter(o => o.no === s.no && o.subj === sj()).length + '건'); H.$$('.list tr[data-no]', page).forEach(tr => { tr.onclick = () => { sel = +tr.dataset.no; drawList(); drawDet(); }; }); };
    const drawDet = () => {
      const box = H.$('.det', page); if (!sel) { box.innerHTML = app.nodata('학생을 선택하십시오.'); return; }
      const list = d.obs.filter(o => o.no === sel && o.subj === sj());
      box.innerHTML = `<div class="sub-tit" style="margin-top:0">${H.esc(H.stu(sel).name)} 관찰내용 <small>${sj()}</small></div>${H.grid([{ t: '', w: 40 }, { t: '일자', w: 110 }, { t: '관찰내용' }], list.map(o => `<tr><td><input type="checkbox" class="ck" data-id="${o.id}"></td><td>${o.date}</td><td class="l">${H.esc(o.text)}</td></tr>`).join('') || '<tr><td colspan="3">관찰내용이 없습니다.</td></tr>', { h: 260 })}
        <div class="toolbar" style="margin-top:6px"><span class="sp"></span><button class="btn dark b-del">삭제</button></div>
        <table class="form"><tr><th class="req">*일자</th><td><input type="date" class="inp od" value="2026-09-30"></td></tr><tr><th class="req">*관찰내용</th><td><textarea class="ta ot"></textarea></td></tr></table><div class="toolbar" style="margin-top:6px"><span class="sp"></span><button class="btn primary b-add">저장</button></div>`;
      H.$('.b-add', box).onclick = () => { const t = H.$('.ot', box).value.trim(); if (!t) { app.alertBox('관찰내용을 입력하십시오.'); return; } d.obs.push({ id: Date.now(), no: sel, subj: sj(), date: H.$('.od', box).value.replace(/-/g, '.'), text: t }); app.Store.save(); drawList(); drawDet(); app.toast('저장되었습니다.'); };
      H.$('.b-del', box).onclick = () => { const ids = H.$$('.ck', box).filter(c => c.checked).map(c => +c.dataset.id); d.obs = d.obs.filter(o => !ids.includes(o.id)); app.Store.save(); drawList(); drawDet(); };
    };
    H.$('.b-search', page).onclick = () => { drawList(); drawDet(); };
    drawList();
  };
  S['교과별성적조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('교과', `<select class="sel s-subj">${H.subjOpts('국어')}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const sj = H.$('.s-subj', page).value; const stds = d.standards.filter(x => x.subj === sj); H.$('.area', page).innerHTML = stds.length ? H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(stds.map(x => ({ t: `<span title="${H.esc(x.text)}">${H.esc(x.code)}</span>` }))), d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td>${stds.map(x => `<td>${H.esc(((d.grades || {})[x.code] || {})[s.no] ? d.grades[x.code][s.no].step : '')}</td>`).join('')}</tr>`).join(''), { h: 600 }) : app.nodata('등록된 성취기준이 없습니다.'); };
  };
  S['개인별성적조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('학생', `<select class="sel s-no">${app.opts(d.students.map(s => [s.no, `${s.no} ${s.name}`]), 8)}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const no = +H.$('.s-no', page).value; H.$('.area', page).innerHTML = H.grid([{ t: '교과', w: 80 }, { t: '영역', w: 110 }, { t: '성취기준', w: 320 }, { t: '단계', w: 90 }, { t: '평가결과' }], d.standards.map(x => { const r = ((d.grades || {})[x.code] || {})[no] || {}; return `<tr><td>${x.subj}</td><td>${H.esc(x.area)}</td><td class="l">${H.esc(x.code + ' ' + x.text)}</td><td>${H.esc(r.step || '')}</td><td class="l">${H.esc(r.text || '')}</td></tr>`; }).join('')); };
  };
  S['수행영역분석표'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = H.grid([{ t: '교과', w: 80 }, { t: '성취기준' }].concat(STEPS.map(s => ({ t: s, w: 90 }))).concat([{ t: '미입력', w: 80 }]), d.standards.map(x => { const g = (d.grades || {})[x.code] || {}; const c = {}; Object.values(g).forEach(r => { c[r.step] = (c[r.step] || 0) + 1; }); return `<tr><td>${x.subj}</td><td class="l">${H.esc(x.code)}</td>${STEPS.map(s => `<td>${c[s] || 0}</td>`).join('')}<td>${d.students.length - Object.keys(g).length}</td></tr>`; }).join('')); };
  };

  /* =============== 학생부 =============== */
  const REC_ITEMS = ['인적·학적사항', '출결상황', '창체-자율·자치활동', '창체-동아리활동', '창체-진로활동', '교과학습발달상황', '행동특성및종합의견'];
  function validate() {
    const d = D(); const out = [];
    const MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
    const openM = MONTHS.filter(m => !H.attClosed(m));
    d.students.forEach(s => {
      const add = (item, msg) => out.push({ item, no: s.no, name: s.name, msg });
      if (!s.addr) add('인적·학적사항', '주소 미입력');
      [['창체-자율·자치활동', '자율·자치'], ['창체-동아리활동', '동아리'], ['창체-진로활동', '진로'], ['행동특성및종합의견', '행특']].forEach(([it, k]) => {
        const v = (d.records[k] || {})[s.no] || '';
        if (!v) add(it, '특기사항 미입력');
        else { if (A().nbytes(v) > MAXB) add(it, `최대 Byte 초과(${A().nbytes(v)})`); spellIssues(v).filter(i => i.type === '기재요령').forEach(i => add(it, `기재 금지 의심 단어: ${i.found}`)); }
      });
      ['국어', '수학', '사회', '과학'].forEach(sj => { if (!((d.dev || {})[sj] || {})[s.no]) add('교과학습발달상황', `${sj} 성취수준 및 특기사항 미입력`); });
    });
    if (openM.length) out.push({ item: '출결상황', no: '-', name: '학급 전체', msg: `출결 미마감 월: ${openM.map(m => +m.slice(5) + '월').join(', ')}` });
    return out;
  }
  S['학교생활기록부'] = function (page, title, app) {
    const d = D(); d.locks = d.locks || {};
    const steps = [['reflect', '학생부반영'], ['verify', '자료검증 및 반마감'], ['result', '검증결과조회'], ['view', '학생부 조회 및 출력'], ['item', '학생부 항목별 조회']];
    page.insertAdjacentHTML('beforeend', `<div class="flow">${steps.map(([k, t], i) => `<div class="step ${i === 1 ? 'on' : ''}" data-s="${k}"><span class="no">${i + 1}</span>${t}</div>`).join('')}</div><div class="body"></div>`);
    const body = H.$('.body', page);
    const R = {
      reflect() {
        body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="info-box">각 메뉴에서 입력한 자료를 학교생활기록부에 반영합니다. 생활통지표를 등록한 경우 동시 반영할 수 있습니다.</div>
          <table class="form"><tr><th>반영항목</th><td>${REC_ITEMS.map(x => `<label style="display:inline-block;margin-right:14px"><input type="checkbox" class="ri" checked> ${x}</label>`).join('')}</td></tr><tr><th>생활통지표</th><td><label><input type="checkbox" class="rt" ${d.report ? '' : 'disabled'}> 생활통지표 동시 반영</label> ${d.report ? '' : '<span style="font-size:12px;color:#b8264c">([통지표 등록]을 하지 않아 선택할 수 없습니다)</span>'}</td></tr><tr><th>최종반영일시</th><td class="last">${d.reflected || '-'}</td></tr></table>
          <div class="toolbar" style="margin-top:10px"><span class="sp"></span><button class="btn primary b-ref">학생부반영</button></div>`;
        H.$('.b-ref', body).onclick = () => { if (locked()) { lockMsg(); return; } const now = new Date(); d.reflected = `${H.dateStr(A().today())} ${A().pad(now.getHours())}:${A().pad(now.getMinutes())}`; if (H.$('.rt', body).checked) d.reportReflected = d.reflected; app.Store.save(); H.$('.last', body).textContent = d.reflected; app.alertBox('학교생활기록부에 반영되었습니다.'); };
        H.$('.b-search', body).onclick = () => app.toast('조회되었습니다.');
      },
      verify() {
        body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>
          <div class="toolbar"><span>반마감 상태 : ${locked() ? '<span class="badge red">마감</span>' : '<span class="badge blue">미마감</span>'}</span><span class="sp"></span><button class="btn outline b-desc">검증항목설명</button><button class="btn outline b-allerr">전체오류내역조회</button><button class="btn primary b-all">전체검증</button><button class="btn outline b-one">항목별검증</button>${locked() ? '<button class="btn b-unlock">마감취소(연수용)</button>' : '<button class="btn dark b-lock">마감</button>'}</div>
          <div class="split"><div class="left" style="width:330px">${H.grid([{ t: '', w: 36 }, { t: '검증항목' }, { t: '확인여부', w: 90 }], REC_ITEMS.map((x, i) => `<tr data-i="${i}"><td><input type="checkbox" class="vk"></td><td class="l">${x}</td><td class="st"></td></tr>`).join(''))}</div><div class="right"><div class="res">${app.nodata('검증할 항목을 선택하고 {전체검증} 또는 {항목별검증}을 누르십시오.')}</div></div></div>`;
        const show = (res, item) => {
          const list = item ? res.filter(r => r.item === item) : res;
          H.$('.res', body).innerHTML = `<div class="sub-tit" style="margin-top:0">검증내역 <small>${item || '전체'} · ${list.length}건</small><span class="sp"></span><button class="btn outline b-bex">일괄입력</button><button class="btn primary b-exs">일괄저장</button></div>` + H.grid([{ t: '', w: 36 }, { t: '항목', w: 150 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '검증내역' }, { t: '예외처리사유', w: 200 }], list.map((r, i) => `<tr><td><input type="checkbox" class="ek"></td><td class="l" style="font-size:12px">${r.item}</td><td>${r.no}</td><td>${H.esc(r.name)}</td><td class="l" style="color:#b8264c">${H.esc(r.msg)}</td><td><input class="inp ex" data-k="${H.esc(r.item + '|' + r.no + '|' + r.msg)}" value="${H.esc((d.exceptions || {})[r.item + '|' + r.no + '|' + r.msg] || '')}"></td></tr>`).join('') || '<tr><td colspan="6">오류 내역이 없습니다.</td></tr>', { h: 500 });
          H.$('.b-exs', body).onclick = () => { d.exceptions = d.exceptions || {}; H.$$('.ex', body).forEach(i => { if (i.value) d.exceptions[i.dataset.k] = i.value; else delete d.exceptions[i.dataset.k]; }); H.save(); };
          H.$('.b-bex', body).onclick = () => { const sel = H.$$('tbody tr', H.$('.res', body)).filter(tr => { const c = H.$('.ek', tr); return c && c.checked; }); if (!sel.length) { app.alertBox('예외처리할 항목을 선택하십시오.'); return; } const m = app.modal({ title: '예외처리사유 일괄 입력', width: 440, body: '<input class="inp v" style="width:100%" placeholder="예) 전입생으로 해당 기간 자료 없음">', buttons: [{ text: '적용', cls: 'primary', onClick: () => { sel.forEach(tr => { H.$('.ex', tr).value = H.$('.v', m.pop).value; }); } }, { text: '닫기' }] }); };
        };
        const run = only => {
          const res = validate(); d.lastVerify = { at: H.dateStr(A().today()), res }; app.Store.save();
          H.$$('.left tbody tr', body).forEach(tr => { const it = REC_ITEMS[+tr.dataset.i]; if (only && !only.includes(it)) return; const n = res.filter(r => r.item === it).length; H.$('.st', tr).innerHTML = n ? `<a class="link" style="color:#b8264c;text-decoration:underline;cursor:pointer" data-it="${it}">확인필요</a>` : ''; });
          H.$$('.st a', body).forEach(a => { a.onclick = () => show(res, a.dataset.it); });
          show(only ? res.filter(r => only.includes(r.item)) : res);
          return res;
        };
        H.$('.b-all', body).onclick = () => { const res = run(); app.toast(`검증이 완료되었습니다. (확인필요 ${res.length}건)`); };
        H.$('.b-one', body).onclick = () => { const items = H.$$('.left tbody tr', body).filter(tr => H.$('.vk', tr).checked).map(tr => REC_ITEMS[+tr.dataset.i]); if (!items.length) { app.alertBox('검증할 항목을 선택하십시오.'); return; } run(items); };
        H.$('.b-allerr', body).onclick = () => show(validate());
        H.$('.b-desc', body).onclick = () => app.modal({ title: '검증항목설명', width: 560, body: H.grid([{ t: '항목', w: 170 }, { t: '검증내용' }], [['인적·학적사항', '주소 등 필수 인적사항 입력 여부'], ['출결상황', '학기 중 월별 출결 마감 여부'], ['창체 각 영역', '특기사항 입력 여부, 최대 Byte 초과, 기재 금지 의심 단어'], ['교과학습발달상황', '주요 교과 성취수준 및 특기사항 입력 여부'], ['행동특성및종합의견', '입력 여부, 최대 Byte 초과']].map(r => `<tr><td>${r[0]}</td><td class="l">${r[1]}</td></tr>`).join('')) });
        const lk = H.$('.b-lock', body); if (lk) lk.onclick = () => { const res = validate().filter(r => !(d.exceptions || {})[r.item + '|' + r.no + '|' + r.msg]); app.confirmBox(`${res.length ? `미처리 검증 오류가 ${res.length}건 있습니다.\n` : ''}학교생활기록부 반마감을 진행하시겠습니까?\n마감 후에는 학생부 관련 자료를 수정할 수 없습니다.`, () => { d.locks.record = true; app.Store.save(); R.verify(); app.alertBox('반마감이 완료되었습니다.'); }); };
        const ul = H.$('.b-unlock', body); if (ul) ul.onclick = () => app.confirmBox('반마감을 취소하시겠습니까?\n(실제 나이스에서는 학생부 마감 담당자에게 요청해야 합니다.)', () => { d.locks.record = false; app.Store.save(); R.verify(); });
        H.$('.b-search', body).onclick = () => R.verify();
      },
      result() {
        const lv = d.lastVerify;
        body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>` + (lv ? `<div class="info-box">최종 검증일 : <b>${lv.at}</b> · 확인필요 ${lv.res.length}건</div>` + H.grid([{ t: '항목', w: 170 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '검증내역' }, { t: '예외처리사유', w: 220 }], lv.res.map(r => `<tr><td class="l">${r.item}</td><td>${r.no}</td><td>${H.esc(r.name)}</td><td class="l">${H.esc(r.msg)}</td><td class="l">${H.esc((d.exceptions || {})[r.item + '|' + r.no + '|' + r.msg] || '')}</td></tr>`).join(''), { h: 560 }) : app.nodata('검증 이력이 없습니다. [자료검증 및 반마감]에서 검증을 실행하십시오.'));
        H.$('.b-search', body).onclick = () => R.result();
      },
      view() {
        body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.sf('학생', `<select class="sel s-no">${app.opts([['all', '전체']].concat(d.students.map(s => [s.no, `${s.no} ${s.name}`])), 8)}</select>`, true)}${app.sf('용도', `<select class="sel">${app.opts(['학교보관용', '학생제출용'])}</select>`)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`;
        H.$('.b-search', body).onclick = () => { const v = H.$('.s-no', body).value; const list = v === 'all' ? d.students : [H.stu(v)]; H.$('.area', body).innerHTML = `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">${app.I.print}인쇄</button></div>${list.map(recordDoc).join('<div style="height:20px"></div>')}</div>`; };
      },
      item() {
        body.innerHTML = `<div class="search-box">${app.commonSearch()}${app.sf('항목', `<select class="sel s-it">${app.opts(['자율·자치', '동아리', '진로', '행특', '출결특기사항'])}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`;
        H.$('.b-search', body).onclick = () => { const it = H.$('.s-it', body).value; H.$('.area', body).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '내용' }, { t: 'Byte', w: 80 }], d.students.map(s => { const v = it === '출결특기사항' ? ((d.attSpecial || {})[s.no] || '') : ((d.records[it] || {})[s.no] || ''); return `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td><td class="l">${H.esc(v)}</td><td>${app.nbytes(v)}</td></tr>`; }).join(''), { h: 600 }); };
      }
    };
    H.$$('.flow .step', page).forEach(st => { st.onclick = () => { H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === st)); R[st.dataset.s](); }; });
    R.verify();
  };
  function attCount(no) {
    const d = D(); const c = { 결석: {}, 지각: {}, 조퇴: {}, 결과: {} };
    Object.keys(d.attendance || {}).forEach(ym => { if (!H.attClosed(ym)) return; Object.entries(d.attendance[ym]).forEach(([k, r]) => { if (+k.split('-')[0] !== no || r.code.startsWith('출석인정')) return; const kind = r.code.slice(-2), t = r.code.slice(0, -2); c[kind][t] = (c[kind][t] || 0) + 1; }); });
    return c;
  }
  function recordDoc(s) {
    const d = D(); const c = attCount(s.no);
    const cell = (k, t) => c[k][t] || '.';
    const devRows = Object.keys(d.dev || {}).filter(sj => d.dev[sj][s.no]).map(sj => `<tr><td style="text-align:center;width:70px">${sj}</td><td>${H.esc(d.dev[sj][s.no])}</td></tr>`).join('') || '<tr><td colspan="2">&nbsp;</td></tr>';
    return `<div class="print-doc"><h2>학 교 생 활 기 록 부</h2>
      <table><tr><th style="width:90px">학년</th><th>반</th><th>번호</th><th>담임성명</th></tr><tr><td style="text-align:center">5</td><td style="text-align:center">2</td><td style="text-align:center">${s.no}</td><td style="text-align:center">${H.esc(d.user.name)}</td></tr></table>
      <h4>1. 인적·학적사항</h4><table><tr><th style="width:90px">학생정보</th><td>성명: ${H.esc(s.name)}　성별: ${s.sex}　생년월일: ${s.birth}<br>주소: ${H.esc(s.addr)}</td></tr><tr><th>학적사항</th><td>2022년 03월 02일 ${H.esc(d.org.school)} 제1학년 입학</td></tr><tr><th>특기사항</th><td>${H.esc(s.note || '')}</td></tr></table>
      <h4>2. 출결상황</h4><table><tr><th rowspan="2">학년</th><th rowspan="2">수업일수</th><th colspan="3">결석일수</th><th colspan="3">지각</th><th colspan="3">조퇴</th><th colspan="3">결과</th><th rowspan="2">특기사항</th></tr><tr>${['결석', '지각', '조퇴', '결과'].map(() => '<th>질병</th><th>미인정</th><th>기타</th>').join('')}</tr><tr><td style="text-align:center">5</td><td style="text-align:center">190</td>${['결석', '지각', '조퇴', '결과'].map(k => ['질병', '미인정', '기타'].map(t => `<td style="text-align:center">${cell(k, t)}</td>`).join('')).join('')}<td>${H.esc((d.attSpecial || {})[s.no] || '')}</td></tr></table>
      <h4>3. 창의적 체험활동상황</h4><table><tr><th style="width:90px">영역</th><th>특기사항</th></tr><tr><td style="text-align:center">자율·자치활동</td><td>${H.esc((d.records['자율·자치'] || {})[s.no] || '')}</td></tr><tr><td style="text-align:center">동아리활동</td><td>${H.esc((d.records['동아리'] || {})[s.no] || '')}</td></tr><tr><td style="text-align:center">진로활동</td><td>${H.esc((d.records['진로'] || {})[s.no] || '')}</td></tr></table>
      <h4>4. 교과학습발달상황</h4><table><tr><th style="width:70px">과목</th><th>성취수준 및 특기사항</th></tr>${devRows}</table>
      <h4>5. 행동특성 및 종합의견</h4><table><tr><td style="height:60px">${H.esc((d.records['행특'] || {})[s.no] || '')}</td></tr></table>
      <p style="text-align:center;margin-top:24px">${H.esc(d.org.school)}장 (연수용 출력물)</p></div>`;
  }
  S['생활통지표'] = function (page, title, app) {
    const d = D();
    const steps = [['reg', '통지표 등록'], ['refl', '자료반영 및 마감관리'], ['view', '통지표 조회 및 출력'], ['close', '통지표 마감']];
    page.insertAdjacentHTML('beforeend', `<div class="flow">${steps.map(([k, t], i) => `<div class="step ${i === 0 ? 'on' : ''}" data-s="${k}"><span class="no">${i + 1}</span>${t}</div>`).join('')}</div><div class="body"></div>`);
    const body = H.$('.body', page);
    const ITEMS = ['출결상황', '창의적체험활동', '교과학습발달상황', '행동특성및종합의견', '교과평가(성취기준별)'];
    const R = {
      reg() {
        const r = d.report || { title: '2026학년도 2학기 학교생활통지표', goal: '바른 인성, 창의적인 생각, 함께하는 미동 어린이', parent: '한 학기 동안 가정에서 보내 주신 관심과 사랑에 감사드립니다. 자녀의 학교생활 모습을 알려 드리오니 가정에서 격려해 주시기 바랍니다.', cover: '기본', items: ITEMS.slice(0, 4) };
        body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true, cls: false })}${app.searchBtn()}</div><table class="form"><tr><th class="req">*제목</th><td><input class="inp r1" style="width:100%" value="${H.esc(r.title)}"></td></tr><tr><th>교육목표</th><td><input class="inp r2" style="width:100%" value="${H.esc(r.goal)}"></td></tr><tr><th>학부모님께</th><td><textarea class="ta r3">${H.esc(r.parent)}</textarea></td></tr><tr><th class="req">*표지 형식</th><td>${['기본', '학교자체양식'].map(c => `<label style="margin-right:14px"><input type="radio" name="cv" value="${c}" ${r.cover === c ? 'checked' : ''}> ${c}</label>`).join('')}<button class="btn outline b-cv" style="margin-left:10px">표지설정</button> <button class="btn outline b-pv">표지미리보기</button></td></tr><tr><th class="req">*항목</th><td>${ITEMS.map(x => `<label style="display:inline-block;margin-right:14px"><input type="checkbox" class="ri" value="${x}" ${r.items.includes(x) ? 'checked' : ''}> ${x}</label>`).join('')}</td></tr></table>
          <div class="toolbar" style="margin-top:10px">${d.report ? '<span class="badge green">등록됨</span>' : '<span class="badge">미등록</span>'}<span class="sp"></span><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div>`;
        const collect = () => ({ title: H.$('.r1', body).value, goal: H.$('.r2', body).value, parent: H.$('.r3', body).value, cover: (H.$('input[name=cv]:checked', body) || {}).value, items: H.$$('.ri', body).filter(c => c.checked).map(c => c.value) });
        H.$('.b-save', body).onclick = () => { const v = collect(); if (!v.items.length) { app.alertBox('항목을 1개 이상 선택하십시오.'); return; } if (!v.title) { app.alertBox('제목을 입력하십시오.'); return; } d.report = v; H.save(); R.reg(); };
        H.$('.b-del', body).onclick = () => app.confirmBox('등록된 통지표 양식을 삭제하시겠습니까?', () => { delete d.report; app.Store.save(); R.reg(); });
        H.$('.b-cv', body).onclick = () => app.alertBox('연수용 환경에서는 표지 편집기를 제공하지 않습니다. ‘기본’ 표지를 사용하십시오.');
        H.$('.b-pv', body).onclick = () => { const v = collect(); app.modal({ title: '표지미리보기', width: 700, body: `<div class="print-wrap"><div class="print-doc" style="width:560px;text-align:center;padding:70px 40px"><div style="font-size:14px">${d.year}학년도</div><h2 style="margin:26px 0">${H.esc(v.title)}</h2><p>${H.esc(v.goal)}</p><p style="margin-top:60px">5학년 2반 　번 　성명: ____________</p><p style="margin-top:50px;font-size:16px">${H.esc(d.org.school)}</p></div></div>` }); };
        H.$('.b-search', body).onclick = () => R.reg();
      },
      refl() {
        body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><table class="form"><tr><th>통지표 등록</th><td>${d.report ? '등록됨' : '<span style="color:#b8264c">미등록 — [통지표 등록]을 먼저 하십시오.</span>'}</td></tr><tr><th>자료반영일시</th><td class="rt">${d.reportReflected || '-'}</td></tr><tr><th>마감상태</th><td>${d.reportClosed ? '<span class="badge red">마감</span>' : '<span class="badge blue">미마감</span>'}</td></tr></table><div class="toolbar" style="margin-top:10px"><span class="sp"></span><button class="btn primary b-ref">자료반영</button></div>`;
        H.$('.b-ref', body).onclick = () => { if (!d.report) { app.alertBox('통지표 등록을 먼저 하십시오.'); return; } if (d.reportClosed) { app.alertBox('마감된 통지표입니다.'); return; } d.reportReflected = H.dateStr(A().today()); app.Store.save(); R.refl(); app.alertBox('통지표에 자료가 반영되었습니다.'); };
        H.$('.b-search', body).onclick = () => R.refl();
      },
      view() {
        body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('학생', `<select class="sel s-no">${app.opts([['all', '전체']].concat(d.students.map(s => [s.no, `${s.no} ${s.name}`])), 8)}</select>`, true)}${app.sf('출력순서', `<select class="sel">${app.opts(['번호순', '성명순'])}</select>`)}${app.searchBtn()}</div><div class="info-box" style="font-size:12px">※ 출력순서: 선택한 기준(번호순/성명순)에 따라 여러 학생의 통지표가 차례로 출력됩니다.</div><div class="area">${app.nodata()}</div>`;
        H.$('.b-search', body).onclick = () => {
          if (!d.report) { H.$('.area', body).innerHTML = app.nodata('통지표가 등록되지 않았습니다.'); return; }
          const v = H.$('.s-no', body).value; const list = v === 'all' ? d.students : [H.stu(v)];
          H.$('.area', body).innerHTML = `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div>${list.map(reportDoc).join('<div style="height:20px"></div>')}</div>`;
        };
      },
      close() {
        body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><table class="form"><tr><th>마감상태</th><td>${d.reportClosed ? '<span class="badge red">마감</span>' : '<span class="badge blue">미마감</span>'}</td></tr></table><div class="toolbar" style="margin-top:10px"><span class="sp"></span>${d.reportClosed ? '<button class="btn b-o">마감취소</button>' : '<button class="btn dark b-c">마감</button>'}</div>`;
        const c = H.$('.b-c', body); if (c) c.onclick = () => app.confirmBox('통지표를 마감하시겠습니까?', () => { d.reportClosed = true; app.Store.save(); R.close(); });
        const o = H.$('.b-o', body); if (o) o.onclick = () => { d.reportClosed = false; app.Store.save(); R.close(); };
      }
    };
    H.$$('.flow .step', page).forEach(st => { st.onclick = () => { H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === st)); R[st.dataset.s](); }; });
    R.reg();
  };
  function reportDoc(s) {
    const d = D(); const r = d.report; const c = attCount(s.no);
    const sum = k => Object.values(c[k]).reduce((a, b) => a + b, 0);
    let h = `<div class="print-doc"><h2 style="font-size:19px;letter-spacing:2px">${H.esc(r.title)}</h2><p style="text-align:center">${H.esc(d.org.school)} 5학년 2반 ${s.no}번 성명: ${H.esc(s.name)} · 담임: ${H.esc(d.user.name)}</p><p style="border:1px solid #000;padding:8px">${H.esc(r.parent)}</p>`;
    if (r.items.includes('출결상황')) h += `<h4>■ 출결상황</h4><table><tr><th>결석</th><th>지각</th><th>조퇴</th><th>결과</th></tr><tr>${['결석', '지각', '조퇴', '결과'].map(k => `<td style="text-align:center">${sum(k)}</td>`).join('')}</tr></table>`;
    if (r.items.includes('창의적체험활동')) h += `<h4>■ 창의적 체험활동</h4><table>${[['자율·자치', '자율·자치활동'], ['동아리', '동아리활동'], ['진로', '진로활동']].map(([k, t]) => `<tr><th style="width:110px">${t}</th><td>${H.esc((d.records[k] || {})[s.no] || '')}</td></tr>`).join('')}</table>`;
    if (r.items.includes('교과학습발달상황')) h += `<h4>■ 교과학습발달상황</h4><table>${Object.keys(d.dev || {}).filter(sj => d.dev[sj][s.no]).map(sj => `<tr><th style="width:80px">${sj}</th><td>${H.esc(d.dev[sj][s.no])}</td></tr>`).join('') || '<tr><td>&nbsp;</td></tr>'}</table>`;
    if (r.items.includes('교과평가(성취기준별)')) h += `<h4>■ 교과평가</h4><table><tr><th>교과</th><th>성취기준</th><th>평가</th></tr>${d.standards.map(x => { const g = ((d.grades || {})[x.code] || {})[s.no]; return g ? `<tr><td style="text-align:center">${x.subj}</td><td>${H.esc(x.text)}</td><td style="text-align:center">${g.step}</td></tr>` : ''; }).join('')}</table>`;
    if (r.items.includes('행동특성및종합의견')) h += `<h4>■ 행동특성 및 종합의견</h4><table><tr><td style="height:50px">${H.esc((d.records['행특'] || {})[s.no] || '')}</td></tr></table>`;
    return h + `<p style="text-align:center;margin-top:20px">${H.esc(d.org.school)}장</p></div>`;
  }
  S['종합일람표'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('구분', `<select class="sel s-k">${app.opts(['교과평가', '교과학습발달상황'])}</select>`)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn b-print">${app.I.print}출력</button></div><div class="area">${app.nodata()}</div><div class="info-box" style="margin-top:10px;font-size:12px">※ 2026 하반기 개선: 종합일람표 본문 글자 크기 8pt → 12pt 확대</div>`);
    H.$('.b-search', page).onclick = () => {
      const k = H.$('.s-k', page).value; const subs = ['국어', '사회', '수학', '과학'];
      H.$('.area', page).innerHTML = k === '교과평가'
        ? H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(d.standards.map(x => ({ t: `<span style="font-size:11px">${x.subj}<br>${H.esc(x.code)}</span>` }))), d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td>${d.standards.map(x => `<td style="font-size:12pt">${H.esc((((d.grades || {})[x.code] || {})[s.no] || {}).step || '')}</td>`).join('')}</tr>`).join(''), { h: 600 })
        : H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(subs.map(x => ({ t: x }))), d.students.map(s => `<tr><td>${s.no}</td><td>${H.esc(s.name)}</td>${subs.map(sj => `<td class="l" style="font-size:12px">${H.esc(((d.dev || {})[sj] || {})[s.no] || '')}</td>`).join('')}</tr>`).join(''), { h: 600 });
    };
    H.$('.b-print', page).onclick = () => window.print();
  };

  /* =============== 보건 =============== */
  S['개인별등록'] = function (page, title, app) {
    const d = D(); d.health = d.health || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="split"><div class="left" style="width:240px"><div class="list"></div></div><div class="right"><div class="tabs"><a class="on">신체의 발달상황</a><a>건강검사</a><a>별도검사</a></div><div class="det">${app.nodata('학생을 선택하십시오.')}</div></div></div>`);
    let sel = null;
    const drawList = () => { H.$('.list', page).innerHTML = H.stuList(sel, s => d.health[s.no] ? '<span class="badge green">입력</span>' : ''); H.$$('.list tr[data-no]', page).forEach(tr => { tr.onclick = () => { sel = +tr.dataset.no; drawList(); drawDet(); }; }); };
    const drawDet = () => {
      const box = H.$('.det', page); if (!sel) return;
      const h = d.health[sel] || {};
      box.innerHTML = `<table class="form"><tr><th>검사일</th><td><input type="date" class="inp h0" value="${h.date || '2026-05-20'}"></td><th>검사기관</th><td>학교자체</td></tr><tr><th class="req">*키(cm)</th><td><input class="inp h1" value="${H.esc(h.h || '')}"></td><th class="req">*몸무게(kg)</th><td><input class="inp h2" value="${H.esc(h.w || '')}"></td></tr><tr><th>비만도(BMI)</th><td class="bmi">-</td><th>청력</th><td><select class="sel h5">${app.opts(['정상', '이상'], h.hear || '정상')}</select></td></tr><tr><th>시력(좌)</th><td><input class="inp h3" value="${H.esc(h.eyeL || '')}"></td><th>시력(우)</th><td><input class="inp h4" value="${H.esc(h.eyeR || '')}"></td></tr><tr><th>비고</th><td colspan="3"><input class="inp h6" style="width:100%" value="${H.esc(h.note || '')}"></td></tr></table><div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="info-box" style="font-size:12px">※ 건강 정보는 모두 연수용 가상 값입니다.</div>`;
      const bmi = () => { const hh = +H.$('.h1', box).value / 100, ww = +H.$('.h2', box).value; H.$('.bmi', box).textContent = hh && ww ? (ww / (hh * hh)).toFixed(1) : '-'; };
      H.$('.h1', box).oninput = H.$('.h2', box).oninput = bmi; bmi();
      H.$('.b-save', box).onclick = () => { const v = k => H.$('.' + k, box).value; if (!v('h1') || !v('h2')) { app.alertBox('키와 몸무게를 입력하십시오.'); return; } d.health[sel] = { date: v('h0'), h: v('h1'), w: v('h2'), eyeL: v('h3'), eyeR: v('h4'), hear: v('h5'), note: v('h6') }; H.save(); drawList(); };
    };
    H.$('.b-search', page).onclick = drawList; drawList();
  };
  S['반별등록'] = function (page, title, app) {
    const d = D(); d.health = d.health || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '키(cm)' }, { t: '몸무게(kg)' }, { t: '시력(좌)' }, { t: '시력(우)' }, { t: '청력', w: 100 }], d.students.map(s => { const h = d.health[s.no] || {}; return `<tr data-no="${s.no}"><td>${s.no}</td><td>${H.esc(s.name)}</td><td><input class="inp f" data-f="h" value="${H.esc(h.h || '')}"></td><td><input class="inp f" data-f="w" value="${H.esc(h.w || '')}"></td><td><input class="inp f" data-f="eyeL" value="${H.esc(h.eyeL || '')}"></td><td><input class="inp f" data-f="eyeR" value="${H.esc(h.eyeR || '')}"></td><td><select class="sel f" data-f="hear">${app.opts(['정상', '이상'], h.hear || '정상')}</select></td></tr>`; }).join(''), { h: 600 }); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { H.$$('tbody tr', page).forEach(tr => { const o = {}; H.$$('.f', tr).forEach(f => { o[f.dataset.f] = f.value; }); if (o.h || o.w) d.health[tr.dataset.no] = Object.assign(d.health[tr.dataset.no] || {}, o); }); H.save(); };
  };

  /* =============== 기타 =============== */
  S['상담현황'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-add">상담등록</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '순번', w: 50 }, { t: '상담일', w: 100 }, { t: '학생', w: 90 }, { t: '대상', w: 80 }, { t: '방법', w: 80 }, { t: '상담영역', w: 110 }, { t: '상담내용' }], d.counsel.map((c, i) => `<tr><td>${i + 1}</td><td>${c.date}</td><td>${H.esc(H.stu(c.no).name)}</td><td>${c.type}</td><td>${c.method}</td><td>${c.topic}</td><td class="l">${H.esc(c.content)}</td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-add', page).onclick = () => { const m = app.modal({ title: '상담 등록', width: 600, body: `<table class="form"><tr><th class="req">*학생</th><td><select class="sel c1">${app.opts(d.students.map(s => [s.no, `${s.no} ${s.name}`]))}</select></td></tr><tr><th class="req">*상담일</th><td><input type="date" class="inp c2" value="2026-09-30"></td></tr><tr><th>대상/방법</th><td><select class="sel c3">${app.opts(['학생', '학부모'])}</select> <select class="sel c4">${app.opts(['대면', '전화', '온라인'])}</select></td></tr><tr><th>상담영역</th><td><select class="sel c5">${app.opts(['학업', '교우관계', '생활습관', '진로', '기타'])}</select></td></tr><tr><th class="req">*상담내용</th><td><textarea class="ta c6"></textarea></td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = k => H.$('.' + k, m.pop).value.trim(); if (!v('c6')) { app.alertBox('상담내용을 입력하십시오.'); return false; } d.counsel.push({ no: +v('c1'), date: v('c2').replace(/-/g, '.'), type: v('c3'), method: v('c4'), topic: v('c5'), content: v('c6') }); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
  };
  S['상담통계'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { const c = {}; d.counsel.forEach(x => { c[x.topic] = (c[x.topic] || 0) + 1; }); H.$('.area', page).innerHTML = H.grid([{ t: '상담영역' }, { t: '건수', w: 120 }], Object.keys(c).map(k => `<tr><td>${k}</td><td>${c[k]}</td></tr>`).join('') + `<tr><td><b>계</b></td><td><b>${d.counsel.length}</b></td></tr>`); };
  };
  S['학부모서비스승인관리'] = function (page, title, app) {
    const d = D(); d.parentSvc = d.parentSvc || d.students.slice(0, 6).map((s, i) => ({ no: s.no, name: s.guardian, rel: s.rel, date: `2026.03.${A().pad(10 + i)}`, status: i < 4 ? '승인' : '신청' }));
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-ok">승인</button><button class="btn dark b-no">승인취소</button></div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '학생', w: 100 }, { t: '신청자', w: 100 }, { t: '관계', w: 80 }, { t: '신청일', w: 110 }, { t: '상태' }], d.parentSvc.map((p, i) => `<tr data-i="${i}"><td><input type="checkbox" class="ck"></td><td>${H.esc(H.stu(p.no).name)}</td><td>${H.esc(p.name)}</td><td>${p.rel}</td><td>${p.date}</td><td><span class="badge ${p.status === '승인' ? 'green' : 'blue'}">${p.status}</span></td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    const set = st => { H.$$('tbody tr', page).filter(tr => H.$('.ck', tr).checked).forEach(tr => { d.parentSvc[+tr.dataset.i].status = st; }); app.Store.save(); draw(); };
    H.$('.b-ok', page).onclick = () => set('승인'); H.$('.b-no', page).onclick = () => set('신청');
  };
  S['학교폭력조치상황관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="info-box warn">학교폭력 조치사항은 매우 민감한 정보이므로 연수용 가상 환경에도 예시 데이터를 넣지 않았습니다.</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('해당 학급에 입력된 조치사항이 없습니다.'); };
  };
  S['학교업무분장설정'] = function (page, title, app) {
    const d = D();
    const depts = [['교무기획부', '안한수', [window.NEIS_ME, '나미리']], ['생활안전부', '봉미선', ['변태수']], ['5학년', '나미리', [window.NEIS_ME, '변태수']], ['영어교과', '마이콜', []], ['보건', '신형만', []]];
    page.insertAdjacentHTML('beforeend', `<div class="flow"><div class="step on"><span class="no">1</span>처음으로</div><div class="step"><span class="no">2</span>부서설정</div><div class="step"><span class="no">3</span>부서원설정</div><div class="step"><span class="no">4</span>업무설정</div></div><div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([[d.year, d.year + '학년도']], d.year)}</select>`, true)}${app.searchBtn()}</div><div class="area"></div>`);
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '순번', w: 60 }, { t: '부서명' }, { t: '부서장', w: 120 }, { t: '부서원' }], depts.map((x, i) => `<tr><td>${i + 1}</td><td>${x[0]}</td><td>${x[1]}</td><td class="l">${x[2].join(', ')}</td></tr>`).join('')); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$$('.flow .step', page).forEach(st => { st.onclick = () => { H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === st)); app.toast('연수용 환경에서는 부서 현황만 확인할 수 있습니다.'); }; });
  };
  S['교직원현황조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="area">${H.grid([{ t: '순번', w: 60 }, { t: '성명', w: 110 }, { t: '직위', w: 110 }, { t: '부서', w: 140 }, { t: '담당' }], d.staff.map((s, i) => `<tr><td>${i + 1}</td><td>${H.esc(s.name)}</td><td>${s.pos}</td><td>${s.dept}</td><td>${s.role || ''}</td></tr>`).join(''))}</div><div class="info-box" style="margin-top:10px">※ 교직원은 모두 만화 캐릭터 이름을 사용한 가상 인물입니다.</div>`);
  };
  S['측정결과입력'] = function (page, title, app) {
    const d = D(); d.paps = d.paps || {};
    const items = [['run', '왕복오래달리기(회)'], ['flex', '앉아윗몸앞으로굽히기(cm)'], ['dash', '50m달리기(초)'], ['jump', '제자리멀리뛰기(cm)']];
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="area"></div><div class="info-box" style="margin-top:10px;font-size:12px">※ 등급은 연수용 간이 산출값이며 실제 PAPS 평가 기준과 다릅니다.</div>`);
    const grade = p => { if (!p) return ''; const sc = (+p.run || 0) / 10 + (+p.flex || 0) / 5 + (p.dash ? (12 - p.dash) : 0) + (+p.jump || 0) / 40; return sc > 16 ? '1등급' : sc > 13 ? '2등급' : sc > 10 ? '3등급' : sc > 7 ? '4등급' : '5등급'; };
    const draw = () => { H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }].concat(items.map(x => ({ t: x[1] }))).concat([{ t: '종합(간이)', w: 100 }]), d.students.map(s => { const p = d.paps[s.no] || {}; return `<tr data-no="${s.no}"><td>${s.no}</td><td>${H.esc(s.name)}</td>${items.map(x => `<td><input class="inp f" data-f="${x[0]}" value="${H.esc(p[x[0]] || '')}"></td>`).join('')}<td>${grade(d.paps[s.no])}</td></tr>`; }).join(''), { h: 600 }); };
    draw(); H.$('.b-search', page).onclick = draw;
    H.$('.b-save', page).onclick = () => { H.$$('tbody tr', page).forEach(tr => { const o = {}; H.$$('.f', tr).forEach(f => { if (f.value) o[f.dataset.f] = f.value; }); if (Object.keys(o).length) d.paps[tr.dataset.no] = o; }); app.Store.save(); draw(); app.alertBox('저장되었습니다.'); };
  };
})();
