/* 업무 화면 (4) — 학교업무분장, 교육과정(편제·담임편성·자율시간·진도표·학교일지·수업일수), 학적(사진·주소연계·반편성·명예졸업) */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const Ap = window.Approval;
  const pad = n => String(n).padStart(2, '0');
  const esc = s => H.esc(s);
  const st = r => r && r.docId ? Ap.statusOf(r.docId) : ((r && r.status) || '저장');
  const nextId = arr => arr.reduce((a, x) => Math.max(a, +x.id || 0), 0) + 1;
  const sel = (root, arr) => H.$$('tbody tr[data-id]', root).filter(tr => { const c = H.$('.ck', tr); return c && c.checked; }).map(tr => arr.find(x => String(x.id) === tr.dataset.id));
  const nodataRow = (n, msg) => `<tr><td colspan="${n}" style="height:auto;border:none">${A().nodata(msg || '조회된 데이터가 없습니다.')}</td></tr>`;
  const flow = (steps, on) => `<div class="flow">${steps.map((t, i) => `<div class="step ${i === on ? 'on' : ''}" data-i="${i}"><span class="no">${i + 1}</span>${t}</div>`).join('')}</div>`;
  const bindFlow = (page, fns) => { H.$$('.flow .step', page).forEach(s => { s.onclick = () => { H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === s)); fns[+s.dataset.i](); }; }); fns[0](); };
  const tabsHtml = (names) => `<div class="tabs">${names.map((t, i) => `<a class="${i === 0 ? 'on' : ''}" data-i="${i}">${t}</a>`).join('')}</div>`;
  const bindTabs = (root, fns) => { H.$$('.tabs a', root).forEach(a => { a.onclick = () => { H.$$('.tabs a', root).forEach(x => x.classList.toggle('on', x === a)); fns[+a.dataset.i](); }; }); fns[0](); };
  const ckAll = root => { const a = H.$('.all', root); if (a) a.onchange = () => H.$$('.ck', root).forEach(c => { c.checked = a.checked; }); };
  const printDoc = (title, inner, w) => A().modal({ title, width: w || 900, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc">${inner}</div></div>` });
  window.SH4 = { st, nextId, sel, nodataRow, flow, bindFlow, tabsHtml, bindTabs, ckAll, printDoc };

  // 다른 학급 담임(가상, 만화 캐릭터 이름)
  const OTHER_T = ['설까치', '엄지', '마동탁', '구영탄', '하석두', '최강타', '홍두깨', '고은비', '나도야', '박달이', '오혜성', '윤대협', '정대만', '송태섭', '백장미'];
  function homerooms() {
    const d = D();
    if (!d.homerooms) {
      const m = {}; let k = 0;
      for (let g = 1; g <= 6; g++) for (let c = 1; c <= 3; c++) { const key = `${g}-${c}`; m[key] = g === 5 ? ['나미리', window.NEIS_ME, '변태수'][c - 1] : OTHER_T[k++ % OTHER_T.length]; }
      d.homerooms = m;
    }
    return d.homerooms;
  }
  const allTeachers = () => D().staff.filter(s => !['행정실장'].includes(s.pos)).map(s => s.name).concat(OTHER_T);

  /* =========================================================
     학교업무분장
     ========================================================= */
  const UNITS = {
    '교무업무': ['(초)경영지원', '(초)학교정보', '(초)교육과정', '(초)학적', '(초)학생생활', '(초)성적', '(초)학생부', '(초)개별화교육계획', '보건', '입(진)학'],
    '일반행정': ['학생배치', '복무', '공무원급여', '사립교직원급여', '교육공무직등급여', '연말정산', '감사', '평생교육', '학교운영위원회', '민원', '정보공시', '교육통계', '특수교육통계'],
    '학교행정': ['교과용도서', '급식', '교육설문', '방과후학교', '체육', '학생건강체력평가', '초등돌봄교실', '교육복지', '학생부보존', '상담관리', '학업중단', '학교환경', '학부모소통', '학생맞춤통합지원'],
    '공통관리': ['일반설문공통', '시스템관리', '시스템환경관리', '업무승인관리', '전자이미지관인관리', '학교업무분장']
  };
  function duty() {
    const d = D();
    if (!d.duty) {
      d.duty = {
        manager: '안한수',
        depts: [
          { id: 1, name: '교무기획부', desc: '교육과정, 학적, 학생부', head: '안한수', units: ['(초)교육과정', '(초)학적', '(초)학생부', '(초)성적'] },
          { id: 2, name: '생활안전부', desc: '학생생활, 학교폭력 예방, 상담', head: '봉미선', units: ['(초)학생생활', '상담관리', '학업중단'] },
          { id: 3, name: '5학년', desc: '5학년 학년 운영', head: '나미리', units: ['(초)교육과정', '(초)학생생활'] },
          { id: 4, name: '보건', desc: '학생 건강관리', head: '도라미', units: ['보건', '학생건강체력평가'] },
          { id: 5, name: '행정실', desc: '예산, 복무, 급여', head: '신형만', units: ['복무', '공무원급여', '정보공시'] }
        ],
        works: [
          { id: 1, dept: 1, name: '교육과정', desc: '교육과정 편성·운영', users: ['안한수'], menus: ['학교교육과정편제및시간배당관리', '학사일정관리', '학급담임편성관리', '담당교과편성관리'], grade: [], subj: [], club: [] },
          { id: 2, dept: 1, name: '학적', desc: '전입·전출, 학적 관리', users: ['안한수'], menus: ['학적현황조회', '학생자료종합검색'], grade: ['전학년'], subj: [], club: [] },
          { id: 3, dept: 2, name: '학생생활', desc: '수상, 진로정보', users: ['봉미선'], menus: ['수상대장관리', '재학생동의여부관리', '동의여부마감관리'], grade: ['전학년'], subj: [], club: [] },
          { id: 4, dept: 2, name: '상담', desc: '상담관리', users: ['봉미선'], menus: ['상담현황(관리자)', '상담통계'], grade: [], subj: [], club: [] },
          { id: 5, dept: 3, name: '학교자율시간', desc: '5학년 학교자율시간 운영', users: ['나미리', window.NEIS_ME], menus: ['학교자율시간관리'], grade: ['5학년'], subj: ['미동 마을 탐구(활동)'], club: [] },
          { id: 6, dept: 4, name: '보건', desc: '건강기록부, 예방접종', users: ['도라미'], menus: ['건강기록부마감'], grade: ['전학년'], subj: [], club: [] }
        ],
        log: [
          { at: '2026-03-02 09:10', user: window.NEIS_ME, kind: '부서원편성', detail: '5학년 > 학교자율시간 업무 편성', by: '안한수' },
          { at: '2026-03-02 09:12', user: window.NEIS_ME, kind: '자료권한', detail: '학년반 자료권한(5학년 2반) 부여', by: '안한수' },
          { at: '2026-03-03 14:20', user: '봉미선', kind: '부서원편성', detail: '생활안전부 > 학생생활 업무 편성', by: '안한수' }
        ],
        temps: []
      };
    }
    return d.duty;
  }
  const dlog = (user, kind, detail) => { duty().log.unshift({ at: Ap.now(), user, kind, detail, by: D().user.name }); };
  function userPicker(title, multi, pre, onOk) {
    const app = A();
    const m = app.modal({ title, width: 560, body: `<div style="display:flex;gap:6px;margin-bottom:8px"><input class="inp q" style="flex:1" placeholder="사용자명"><button class="btn primary go">조회</button></div><div class="lst"></div>`,
      buttons: [{ text: '확인', cls: 'primary', onClick: () => { const v = H.$$('.pk', m.pop).filter(c => c.checked).map(c => c.value); if (!v.length) { app.alertBox('사용자를 선택하십시오.'); return false; } onOk(multi ? v : v[0]); } }, { text: '닫기' }] });
    const run = () => { const q = H.$('.q', m.pop).value.trim(); const us = D().staff.filter(s => !q || s.name.includes(q)); H.$('.lst', m.pop).innerHTML = H.grid([{ t: '', w: 40 }, { t: '사용자명', w: 90 }, { t: '사용자ID', w: 110 }, { t: '직위', w: 90 }, { t: '부서' }], us.map(s => `<tr><td><input type="${multi ? 'checkbox' : 'radio'}" name="pk" class="pk" value="${esc(s.name)}" ${(pre || []).includes(s.name) ? 'checked' : ''}></td><td>${esc(s.name)}</td><td>${esc(s.id)}</td><td>${esc(s.pos)}</td><td>${esc(s.dept)}</td></tr>`).join(''), { h: 340 }); };
    H.$('.go', m.pop).onclick = run; run();
  }

  S['학교업무분장관리담당자지정'] = function (page, title, app) {
    const du = duty(); let pick = null;
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('사용자성명', '<input class="inp s-q">')}${app.searchBtn()}</div>
      <div class="split"><div class="left" style="width:520px"><div class="sub-tit" style="margin-top:0">사용자목록</div><div class="ul"></div></div>
      <div class="right"><div class="sub-tit" style="margin-top:0">학교업무분장관리담당자<span class="sp"></span><button class="btn primary b-set">지정</button><button class="btn b-unset">해제</button><button class="btn primary b-save">저장</button></div><div class="cur"></div>
      <div class="info-box" style="margin-top:10px">학교장 또는 학교기관마스터가 학교업무분장관리 담당자를 지정합니다. 담당자는 부서와 부서장을 지정하고, 부서장은 부서원과 권한을 관리합니다.</div></div></div>`);
    let after = du.manager;
    const draw = () => {
      const q = H.$('.s-q', page).value.trim();
      H.$('.ul', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '사용자명', w: 90 }, { t: '사용자ID', w: 110 }, { t: '직위', w: 90 }, { t: '부서' }], D().staff.filter(s => !q || s.name.includes(q)).map(s => `<tr data-n="${esc(s.name)}" class="${pick === s.name ? 'sel' : ''}"><td><input type="radio" name="um" ${pick === s.name ? 'checked' : ''}></td><td>${esc(s.name)}</td><td>${esc(s.id)}</td><td>${esc(s.pos)}</td><td>${esc(s.dept)}</td></tr>`).join(''), { h: 460 });
      H.$$('.ul tr[data-n]', page).forEach(tr => { tr.onclick = () => { pick = tr.dataset.n; draw(); }; });
      const one = n => { const s = Ap.staff(n); return s ? `${esc(s.name)} (${esc(s.id)}) / ${esc(s.pos)} / ${esc(s.dept)}` : '-'; };
      H.$('.cur', page).innerHTML = `<table class="form"><tr><th>현재 담당자</th><td style="${after !== du.manager ? 'text-decoration:line-through;color:#8a94a6' : ''}">${one(du.manager)}</td></tr><tr><th>변경후 담당자</th><td style="color:#1644d8">${after !== du.manager ? one(after) : '-'}</td></tr></table>`;
    };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-set', page).onclick = () => { if (!pick) { app.alertBox('사용자목록에서 지정할 사용자를 선택하십시오.'); return; } after = pick; draw(); };
    H.$('.b-unset', page).onclick = () => { after = du.manager; draw(); };
    H.$('.b-save', page).onclick = () => { if (after === du.manager) { app.alertBox('변경된 내용이 없습니다.'); return; } dlog(after, '담당자지정', `학교업무분장관리담당자 지정 (이전: ${du.manager})`); du.manager = after; H.save(); draw(); };
  };

  S['학교업무분장설정'] = function (page, title, app) {
    const du = duty();
    page.insertAdjacentHTML('beforeend', `${flow(['처음으로', '부서관리(부서장 지정)', '업무관리(부서원 편성)', '업무관리(메뉴, 자료권한 관리)', '교무자료권한승인관리'], 0)}
      <div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([['2026', '2026학년도'], ['2027', '2027학년도']], '2026')}</select>`, true)}${app.searchBtn()}</div><div class="body"></div>`);
    const body = H.$('.body', page);
    let curStep = 0;
    const stepFns = [
      () => { // 처음으로
        curStep = 0;
        body.innerHTML = `<div style="display:flex;gap:20px;margin-top:10px">
          <div class="info-box bx1" style="flex:1;cursor:pointer;padding:26px;text-align:center"><div style="font-size:17px;font-weight:700;margin-bottom:8px">우리학교 업무분장 처음부터 설정하기</div>부서 관리 및 부서장 지정부터 업무 담당자, 메뉴·자료권한까지 직접 설정합니다.</div>
          <div class="info-box bx2" style="flex:1;cursor:pointer;padding:26px;text-align:center"><div style="font-size:17px;font-weight:700;margin-bottom:8px">학교업무분장 예시 가져와서 설정하기</div>유형 A(교무업무지원)·B(기능 부서별)·C(부서별) 예시 또는 지난 학년도 업무분장을 가져옵니다.</div></div>`;
        H.$('.bx1', body).onclick = () => H.$$('.flow .step', page)[1].click();
        H.$('.bx2', body).onclick = () => {
          const m = app.modal({ title: '업무분장 가져오기', width: 640, body: `<div style="margin-bottom:10px"><label><input type="radio" name="imp" value="ex" checked> 학교업무분장예시</label> &nbsp; <label><input type="radio" name="imp" value="prev"> 지난학년도 업무분장 (2025학년도)</label></div>${H.grid([{ t: '', w: 40 }, { t: '유형' }, { t: '구성', w: 330 }], [['A', '교무업무지원형', '교무기획부·교육과정부·생활안전부·학년부'], ['B', '기능 부서별', '교무부·연구부·생활부·정보부·보건'], ['C', '부서별', '학년별 부서 + 교과전담부']].map((r, i) => `<tr><td><input type="radio" name="ty" value="${r[0]}" ${i === 0 ? 'checked' : ''}></td><td>유형 ${r[0]} (${r[1]})</td><td class="l">${r[2]}</td></tr>`).join(''))}<div class="info-box warn" style="margin-top:10px;font-size:12px">※ 가져오기로 덮어쓰기 하더라도 이미 부여된 학년반·교과목 자료권한은 삭제되지 않습니다.</div>`,
            buttons: [{ text: '저장', cls: 'primary', onClick: () => { const ty = H.$('input[name=ty]:checked', m.pop).value; const imp = H.$('input[name=imp]:checked', m.pop).value; const names = imp === 'prev' ? du.depts.map(x => x.name) : { A: ['교무기획부', '교육과정부', '생활안전부', '5학년'], B: ['교무부', '연구부', '생활부', '정보부', '보건'], C: ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '교과전담'] }[ty]; names.forEach(n => { if (!du.depts.some(x => x.name === n)) du.depts.push({ id: nextId(du.depts), name: n, desc: '', head: '', units: [] }); }); dlog(D().user.name, '업무분장가져오기', imp === 'prev' ? '지난학년도 업무분장 가져오기' : `예시 유형 ${ty} 가져오기`); H.save('업무분장을 가져왔습니다. [부서관리]에서 부서장을 지정하십시오.'); } }, { text: '닫기' }] });
        };
      },
      () => { // 부서관리
        curStep = 1;
        const draw = () => {
          body.innerHTML = `<div class="toolbar"><span class="total">Total <b>${du.depts.length}</b></span><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn outline b-copy">부서복사</button><button class="btn outline b-mgr">교장·교감업무생성</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div>` +
            H.grid([{ t: '', w: 40 }, { t: '부서명', w: 160 }, { t: '소관업무' }, { t: '부서장', w: 170 }, { t: '단위업무', w: 330 }], du.depts.map(x => `<tr data-id="${x.id}"><td><input type="checkbox" class="ck"></td><td><input class="inp f" data-f="name" value="${esc(x.name)}"></td><td><input class="inp f" data-f="desc" value="${esc(x.desc)}"></td><td class="link hd">${x.head ? esc(x.head) : '클릭해서 부서장 지정하기'}</td><td class="link l un" style="font-size:12px">${x.units.length ? esc(x.units.join(', ')) : '클릭해서 단위업무 선택하기'}</td></tr>`).join(''), { h: 480 });
          H.$$('.f', body).forEach(f => { f.oninput = () => { du.depts.find(x => String(x.id) === f.closest('tr').dataset.id)[f.dataset.f] = f.value; }; });
          H.$$('.hd', body).forEach(td => { td.onclick = () => { const dp = du.depts.find(x => String(x.id) === td.parentElement.dataset.id); userPicker('부서장 지정', false, [dp.head], v => { dp.head = v; draw(); }); }; });
          H.$$('.un', body).forEach(td => { td.onclick = () => { const dp = du.depts.find(x => String(x.id) === td.parentElement.dataset.id); const m = app.modal({ title: `단위업무 선택 - ${dp.name}`, width: 760, body: Object.keys(UNITS).map(g => `<div class="sub-tit" style="margin:10px 0 6px;font-size:15px">${g} (${UNITS[g].length})</div>${UNITS[g].map(u => `<label style="display:inline-block;width:170px;line-height:26px"><input type="checkbox" class="uk" value="${esc(u)}" ${dp.units.includes(u) ? 'checked' : ''}> ${esc(u)}</label>`).join('')}`).join(''), buttons: [{ text: '확인', cls: 'primary', onClick: () => { dp.units = H.$$('.uk', m.pop).filter(c => c.checked).map(c => c.value); draw(); } }, { text: '닫기' }] }); }; });
          H.$('.b-add', body).onclick = () => { du.depts.push({ id: nextId(du.depts), name: '', desc: '', head: '', units: [] }); draw(); };
          H.$('.b-copy', body).onclick = () => { const s = sel(body, du.depts); if (s.length !== 1) { app.alertBox('복사할 부서를 1개 선택하십시오.'); return; } const i = du.depts.indexOf(s[0]); du.depts.splice(i + 1, 0, Object.assign({}, s[0], { id: nextId(du.depts), name: s[0].name + '(복사)', units: s[0].units.slice() })); draw(); };
          H.$('.b-mgr', body).onclick = () => { [['교장·교감', '고길동', ['(초)경영지원', '업무승인관리']], ['정보공시', '안한수', ['정보공시']], ['교육통계부', '안한수', ['교육통계']]].forEach(([n, h, u]) => { if (!du.depts.some(x => x.name === n)) du.depts.push({ id: nextId(du.depts), name: n, desc: '', head: h, units: u }); }); draw(); app.toast('교장·교감, 정보공시, 교육통계부 부서가 생성되었습니다.'); };
          H.$('.b-save', body).onclick = () => { if (du.depts.some(x => !x.name.trim())) { app.alertBox('부서명을 입력하십시오.'); return; } if (du.depts.some(x => !x.head)) { app.alertBox('부서장이 지정되지 않은 부서가 있습니다.'); return; } H.save(); };
          H.$('.b-del', body).onclick = () => { const s = sel(body, du.depts); if (!s.length) { app.alertBox('삭제할 부서를 선택하십시오.'); return; } if (s.some(x => du.works.some(w => w.dept === x.id))) { app.alertBox('업무가 편성된 부서는 삭제할 수 없습니다.\n[업무관리(부서원 편성)]에서 업무를 먼저 삭제하십시오.'); return; } du.depts = du.depts.filter(x => !s.includes(x)); draw(); };
        };
        draw();
      },
      () => { // 부서원 편성
        curStep = 2; let dsel = du.depts[0] && du.depts[0].id;
        const draw = () => {
          const works = du.works.filter(w => w.dept === dsel);
          body.innerHTML = `<div class="split"><div class="left" style="width:240px">${H.grid([{ t: '부서' }, { t: '업무수', w: 70 }], du.depts.map(x => `<tr data-d="${x.id}" class="${x.id === dsel ? 'sel' : ''}" style="cursor:pointer"><td class="l">${esc(x.name)}</td><td>${du.works.filter(w => w.dept === x.id).length}</td></tr>`).join(''), { h: 500 })}</div>
            <div class="right"><div class="toolbar"><input class="inp wq" placeholder="업무찾기" style="width:180px"><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn outline b-mv">업무복사·이동</button><button class="btn b-perm">사용자권한삭제</button><button class="btn primary b-save">저장</button><button class="btn dark b-del">삭제</button></div>
            ${H.grid([{ t: '', w: 40 }, { t: '업무명', w: 170 }, { t: '업무설명' }, { t: '사용자명', w: 220 }], works.map(w => `<tr data-id="${w.id}"><td><input type="checkbox" class="ck"></td><td><input class="inp f" data-f="name" value="${esc(w.name)}"></td><td><input class="inp f" data-f="desc" value="${esc(w.desc)}"></td><td class="link us">${w.users.length ? esc(w.users.join(', ')) : '클릭해서 사용자 지정하기'}</td></tr>`).join('') || nodataRow(4, '편성된 업무가 없습니다. {행추가}로 업무를 추가하십시오.'), { h: 460 })}</div></div>`;
          H.$$('tr[data-d]', body).forEach(tr => { tr.onclick = () => { dsel = +tr.dataset.d; draw(); }; });
          H.$$('.f', body).forEach(f => { f.oninput = () => { du.works.find(x => String(x.id) === f.closest('tr').dataset.id)[f.dataset.f] = f.value; }; });
          H.$$('.us', body).forEach(td => { td.onclick = () => { const w = du.works.find(x => String(x.id) === td.parentElement.dataset.id); userPicker('업무별 사용자 등록', true, w.users, v => { v.filter(u => !w.users.includes(u)).forEach(u => dlog(u, '부서원편성', `${du.depts.find(x => x.id === w.dept).name} > ${w.name} 업무 편성`)); w.users = v; draw(); }); }; });
          H.$('.wq', body).oninput = e => { const q = e.target.value.trim(); H.$$('tbody tr[data-id]', body).forEach(tr => { tr.style.display = !q || H.$('.f', tr).value.includes(q) ? '' : 'none'; }); };
          H.$('.b-add', body).onclick = () => { if (!dsel) return; du.works.push({ id: nextId(du.works), dept: dsel, name: '', desc: '', users: [], menus: [], grade: [], subj: [], club: [] }); draw(); };
          H.$('.b-save', body).onclick = () => { if (du.works.some(w => !w.name.trim())) { app.alertBox('업무명을 입력하십시오.'); return; } H.save(); };
          H.$('.b-del', body).onclick = () => { const s = sel(body, du.works); if (!s.length) { app.alertBox('삭제할 업무를 선택하십시오.'); return; } du.works = du.works.filter(w => !s.includes(w)); draw(); };
          H.$('.b-mv', body).onclick = () => { const s = sel(body, du.works); if (s.length !== 1) { app.alertBox('복사·이동할 업무를 1개 선택하십시오.'); return; } const m = app.modal({ title: '업무 복사·이동', width: 420, body: `<table class="form"><tr><th>대상 부서</th><td><select class="sel tg">${app.opts(du.depts.filter(x => x.id !== dsel).map(x => [x.id, x.name]))}</select></td></tr></table>`, buttons: [{ text: '복사', cls: 'primary', onClick: () => { du.works.push(Object.assign(JSON.parse(JSON.stringify(s[0])), { id: nextId(du.works), dept: +H.$('.tg', m.pop).value })); draw(); app.toast('복사되었습니다.'); } }, { text: '이동', cls: 'outline', onClick: () => { s[0].dept = +H.$('.tg', m.pop).value; draw(); app.toast('이동되었습니다. (부서원·자료권한 유지)'); } }, { text: '닫기' }] }); };
          H.$('.b-perm', body).onclick = () => app.alertBox('{사용자권한삭제}는 권한관리 담당자만 사용할 수 있습니다.\n(퇴직·전보 등으로 남아 있는 사용자 권한을 일괄 삭제하는 기능)');
        };
        draw();
      },
      () => { // 메뉴, 자료권한
        curStep = 3; let dsel = du.depts[0] && du.depts[0].id;
        const MENUS = Object.keys(A().leafIndex).filter(l => !['기본메뉴', '승인사항'].includes(A().leafIndex[l].role));
        const draw = () => {
          const works = du.works.filter(w => w.dept === dsel);
          body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn primary b-go">교무자료권한승인관리</button></div><div class="split"><div class="left" style="width:220px">${H.grid([{ t: '부서' }], du.depts.map(x => `<tr data-d="${x.id}" class="${x.id === dsel ? 'sel' : ''}" style="cursor:pointer"><td class="l">${esc(x.name)}</td></tr>`).join(''), { h: 500 })}</div>
            <div class="right">${H.grid([{ t: '업무명', w: 140 }, { t: '사용자', w: 140 }, { t: '업무 메뉴 관리', w: 150 }, { t: '학년반 자료권한' }, { t: '교과목 자료권한' }, { t: '동아리활동 자료권한', w: 150 }], works.map(w => `<tr data-id="${w.id}"><td>${esc(w.name)}</td><td style="font-size:12px">${esc(w.users.join(', '))}</td><td><button class="btn ${w.menus.length ? 'green' : 'primary'} b-menu" style="height:26px">${w.menus.length ? `완료(${w.menus.length})` : '메뉴관리'}</button></td><td class="l" style="font-size:12px">${esc(w.grade.join(', '))} <button class="btn outline b-auth" data-k="grade" style="height:24px">등록</button></td><td class="l" style="font-size:12px">${esc(w.subj.join(', '))} <button class="btn outline b-auth" data-k="subj" style="height:24px">등록</button></td><td class="l" style="font-size:12px">${esc(w.club.join(', '))} <button class="btn outline b-auth" data-k="club" style="height:24px">등록</button></td></tr>`).join('') || nodataRow(6, '편성된 업무가 없습니다.'), { h: 460 })}</div></div>
            <div class="info-box" style="margin-top:10px">‘메뉴등록’은 조회 권한, ‘관리 권한’은 등록/수정/삭제 권한입니다. 학년반·교과목·동아리 자료권한은 <b>교무자료권한승인관리</b>에서 결재가 완료되어야 최종 부여됩니다.</div>`;
          H.$$('tr[data-d]', body).forEach(tr => { tr.onclick = () => { dsel = +tr.dataset.d; draw(); }; });
          H.$('.b-go', body).onclick = () => H.$$('.flow .step', page)[4].click();
          H.$$('.b-menu', body).forEach(b => { b.onclick = () => {
            const w = du.works.find(x => String(x.id) === b.closest('tr').dataset.id);
            const m = app.modal({ title: `업무 메뉴 관리 - ${w.name}`, width: 760, body: `<div style="display:flex;gap:6px;margin-bottom:8px"><input class="inp q" style="flex:1" placeholder="메뉴명"><button class="btn primary go">조회</button></div><div class="lst"></div>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = H.$$('.mk', m.pop).filter(c => c.checked).map(c => c.value); w.menus = v; w.menus.forEach(x => { if (!(w.manage || []).includes(x)) { /* noop */ } }); w.manage = H.$$('.mg', m.pop).filter(c => c.checked).map(c => c.value); w.users.forEach(u => dlog(u, '메뉴권한', `${w.name} 업무 메뉴 ${v.length}건 등록`)); app.Store.save(); draw(); app.toast('업무 메뉴가 저장되었습니다.'); } }, { text: '닫기' }] });
            const run = () => { const q = H.$('.q', m.pop).value.trim(); H.$('.lst', m.pop).innerHTML = H.grid([{ t: '메뉴경로' }, { t: '메뉴등록', w: 80 }, { t: '관리권한', w: 80 }], MENUS.filter(x => !q || x.includes(q)).map(x => `<tr><td class="l" style="font-size:12px">${esc(A().pathOf(x).join(' > '))}</td><td><input type="checkbox" class="mk" value="${esc(x)}" ${w.menus.includes(x) ? 'checked' : ''}></td><td><input type="checkbox" class="mg" value="${esc(x)}" ${(w.manage || w.menus).includes(x) ? 'checked' : ''}></td></tr>`).join(''), { h: 380 }); };
            H.$('.go', m.pop).onclick = run; run();
          }; });
          H.$$('.b-auth', body).forEach(b => { b.onclick = () => {
            const w = du.works.find(x => String(x.id) === b.closest('tr').dataset.id); const k = b.dataset.k;
            const opts = { grade: ['전학년'].concat([1, 2, 3, 4, 5, 6].flatMap(g => [`${g}학년`].concat([1, 2, 3].map(c => `${g}학년 ${c}반`)))), subj: D().subjects.concat(['미동 마을 탐구(활동)']).map(s => `5학년 ${s}`), club: ['농구부', '코딩부', '합창부', '미술부', '과학탐구부', '독서토론부'] }[k];
            const m = app.modal({ title: `자료 권한 관리 - ${w.name} (${{ grade: '학년반', subj: '교과목', club: '동아리활동' }[k]})`, width: 640, body: `<div class="info-box" style="font-size:12px">학년도 : 2026학년도 ${k === 'subj' ? '· 교과목 자료권한은 학기별로 부여해야 합니다(2학기).' : ''}</div>${opts.map(o => `<label style="display:inline-block;width:140px;line-height:26px"><input type="checkbox" class="ak" value="${esc(o)}" ${w[k].includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { w[k] = H.$$('.ak', m.pop).filter(c => c.checked).map(c => c.value); w.authStatus = '저장'; delete w.docId; w.users.forEach(u => dlog(u, '자료권한', `${w.name} ${{ grade: '학년반', subj: '교과목', club: '동아리' }[k]} 자료권한 변경`)); app.Store.save(); draw(); } }, { text: '닫기' }] });
          }; });
        };
        draw();
      },
      () => { // 교무자료권한승인관리
        curStep = 4;
        const draw = () => {
          const rows = du.works.filter(w => w.grade.length || w.subj.length || w.club.length);
          body.innerHTML = `<div class="toolbar"><span class="total">Total <b>${rows.length}</b></span><span class="sp"></span><button class="btn primary b-req">승인요청</button></div>` + H.grid([{ t: '', w: 40 }, { t: '부서', w: 120 }, { t: '업무', w: 130 }, { t: '사용자', w: 140 }, { t: '자료권한' }, { t: '결재상태', w: 100 }], rows.map(w => { const s = w.docId ? Ap.statusOf(w.docId) : (w.seedDone ? '완결' : '저장'); return `<tr data-id="${w.id}"><td><input type="checkbox" class="ck" ${s === '완결' || s === '결재중' ? 'disabled' : ''}></td><td>${esc(du.depts.find(x => x.id === w.dept).name)}</td><td>${esc(w.name)}</td><td style="font-size:12px">${esc(w.users.join(', '))}</td><td class="l" style="font-size:12px">${[['학년반', w.grade], ['교과목', w.subj], ['동아리', w.club]].filter(x => x[1].length).map(x => `${x[0]}: ${esc(x[1].join(', '))}`).join(' / ')}</td><td class="link stt">${Ap.badge(s)}</td></tr>`; }).join('') || nodataRow(6, '승인요청할 자료권한이 없습니다.'), { h: 460 }) + '<div class="info-box" style="margin-top:10px">자료권한 부여의 최종 결재자는 학교장입니다. 결재가 완료되면 결재상태가 ‘완결’로 바뀌고 체크박스가 비활성화됩니다.</div>';
          H.$$('.stt', body).forEach(td => { td.onclick = () => { const w = du.works.find(x => String(x.id) === td.parentElement.dataset.id); if (w.docId) Ap.detail(Ap.get(w.docId)); }; });
          H.$('.b-req', body).onclick = () => { const s = sel(body, du.works); if (!s.length) { app.alertBox('승인요청할 항목을 선택하십시오.'); return; } Ap.submit({ area: '교육과정', form: '교무자료권한승인', title: `교무자료권한 승인요청 - ${s.map(w => w.name).join(', ')}`, content: s.map(w => [w.name, `${w.users.join(', ')} · ${[['학년반', w.grade], ['교과목', w.subj], ['동아리', w.club]].filter(x => x[1].length).map(x => `${x[0]}: ${x[1].join(', ')}`).join(' / ')}`]), ref: { type: 'dutyAuth' }, onDone: doc => { s.forEach(w => { w.docId = doc.id; }); draw(); } }); };
        };
        page.__refresh = () => { if (curStep === 4) draw(); };
        draw();
      }
    ];
    H.$('.b-search', page).onclick = () => stepFns[curStep]();
    bindFlow(page, stepFns);
  };

  S['담임업무기준관리'] = function (page, title, app) {
    const d = D(); d.homeroomStd = d.homeroomStd || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('담임구분', `<select class="sel s-k">${app.opts(['학급담임', '교과담임', '동아리담임'])}</select>`, true)}${app.searchBtn()}</div>
      <div class="split"><div class="left" style="width:460px"><div class="sub-tit" style="margin-top:0">편성 대상 업무 <select class="sel s-g" style="margin-left:8px">${app.opts(['교무업무', '공통관리', '일반행정', '학교행정'])}</select></div><div class="src"></div></div>
      <div style="display:flex;flex-direction:column;justify-content:center;gap:8px;padding-top:60px"><button class="btn outline b-add">추가 ▶</button><button class="btn b-ret">◀ 반환</button></div>
      <div class="right"><div class="sub-tit" style="margin-top:0">현재 편성 업무<span class="sp"></span><button class="btn primary b-save">저장</button></div><div class="dst"></div></div></div>`);
    let cur = [];
    const base = k => { const r = { '학급담임': '학급담임', '동아리담임': '동아리담임', '교과담임': '학급담임' }[k]; const out = []; window.NEIS_MENU[r].forEach(row => row.forEach(g => g.items.forEach(it => it.leaves.forEach(l => out.push(l))))); return k === '교과담임' ? out.filter(l => /교과평가|학기말종합의견|교과학습발달상황|관찰내용관리|교과별성적조회|교과시간별출결관리/.test(l)) : out; };
    const load = () => { const k = H.$('.s-k', page).value; cur = (d.homeroomStd[k] || base(k)).slice(); draw(); };
    const draw = () => {
      const g = H.$('.s-g', page).value;
      const pool = Object.keys(A().leafIndex).filter(l => { const x = A().leafIndex[l]; if (['기본메뉴', '승인사항'].includes(x.role)) return false; const map = { '교무업무': ['교육과정', '학적', '학생생활', '성적', '학생부', '개별화교육계획', '보건', '경영지원'], '공통관리': ['학교업무분장'], '일반행정': ['{정보공시}학교정보공시'], '학교행정': ['상담관리', '학업중단', '{학생건강체력평가}PAPS', '학교폭력실태조사', '학생정서행동특성검사', '교육활동신청관리'] }[g]; return map.includes(x.g) && !cur.includes(l); });
      H.$('.src', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '업무메뉴' }], pool.map(l => `<tr><td><input type="checkbox" class="sk" value="${esc(l)}"></td><td class="l" style="font-size:12px">${esc(A().pathOf(l).slice(1).join(' > '))}</td></tr>`).join('') || nodataRow(2, '추가할 메뉴가 없습니다.'), { h: 480 });
      H.$('.dst', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '메뉴' }], cur.map(l => `<tr><td><input type="checkbox" class="dk" value="${esc(l)}"></td><td class="l" style="font-size:12px">${esc(l)}</td></tr>`).join(''), { h: 480 });
    };
    H.$('.s-g', page).onchange = draw;
    H.$('.b-search', page).onclick = load;
    H.$('.b-add', page).onclick = () => { const v = H.$$('.sk', page).filter(c => c.checked).map(c => c.value); if (!v.length) { app.alertBox('추가할 메뉴를 선택하십시오.'); return; } cur = cur.concat(v); draw(); };
    H.$('.b-ret', page).onclick = () => { const v = H.$$('.dk', page).filter(c => c.checked).map(c => c.value); if (!v.length) { app.alertBox('반환할 메뉴를 선택하십시오.'); return; } cur = cur.filter(l => !v.includes(l)); draw(); };
    H.$('.b-save', page).onclick = () => { d.homeroomStd[H.$('.s-k', page).value] = cur; H.save('저장되었습니다.\n변경된 담임업무 메뉴는 담임교사에게 적용됩니다. (연수용: 기준만 저장)'); };
    load();
  };

  S['메뉴별업무분장소유자조회'] = function (page, title, app) {
    const du = duty();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('교사', '<input class="inp s-t" readonly style="width:140px"> <button class="btn b-ft">찾기</button> <button class="btn b-clr">지우기</button>')}${app.sf('메뉴', '<input class="inp s-m" readonly style="width:260px"> <button class="btn b-fm">찾기</button>')}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn b-print">${app.I.print}출력</button></div><div class="area">${app.nodata()}</div>`);
    const run = () => {
      const t = H.$('.s-t', page).value, mn = H.$('.s-m', page).value;
      const rows = [];
      D().staff.forEach(s => { if (t && s.name !== t) return; const ws = du.works.filter(w => w.users.includes(s.name)); const menus = [...new Set(ws.flatMap(w => w.menus))]; if (mn && !menus.includes(mn)) return; const hr = Object.entries(homerooms()).filter(([k, v]) => v === s.name).map(([k]) => k.replace('-', '학년 ') + '반'); rows.push([s, ws, menus, [...new Set(ws.flatMap(w => w.grade).concat(hr))], [...new Set(ws.flatMap(w => w.subj))], [...new Set(ws.flatMap(w => w.club))]]); });
      H.$('.area', page).innerHTML = H.grid([{ t: '사용자명', w: 90 }, { t: '직위', w: 90 }, { t: '업무', w: 180 }, { t: '메뉴(건)', w: 80 }, { t: '학년반 자료권한' }, { t: '교과목 자료권한' }, { t: '동아리', w: 120 }], rows.map(([s, ws, m, g, sj, c]) => `<tr><td>${esc(s.name)}</td><td>${esc(s.pos)}</td><td class="l" style="font-size:12px">${esc(ws.map(w => w.name).join(', '))}</td><td class="link mc" data-n="${esc(s.name)}">${m.length}</td><td class="l" style="font-size:12px">${esc(g.join(', '))}</td><td class="l" style="font-size:12px">${esc(sj.join(', '))}</td><td style="font-size:12px">${esc(c.join(', '))}</td></tr>`).join('') || nodataRow(7), { h: 540 });
      H.$$('.mc', page).forEach(td => { td.onclick = () => { const ms = [...new Set(du.works.filter(w => w.users.includes(td.dataset.n)).flatMap(w => w.menus))]; app.modal({ title: `${td.dataset.n} 메뉴 권한`, width: 620, body: H.grid([{ t: '메뉴경로' }], ms.map(x => `<tr><td class="l" style="font-size:12px">${esc(A().pathOf(x).join(' > '))}</td></tr>`).join('') || '<tr><td>등록된 메뉴가 없습니다.</td></tr>', { h: 400 }) }); }; });
    };
    H.$('.b-search', page).onclick = run;
    H.$('.b-clr', page).onclick = () => { H.$('.s-t', page).value = ''; H.$('.s-m', page).value = ''; };
    H.$('.b-ft', page).onclick = () => userPicker('교사검색', false, [], v => { H.$('.s-t', page).value = v; });
    H.$('.b-fm', page).onclick = () => { const ms = [...new Set(du.works.flatMap(w => w.menus))]; const m = app.modal({ title: '메뉴찾기', width: 560, body: H.grid([{ t: '', w: 40 }, { t: '메뉴' }], ms.map(x => `<tr><td><input type="radio" name="mm" value="${esc(x)}"></td><td class="l">${esc(x)}</td></tr>`).join(''), { h: 360 }), buttons: [{ text: '확인', cls: 'primary', onClick: () => { const r = H.$('input[name=mm]:checked', m.pop); if (r) H.$('.s-m', page).value = r.value; } }, { text: '닫기' }] }); };
    H.$('.b-print', page).onclick = () => window.print();
    run();
  };

  S['업무분장변경통계현황'] = function (page, title, app) {
    const du = duty();
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['부서원편성이력', '메뉴및자료권한변경이력', '업무별부서원편성이력'])}<div class="search-box">${app.sf('교사', '<input class="inp s-t" readonly style="width:140px"> <button class="btn b-ft">찾기</button> <button class="btn b-clr">전체</button>')}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn green b-xl">엑셀다운로드</button></div><div class="area"></div>`);
    let tab = 0;
    const run = () => {
      const t = H.$('.s-t', page).value;
      if (tab === 2) {
        H.$('.area', page).innerHTML = H.grid([{ t: '부서', w: 140 }, { t: '업무' }, { t: '사용자 수', w: 100 }, { t: '사용자' }], du.works.filter(w => !t || w.users.includes(t)).map(w => `<tr><td>${esc(du.depts.find(x => x.id === w.dept).name)}</td><td>${esc(w.name)}</td><td class="link">${w.users.length}</td><td class="l">${esc(w.users.join(', '))}</td></tr>`).join('') || nodataRow(4), { h: 520 });
        return;
      }
      const kinds = tab === 0 ? ['부서원편성', '담당자지정', '업무분장가져오기'] : ['메뉴권한', '자료권한'];
      const rows = du.log.filter(x => kinds.includes(x.kind) && (!t || x.user === t));
      if (tab === 1) {
        const by = {}; rows.forEach(x => { by[x.user] = (by[x.user] || 0) + 1; });
        H.$('.area', page).innerHTML = H.grid([{ t: '사용자', w: 120 }, { t: '변경건수', w: 120 }, { t: '최근 변경' }], Object.keys(by).map(u => `<tr><td>${esc(u)}</td><td class="link cc" data-u="${esc(u)}">${by[u]}</td><td class="l">${esc(rows.find(x => x.user === u).detail)}</td></tr>`).join('') || nodataRow(3), { h: 520 });
        H.$$('.cc', page).forEach(td => { td.onclick = () => app.modal({ title: `${td.dataset.u} 메뉴 및 자료권한 변경 상세이력`, width: 680, body: H.grid([{ t: '변경일시', w: 140 }, { t: '구분', w: 90 }, { t: '내용' }, { t: '처리자', w: 80 }], rows.filter(x => x.user === td.dataset.u).map(x => `<tr><td>${x.at}</td><td>${x.kind}</td><td class="l">${esc(x.detail)}</td><td>${esc(x.by)}</td></tr>`).join('')) }); });
        return;
      }
      H.$('.area', page).innerHTML = H.grid([{ t: '변경일시', w: 150 }, { t: '사용자', w: 100 }, { t: '구분', w: 120 }, { t: '내용' }, { t: '처리자', w: 100 }], rows.map(x => `<tr><td>${x.at}</td><td>${esc(x.user)}</td><td>${x.kind}</td><td class="l">${esc(x.detail)}</td><td>${esc(x.by)}</td></tr>`).join('') || nodataRow(5), { h: 520 });
    };
    H.$('.b-search', page).onclick = run;
    H.$('.b-clr', page).onclick = () => { H.$('.s-t', page).value = ''; run(); };
    H.$('.b-ft', page).onclick = () => userPicker('교사검색', false, [], v => { H.$('.s-t', page).value = v; run(); });
    H.$('.b-xl', page).onclick = () => app.alertBox('연수용 환경에서는 엑셀 다운로드를 지원하지 않습니다.');
    bindTabs(page, [0, 1, 2].map(i => () => { tab = i; run(); }));
  };

  const POOL = [{ name: '오혜성', id: 'teacher21', org: '새싹초등학교', pos: '교사' }, { name: '마동탁', id: 'teacher22', org: '연수초등학교', pos: '교사' }, { name: '엄지', id: 'teacher23', org: '해오름초등학교', pos: '교사' }];
  S['발령전임시교원등록'] = function (page, title, app) {
    const du = duty();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('사용자명', '<input class="inp s-q">')}${app.searchBtn()}</div><div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn primary b-imp">사용자가져오기</button><button class="btn primary b-tmp">임시교원등록</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>
      <div class="info-box" style="margin-top:10px">· <b>사용자가져오기</b>: 같은 시도의 교원(나이스 ID 보유)을 가져와 바로 권한을 부여합니다.<br>· <b>임시교원등록</b>: 신규임용·타시도 전입 등으로 ID가 없는 교원을 임시 등록합니다. 로그인은 불가하며, 6개월 이내에 [임시교원권한이양]으로 정식 ID에 이양해야 합니다.</div>`);
    const draw = () => { const q = H.$('.s-q', page).value.trim(); const rows = du.temps.filter(t => !q || t.name.includes(q)); H.$('.cnt', page).textContent = rows.length; H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '구분', w: 110 }, { t: '사용자ID', w: 120 }, { t: '사용자명', w: 100 }, { t: '소속' }, { t: '직위', w: 90 }, { t: '등록일', w: 110 }], rows.map(t => `<tr data-id="${t.id}"><td><input type="checkbox" class="ck"></td><td>${t.kind}</td><td>${esc(t.uid)}</td><td>${esc(t.name)}</td><td>${esc(t.org)}</td><td>${esc(t.pos)}</td><td>${t.date}</td></tr>`).join('') || nodataRow(7, '등록된 발령전 임시교원이 없습니다.')); };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-imp', page).onclick = () => {
      const m = app.modal({ title: '사용자가져오기', width: 600, body: `<div style="display:flex;gap:6px;margin-bottom:8px"><input class="inp q" style="flex:1" placeholder="교원 성명 (예: 오혜성)"><button class="btn primary go">조회</button></div><div class="lst"></div><div class="info-box" style="margin-top:8px;font-size:12px">※ 동일한 성명이 여러 명일 수 있으므로 소속을 정확히 확인하십시오. (가상 교원)</div>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const r = H.$('input[name=pu]:checked', m.pop); if (!r) { app.alertBox('가져올 사용자를 선택하십시오.'); return false; } const u = POOL[+r.value]; if (du.temps.some(t => t.uid === u.id)) { app.alertBox('이미 등록된 사용자입니다.'); return false; } du.temps.push({ id: nextId(du.temps), kind: '사용자가져오기', uid: u.id, name: u.name, org: u.org, pos: u.pos, date: H.dateStr(app.today()) }); H.save(); draw(); } }, { text: '닫기' }] });
      const run = () => { const q = H.$('.q', m.pop).value.trim(); H.$('.lst', m.pop).innerHTML = H.grid([{ t: '', w: 40 }, { t: '사용자ID', w: 110 }, { t: '사용자명', w: 90 }, { t: '소속' }, { t: '직위', w: 80 }], POOL.map((u, i) => (!q || u.name.includes(q)) ? `<tr><td><input type="radio" name="pu" value="${i}"></td><td>${u.id}</td><td>${u.name}</td><td>${u.org}</td><td>${u.pos}</td></tr>` : '').join('') || nodataRow(5)); };
      H.$('.go', m.pop).onclick = run; run();
    };
    H.$('.b-tmp', page).onclick = () => {
      const m = app.modal({ title: '임시교원등록', width: 440, body: '<table class="form"><tr><th class="req">*사용자명</th><td><input class="inp v" placeholder="이양받을 교원명과 동일하게 입력"></td></tr></table>', buttons: [{ text: '등록', cls: 'primary', onClick: () => { const v = H.$('.v', m.pop).value.trim(); if (!v) { app.alertBox('사용자명을 입력하십시오.'); return false; } const uid = 'TMP' + pad(nextId(du.temps)).padStart(4, '0'); du.temps.push({ id: nextId(du.temps), kind: '임시교원등록', uid, name: v, org: D().org.school, pos: '교사(임시)', date: H.dateStr(app.today()) }); app.Store.save(); draw(); app.alertBox('임시 발급받은 아이디를 6개월 이내에 정식아이디로 이양하십시오.'); } }, { text: '닫기' }] });
    };
    H.$('.b-del', page).onclick = () => { const s = sel(page, du.temps); if (!s.length) { app.alertBox('삭제할 사용자를 선택하십시오.'); return; } if (s.some(t => t.kind === '임시교원등록')) { app.alertBox('임시교원등록으로 등록한 사용자는 권한이양 전에는 삭제할 수 없습니다.'); return; } du.temps = du.temps.filter(t => !s.includes(t)); H.save(); draw(); };
  };
  S['임시교원권한이양'] = function (page, title, app) {
    const du = duty(); let from = null, to = null;
    page.insertAdjacentHTML('beforeend', `<div class="split"><div class="left" style="flex:1"><div class="sub-tit" style="margin-top:0">인계자(임시사용자)</div><div style="display:flex;gap:6px"><input class="inp q1" style="flex:1" placeholder="사용자명"><button class="btn primary g1">조회</button></div><div class="p1" style="margin-top:8px"></div></div>
      <div class="right" style="flex:1"><div class="sub-tit" style="margin-top:0">인수자(실사용자)</div><div style="display:flex;gap:6px"><input class="inp q2" style="flex:1" placeholder="사용자명 또는 ID"><button class="btn primary g2">조회</button></div><div class="p2" style="margin-top:8px"></div></div></div>
      <div class="toolbar" style="margin-top:14px"><span class="sp"></span><button class="btn primary b-go">업무분장 인계</button></div><div class="info-box">임시교원의 사용자명과 이양받을 교원의 사용자명이 같아야 합니다. 이양 후 임시 ID는 자동 삭제되고, 담임정보·시간표 등의 임시 ID는 정식 ID로 바뀝니다.</div>`);
    const card = u => u ? `<table class="form"><tr><th>사용자ID</th><td>${esc(u.uid || u.id)}</td></tr><tr><th>사용자명</th><td>${esc(u.name)}</td></tr><tr><th>소속</th><td>${esc(u.org)}</td></tr></table>` : app.nodata('사용자를 조회하여 선택하십시오.');
    const draw = () => { H.$('.p1', page).innerHTML = card(from); H.$('.p2', page).innerHTML = card(to); };
    draw();
    H.$('.g1', page).onclick = () => { const q = H.$('.q1', page).value.trim(); const list = du.temps.filter(t => t.kind === '임시교원등록' && (!q || t.name.includes(q))); const m = app.modal({ title: '임시사용자찾기', width: 480, body: H.grid([{ t: 'ID', w: 100 }, { t: '사용자명' }, { t: '등록일', w: 110 }], list.map((t, i) => `<tr data-i="${i}" style="cursor:pointer"><td>${t.uid}</td><td>${esc(t.name)}</td><td>${t.date}</td></tr>`).join('') || nodataRow(3, '임시교원이 없습니다. [발령전임시교원등록]에서 먼저 등록하십시오.')) + '<div style="font-size:12px;margin-top:6px">※ 더블클릭하여 선택</div>' }); H.$$('tr[data-i]', m.pop).forEach(tr => { tr.ondblclick = () => { from = list[+tr.dataset.i]; m.close(); draw(); }; }); };
    H.$('.g2', page).onclick = () => { const q = H.$('.q2', page).value.trim(); const list = POOL.concat(D().staff.map(s => ({ name: s.name, id: s.id, org: D().org.school }))).filter(u => !q || u.name.includes(q) || u.id.includes(q)); const m = app.modal({ title: '인수자 찾기', width: 480, body: H.grid([{ t: 'ID', w: 110 }, { t: '사용자명' }, { t: '소속' }], list.map((u, i) => `<tr data-i="${i}" style="cursor:pointer"><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.org)}</td></tr>`).join('')) + '<div style="font-size:12px;margin-top:6px">※ 더블클릭하여 선택</div>' }); H.$$('tr[data-i]', m.pop).forEach(tr => { tr.ondblclick = () => { to = list[+tr.dataset.i]; m.close(); draw(); }; }); };
    H.$('.b-go', page).onclick = () => { if (!from || !to) { app.alertBox('인계자와 인수자를 모두 선택하십시오.'); return; } if (from.name !== to.name) { app.alertBox('임시교원의 사용자명과 인수자의 사용자명이 동일해야 합니다.'); return; } app.confirmBox(`${from.uid}의 전체 업무 권한을 ${to.id}(${to.name})에게 이양하시겠습니까?`, () => { du.temps = du.temps.filter(t => t !== from); dlog(to.name, '부서원편성', `임시교원(${from.uid}) 권한 이양`); from = null; to = null; H.save('권한이 이양되었습니다. 임시 ID는 삭제되었습니다.'); draw(); }); };
  };

  /* =========================================================
     교육과정
     ========================================================= */
  S['학교기본정보조회'] = function (page, title, app) {
    const d = D(); const hr = homerooms();
    page.insertAdjacentHTML('beforeend', `<table class="form"><colgroup><col style="width:150px"><col><col style="width:150px"><col></colgroup>
      <tr><th>학교명</th><td>${esc(d.org.school)}</td><th>학교코드</th><td>${esc(d.org.schoolCode)}</td></tr>
      <tr><th>관할교육청</th><td>${esc(d.org.office)} 태백교육지원청</td><th>설립구분</th><td>공립</td></tr>
      <tr><th>주소</th><td colspan="3">연수특별자치도 태백시 미동마을로 1 (가상 주소)</td></tr>
      <tr><th>대표전화</th><td>000-000-0000 (가상)</td><th>개교일</th><td>1990.03.01</td></tr>
      <tr><th>학교장</th><td>고길동</td><th>교감</th><td>권준호</td></tr></table>
      <div class="sub-tit">학년·학급 현황 (2026학년도)</div>${H.grid([{ t: '학년', w: 80 }, { t: '학급수', w: 80 }, { t: '학생수(가상)', w: 110 }, { t: '담임' }], [1, 2, 3, 4, 5, 6].map(g => `<tr><td>${g}학년</td><td>3</td><td>${g === 5 ? 30 : 27 + g}</td><td class="l">${[1, 2, 3].map(c => `${c}반 ${esc(hr[g + '-' + c])}`).join(' · ')}</td></tr>`).join(''))}`);
  };
  function homeroomScreen(page, title, app, editable) {
    const hr = homerooms(); const d = D(); d.homeroomHist = d.homeroomHist || [];
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([['2026', '2026학년도']])}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([['', '전체'], 1, 2, 3, 4, 5, 6].map(x => Array.isArray(x) ? x : [x, x + '학년']), editable ? '5' : '')}</select>`, true)}${app.searchBtn()}</div>
      ${editable ? '<div class="toolbar"><label><input type="checkbox" class="hist"> 이력추가</label><span class="sp"></span><button class="btn outline b-re">자료권한재등록</button><button class="btn primary b-save">저장</button></div>' : ''}
      <div class="split">${editable ? '<div class="left" style="width:200px"><div class="sub-tit" style="margin-top:0">교사 목록</div><div class="tl"></div></div>' : ''}<div class="right"><div class="area"></div></div></div>
      ${editable ? '<div class="info-box" style="margin-top:10px">왼쪽 교사를 끌어서(드래그 앤 드롭) 오른쪽 ‘담임’ 칸에 놓은 뒤 {저장}합니다. 학기 중 담임이 바뀌면 ‘이력추가’를 체크하여 저장해야 학년반 이력에 누가됩니다.</div>' : ''}`);
    let work = Object.assign({}, hr);
    const draw = () => {
      const g = H.$('.s-g', page).value;
      const keys = Object.keys(work).filter(k => !g || k.startsWith(g + '-'));
      H.$('.area', page).innerHTML = H.grid([{ t: '학년', w: 70 }, { t: '반', w: 70 }, { t: '담임' }, { t: '학생수', w: 90 }].concat(editable ? [{ t: '', w: 50 }] : []), keys.map(k => `<tr><td>${k.split('-')[0]}</td><td>${k.split('-')[1]}</td><td class="drop" data-k="${k}" style="${editable ? 'background:#f7faff;cursor:copy' : ''}">${esc(work[k] || '')}</td><td>${k === '5-2' ? D().students.length : 9 + (+k[0] % 3)}</td>${editable ? `<td><span class="rm" data-k="${k}" style="cursor:pointer" title="삭제">🗑</span></td>` : ''}</tr>`).join(''), { h: 560 });
      if (!editable) return;
      H.$('.tl', page).innerHTML = H.grid([{ t: '교사' }], allTeachers().map(n => `<tr><td draggable="true" class="dg" data-n="${esc(n)}" style="cursor:grab">${esc(n)}</td></tr>`).join(''), { h: 520 });
      H.$$('.dg', page).forEach(td => { td.ondragstart = e => e.dataTransfer.setData('text/plain', td.dataset.n); });
      H.$$('.drop', page).forEach(td => { td.ondragover = e => e.preventDefault(); td.ondrop = e => { e.preventDefault(); work[td.dataset.k] = e.dataTransfer.getData('text/plain'); draw(); }; });
      H.$$('.rm', page).forEach(x => { x.onclick = () => { work[x.dataset.k] = ''; draw(); }; });
    };
    draw();
    H.$('.b-search', page).onclick = draw;
    if (editable) {
      H.$('.b-save', page).onclick = () => { const ch = Object.keys(work).filter(k => work[k] !== hr[k]); if (!ch.length) { app.alertBox('변경된 내용이 없습니다.'); return; } if (H.$('.hist', page).checked) ch.forEach(k => d.homeroomHist.push({ cls: k, before: hr[k], after: work[k], at: Ap.now() })); Object.assign(hr, work); H.save(`${ch.length}개 학급의 담임이 저장되었습니다.\n학급담임 권한이 자동 등록되며, 자료권한은 [교무자료권한승인관리] 결재 후 부여됩니다.`); };
      H.$('.b-re', page).onclick = () => app.alertBox('학급담임 자료권한이 재등록되었습니다.\n[교무자료권한승인관리]에서 결재를 진행하십시오. (연수용)');
    }
  }
  S['학급담임편성조회'] = (p, t, app) => homeroomScreen(p, t, app, false);
  S['학급담임편성관리'] = (p, t, app) => homeroomScreen(p, t, app, true);

  S['담당교과편성관리'] = function (page, title, app) {
    const d = D();
    if (!d.subjTeach) d.subjTeach = [{ id: 1, sem: '1', grade: 5, teacher: '마이콜', subj: '영어', classes: [1, 2, 3] }, { id: 2, sem: '2', grade: 5, teacher: '마이콜', subj: '영어', classes: [1, 2, 3] }, { id: 3, sem: '1', grade: 5, teacher: '봉미선', subj: '체육', classes: [1, 3] }];
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['담당교과 편성', '담당교과 조회', '교과별/학급별 시수누계'])}<div class="body"></div>`);
    const body = H.$('.body', page);
    const t0 = () => {
      body.innerHTML = `<div class="search-box">${app.sf('학기', `<select class="sel s-sem">${app.opts([['1', '1학기'], ['2', '2학기']], '2')}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([1, 2, 3, 4, 5, 6].map(x => [x, x + '학년']), 5)}</select>`, true)}${app.searchBtn()}</div>
        <div class="toolbar"><span class="sp"></span><button class="btn outline b-imp">가져오기</button><button class="btn outline b-att">출결일괄편성</button><button class="btn outline b-re">자료권한재등록</button><button class="btn primary b-add">등록</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>
        <div class="info-box" style="margin-top:10px">학급담임은 담임 편성 시 1·2학기 교과목 권한이 자동 부여됩니다. 교과전담(교과담임)은 학기별로 담당교과를 등록하고 자료권한 결재를 받아야 합니다.</div>`;
      const draw = () => { const sm = H.$('.s-sem', body).value, g = +H.$('.s-g', body).value; const rows = d.subjTeach.filter(x => x.sem === sm && x.grade === g); H.$('.area', body).innerHTML = H.grid([{ t: '', w: 40 }, { t: '교사명', w: 110 }, { t: '과목', w: 110 }, { t: '담당 반' }, { t: '구분', w: 110 }], rows.map(x => `<tr data-id="${x.id}"><td><input type="checkbox" class="ck"></td><td>${esc(x.teacher)}</td><td>${esc(x.subj)}</td><td>${x.classes.map(c => `${g}-${c}`).join(', ')}</td><td>교과담임</td></tr>`).join('') + [1, 2, 3].map(c => `<tr><td></td><td>${esc(homerooms()[g + '-' + c])}</td><td style="color:#6d7074">전과목</td><td>${g}-${c}</td><td>학급담임(자동)</td></tr>`).join('')); };
      draw();
      H.$('.b-search', body).onclick = draw;
      H.$('.b-imp', body).onclick = () => { if (H.$('.s-sem', body).value !== '2') { app.alertBox('{가져오기}는 2학기 조회 시 1학기 편성내역을 가져오는 기능입니다.'); return; } const g = +H.$('.s-g', body).value; app.confirmBox('1학기 담당교과 편성내역을 2학기로 가져오시겠습니까?', () => { d.subjTeach.filter(x => x.sem === '1' && x.grade === g).forEach(x => { if (!d.subjTeach.some(y => y.sem === '2' && y.grade === g && y.teacher === x.teacher && y.subj === x.subj)) d.subjTeach.push(Object.assign({}, x, { id: nextId(d.subjTeach), sem: '2' })); }); app.Store.save(); draw(); app.toast('가져왔습니다.'); }); };
      H.$('.b-att', body).onclick = () => app.alertBox('해당 학년 학적 반영 학생을 개설 과목에 일괄 편성했습니다.\n(학기말종합의견 등에서 학생 명단이 나타나지 않을 때 사용)');
      H.$('.b-re', body).onclick = () => app.alertBox('교과 자료권한이 재등록되었습니다. [교무자료권한승인관리]에서 결재하십시오.');
      H.$('.b-add', body).onclick = () => { const g = +H.$('.s-g', body).value, sm = H.$('.s-sem', body).value; const m = app.modal({ title: '담당교과 등록', width: 560, body: `<table class="form"><tr><th class="req">*교사명</th><td><select class="sel t">${app.opts(allTeachers())}</select></td></tr><tr><th class="req">*과목</th><td><select class="sel sj">${app.opts(D().subjects)}</select></td></tr><tr><th class="req">*반</th><td>${[1, 2, 3].map(c => `<label style="margin-right:12px"><input type="checkbox" class="ck2" value="${c}"> ${g}-${c}</label>`).join('')}</td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const cs = H.$$('.ck2', m.pop).filter(c => c.checked).map(c => +c.value); if (!cs.length) { app.alertBox('반을 선택하십시오.'); return false; } d.subjTeach.push({ id: nextId(d.subjTeach), sem: sm, grade: g, teacher: H.$('.t', m.pop).value, subj: H.$('.sj', m.pop).value, classes: cs }); app.Store.save(); draw(); } }, { text: '닫기' }] }); };
      H.$('.b-del', body).onclick = () => { const s = sel(body, d.subjTeach); if (!s.length) { app.alertBox('삭제할 편성을 선택하십시오.'); return; } d.subjTeach = d.subjTeach.filter(x => !s.includes(x)); app.Store.save(); draw(); };
    };
    const t1 = () => { body.innerHTML = `<div class="search-box">${app.sf('학기', `<select class="sel s-sem">${app.opts([['1', '1학기'], ['2', '2학기']], '2')}</select>`, true)}${app.sf('교사', `<select class="sel s-t">${app.opts([['', '전체']].concat(allTeachers()))}</select>`)}${app.searchBtn()}</div><div class="area"></div>`; const draw = () => { const sm = H.$('.s-sem', body).value, t = H.$('.s-t', body).value; H.$('.area', body).innerHTML = H.grid([{ t: '교사', w: 110 }, { t: '학년', w: 70 }, { t: '과목', w: 110 }, { t: '반' }], d.subjTeach.filter(x => x.sem === sm && (!t || x.teacher === t)).map(x => `<tr><td>${esc(x.teacher)}</td><td>${x.grade}</td><td>${esc(x.subj)}</td><td>${x.classes.map(c => `${x.grade}-${c}`).join(', ')}</td></tr>`).join('') || nodataRow(4)); }; draw(); H.$('.b-search', body).onclick = draw; };
    const t2 = () => {
      body.innerHTML = `<div class="search-box">${app.sf('학년', `<select class="sel">${app.opts([['5', '5학년']])}</select>`, true)}${app.sf('기간', '<input type="date" class="inp s-a" value="2026-09-01"> ~ <input type="date" class="inp s-b" value="2026-09-30">', true)}${app.searchBtn()}</div><div class="area"></div><div class="info-box" style="margin-top:10px">각 칸의 숫자는 <b>기간계 / 누계 / 계획</b>입니다. (연수용: 5학년 2반 학급시간표 기준 산출)</div>`;
      const draw = () => { const a = H.$('.s-a', body).value, b = H.$('.s-b', body).value; const cnt = (from, to) => { const c = {}; const dd = new Date(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8)); const e = new Date(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8)); while (dd <= e) { const k = H.key(dd); const dow = dd.getDay(); if (dow % 6 && !H.holiday(k)) { const mon = new Date(dd); mon.setDate(dd.getDate() - (dow - 1)); H.timetable(H.key(mon)).forEach(r => { const s = r[dow - 1]; if (s) c[s] = (c[s] || 0) + 1; }); } dd.setDate(dd.getDate() + 1); } return c; }; const p = cnt(a, b), acc = cnt('2026-08-18', b); const plan = { '국어': 102, '수학': 68, '사회': 51, '과학': 51, '영어': 51, '체육': 51, '음악': 34, '미술': 34, '도덕': 17, '실과': 34 }; H.$('.area', body).innerHTML = H.grid([{ t: '학급', w: 80 }].concat(D().subjects.map(s => ({ t: s }))), [1, 2, 3].map(c => `<tr><td>5-${c}</td>${D().subjects.map(s => `<td style="font-size:12px">${c === 2 ? `${p[s] || 0}/${acc[s] || 0}/${plan[s] || 17}` : '-'}</td>`).join('')}</tr>`).join('')); };
      draw(); H.$('.b-search', body).onclick = draw;
    };
    bindTabs(page, [t0, t1, t2]);
  };

  function curriculum() {
    const d = D();
    if (!d.curri) {
      const base = { '국어': [102, 102], '사회': [51, 51], '도덕': [17, 17], '수학': [68, 68], '과학': [51, 51], '실과': [34, 34], '체육': [51, 51], '음악': [34, 34], '미술': [34, 34], '영어': [51, 51] };
      d.curri = { 5: { subj: base, cha: { '자율·자치': [17, 17], '동아리': [17, 17], '진로': [17, 17] } } };
      d.autonomy = [{ id: 1, grade: 5, mode: '학급공통', name: '미동 마을 탐구', type: '활동', rel: '사회', sem: '2', hours: 17, teachers: { 1: '나미리', 2: window.NEIS_ME, 3: '변태수' }, assigned: false }];
    }
    return d.curri;
  }
  S['학교교육과정편제및시간배당관리'] = function (page, title, app) {
    const d = D(); curriculum();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([['2026', '2026학년도']])}</select>`, true)}${app.sf('교육과정차수', `<select class="sel">${app.opts(['2022 개정 교육과정'])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-reg">등록</button><button class="btn b-print">${app.I.print}출력</button></div><div class="area"></div>`);
    const draw = () => {
      const rows = [];
      Object.keys(d.curri).forEach(g => { const c = d.curri[g]; Object.entries(c.subj).forEach(([s, h]) => rows.push([g, '공통교육과정', s, h])); Object.entries(c.cha).forEach(([s, h]) => rows.push([g, '창의적체험활동', s, h])); d.autonomy.filter(a => a.grade === +g).forEach(a => rows.push([g, `학교자율시간(${a.mode})`, `${a.name}${a.type === '활동' ? '(활동)' : ''}`, a.sem === '1' ? [a.hours, 0] : [0, a.hours], a.id])); });
      const tot = rows.reduce((a, r) => [a[0] + r[3][0], a[1] + r[3][1]], [0, 0]);
      H.$('.area', page).innerHTML = H.grid([{ t: '학년', w: 60 }, { t: '구분', w: 180 }, { t: '과목(활동)' }, { t: '1학기', w: 90 }, { t: '2학기', w: 90 }, { t: '계', w: 90 }], rows.map(r => `<tr data-g="${r[0]}" data-s="${esc(r[2])}" data-k="${esc(r[1])}"><td>${r[0]}</td><td>${r[1]}</td><td>${esc(r[2])}</td><td class="link ed">${r[3][0]}</td><td class="link ed">${r[3][1]}</td><td>${r[3][0] + r[3][1]}</td></tr>`).join('') + `<tr style="font-weight:700"><td colspan="3">합계</td><td>${tot[0]}</td><td>${tot[1]}</td><td>${tot[0] + tot[1]}</td></tr>`, { h: 560 });
      H.$$('.ed', page).forEach(td => { td.onclick = () => { const tr = td.parentElement; const g = tr.dataset.g, s = tr.dataset.s, k = tr.dataset.k; if (k.startsWith('학교자율시간')) { app.alertBox('학교자율시간 시수는 {등록} 화면의 학교자율시간 영역에서 수정합니다.'); return; } const obj = k === '공통교육과정' ? d.curri[g].subj : d.curri[g].cha; const m = app.modal({ title: '학교교육과정편제 및 시간배당 수정', width: 440, body: `<table class="form"><tr><th>과목</th><td>${esc(s)}</td></tr><tr><th>1학기</th><td><input class="inp a" type="number" value="${obj[s][0]}"></td></tr><tr><th>2학기</th><td><input class="inp b" type="number" value="${obj[s][1]}"></td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { obj[s] = [+H.$('.a', m.pop).value, +H.$('.b', m.pop).value]; app.Store.save(); draw(); } }, { text: '삭제', cls: 'dark', onClick: () => { if (d.subjTeach && d.subjTeach.some(x => x.subj === s)) { app.alertBox('담당교과가 편성된 과목은 삭제할 수 없습니다.\n담당 교사 편성·시간표·평가 자료를 먼저 삭제하십시오.'); return false; } delete obj[s]; app.Store.save(); draw(); } }, { text: '닫기' }] }); }; });
    };
    draw();
    H.$('.b-search', page).onclick = draw;
    H.$('.b-print', page).onclick = () => printDoc('학교교육과정편제 및 시간배당 보고서', `<h2 style="font-size:18px">2026학년도 학교교육과정 편제 및 시간배당</h2>${H.$('.area', page).innerHTML.replace(/class="link ed"/g, '')}`);
    H.$('.b-reg', page).onclick = () => {
      const m = app.modal({ title: '학교교육과정편제 및 시간배당 등록', width: 820, body: `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">학년 <select class="sel g">${app.opts([1, 2, 3, 4, 5, 6].map(x => [x, x + '학년']), 5)}</select><button class="btn primary go">조회</button><span class="sp" style="flex:1"></span><button class="btn outline auto">자동반영</button></div><div class="bd"></div>`,
        buttons: [{ text: '저장', cls: 'primary', keep: true, onClick: () => { const g = H.$('.g', m.pop).value; const c = d.curri[g] = d.curri[g] || { subj: {}, cha: {} }; H.$$('.hr', m.pop).forEach(i => { const o = i.dataset.k === '공통' ? c.subj : c.cha; o[i.dataset.s] = o[i.dataset.s] || [0, 0]; o[i.dataset.s][+i.dataset.m] = +i.value || 0; }); app.Store.save(); draw(); app.toast('저장되었습니다.'); } }, { text: '닫기' }] });
      const load = () => {
        const g = H.$('.g', m.pop).value; const c = d.curri[g] || { subj: {}, cha: {} };
        const subs = +g <= 2 ? ['국어', '수학', '바른 생활', '슬기로운 생활', '즐거운 생활'] : D().subjects.filter(s => !['자율·자치', '동아리', '진로'].includes(s));
        const row = (k, s, h) => `<tr><td>${k}</td><td>${esc(s)}</td><td><input class="inp hr" type="number" data-k="${k}" data-s="${esc(s)}" data-m="0" value="${h[0]}"></td><td><input class="inp hr" type="number" data-k="${k}" data-s="${esc(s)}" data-m="1" value="${h[1]}"></td></tr>`;
        H.$('.bd', m.pop).innerHTML = H.grid([{ t: '구분', w: 120 }, { t: '과목(활동)' }, { t: '1학기 시수', w: 120 }, { t: '2학기 시수', w: 120 }], subs.map(s => row('공통', s, c.subj[s] || [0, 0])).join('') + ['자율·자치', '동아리', '진로'].map(s => row('창체', s, c.cha[s] || [0, 0])).join(''), { h: 360 }) + (+g >= 3 ? `<div class="sub-tit" style="font-size:15px">학교자율시간<span class="sp"></span><button class="btn outline b-au">등록</button></div>${H.grid([{ t: '운영방식', w: 90 }, { t: '편제' }, { t: '관련교과', w: 90 }, { t: '과목/활동', w: 80 }, { t: '학기', w: 60 }, { t: '시수', w: 60 }], d.autonomy.filter(a => a.grade === +g).map(a => `<tr><td>${a.mode}</td><td>${esc(a.name)}${a.type === '활동' ? '(활동)' : ''}</td><td>${a.rel}</td><td>${a.type}</td><td>${a.sem}</td><td>${a.hours}</td></tr>`).join('') || nodataRow(6, '등록된 학교자율시간이 없습니다.'))}` : '');
        const au = H.$('.b-au', m.pop); if (au) au.onclick = () => { const mm = app.modal({ title: '학교자율시간 등록', width: 520, body: `<table class="form"><tr><th class="req">*운영방식</th><td><select class="sel a1">${app.opts(['학급공통', '학생선택'])}</select></td></tr><tr><th class="req">*편제(과목명)</th><td><input class="inp a2" placeholder="예) 우리 고장 탐구"></td></tr><tr><th class="req">*관련교과</th><td><select class="sel a3">${app.opts(['국어', '사회', '과학', '실과', '미술', '음악', '체육'])}</select></td></tr><tr><th class="req">*과목활동구분</th><td><select class="sel a4">${app.opts(['활동', '과목'])}</select></td></tr><tr><th class="req">*학기</th><td><select class="sel a5">${app.opts([['1', '1학기'], ['2', '2학기']], '2')}</select></td></tr><tr><th class="req">*시수</th><td><input class="inp a6" type="number" value="17"></td></tr></table><div class="info-box" style="margin-top:8px;font-size:12px">동일한 과목(활동)은 한 학기만 편성할 수 있습니다.</div>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const v = k => H.$('.' + k, mm.pop).value.trim(); if (!v('a2')) { app.alertBox('편제(과목명)를 입력하십시오.'); return false; } if (d.autonomy.some(a => a.grade === +g && a.name === v('a2'))) { app.alertBox('동일한 과목(활동)이 이미 편성되어 있습니다.'); return false; } d.autonomy.push({ id: nextId(d.autonomy), grade: +g, mode: v('a1'), name: v('a2'), rel: v('a3'), type: v('a4'), sem: v('a5'), hours: +v('a6'), teachers: {}, assigned: false }); app.Store.save(); load(); draw(); } }, { text: '닫기' }] }); };
      };
      H.$('.go', m.pop).onclick = load;
      H.$('.auto', m.pop).onclick = () => { H.$$('.hr[data-k="공통"]', m.pop).forEach(i => { const tot = (+H.$(`.hr[data-s="${CSS.escape(i.dataset.s)}"][data-m="0"]`, m.pop).value || 0) + (+H.$(`.hr[data-s="${CSS.escape(i.dataset.s)}"][data-m="1"]`, m.pop).value || 0) || 68; const a = Math.round(tot * 95 / 190); i.value = i.dataset.m === '0' ? a : tot - a; }); app.toast('수업일수에 비례하여 학기별 시수를 자동 입력했습니다. (공통교육과정만)'); };
      load();
    };
  };

  S['학교자율시간관리'] = function (page, title, app) {
    const d = D(); curriculum(); d.autoGroups = d.autoGroups || [];
    page.insertAdjacentHTML('beforeend', `${flow(['학생선택그룹편성', '과목(활동) 개설', '학생배정(학생선택)', '학교자율시간관리(전체)'], 1)}<div class="search-box">${app.sf('학기', `<select class="sel s-sem">${app.opts([['1', '1학기'], ['2', '2학기']], '2')}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([3, 4, 5, 6].map(x => [x, x + '학년']), 5)}</select>`, true)}${app.searchBtn()}</div><div class="body"></div>`);
    const body = H.$('.body', page); let cur = 1;
    const list = () => d.autonomy.filter(a => a.grade === +H.$('.s-g', page).value && a.sem === H.$('.s-sem', page).value);
    const fns = [
      () => { cur = 0; const ss = list().filter(a => a.mode === '학생선택'); body.innerHTML = ss.length ? `<div class="toolbar"><span class="sp"></span><button class="btn outline b-add">행추가</button><button class="btn primary b-save">저장</button></div>${H.grid([{ t: '선택그룹명' }, { t: '과목(활동)당 시수', w: 140 }, { t: '선택과목(활동) 수', w: 140 }, { t: '편성 과목(활동)' }], d.autoGroups.map(g => `<tr><td>${esc(g.name)}</td><td>${g.hours}</td><td>${g.n}</td><td>${esc(g.items.join(', '))}</td></tr>`).join('') || nodataRow(4, '생성된 학생선택그룹이 없습니다.'))}` : `<div class="info-box">학생선택그룹편성은 <b>‘학교자율시간(학생선택)’</b> 과목(활동)을 편제한 경우에만 사용합니다.<br>현재 선택한 학년·학기에는 학생선택 과목이 없습니다. (5학년 2학기: 학급공통 ‘미동 마을 탐구(활동)’ 운영)</div>`; const ad = H.$('.b-add', body); if (ad) ad.onclick = () => { const m = app.modal({ title: '학생선택그룹 생성', width: 480, body: `<table class="form"><tr><th>그룹명</th><td><input class="inp n"></td></tr><tr><th>과목당 시수</th><td><input class="inp h" type="number" value="17"></td></tr><tr><th>선택과목 수</th><td><input class="inp c" type="number" value="1"></td></tr><tr><th>편성 과목</th><td>${ss.map(a => `<label><input type="checkbox" class="k" value="${esc(a.name)}" data-h="${a.hours}"> ${esc(a.name)} (${a.hours}시간)</label>`).join('<br>')}</td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const h = +H.$('.h', m.pop).value; const it = H.$$('.k', m.pop).filter(c => c.checked); if (it.some(c => +c.dataset.h !== h)) { app.alertBox('과목(활동)당 시수와 편제 시수가 일치하지 않는 과목이 있습니다.'); return false; } d.autoGroups.push({ name: H.$('.n', m.pop).value, hours: h, n: +H.$('.c', m.pop).value, items: it.map(c => c.value) }); app.Store.save(); fns[0](); } }, { text: '닫기' }] }); }; },
      () => {
        cur = 1; const ls = list(); const g = H.$('.s-g', page).value;
        body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn outline b-bulk">학급공통 일괄편성</button><button class="btn primary b-open">과목(활동)개설</button></div>${H.grid([{ t: '운영방식', w: 90 }, { t: '과목(활동)명' }, { t: '관련교과', w: 90 }, { t: '시수', w: 60 }, { t: '학생편성', w: 90 }].concat([1, 2, 3].map(c => ({ t: `${g}-${c} 담당교사`, w: 120 }))), ls.map(a => `<tr data-id="${a.id}"><td>${a.mode}</td><td>${esc(a.name)}${a.type === '활동' ? '(활동)' : ''}</td><td>${a.rel}</td><td>${a.hours}</td><td>${a.assigned ? '<span class="badge green">편성</span>' : '<span class="badge">미편성</span>'}</td>${[1, 2, 3].map(c => `<td class="link tc" data-c="${c}">${esc(a.teachers[c] || '미지정')}</td>`).join('')}</tr>`).join('') || nodataRow(8, '편제된 학교자율시간이 없습니다. [학교교육과정편제및시간배당관리]에서 먼저 등록하십시오.'))}
          <div class="info-box" style="margin-top:10px">학급공통 운영: ① {학급공통 일괄편성}으로 학생 편성 → ② {과목(활동)개설}로 반별 담당교사 지정 → ③ [교무자료권한승인관리]에서 교과목 결재 완료 후 [평가계획(안)관리]에 과목이 표시됩니다.</div>`;
        H.$('.b-bulk', body).onclick = () => { const c = ls.filter(a => a.mode === '학급공통'); if (!c.length) { app.alertBox('학급공통 과목(활동)이 없습니다.'); return; } app.confirmBox(`학급공통 과목(활동) ${c.length}개에 해당 학년 학생을 일괄 편성하시겠습니까?`, () => { c.forEach(a => { a.assigned = true; }); app.Store.save(); fns[1](); app.toast('편성되었습니다.'); }); };
        H.$('.b-open', body).onclick = () => { if (!ls.length) return; const m = app.modal({ title: '과목(활동) 개설', width: 520, body: `<table class="form"><tr><th class="req">*과목(활동)</th><td><select class="sel a">${app.opts(ls.map(a => [a.id, a.name]))}</select></td></tr><tr><th class="req">*교사명</th><td><select class="sel t">${app.opts(allTeachers(), D().user.name)}</select></td></tr><tr><th class="req">*편성학반</th><td>${[1, 2, 3].map(c => `<label style="margin-right:10px"><input type="checkbox" class="k" value="${c}"> ${g}-${c}</label>`).join('')}</td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { const a = d.autonomy.find(x => x.id === +H.$('.a', m.pop).value); const cs = H.$$('.k', m.pop).filter(c => c.checked).map(c => c.value); if (!cs.length) { app.alertBox('편성학반을 선택하십시오.'); return false; } cs.forEach(c => { a.teachers[c] = H.$('.t', m.pop).value; }); app.Store.save(); fns[1](); } }, { text: '닫기' }] }); };
        H.$$('.tc', body).forEach(td => { td.onclick = () => { const a = d.autonomy.find(x => String(x.id) === td.parentElement.dataset.id); const c = td.dataset.c; const m = app.modal({ title: '담당교사 변경', width: 400, body: `<select class="sel t" style="width:100%">${app.opts(allTeachers(), a.teachers[c])}</select>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { a.teachers[c] = H.$('.t', m.pop).value; app.Store.save(); fns[1](); } }, { text: '닫기' }] }); }; });
      },
      () => { cur = 2; body.innerHTML = list().some(a => a.mode === '학생선택') ? `<div class="info-box">과목(활동)을 선택하고 미편성 학생을 {추가}하여 배정합니다.</div>` : '<div class="info-box">학생배정은 ‘학교자율시간(학생선택)’ 과목(활동)에서만 사용합니다. 학급공통 과목은 {학급공통 일괄편성}으로 전체 학생이 편성됩니다.</div>'; },
      () => { cur = 3; const g = H.$('.s-g', page).value; body.innerHTML = H.grid([{ t: '과목(활동)명' }, { t: '운영방식', w: 90 }, { t: '학기', w: 60 }, { t: '시수', w: 60 }, { t: '학반', w: 70 }, { t: '담당교사', w: 100 }, { t: '학생수', w: 80 }], list().flatMap(a => [1, 2, 3].map(c => `<tr><td>${esc(a.name)}${a.type === '활동' ? '(활동)' : ''}</td><td>${a.mode}</td><td>${a.sem}</td><td>${a.hours}</td><td>${g}-${c}</td><td>${esc(a.teachers[c] || '-')}</td><td>${a.assigned ? (c === 2 ? D().students.length : 10) : 0}</td></tr>`)).join('') || nodataRow(7)); }
    ];
    H.$('.b-search', page).onclick = () => fns[cur]();
    H.$$('.flow .step', page).forEach(s => { s.onclick = () => { H.$$('.flow .step', page).forEach(x => x.classList.toggle('on', x === s)); fns[+s.dataset.i](); }; });
    fns[1]();
  };

  S['연간수업일수확보계획표'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel">${app.opts([['2026', '2026학년도']])}</select>`, true)}${app.sf('학년', `<select class="sel s-g">${app.opts([1, 2, 3, 4, 5, 6].map(x => [x, x + '학년']), 5)}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => {
      const VAC = [['2026-07-25', '2026-08-17'], ['2027-01-01', '2027-02-28']];
      const inVac = k => VAC.some(([a, b]) => k >= a && k <= b);
      const rows = []; let tot = 0;
      for (let i = 0; i < 12; i++) {
        const y = i < 10 ? 2026 : 2027, mo = (i + 2) % 12 + 1; const days = new Date(y, mo, 0).getDate();
        let hol = 0, sat = 0, sun = 0, vac = 0, sch = 0;
        for (let dd = 1; dd <= days; dd++) { const dt = new Date(y, mo - 1, dd); const k = H.key(dt); const w = dt.getDay(); if (y === 2026 && mo === 3 && dd < 3) { vac++; continue; } if (w === 0) sun++; else if (w === 6) sat++; else if (H.holiday(k)) hol++; else if (inVac(k)) vac++; else sch++; }
        tot += sch; rows.push(`<tr><td>${mo}월</td><td>${days}</td><td>${sun}</td><td>${sat}</td><td>${hol}</td><td>${vac}</td><td style="font-weight:700">${sch}</td><td>${tot}</td></tr>`);
      }
      H.$('.area', page).innerHTML = `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:18px">2026학년도 ${H.$('.s-g', page).value}학년 연간 수업일수 확보 계획표</h2><table><tr><th>월</th><th>일수</th><th>일요일</th><th>토요휴업일</th><th>공휴일</th><th>방학·재량휴업</th><th>수업일수</th><th>누계</th></tr>${rows.join('')}</table><p>※ 연간 수업일수 법정 기준: 190일 이상 · 산출 결과 ${tot}일 (연수용: [학사일정관리]의 공휴일과 방학 기간 7.25~8.17, 1.1~2.28 기준)</p></div></div>`;
    };
  };

  // 교과진도표
  function progress() {
    const d = D();
    if (!d.progress) d.progress = [];
    return d.progress;
  }
  function buildProgress(subj) {
    const d = D(); const items = d.learning.filter(l => l.subj === subj && String(l.sem) === '2');
    const rows = []; let i = 0;
    H.weeks().forEach(w => { const t = H.timetable(w.key); for (let c = 0; c < 5; c++) { const dt = new Date(w.start); dt.setDate(dt.getDate() + c); const k = H.key(dt); if (H.holiday(k)) continue; for (let r = 0; r < 6; r++) { if (t[r][c] !== subj) continue; const it = items[i]; rows.push({ id: rows.length + 1, week: w.no, date: k, period: r + 1, subj, unit: it ? it.unit : '', content: it ? it.content : '', no: it ? `${it.cur}/${it.total}` : '' }); i++; } } });
    return rows;
  }
  S['교과진도표관리'] = function (page, title, app) {
    const d = D(); progress(); d.progEtc = d.progEtc || {};
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['교과진도표관리', '교과진도표조회', '교과연간지도계획', '교과연간운영계획'])}<div class="body"></div>`);
    const body = H.$('.body', page);
    const subjSel = v => `<select class="sel s-subj">${H.subjOpts(v || '국어')}</select>`;
    const t0 = () => {
      body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('편제', subjSel(), true)}${app.searchBtn()}</div><div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn primary b-gen">교과진도표생성</button><button class="btn outline b-add">행추가</button><button class="btn outline b-merge">행병합</button><button class="btn outline b-split">행분할</button><button class="btn outline b-etc">기타등록</button><button class="btn primary b-save">저장</button></div><div class="area">${app.nodata()}</div>`;
      let rows = null;
      const draw = () => { const sj = H.$('.s-subj', body).value; rows = rows || d.progress.filter(r => r.subj === sj).map(r => Object.assign({}, r)); H.$('.cnt', body).textContent = rows.length; H.$('.area', body).innerHTML = H.grid([{ t: '', w: 40 }, { t: '주차', w: 60 }, { t: '일자', w: 110 }, { t: '교시', w: 60 }, { t: '단원' }, { t: '학습내용' }, { t: '차시', w: 70 }], rows.map((r, i) => `<tr data-i="${i}"><td><input type="checkbox" class="ck"></td><td>${r.week}</td><td>${r.date}</td><td>${r.period}</td><td><input class="inp f" data-f="unit" value="${esc(r.unit)}"></td><td><input class="inp f" data-f="content" value="${esc(r.content)}"></td><td><input class="inp f" data-f="no" value="${esc(r.no)}"></td></tr>`).join('') || nodataRow(7, '생성된 교과진도표가 없습니다. {교과진도표생성}을 누르십시오.'), { h: 520 }); H.$$('.f', body).forEach(f => { f.oninput = () => { rows[+f.closest('tr').dataset.i][f.dataset.f] = f.value; }; }); };
      const picked = () => H.$$('tbody tr[data-i]', body).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.i);
      H.$('.b-search', body).onclick = () => { rows = null; draw(); };
      H.$('.s-subj', body).onchange = () => { rows = null; draw(); };
      H.$('.b-gen', body).onclick = () => { const sj = H.$('.s-subj', body).value; const n = d.learning.filter(l => l.subj === sj && String(l.sem) === '2').length; if (!n) { app.alertBox(`${sj}의 2학기 교과별 학습내용이 없습니다.\n[교과별학습내용등록]에서 먼저 등록하십시오.`); return; } app.confirmBox(`${sj} 교과진도표를 학급시간표 기준으로 생성하시겠습니까?\n(기존 진도표는 덮어쓰기 됩니다)`, () => { d.progress = d.progress.filter(r => r.subj !== sj).concat(buildProgress(sj)); app.Store.save(); rows = null; draw(); app.toast('교과진도표가 생성되었습니다.'); }); };
      H.$('.b-add', body).onclick = () => { if (!rows) return; rows.push({ id: Date.now(), week: '', date: '', period: '', subj: H.$('.s-subj', body).value, unit: '', content: '', no: '' }); draw(); };
      H.$('.b-merge', body).onclick = () => { const p = picked(); if (p.length < 2) { app.alertBox('병합할 행을 2개 이상 선택하십시오.'); return; } const f = rows[p[0]]; p.slice(1).forEach(i => { f.content += ' / ' + rows[i].content; }); p.slice(1).reverse().forEach(i => rows.splice(i, 1)); draw(); };
      H.$('.b-split', body).onclick = () => { const p = picked(); if (p.length !== 1) { app.alertBox('분할할 행을 1개 선택하십시오.'); return; } rows.splice(p[0] + 1, 0, Object.assign({}, rows[p[0]], { content: '' })); draw(); };
      H.$('.b-save', body).onclick = () => { if (!rows) return; const sj = H.$('.s-subj', body).value; d.progress = d.progress.filter(r => r.subj !== sj).concat(rows); H.save(); };
      H.$('.b-etc', body).onclick = () => { const ws = H.weeks(); const m = app.modal({ title: '기타내용등록', width: 640, body: `<div style="margin-bottom:8px">주차 <select class="sel w">${app.opts(ws.map(w => [w.key, w.label]), H.curWeek().key)}</select></div><table class="form"><tr><th>제목</th><td><input class="inp t" style="width:100%" placeholder="예) 독서 주간"></td></tr><tr><th>내용</th><td><textarea class="ta c"></textarea></td></tr></table>`, buttons: [{ text: '저장', cls: 'primary', onClick: () => { d.progEtc[H.$('.w', m.pop).value] = { title: H.$('.t', m.pop).value, content: H.$('.c', m.pop).value }; app.Store.save(); app.toast('저장되었습니다.'); } }, { text: '닫기' }] }); H.$('.w', m.pop).onchange = () => { const e = d.progEtc[H.$('.w', m.pop).value] || {}; H.$('.t', m.pop).value = e.title || ''; H.$('.c', m.pop).value = e.content || ''; }; H.$('.w', m.pop).onchange(); };
      draw();
    };
    const t1 = () => { const ws = H.weeks(); body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('양식', `<select class="sel">${app.opts(['주간 교시별', '교과별'])}</select>`)}${app.sf('주차', `<select class="sel s-w">${app.opts(ws.map(w => [w.no, w.label]), H.curWeek().no)}</select>`, true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`; H.$('.b-search', body).onclick = () => { const wn = +H.$('.s-w', body).value; const rs = d.progress.filter(r => r.week === wn).sort((a, b) => (a.date + a.period).localeCompare(b.date + b.period)); const w = ws.find(x => x.no === wn); const etc = d.progEtc[w.key]; H.$('.area', body).innerHTML = (etc ? `<div class="info-box"><b>${esc(etc.title)}</b> ${esc(etc.content)}</div>` : '') + H.grid([{ t: '일자', w: 110 }, { t: '교시', w: 60 }, { t: '과목', w: 90 }, { t: '단원' }, { t: '학습내용' }, { t: '차시', w: 70 }], rs.map(r => `<tr><td>${r.date}</td><td>${r.period}</td><td>${r.subj}</td><td class="l">${esc(r.unit)}</td><td class="l">${esc(r.content)}</td><td>${esc(r.no)}</td></tr>`).join('') || nodataRow(6, '해당 주차의 진도표가 없습니다.')); }; };
    const t2 = () => { body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.sf('편제', subjSel(), true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`; H.$('.b-search', body).onclick = () => { const sj = H.$('.s-subj', body).value; const units = {}; d.progress.filter(r => r.subj === sj).forEach(r => { if (!r.unit) return; units[r.unit] = units[r.unit] || { from: r.date, to: r.date, n: 0 }; units[r.unit].to = r.date; units[r.unit].n++; }); H.$('.area', body).innerHTML = H.grid([{ t: '단원' }, { t: '시작', w: 110 }, { t: '종료', w: 110 }, { t: '시수', w: 70 }], Object.keys(units).map(u => `<tr><td class="l">${esc(u)}</td><td>${units[u].from}</td><td>${units[u].to}</td><td>${units[u].n}</td></tr>`).join('') || nodataRow(4, '교과진도표를 먼저 생성하십시오.')); }; };
    const t3 = () => { body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true })}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`; H.$('.b-search', body).onclick = () => { const by = {}; d.progress.forEach(r => { by[r.subj] = (by[r.subj] || 0) + 1; }); H.$('.area', body).innerHTML = H.grid([{ t: '과목' }, { t: '진도표 편성 시수', w: 140 }, { t: '편제 시수(2학기)', w: 140 }], D().subjects.map(s => `<tr><td>${s}</td><td>${by[s] || 0}</td><td>${((curriculum()[5] || {}).subj || {})[s] ? curriculum()[5].subj[s][1] : '-'}</td></tr>`).join('')); }; };
    bindTabs(page, [t0, t1, t2, t3]);
  };
  function reorgScreen(page, app, kindIdx) {
    const d = D(); progress(); d.reorg = d.reorg || { topics: [{ id: 1, kind: '범교과주제학습', name: '안전·건강 교육', use: true }, { id: 2, kind: '주제중심교과통합', name: '우리 마을 지도 만들기', use: true }], items: [] };
    const kinds = ['범교과주제학습', '주제중심교과통합'];
    page.insertAdjacentHTML('beforeend', `${tabsHtml(kinds)}<div class="body"></div>`);
    const body = H.$('.body', page);
    const fn = k => () => {
      const kind = kinds[k]; const label = k === 0 ? '주제' : '프로젝트';
      body.innerHTML = `<div class="search-box">${app.commonSearch({ sem: true, grade: false, cls: false })}${app.sf(label, `<select class="sel s-t">${app.opts(d.reorg.topics.filter(t => t.kind === kind && t.use).map(t => [t.id, t.name]))}</select>`, true)}${app.searchBtn()}</div>
        <div class="toolbar"><span class="sp"></span><button class="btn outline b-topic">${k === 0 ? '주제등록' : '프로젝트등록'}</button><button class="btn primary b-pull">진도표가져오기</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>`;
      const draw = () => { const tid = +H.$('.s-t', body).value; const rows = d.reorg.items.filter(x => x.topic === tid); H.$('.area', body).innerHTML = H.grid([{ t: '', w: 40 }, { t: '일자', w: 110 }, { t: '교시', w: 60 }, { t: '과목', w: 80 }, { t: '단원' }, { t: '학습내용' }], rows.map(r => `<tr data-id="${r.id}"><td><input type="checkbox" class="ck"></td><td>${r.date}</td><td>${r.period}</td><td>${r.subj}</td><td class="l">${esc(r.unit)}</td><td class="l">${esc(r.content)}</td></tr>`).join('') || nodataRow(6, `${label}에 편성된 진도가 없습니다. {진도표가져오기}로 추가하십시오.`), { h: 480 }); };
      draw();
      H.$('.b-search', body).onclick = draw; H.$('.s-t', body).onchange = draw;
      H.$('.b-topic', body).onclick = () => { const m = app.modal({ title: k === 0 ? '주제어 관리' : '프로젝트명 관리', width: 520, body: '<div class="toolbar"><span class="sp"></span><button class="btn outline ad">행추가</button></div><div class="ls"></div><div class="info-box" style="margin-top:8px;font-size:12px">사용 중인 주제어·프로젝트명은 삭제할 수 없으며 ‘미사용’으로만 변경할 수 있습니다.</div>', buttons: [{ text: '저장', cls: 'primary', onClick: () => { H.$$('.tr', m.pop).forEach(tr => { const t = d.reorg.topics.find(x => String(x.id) === tr.dataset.id); t.name = H.$('.n', tr).value; t.use = H.$('.u', tr).value === '사용'; }); d.reorg.topics = d.reorg.topics.filter(t => t.name.trim()); app.Store.save(); fn(k)(); } }, { text: '닫기' }] }); const dr = () => { H.$('.ls', m.pop).innerHTML = H.grid([{ t: label + '명' }, { t: '사용여부', w: 110 }], d.reorg.topics.filter(t => t.kind === kind).map(t => `<tr class="tr" data-id="${t.id}"><td><input class="inp n" value="${esc(t.name)}"></td><td><select class="sel u">${app.opts(['사용', '미사용'], t.use ? '사용' : '미사용')}</select></td></tr>`).join('')); }; dr(); H.$('.ad', m.pop).onclick = () => { d.reorg.topics.push({ id: nextId(d.reorg.topics), kind, name: '', use: true }); dr(); }; };
      H.$('.b-pull', body).onclick = () => { const tid = +H.$('.s-t', body).value; if (!tid) { app.alertBox(`${label}를 먼저 등록하십시오.`); return; } const m = app.modal({ title: '진도표가져오기', width: 820, body: `<div style="display:flex;gap:6px;margin-bottom:8px">과목 <select class="sel sj">${H.subjOpts('국어')}</select><button class="btn primary go">조회</button></div><div class="ls"></div>`, buttons: [{ text: '선택', cls: 'primary', onClick: () => { const ids = H.$$('.pk', m.pop).filter(c => c.checked).map(c => +c.value); if (!ids.length) { app.alertBox('진도를 선택하십시오.'); return false; } d.progress.filter(r => ids.includes(r.id) && r.subj === H.$('.sj', m.pop).value).forEach(r => d.reorg.items.push(Object.assign({}, r, { id: nextId(d.reorg.items), topic: tid, kind }))); app.Store.save(); draw(); app.toast('저장되었습니다.'); } }, { text: '닫기' }] }); const run = () => { const sj = H.$('.sj', m.pop).value; const rs = d.progress.filter(r => r.subj === sj); H.$('.ls', m.pop).innerHTML = H.grid([{ t: '', w: 40 }, { t: '일자', w: 110 }, { t: '교시', w: 60 }, { t: '단원' }, { t: '학습내용' }], rs.map(r => `<tr><td><input type="checkbox" class="pk" value="${r.id}"></td><td>${r.date}</td><td>${r.period}</td><td class="l">${esc(r.unit)}</td><td class="l">${esc(r.content)}</td></tr>`).join('') || nodataRow(5, '해당 과목의 교과진도표가 없습니다. [교과진도표관리]에서 생성하십시오.'), { h: 380 }); }; H.$('.go', m.pop).onclick = run; run(); };
      H.$('.b-del', body).onclick = () => { const s = sel(body, d.reorg.items); d.reorg.items = d.reorg.items.filter(x => !s.includes(x)); app.Store.save(); draw(); };
    };
    bindTabs(page, [fn(0), fn(1)]);
    if (kindIdx) H.$$('.tabs a', page)[kindIdx].click();
  }
  S['교육과정재구성'] = (p, t, app) => reorgScreen(p, app, 0);
  S['진도표조회'] = function (page, title, app) {
    const d = D(); d.reorg = d.reorg || { topics: [], items: [] };
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('구분', `<select class="sel s-k">${app.opts(['범교과주제학습', '주제중심교과통합'])}</select>`, true)}${app.sf('주제/프로젝트', '<select class="sel s-t" style="width:220px"></select>', true)}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    const fill = () => { H.$('.s-t', page).innerHTML = app.opts(d.reorg.topics.filter(t => t.kind === H.$('.s-k', page).value).map(t => [t.id, t.name])); };
    H.$('.s-k', page).onchange = fill; fill();
    H.$('.b-search', page).onclick = () => { const tid = +H.$('.s-t', page).value; H.$('.area', page).innerHTML = H.grid([{ t: '일자', w: 110 }, { t: '교시', w: 60 }, { t: '과목', w: 80 }, { t: '단원' }, { t: '학습내용' }], d.reorg.items.filter(x => x.topic === tid).map(r => `<tr><td>${r.date}</td><td>${r.period}</td><td>${r.subj}</td><td class="l">${esc(r.unit)}</td><td class="l">${esc(r.content)}</td></tr>`).join('') || nodataRow(5, '교육과정재구성의 진도표가 설정되어 있어야 조회됩니다.')); };
  };

  S['학교일지관리'] = function (page, title, app) {
    const d = D(); d.diary = d.diary || {};
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['학교일지 생성 및 제거', '학교일지관리(결재)', '학교일지 일괄생성'])}<div class="search-box">${app.sf('기간', '<input type="date" class="inp s-a" value="2026-09-28"> ~ <input type="date" class="inp s-b" value="2026-10-02">', true)}${app.searchBtn()}</div><div class="body"></div>`);
    const body = H.$('.body', page); let tab = 0;
    const days = () => { const out = []; const a = H.$('.s-a', page).value, b = H.$('.s-b', page).value; const dt = new Date(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8)); const e = new Date(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8)); while (dt <= e) { if (dt.getDay() % 6) out.push(H.key(dt)); dt.setDate(dt.getDate() + 1); } return out; };
    const dst = k => { const x = d.diary[k]; if (!x) return '미작성'; if (x.docId) return Ap.statusOf(x.docId); return x.created ? '생성' : '작성'; };
    const draw = () => {
      const ds = days();
      if (tab === 0) {
        body.innerHTML = `<div class="split"><div class="left" style="width:340px">${H.grid([{ t: '', w: 36 }, { t: '일자', w: 110 }, { t: '행사' }, { t: '상태', w: 80 }], ds.map(k => { const h = D().schedule.filter(s => s.d === k); return `<tr data-k="${k}" style="cursor:pointer"><td><input type="checkbox" class="ck"></td><td class="link">${k}</td><td style="font-size:12px">${esc(h.map(x => x.t).join(', '))}</td><td>${Ap.badge(dst(k))}</td></tr>`; }).join(''), { h: 520 })}<div class="toolbar" style="margin-top:6px"><span class="sp"></span><button class="btn primary b-cr">생성</button><button class="btn b-rm">제거</button><button class="btn dark b-del">삭제</button></div></div><div class="right"><div class="ed">${app.nodata('날짜를 클릭하십시오.')}</div></div></div>`;
        H.$$('tr[data-k] td.link', body).forEach(td => { td.onclick = () => edit(td.parentElement.dataset.k); });
        const pk = () => H.$$('tr[data-k]', body).filter(tr => H.$('.ck', tr).checked).map(tr => tr.dataset.k);
        H.$('.b-cr', body).onclick = () => { const ks = pk().filter(k => d.diary[k]); if (!ks.length) { app.alertBox('작성된 학교일지를 선택하십시오.'); return; } ks.forEach(k => { d.diary[k].created = true; }); app.Store.save(); draw(); app.toast('결재자료가 생성되었습니다.'); };
        H.$('.b-rm', body).onclick = () => { pk().forEach(k => { if (d.diary[k] && !d.diary[k].docId) d.diary[k].created = false; }); app.Store.save(); draw(); };
        H.$('.b-del', body).onclick = () => { const ks = pk(); if (ks.some(k => d.diary[k] && d.diary[k].docId && ['결재중', '완결'].includes(Ap.statusOf(d.diary[k].docId)))) { app.alertBox('결재 중이거나 완결된 학교일지는 삭제할 수 없습니다.'); return; } ks.forEach(k => { delete d.diary[k]; }); app.Store.save(); draw(); };
      } else if (tab === 1) {
        body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn primary b-req">승인요청</button></div>` + H.grid([{ t: '', w: 40 }, { t: '일자', w: 120 }, { t: '지시 및 전달사항' }, { t: '결재상태', w: 100 }], ds.filter(k => d.diary[k] && d.diary[k].created).map(k => `<tr data-k="${k}"><td><input type="checkbox" class="ck"></td><td>${k}</td><td class="l">${esc(d.diary[k].title)}</td><td class="link stt">${Ap.badge(dst(k))}</td></tr>`).join('') || nodataRow(4, '결재자료가 생성된 학교일지가 없습니다.'));
        H.$$('.stt', body).forEach(td => { td.onclick = () => { const x = d.diary[td.parentElement.dataset.k]; if (x.docId) Ap.detail(Ap.get(x.docId)); }; });
        H.$('.b-req', body).onclick = () => { const ks = H.$$('tr[data-k]', body).filter(tr => H.$('.ck', tr).checked).map(tr => tr.dataset.k).filter(k => !['결재중', '완결'].includes(dst(k))); if (!ks.length) { app.alertBox('상신할 학교일지를 선택하십시오.'); return; } Ap.submit({ area: '교육과정', form: '학교일지', title: `학교일지 (${ks.map(k => k.slice(5).replace('-', '.')).join(', ')})`, content: ks.map(k => [k, `${d.diary[k].title} / ${d.diary[k].content}${d.diary[k].duty ? ' / 복무: ' + d.diary[k].duty : ''}`]), ref: { type: 'diary' }, onDone: doc => { ks.forEach(k => { d.diary[k].docId = doc.id; }); draw(); } }); };
      } else {
        body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn primary b-bulk">일괄생성</button></div>` + H.grid([{ t: '', w: 40 }, { t: '일자', w: 120 }, { t: '상태' }], ds.map(k => `<tr data-k="${k}"><td><input type="checkbox" class="ck" ${d.diary[k] ? 'disabled' : ''}></td><td>${k}</td><td>${Ap.badge(dst(k))}</td></tr>`).join(''));
        H.$('.b-bulk', body).onclick = () => { const ks = H.$$('tr[data-k]', body).filter(tr => H.$('.ck', tr).checked).map(tr => tr.dataset.k); if (!ks.length) { app.alertBox('일괄생성할 날짜를 선택하십시오.'); return; } app.confirmBox(`${ks.length}일의 학교일지를 일괄생성하시겠습니까?`, () => { ks.forEach(k => { d.diary[k] = { title: '특이사항 없음', content: '', duty: '', created: true }; }); app.Store.save(); draw(); }); };
      }
    };
    const edit = k => {
      const x = d.diary[k] || { title: '', content: '', duty: '' };
      const ed = H.$('.ed', body);
      ed.innerHTML = `<div class="sub-tit" style="margin-top:0">${k} 학교일지</div><table class="form"><tr><th class="req">*제목</th><td><input class="inp t" style="width:100%" value="${esc(x.title)}" placeholder="예) 2학기 교과평가 계획 안내"></td></tr><tr><th>지시 및 전달사항</th><td><textarea class="ta c" style="min-height:120px">${esc(x.content)}</textarea></td></tr><tr><th>교직원 복무</th><td><textarea class="ta du" style="min-height:90px">${esc(x.duty)}</textarea></td></tr></table><div class="toolbar" style="margin-top:8px"><span class="sp"></span><button class="btn outline b-duty">복무가져오기</button><button class="btn primary b-sv">저장</button></div>`;
      H.$('.b-duty', ed).onclick = () => { const lines = D().staffLeaves.filter(s => s.date === k).map(s => `${s.name} ${s.kind} ${s.time}`).concat(D().leaves.filter(l => l.from.slice(0, 10) <= k && l.to.slice(0, 10) >= k && ['결재중', '완결'].includes(l.docId ? Ap.statusOf(l.docId) : '')).map(l => `${D().user.name} ${l.cat}(${l.sub}) ${l.from.slice(11)}~${l.to.slice(11)}`)).concat(D().bizTrips.filter(l => !l.deleted && l.from.slice(0, 10) <= k && l.to.slice(0, 10) >= k && l.docId && ['결재중', '완결'].includes(Ap.statusOf(l.docId))).map(l => `${D().user.name} 출장 ${l.place}`)); H.$('.du', ed).value = lines.join('\n') || '해당 일자의 근무상황이 없습니다.'; app.toast('교직원 근무상황을 가져왔습니다.'); };
      H.$('.b-sv', ed).onclick = () => { const t = H.$('.t', ed).value.trim(); if (!t) { app.alertBox('제목을 입력하십시오.'); return; } d.diary[k] = Object.assign(d.diary[k] || {}, { title: t, content: H.$('.c', ed).value, duty: H.$('.du', ed).value }); H.save(); draw(); edit(k); };
    };
    page.__refresh = draw;
    H.$('.b-search', page).onclick = draw;
    bindTabs(page, [0, 1, 2].map(i => () => { tab = i; draw(); }));
  };

  /* =========================================================
     학적
     ========================================================= */
  // 사진: AI(GPT)로 생성한 가상 인물 증명사진(img/students/NN.jpg) / 업로드 사진(축소 저장)
  // 사진이 오기 전에는 빈 회색 칸만 보이고, 다 받으면 나타난다. 미리 받아 두어 학적 화면에서 바로 뜨게 한다.
  const PHOTO = no => `img/students/${String(no).padStart(2, '0')}.jpg`;
  (window.NEIS_SEED.students || []).forEach(s => { const im = new Image(); im.src = PHOTO(s.no); });
  H.avatar = (s, w) => { const p = (D().photos || {})[s.no]; w = w || 72; const h = Math.round(w * 4 / 3); if (p) return `<img src="${p}" style="width:${w}px;height:${h}px;object-fit:cover;border:1px solid #cfd5df">`; return `<div style="position:relative;width:${w}px;height:${h}px;border:1px solid #cfd5df;overflow:hidden;background:#eef1f6"><img src="${PHOTO(s.no)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .15s" onload="this.style.opacity=1" onerror="this.remove()"></div>`; };
  const shrink = (file, cb) => { const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 90; c.height = 120; const g = c.getContext('2d'); const sc = Math.max(90 / img.width, 120 / img.height); const w = img.width * sc, h = img.height * sc; g.drawImage(img, (90 - w) / 2, (120 - h) / 2, w, h); cb(c.toDataURL('image/jpeg', 0.8)); }; img.src = r.result; }; r.readAsDataURL(file); };
  const rotate = (src, deg, cb) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const sw = deg % 180 ? img.height : img.width, sh = deg % 180 ? img.width : img.height; c.width = sw; c.height = sh; const g = c.getContext('2d'); g.translate(sw / 2, sh / 2); g.rotate(deg * Math.PI / 180); g.drawImage(img, -img.width / 2, -img.height / 2); cb(c.toDataURL('image/jpeg', 0.8)); }; img.src = src; };
  S['사진일괄입력'] = function (page, title, app) {
    const d = D(); d.photos = d.photos || {};
    let work = Object.assign({}, d.photos);
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch({ year: false })}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-rot">사진일괄변환</button><label class="btn green" style="cursor:pointer">${app.I.up}사진일괄올리기<input type="file" class="f-all" accept="image/*" multiple style="display:none"></label><button class="btn green b-dl">${app.I.down}사진일괄내리기</button><button class="btn primary b-save">저장</button></div>
      <div class="info-box" style="font-size:12px">사진 파일명을 <b>성명(번호)</b> 형식으로 바꾼 뒤 일괄 올립니다. 예) 남주혁(8).png · 기본 사진은 AI로 생성한 가상 인물(실존 인물 아님)입니다. (연수용: 사진은 이 브라우저에만 저장)</div>
      <div class="area" style="display:flex;flex-wrap:wrap;gap:14px"></div>`);
    const draw = () => { const tmp = D().photos; D().photos = work; H.$('.area', page).innerHTML = d.students.map(s => `<div style="width:110px;text-align:center;border:1px solid #e3e5e6;border-radius:6px;padding:8px"><label style="position:absolute"><input type="checkbox" class="pk" value="${s.no}"></label><div style="display:flex;justify-content:center">${H.avatar(s, 72)}</div><div style="margin:6px 0 4px">${s.no}. ${esc(s.name)}</div><label class="btn" style="height:24px;cursor:pointer;font-size:12px">찾아보기<input type="file" class="f-one" data-no="${s.no}" accept="image/*" style="display:none"></label></div>`).join(''); D().photos = tmp; H.$$('.f-one', page).forEach(f => { f.onchange = () => { if (f.files[0]) shrink(f.files[0], u => { work[f.dataset.no] = u; draw(); }); }; }); };
    draw();
    H.$('.b-search', page).onclick = () => { work = Object.assign({}, d.photos); draw(); };
    H.$('.f-all', page).onchange = e => { const fs = [...e.target.files]; let ok = 0, bad = []; let left = fs.length; if (!left) return; fs.forEach(f => { const m = f.name.match(/^(.+)\((\d+)\)\.\w+$/); const s = m && d.students.find(x => x.no === +m[2] && x.name === m[1]); if (!s) { bad.push(f.name); if (!--left) done(); return; } shrink(f, u => { work[s.no] = u; ok++; if (!--left) done(); }); }); function done() { draw(); app.alertBox(`${ok}건의 사진을 불러왔습니다.${bad.length ? `\n파일명 형식이 맞지 않는 파일 ${bad.length}건: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? ' 외' : ''}` : ''}\n{저장}을 눌러 저장하십시오.`); } e.target.value = ''; };
    H.$('.b-rot', page).onclick = () => { const nos = H.$$('.pk', page).filter(c => c.checked).map(c => c.value).filter(n => work[n]); if (!nos.length) { app.alertBox('회전할 사진(업로드된 사진)을 선택하십시오.'); return; } const m = app.modal({ title: '사진변환', width: 380, body: `<div style="text-align:center">${['좌90°', '180°', '우90°'].map((t, i) => `<label style="margin:0 8px"><input type="radio" name="rd" value="${[-90, 180, 90][i]}" ${i === 0 ? 'checked' : ''}> ${t}</label>`).join('')}</div>`, buttons: [{ text: '변환', cls: 'primary', onClick: () => { const deg = +H.$('input[name=rd]:checked', m.pop).value; let left = nos.length; nos.forEach(n => rotate(work[n], deg, u => { work[n] = u; if (!--left) draw(); })); } }, { text: '닫기' }] }); };
    H.$('.b-dl', page).onclick = () => app.alertBox('연수용 환경에서는 사진 일괄 내려받기를 지원하지 않습니다.');
    H.$('.b-save', page).onclick = () => { d.photos = work; try { H.save(); } catch (e) { app.alertBox('저장 공간이 부족합니다. 사진 수를 줄여 주세요.'); } };
  };

  S['학생주소연계'] = function (page, title, app) {
    const d = D(); d.addrLink = d.addrLink || { reqs: [], hist: [] };
    const L = d.addrLink;
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div>${tabsHtml(['연계대상자 관리', '연계결과 확인 및 반영'])}<div class="body"></div>`);
    const body = H.$('.body', page); let tab = 0;
    // 주민등록정보시스템 수신 결과(가상): 일부 학생은 이사한 주소
    const recvAddr = s => ({ 1: '연수특별자치도 태백시 농구장길 45', 9: '연수특별자치도 태백시 달리기길 23' }[s.no] || s.addr);
    const draw = () => {
      if (tab === 0) {
        body.innerHTML = `<div class="toolbar"><span>학생주소정보 요청 기간 : <b>2026.09.01 ~ 2026.10.31</b> (2학기)</span><span class="sp"></span><button class="btn primary b-req">승인및자료요청</button><button class="btn dark b-rm">연계대상자삭제</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '주소' }, { t: '진행상태', w: 110 }], d.students.map(s => { const r = L.reqs.find(x => x.no === s.no); const stt = r ? (Ap.statusOf(r.docId) === '완결' ? '조회성공' : Ap.statusOf(r.docId) === '결재중' ? '상신중' : Ap.statusOf(r.docId)) : ''; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck" ${r && ['상신중', '조회성공'].includes(stt) ? 'disabled' : ''}></td><td>${s.no}</td><td>${esc(s.name)}</td><td class="l">${esc(s.addr)}</td><td>${stt ? Ap.badge(stt) : ''}</td></tr>`; }).join(''), { h: 520 }) + '<div class="info-box" style="margin-top:10px">학생주소연계는 학기별 1회 필수 시행합니다. 체크한 학생의 주소를 주민등록정보시스템에 확인 요청하며, 기안문 상신 후 결재가 완료되면 결과가 수신됩니다(연수용 가상 연계).</div>';
        ckAll(body);
        H.$('.b-req', body).onclick = () => { const nos = H.$$('tr[data-no]', body).filter(tr => { const c = H.$('.ck', tr); return c.checked && !c.disabled; }).map(tr => +tr.dataset.no); if (!nos.length) { app.alertBox('주소정보를 확인 요청할 학생을 선택하십시오.'); return; } Ap.submit({ area: '학적', form: '학생주소연계 요청', title: `학생주소정보 연계 요청 - 5학년 2반 ${nos.length}명`, content: [['대상', `5학년 2반 ${nos.length}명`], ['요청학생', nos.map(n => H.stu(n).name).join(', ')], ['연계기관', '주민등록정보시스템(가상)']], ref: { type: 'addrLink' }, onDone: doc => { L.reqs = L.reqs.filter(x => !nos.includes(x.no)); nos.forEach(n => L.reqs.push({ no: n, docId: doc.id, at: Ap.now() })); draw(); } }); };
        H.$('.b-rm', body).onclick = () => { const nos = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.no); L.reqs = L.reqs.filter(x => !nos.includes(x.no) || Ap.statusOf(x.docId) === '완결'); app.Store.save(); draw(); };
      } else {
        const done = L.reqs.filter(x => Ap.statusOf(x.docId) === '완결');
        body.innerHTML = `<div class="toolbar"><span class="sp"></span><button class="btn green b-xl">엑셀내려받기</button><button class="btn primary b-apply">자료반영</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '주소(나이스)' }, { t: '주소(연계 수신자료)' }, { t: '전송결과', w: 90 }, { t: '반영여부', w: 80 }], done.map(r => { const s = H.stu(r.no); const rv = recvAddr(s); const diff = rv !== s.addr; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck" ${r.applied ? 'disabled' : ''}></td><td>${s.no}</td><td>${esc(s.name)}</td><td class="l">${esc(s.addr)}</td><td class="l" style="${diff ? 'color:#e0262c;font-weight:700' : ''}">${esc(rv)}</td><td>조회성공</td><td>${r.applied ? 'Y' : 'N'}</td></tr>`; }).join('') || nodataRow(7, '수신된 연계 결과가 없습니다. 연계 요청 결재가 완결되어야 결과가 수신됩니다.'), { h: 520 }) + '<div class="info-box" style="margin-top:10px">나이스 주소와 수신 주소가 다르면 <span style="color:#e0262c;font-weight:700">빨간색</span>으로 표시됩니다. 반영할 학생을 체크하고 {자료반영}하면 누가주소로 추가됩니다.</div>';
        ckAll(body);
        H.$('.b-xl', body).onclick = () => app.alertBox('연수용 환경에서는 엑셀 내려받기를 지원하지 않습니다.');
        H.$('.b-apply', body).onclick = () => { const nos = H.$$('tr[data-no]', body).filter(tr => { const c = H.$('.ck', tr); return c.checked && !c.disabled; }).map(tr => +tr.dataset.no); if (!nos.length) { app.alertBox('반영할 학생을 선택하십시오.'); return; } nos.forEach(n => { const s = H.stu(n); const rv = recvAddr(s); const r = L.reqs.find(x => x.no === n); r.applied = true; if (rv !== s.addr) { s.addrs = s.addrs || [{ from: '2023.03.02', addr: s.addr }]; s.addrs.push({ from: H.dateStr(app.today()), addr: rv }); s.addr = rv; } L.hist.push({ no: n, req: r.at, recv: '조회성공', applied: 'Y', at: Ap.now(), changed: rv !== s.addr }); }); H.save(`${nos.length}명의 주소 연계 자료를 반영했습니다.`); draw(); };
      }
    };
    page.__refresh = draw;
    H.$('.b-search', page).onclick = draw;
    bindTabs(page, [0, 1].map(i => () => { tab = i; draw(); }));
  };
  S['학생주소연계이력조회'] = function (page, title, app) {
    const d = D();
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.commonSearch()}${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    const draw = () => { const L = (d.addrLink || { reqs: [] }); H.$('.area', page).innerHTML = H.grid([{ t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '요청일시', w: 150 }, { t: '결재상태', w: 100 }, { t: '전송결과', w: 100 }, { t: '반영여부', w: 80 }, { t: '반영일시', w: 150 }], L.reqs.map(r => { const s = H.stu(r.no); const h = (L.hist || []).filter(x => x.no === r.no).pop(); const stt = Ap.statusOf(r.docId); return `<tr><td>${s.no}</td><td>${esc(s.name)}</td><td>${r.at}</td><td>${Ap.badge(stt)}</td><td>${stt === '완결' ? '조회성공' : '-'}</td><td>${r.applied ? 'Y' : 'N'}</td><td>${h ? h.at : ''}</td></tr>`; }).join('') || nodataRow(7, '주소연계 이력이 없습니다.'), { h: 560 }); };
    H.$('.b-search', page).onclick = draw; draw();
  };

  S['진급대상자반편성관리'] = function (page, title, app) {
    const d = D(); d.promo = d.promo || {};
    page.insertAdjacentHTML('beforeend', `${tabsHtml(['반편성내역개별등록', '반편성결과조회'])}<div class="search-box">${app.sf('진급학년도', `<select class="sel">${app.opts([['2027', '2027학년도']])}</select>`, true)}${app.sf('현재 학년/반', '<b>5학년 2반 → 6학년</b>')}${app.searchBtn()}</div><div class="body"></div>`);
    const body = H.$('.body', page);
    const t0 = () => {
      body.innerHTML = `<div class="toolbar"><span>진급반</span><select class="sel s-b" style="min-width:90px">${app.opts([1, 2, 3].map(c => [c, `6-${c}`]))}</select><button class="btn outline b-apply">일괄적용</button><span class="sp"></span><button class="btn outline b-same">동명이인</button><button class="btn b-print">${app.I.print}출력</button><button class="btn primary b-save">저장</button></div>` + H.grid([{ t: '<input type="checkbox" class="all">', w: 40 }, { t: '번호', w: 50 }, { t: '성명', w: 80 }, { t: '성별', w: 50 }, { t: '생년월일', w: 110 }, { t: '진급반', w: 110 }, { t: '특이사항(반편성 참고)' }], d.students.map(s => { const p = d.promo[s.no] || {}; return `<tr data-no="${s.no}"><td><input type="checkbox" class="ck"></td><td>${s.no}</td><td>${esc(s.name)}</td><td>${s.sex}</td><td>${s.birth}</td><td><select class="sel cl">${app.opts([['', '미편성']].concat([1, 2, 3].map(c => [c, `6-${c}`])), p.cls || '')}</select></td><td><input class="inp nt" value="${esc(p.note || '')}"></td></tr>`; }).join(''), { h: 520 }) + '<div class="info-box" style="margin-top:10px">학급담임에게는 [개별반편성]과 [반편성결과조회]만 기본 부여됩니다. 특이사항은 반편성 참고용이며 의무 기재사항이 아닙니다.</div>';
      ckAll(body);
      H.$('.b-apply', body).onclick = () => { const trs = H.$$('tr[data-no]', body).filter(tr => H.$('.ck', tr).checked); if (!trs.length) { app.alertBox('학생을 선택하십시오.'); return; } trs.forEach(tr => { H.$('.cl', tr).value = H.$('.s-b', body).value; }); app.toast(`${trs.length}명에게 적용했습니다. {저장}을 누르십시오.`); };
      H.$('.b-save', body).onclick = () => { H.$$('tr[data-no]', body).forEach(tr => { d.promo[tr.dataset.no] = { cls: H.$('.cl', tr).value, note: H.$('.nt', tr).value }; }); H.save(); };
      H.$('.b-same', body).onclick = () => app.modal({ title: '동명이인', width: 480, body: '<div class="nodata" style="padding:30px">동명이인 학생이 없습니다.</div>' });
      H.$('.b-print', body).onclick = () => printDoc('재학생 개별반편성내역', `<h2 style="font-size:18px">2027학년도 진급 반편성 내역 (현 5학년 2반)</h2><table><tr><th>번호</th><th>성명</th><th>성별</th><th>진급반</th><th>특이사항</th></tr>${d.students.map(s => { const p = d.promo[s.no] || {}; return `<tr><td style="text-align:center">${s.no}</td><td style="text-align:center">${esc(s.name)}</td><td style="text-align:center">${s.sex}</td><td style="text-align:center">${p.cls ? '6-' + p.cls : ''}</td><td>${esc(p.note || '')}</td></tr>`; }).join('')}</table>`);
    };
    const t1 = () => { const by = { 1: [], 2: [], 3: [], '': [] }; d.students.forEach(s => by[(d.promo[s.no] || {}).cls || ''].push(s)); body.innerHTML = H.grid([{ t: '진급반', w: 90 }, { t: '남', w: 60 }, { t: '여', w: 60 }, { t: '계', w: 60 }, { t: '학생' }], ['1', '2', '3', ''].map(c => `<tr><td>${c ? '6-' + c : '미편성'}</td><td>${by[c].filter(s => s.sex === '남').length}</td><td>${by[c].filter(s => s.sex === '여').length}</td><td>${by[c].length}</td><td class="l" style="font-size:12px">${by[c].map(s => esc(s.name)).join(', ')}</td></tr>`).join('')); };
    bindTabs(page, [t0, t1]);
    H.$('.b-search', page).onclick = () => H.$('.tabs a.on', page).click();
  };

  // 명예졸업 — 민감한 사안이므로 예시 데이터 없이 절차만 실습
  const honorNote = '<div class="info-box warn">명예졸업은 학교교육활동 중 불의의 사고 등으로 사망한 학생 등에 대해 학업성적관리위원회 심의를 거쳐 처리하는 매우 민감한 업무입니다. 연수용 환경에는 예시 데이터를 넣지 않았으며 처리 절차만 확인할 수 있습니다.</div>';
  S['명예졸업대상자관리'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${honorNote}<div class="search-box">${app.sf('졸업학년도', `<select class="sel">${app.opts([['2026', '2026학년도']])}</select>`, true)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn primary b-reg">등록</button><button class="btn outline b-x">학교생활기록부생성</button><button class="btn outline b-x">명예졸업대장번호부여</button><button class="btn primary b-x">승인요청</button><button class="btn dark b-x">학적반영</button></div><div class="area">${app.nodata()}</div>
      <div class="info-box" style="margin-top:10px"><b>처리 절차</b> : ① 학업성적관리위원회 심의 → ② {등록}(재학생 또는 ‘면제’ 처리 학생만 가능) → ③ 학적변동일자 입력·저장 → ④ {학교생활기록부생성} → ⑤ {명예졸업대장번호부여} → ⑥ {승인요청}(결재) → ⑦ 결재 완료 후 {학적반영}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('등록된 명예졸업 대상자가 없습니다.'); };
    H.$('.b-reg', page).onclick = () => app.modal({ title: '명예졸업대상자 등록', width: 560, body: `<div style="margin-bottom:8px"><label><input type="radio" name="rr" checked> 재학생</label> <label><input type="radio" name="rr"> 재학아닌학생</label></div><div class="nodata" style="padding:30px">연수용 환경에서는 대상 학생을 조회하지 않습니다.<br>(‘재학아닌학생’은 ‘면제’ 처리된 학생만 등록 가능)</div>` });
    H.$$('.b-x', page).forEach(b => { b.onclick = () => app.alertBox('명예졸업 대상자를 먼저 등록하십시오.'); });
  };
  S['명예졸업장출력'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${honorNote}<div class="search-box">${app.sf('졸업생 성명', '<input class="inp">')}<label style="margin-right:12px"><input type="checkbox" checked> 테두리</label><label><input type="checkbox" checked> 학교장명</label>${app.searchBtn()}</div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('당해 학년도 졸업처리가 완료되어야 명예졸업장을 출력할 수 있습니다.'); };
  };
  S['명예졸업대장조회'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `${honorNote}<div class="search-box">${app.sf('졸업학년도', `<select class="sel">${app.opts([['2026', '2026학년도']])}</select>`, true)}${app.sf('정렬순', `<select class="sel">${app.opts(['대장번호순', '성명순'])}</select>`)}${app.searchBtn()}</div><div class="toolbar"><span class="sp"></span><button class="btn outline b-x">졸업현황조회</button><button class="btn outline b-x">오류자료조회</button><button class="btn b-x">${app.I.print}출력</button></div><div class="area">${app.nodata()}</div>`);
    H.$('.b-search', page).onclick = () => { H.$('.area', page).innerHTML = app.nodata('명예졸업대장은 당해 학년도 졸업처리 완료 후 조회할 수 있습니다.'); };
    H.$$('.b-x', page).forEach(b => { b.onclick = () => app.alertBox('조회된 자료가 없습니다.'); });
  };
})();
