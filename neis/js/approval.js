/* 결재(상신) 공통 — 결재선 지정·상신·회수·기결취소, 결재함(상신함 등), 연수용 결재자 시뮬레이션 */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const esc = s => A().esc(s);
  const $ = (s, r) => r.querySelector(s);
  const $$ = (s, r) => Array.from(r.querySelectorAll(s));
  const pad = n => String(n).padStart(2, '0');
  const KINDS = ['검토', '협조', '결재', '전결'];

  const Ap = window.Approval = {};
  Ap.now = () => { const t = A().today(); const n = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(n.getHours())}:${pad(n.getMinutes())}`; };
  Ap.docs = () => (D().docs = D().docs || []);
  Ap.get = id => Ap.docs().find(x => x.id === id);
  Ap.staff = name => D().staff.find(s => s.name === name);
  Ap.me = () => Ap.staff(D().user.name);
  Ap.person = (name, kind) => { const s = Ap.staff(name); return { name, pos: s.pos, dept: s.dept, kind, state: '', at: '', op: '' }; };

  /* ---- 기본 결재선: 부장(검토) → 교감(검토) → 교장(결재), 예산 수반 문서는 행정실장(협조) ---- */
  Ap.defaultLine = coop => {
    const my = D().myLine;
    let line = my && my.length ? my.map(x => Ap.person(x.name, x.kind)) : [Ap.person('나미리', '검토'), Ap.person('권준호', '검토'), Ap.person('고길동', '결재')];
    if (coop && !line.some(x => x.pos === '행정실장')) {
      const vi = line.findIndex(x => x.pos === '교감');
      line.splice(vi < 0 ? line.length - 1 : vi, 0, Ap.person('신형만', '협조'));
    }
    return line;
  };

  /* ---- 상태 ---- */
  Ap.cancelOf = docId => Ap.docs().find(x => x.ref && x.ref.type === 'cancel' && x.ref.target === docId && ['진행중', '기결'].includes(x.status));
  Ap.statusOf = docId => {
    const doc = Ap.get(docId);
    if (!doc) return '저장';
    const c = Ap.cancelOf(docId);
    if (c) return c.status === '기결' ? '기결취소' : '취소결재중';
    return { '진행중': '결재중', '기결': '완결', '반려': '반려', '회수': '회수', '기결취소': '기결취소' }[doc.status] || doc.status;
  };
  Ap.badge = st => `<span class="st-badge st-${esc(st)}">${esc(st)}</span>`;
  Ap.current = doc => doc.line.find(x => x.state === '진행');
  Ap.finalName = doc => { const f = doc.line.filter(x => x.kind === '결재' || x.kind === '전결').pop(); return f ? f.name : ''; };
  Ap.counts = () => {
    const docs = Ap.docs().filter(x => !x.hidden);
    return { '상신함': null, '미결/협조함': 0, '공람함': 0, '예결함': 0, '기결함': null, '반려함': docs.filter(x => x.status === '반려').length, '메시지함': (D().msgs || []).filter(m => !m.read).length };
  };
  Ap.msg = text => { D().msgs = D().msgs || []; D().msgs.unshift({ at: Ap.now(), text, read: false }); };
  // 결재 상태가 바뀌면 열린 화면과 좌측 승인사항 건수를 갱신
  Ap.refresh = () => {
    A().Store.save();
    A().tabs.forEach(t => { if (t.page.__refresh) { try { t.page.__refresh(); } catch (e) { console.error(e); } } });
    if (A().lnbMode === 'home') A().renderLnb();
  };

  /* ---- 결재선 편집기 (상신 팝업·개인결재선등록 공용) ---- */
  Ap.lineEditor = (box, init) => {
    const line = init.map(x => Object.assign({}, x));
    const me = Ap.me();
    let pick = null, sel = -1;
    const others = D().staff.filter(s => s.name !== me.name);
    const draw = () => {
      box.innerHTML = `<div class="split" style="gap:10px">
        <div class="left" style="width:300px"><div style="font-weight:700;margin-bottom:6px">결재자 목록</div>
          <div class="grid-wrap" style="max-height:230px"><table class="grid"><colgroup><col style="width:80px"><col style="width:80px"><col></colgroup><thead><tr><th>성명</th><th>직위</th><th>부서</th></tr></thead><tbody>${others.map(s => `<tr data-n="${esc(s.name)}" class="${pick === s.name ? 'sel' : ''}" style="cursor:pointer"><td>${esc(s.name)}</td><td>${esc(s.pos)}</td><td style="font-size:12px">${esc(s.dept)}</td></tr>`).join('')}</tbody></table></div></div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:6px;padding-top:24px"><button class="btn outline le-add">추가 ▶</button><button class="btn le-del">◀ 삭제</button><button class="btn le-up">▲</button><button class="btn le-down">▼</button></div>
        <div class="right"><div style="font-weight:700;margin-bottom:6px">결재선 <span style="font-weight:400;font-size:12px;color:#5d6b82">(결재자를 선택 후 추가하고, 결재구분을 지정하세요)</span></div>
          <div class="grid-wrap" style="max-height:230px"><table class="grid"><colgroup><col style="width:50px"><col style="width:100px"><col style="width:80px"><col style="width:80px"><col></colgroup><thead><tr><th>순번</th><th>결재구분</th><th>성명</th><th>직위</th><th>부서</th></tr></thead><tbody>
          <tr style="background:#f7f8fa"><td>1</td><td>기안</td><td>${esc(me.name)}</td><td>${esc(me.pos)}</td><td>${esc(me.dept)}</td></tr>
          ${line.map((x, i) => `<tr data-i="${i}" class="${i === sel ? 'sel' : ''}" style="cursor:pointer"><td>${i + 2}</td><td><select class="sel le-kind" style="min-width:0">${A().opts(KINDS, x.kind)}</select></td><td>${esc(x.name)}</td><td>${esc(x.pos)}</td><td style="font-size:12px">${esc(x.dept)}</td></tr>`).join('')}
          </tbody></table></div></div></div>`;
      $$('.left tr[data-n]', box).forEach(tr => { tr.onclick = () => { pick = tr.dataset.n; draw(); }; tr.ondblclick = () => { pick = tr.dataset.n; add(); }; });
      $$('.right tr[data-i]', box).forEach(tr => { tr.onclick = e => { if (e.target.tagName === 'SELECT') return; sel = +tr.dataset.i; draw(); }; });
      $$('.le-kind', box).forEach(s => { s.onchange = () => { line[+s.closest('tr').dataset.i].kind = s.value; }; });
      const add = () => { if (!pick) { A().alertBox('결재자 목록에서 결재자를 선택하십시오.'); return; } if (line.some(x => x.name === pick)) { A().alertBox('이미 결재선에 지정된 결재자입니다.'); return; } const s = Ap.staff(pick); const kind = s.pos === '교장' ? '결재' : s.pos === '행정실장' ? '협조' : '검토'; line.push(Ap.person(pick, kind)); sel = line.length - 1; draw(); };
      $('.le-add', box).onclick = add;
      $('.le-del', box).onclick = () => { if (sel < 0) { A().alertBox('삭제할 결재자를 선택하십시오.'); return; } line.splice(sel, 1); sel = -1; draw(); };
      const mv = d => { const j = sel + d; if (sel < 0 || j < 0 || j >= line.length) return; [line[sel], line[j]] = [line[j], line[sel]]; sel = j; draw(); };
      $('.le-up', box).onclick = () => mv(-1);
      $('.le-down', box).onclick = () => mv(1);
    };
    draw();
    return {
      get: () => line,
      set: l => { line.splice(0, line.length, ...l.map(x => Object.assign({}, x))); sel = -1; draw(); },
      validate: () => {
        if (!line.length) return '결재자를 1명 이상 지정하십시오.';
        const last = line[line.length - 1];
        if (!['결재', '전결'].includes(last.kind)) return "마지막 결재자의 결재구분은 '결재' 또는 '전결'이어야 합니다.";
        if (line.slice(0, -1).some(x => ['결재', '전결'].includes(x.kind))) return "'결재' 또는 '전결'은 결재선의 마지막에만 지정할 수 있습니다.";
        return '';
      }
    };
  };

  /* ---- 상신 ---- */
  // spec: { area, form, title, content:[[k,v]], ref, coop, onDone(doc) }
  Ap.submit = spec => {
    const app = A(); const me = Ap.me();
    let ed = null;
    const m = app.modal({ title: '결재경로 지정 및 상신', width: 980, body: `
      <table class="form"><colgroup><col style="width:130px"><col><col style="width:130px"><col></colgroup>
        <tr><th>결재문서명</th><td colspan="3"><input class="inp" style="width:100%" readonly value="${esc(spec.title)}"></td></tr>
        <tr><th>업무영역</th><td>${esc(spec.area)}</td><th>기안자</th><td>${esc(me.name)} (${esc(me.pos)} / ${esc(me.dept)})</td></tr></table>
      <div class="sub-tit" style="margin-top:14px">결재선 지정 ${spec.coop ? '<small>※ 예산(여비·수당)이 수반되는 문서는 행정실장 협조가 필요합니다.</small>' : ''}</div>
      <div class="le"></div>
      <div class="sub-tit">문서 내용</div>
      <table class="form"><colgroup><col style="width:130px"><col></colgroup>${spec.content.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
      <table class="form" style="margin-top:8px"><colgroup><col style="width:130px"><col></colgroup><tr><th>상신의견</th><td><input class="inp op" style="width:100%" placeholder="(선택) 결재권자에게 전달할 의견"></td></tr></table>`,
      buttons: [
        { text: '개인결재선 불러오기', cls: 'outline', keep: true, onClick: () => { if (!(D().myLine || []).length) { app.alertBox('등록된 개인결재선이 없습니다.\n[상신함]-{개인결재선등록}에서 등록할 수 있습니다.'); return; } ed.set(Ap.defaultLine(spec.coop)); app.toast('개인결재선을 불러왔습니다.'); } },
        { text: '상신', cls: 'primary', onClick: () => {
          const err = ed.validate(); if (err) { app.alertBox(err); return false; }
          const at = Ap.now();
          const line = [{ name: me.name, pos: me.pos, dept: me.dept, kind: '기안', state: '완료', at, op: $('.op', m.pop).value }]
            .concat(ed.get().map((x, i) => Object.assign({}, x, { state: i === 0 ? '진행' : '대기', at: '', op: '' })));
          const doc = { id: 'D' + Date.now(), area: spec.area, form: spec.form, title: spec.title, drafter: me.name, at, status: '진행중', line, content: spec.content, ref: spec.ref || null };
          Ap.docs().unshift(doc);
          if (spec.onDone) spec.onDone(doc);
          Ap.refresh();
          app.alertBox(`결재가 상신되었습니다.\n현재 결재자 : ${line[1].pos} ${line[1].name}(${line[1].kind})\n\n진행 상황은 [승인사항]-[상신함]에서 확인할 수 있습니다.\n(연수용) 문서 상세 화면에서 결재자 역할로 승인·반려를 체험할 수 있습니다.`, spec.after);
        } },
        { text: '닫기' }] });
    ed = Ap.lineEditor($('.le', m.pop), Ap.defaultLine(spec.coop));
  };

  /* ---- 결재 진행(연수용 시뮬레이션) ---- */
  Ap.step = (doc, ok, op) => {
    const cur = Ap.current(doc); if (!cur) return;
    cur.at = Ap.now(); cur.op = op || '';
    if (!ok) {
      cur.state = '반려'; doc.status = '반려';
      Ap.msg(`[반려] ${doc.title}${op ? ' : ' + op : ''}`);
      return;
    }
    cur.state = '완료';
    const next = cur.kind === '전결' ? null : doc.line.find(x => x.state === '대기');
    if (next) { next.state = '진행'; return; }
    doc.status = '기결'; doc.doneAt = cur.at;
    if (doc.ref && doc.ref.type === 'cancel') { const t = Ap.get(doc.ref.target); if (t) Ap.msg(`[기결취소 완료] ${t.title}`); }
    Ap.msg(`[결재완료] ${doc.title}`);
  };
  Ap.canRetrieve = doc => doc.status === '진행중' && !doc.line.some(x => x.kind !== '기안' && ['완료', '반려'].includes(x.state));
  Ap.retrieve = doc => {
    if (!Ap.canRetrieve(doc)) { A().alertBox(doc.status !== '진행중' ? '결재 진행 중인 문서만 회수할 수 있습니다.' : '이미 결재자가 처리한 문서는 회수할 수 없습니다.\n(첫 결재자가 결재하기 전까지만 회수 가능)'); return false; }
    doc.status = '회수'; doc.line.forEach(x => { if (x.kind !== '기안') x.state = ''; });
    Ap.refresh();
    return true;
  };
  // 기결문서취소: 취소 사유를 입력하여 다시 결재를 받음
  Ap.cancelDoc = (doc, after) => {
    const app = A();
    if (doc.status !== '기결') { app.alertBox('기결(결재 완료)된 문서만 기결취소를 신청할 수 있습니다.'); return; }
    if (Ap.cancelOf(doc.id)) { app.alertBox('이미 기결취소가 신청된 문서입니다.'); return; }
    if (doc.ref && doc.ref.type === 'cancel') { app.alertBox('기결취소 문서는 다시 취소할 수 없습니다.'); return; }
    const m = app.modal({ title: '기결문서취소 신청', width: 520, body: `<div class="info-box">결재가 완료된 문서를 취소하려면 취소 사유를 입력하고 다시 결재를 받아야 합니다.</div><table class="form"><tr><th>대상문서</th><td>${esc(doc.title)}</td></tr><tr><th class="req">*취소사유</th><td><input class="inp r" style="width:100%" placeholder="예) 개인 일정 변경으로 연가 사용 취소"></td></tr></table>`,
      buttons: [{ text: '다음(결재선 지정)', cls: 'primary', onClick: () => {
        const r = $('.r', m.pop).value.trim(); if (!r) { app.alertBox('취소사유를 입력하십시오.'); return false; }
        Ap.submit({ area: doc.area, form: '기결문서취소', title: `[기결취소] ${doc.title}`, content: [['취소대상', doc.title], ['원 상신일시', doc.at], ['취소사유', r]].concat(doc.content), ref: { type: 'cancel', target: doc.id }, coop: doc.line.some(x => x.kind === '협조'), after });
      } }, { text: '닫기' }] });
  };

  /* ---- 결재문서 상세 ---- */
  Ap.detail = doc => {
    const app = A();
    const m = app.modal({ title: '결재문서 조회', width: 900, body: '<div class="dd"></div>', buttons: [{ text: '출력', onClick: () => { window.print(); return false; } }, { text: '닫기' }] });
    const box = $('.dd', m.pop);
    const draw = () => {
      const cur = Ap.current(doc);
      const st = Ap.statusOf(doc.id);
      const signCell = x => x.state === '완료' ? `<span class="sign-ok">${esc(x.name)}</span>` : x.state === '반려' ? '<span class="sign-no">반려</span>' : x.state === '진행' ? '<span class="sign-ing">결재중</span>' : '';
      box.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:16px">
          <div style="flex:1"><div style="font-size:18px;font-weight:700;margin:4px 0 10px">${esc(doc.title)}</div>
            <div>진행상태 ${Ap.badge(st)} ${doc.status === '회수' ? '<span style="font-size:12px;color:#6d7074">기안자가 회수한 문서입니다.</span>' : ''}</div></div>
          <table class="stamp"><tr><th class="vert" rowspan="3">결재</th>${doc.line.map(x => `<th>${esc(x.kind === '기안' ? '기안' : x.pos)}${x.kind !== '기안' ? `<br><span style="font-size:11px;color:#5d6b82">(${esc(x.kind)})</span>` : ''}</th>`).join('')}</tr>
            <tr>${doc.line.map(x => `<td class="sign">${signCell(x)}</td>`).join('')}</tr>
            <tr>${doc.line.map(x => `<td style="font-size:11px">${x.at ? esc(x.at.slice(5, 10).replace('-', '.')) : '&nbsp;'}</td>`).join('')}</tr></table>
        </div>
        <table class="form" style="margin-top:14px"><colgroup><col style="width:130px"><col><col style="width:130px"><col></colgroup>
          <tr><th>결재문서</th><td>${esc(doc.form)}</td><th>업무영역</th><td>${esc(doc.area)}</td></tr>
          <tr><th>기안자</th><td>${esc(doc.drafter)}</td><th>상신일시</th><td>${esc(doc.at)}</td></tr>
          ${doc.content.map(([k, v]) => `<tr><th>${esc(k)}</th><td colspan="3">${esc(v)}</td></tr>`).join('')}</table>
        <div class="sub-tit">결재이력</div>
        <div class="grid-wrap"><table class="grid"><colgroup><col style="width:50px"><col style="width:80px"><col style="width:140px"><col style="width:80px"><col style="width:140px"><col></colgroup><thead><tr><th>순번</th><th>결재구분</th><th>결재자</th><th>처리</th><th>처리일시</th><th>의견</th></tr></thead><tbody>
          ${doc.line.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.kind)}</td><td>${esc(x.pos)} ${esc(x.name)}</td><td>${x.kind === '기안' ? '상신' : { '완료': '승인', '반려': '반려', '진행': '결재대기', '대기': '대기' }[x.state] || '-'}</td><td>${esc(x.at || '')}</td><td class="l">${esc(x.op || '')}</td></tr>`).join('')}</tbody></table></div>
        ${cur ? `<div class="sim-box"><b>[연수용 결재 시뮬레이션]</b> 실제 나이스에서는 결재권자가 자신의 [미결/협조함]에서 처리합니다. 여기서는 현재 결재자 역할로 처리해 볼 수 있습니다.
          <div style="margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span>현재 결재자 : <b>${esc(cur.pos)} ${esc(cur.name)}</b> (${esc(cur.kind)})</span>
          <input class="inp sop" style="flex:1;min-width:200px" placeholder="결재의견 (반려 시 사유 입력)"><button class="btn primary s-ok">승인</button><button class="btn red s-no">반려</button><button class="btn outline s-all">최종 결재까지 승인</button></div></div>` : ''}
        ${Ap.canRetrieve(doc) && doc.drafter === D().user.name ? '<div class="toolbar" style="margin-top:10px"><span class="sp"></span><button class="btn dark d-ret">회수</button></div>' : ''}`;
      const ok = $('.s-ok', box);
      if (ok) {
        ok.onclick = () => { Ap.step(doc, true, $('.sop', box).value.trim()); Ap.refresh(); draw(); app.toast('승인 처리되었습니다.'); };
        $('.s-no', box).onclick = () => { const op = $('.sop', box).value.trim(); if (!op) { app.alertBox('반려 사유를 결재의견에 입력하십시오.'); return; } Ap.step(doc, false, op); Ap.refresh(); draw(); app.toast('반려 처리되었습니다.'); };
        $('.s-all', box).onclick = () => { let g = 0; while (Ap.current(doc) && g++ < 20) Ap.step(doc, true, ''); Ap.refresh(); draw(); app.toast('최종 결재가 완료되었습니다.'); };
      }
      const rt = $('.d-ret', box); if (rt) rt.onclick = () => app.confirmBox('상신한 문서를 회수하시겠습니까?', () => { if (Ap.retrieve(doc)) { draw(); app.toast('회수되었습니다.'); } });
    };
    draw();
  };

  /* ---- 개인결재선등록 ---- */
  Ap.myLinePopup = () => {
    const app = A(); let ed;
    const m = app.modal({ title: '개인결재선등록', width: 900, body: '<div class="info-box">자주 사용하는 결재선을 등록해 두면 상신할 때 기본 결재선으로 사용됩니다. (출장·초과근무 문서는 행정실장 협조가 자동 추가됩니다)</div><div class="le"></div>',
      buttons: [{ text: '저장', cls: 'primary', onClick: () => { const e = ed.validate(); if (e) { app.alertBox(e); return false; } D().myLine = ed.get().map(x => ({ name: x.name, kind: x.kind })); app.Store.save(); app.toast('개인결재선이 저장되었습니다.'); } },
        { text: '초기화', onClick: () => { delete D().myLine; app.Store.save(); app.toast('기본 결재선(부장-교감-교장)으로 초기화했습니다.'); } }, { text: '닫기' }] });
    ed = Ap.lineEditor($('.le', m.pop), Ap.defaultLine(false));
  };

  /* ================= 결재함 화면 ================= */
  const S = window.SCREENS = window.SCREENS || {};
  const FORMS = ['근무상황신청', '출장신청', '초과근무신청', '교외체험학습 승인', '결석신고서 확인', '월말출결통계', '결보강처리', '학생부 정정대장', '기결문서취소'];
  const boxStatus = x => { const st = Ap.statusOf(x.id); return { '결재중': '진행중', '완결': '기결' }[st] || st; };
  function boxScreen(page, title, app, preset) {
    const t = app.today(); const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const back = days => { const d = new Date(t); d.setDate(d.getDate() - days); return ymd(d); };
    const mine = preset.mine;
    page.insertAdjacentHTML('beforeend', `
      <div class="search-box">
        ${app.sf('업무영역', `<select class="sel s-area">${app.opts([['', '전체'], '복무', '학적', '학생부', '교육과정'])}</select>`)}
        ${app.sf('결재문서', `<select class="sel s-form" style="width:280px">${app.opts([['', '전체']].concat(FORMS))}</select>`)}
        <div style="flex-basis:100%;height:0"></div>
        ${app.sf('결재문서명', '<input class="inp s-title" style="width:360px">')}
        ${app.sf('상신기간', `<input type="date" class="inp s-a" value="${back(92)}"> ~ <input type="date" class="inp s-b" value="${ymd(t)}"> <button class="btn primary q" data-d="0">오늘</button> <button class="btn primary q" data-d="7">일주일</button> <button class="btn primary q" data-d="31">1개월</button> <button class="btn primary q" data-d="92">3개월</button>`, true)}
        <div style="flex-basis:100%;height:0"></div>
        ${preset.radios ? app.sf('진행상태', ['전체', '진행중', '기결', '반려', '회수', '기결취소'].map(x => `<label style="margin-right:12px"><input type="radio" name="ps-${esc(title)}" value="${x}" ${x === preset.status ? 'checked' : ''}> ${x}</label>`).join('')) : ''}
        ${app.searchBtn()}</div>
      <div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="gear">${app.I.gearSm}</span><span class="sp"></span>
        <button class="btn primary b-myline">개인결재선등록</button><button class="btn primary b-x">전결자지정</button><button class="btn primary b-x">대리결재자지정</button><button class="btn primary b-x">대리결재현황조회</button>
        <button class="btn dark b-cancel">기결문서취소</button><button class="btn dark b-ret">회수</button><button class="btn dark b-del">삭제</button></div>
      <div class="area">${app.nodata()}</div>
      ${mine ? '' : '<div class="info-box" style="margin-top:10px">연수용 환경의 담임교사 계정에는 결재·공람할 문서가 배정되지 않습니다. 결재권자 입장의 처리는 <b>상신함 → 문서 상세 → [연수용 결재 시뮬레이션]</b>에서 체험할 수 있습니다.</div>'}`);
    $$('.q', page).forEach(b => { b.onclick = () => { $('.s-a', page).value = back(+b.dataset.d); $('.s-b', page).value = ymd(t); }; });
    let queried = false;
    const list = () => {
      if (!mine) return [];
      const area = $('.s-area', page).value, form = $('.s-form', page).value, q = $('.s-title', page).value.trim();
      const a = $('.s-a', page).value, b = $('.s-b', page).value;
      const r = $(`input[name="ps-${CSS.escape(title)}"]:checked`, page);
      const st = r ? r.value : preset.status;
      return Ap.docs().filter(x => !x.hidden && x.drafter === D().user.name && (!area || x.area === area) && (!form || x.form === form) && (!q || x.title.includes(q)) && x.at.slice(0, 10) >= a && x.at.slice(0, 10) <= b && (st === '전체' || !st || (st === '기결취소' ? Ap.statusOf(x.id) === '기결취소' : x.status === st)));
    };
    const draw = () => {
      if (!queried) return;
      const rows = list();
      $('.cnt', page).textContent = rows.length;
      const me = Ap.me();
      $('.area', page).innerHTML = `<div class="grid-wrap" style="max-height:560px"><table class="grid"><colgroup><col style="width:40px"><col style="width:50px"><col><col style="width:100px"><col style="width:100px"><col style="width:90px"><col style="width:80px"><col style="width:110px"><col style="width:140px"><col style="width:100px"></colgroup>
        <thead><tr><th><input type="checkbox" class="all"></th><th>순번</th><th>결재문서명<span class="sort">△</span></th><th>결재권자명<span class="sort">△</span></th><th>기안자ID<span class="sort">△</span></th><th>기안자명<span class="sort">△</span></th><th>직위<span class="sort">△</span></th><th>조직명<span class="sort">△</span></th><th>상신일시<span class="sort">△</span></th><th>진행상황<span class="sort">△</span></th></tr></thead>
        <tbody>${rows.map((x, i) => `<tr data-id="${x.id}"><td><input type="checkbox" class="ck"></td><td>${i + 1}</td><td class="l link">${esc(x.title)}</td><td>${esc(Ap.finalName(x))}</td><td>${esc(me.id)}</td><td>${esc(x.drafter)}</td><td>${esc(me.pos)}</td><td>${esc(me.dept)}</td><td>${esc(x.at)}</td><td>${Ap.badge(boxStatus(x))}</td></tr>`).join('') || `<tr><td colspan="10" style="height:auto;border:none">${app.nodata('조회된 데이터가 없습니다.')}</td></tr>`}</tbody></table></div>`;
      const all = $('.all', page); if (all) all.onchange = () => $$('.ck', page).forEach(c => { c.checked = all.checked; });
      $$('td.link', page).forEach(td => { td.onclick = () => Ap.detail(Ap.get(td.parentElement.dataset.id)); });
    };
    page.__refresh = draw;
    const selected = () => $$('tbody tr[data-id]', page).filter(tr => $('.ck', tr).checked).map(tr => Ap.get(tr.dataset.id));
    $('.b-search', page).onclick = () => {
      queried = true;
      if (!mine) { $('.cnt', page).textContent = 0; $('.area', page).innerHTML = app.nodata('조회된 데이터가 없습니다.'); return; }
      draw();
    };
    $('.b-myline', page).onclick = () => Ap.myLinePopup();
    $$('.b-x', page).forEach(b => { b.onclick = () => app.alertBox(`[${b.textContent}]\n결재권자(교감·교장) 또는 담당자 권한 기능으로 연수용 환경에서는 제공하지 않습니다.`); });
    $('.b-ret', page).onclick = () => { const s = selected(); if (s.length !== 1) { app.alertBox('회수할 문서를 1건 선택하십시오.'); return; } app.confirmBox('선택한 문서를 회수하시겠습니까?', () => { if (Ap.retrieve(s[0])) app.toast('회수되었습니다.'); }); };
    $('.b-cancel', page).onclick = () => { const s = selected(); if (s.length !== 1) { app.alertBox('기결취소할 문서를 1건 선택하십시오.'); return; } Ap.cancelDoc(s[0]); };
    $('.b-del', page).onclick = () => { const s = selected(); if (!s.length) { app.alertBox('삭제할 문서를 선택하십시오.'); return; } if (s.some(x => !['회수', '반려'].includes(x.status))) { app.alertBox('회수 또는 반려된 문서만 삭제할 수 있습니다.'); return; } app.confirmBox(`선택한 ${s.length}건을 목록에서 삭제하시겠습니까?`, () => { s.forEach(x => { x.hidden = true; }); Ap.refresh(); }); };
    if (mine) { queried = true; draw(); }
  }
  S['상신함'] = (p, t, app) => boxScreen(p, t, app, { mine: true, radios: true, status: '전체' });
  S['기결함'] = (p, t, app) => boxScreen(p, t, app, { mine: true, radios: false, status: '기결' });
  S['반려함'] = (p, t, app) => boxScreen(p, t, app, { mine: true, radios: false, status: '반려' });
  S['미결/협조함'] = (p, t, app) => boxScreen(p, t, app, { mine: false });
  S['공람함'] = (p, t, app) => boxScreen(p, t, app, { mine: false });
  S['예결함'] = (p, t, app) => boxScreen(p, t, app, { mine: false });
  S['메시지함'] = function (page, title, app) {
    page.insertAdjacentHTML('beforeend', `<div class="toolbar"><span class="total">Total <b class="cnt">0</b></span><span class="sp"></span><button class="btn outline b-read">모두 읽음</button><button class="btn dark b-del">삭제</button></div><div class="area"></div>`);
    const draw = () => {
      const ms = D().msgs || [];
      $('.cnt', page).textContent = ms.length;
      $('.area', page).innerHTML = `<div class="grid-wrap"><table class="grid"><colgroup><col style="width:40px"><col style="width:150px"><col><col style="width:90px"></colgroup><thead><tr><th></th><th>수신일시</th><th>내용</th><th>확인</th></tr></thead><tbody>${ms.map((x, i) => `<tr data-i="${i}" style="${x.read ? '' : 'font-weight:700'}"><td><input type="checkbox" class="ck"></td><td>${esc(x.at)}</td><td class="l link">${esc(x.text)}</td><td>${x.read ? '확인' : '미확인'}</td></tr>`).join('') || '<tr><td colspan="4">메시지가 없습니다.</td></tr>'}</tbody></table></div>`;
      $$('td.link', page).forEach(td => { td.onclick = () => { const x = ms[+td.parentElement.dataset.i]; x.read = true; Ap.refresh(); app.alertBox(`${x.at}\n\n${x.text}`); }; });
    };
    page.__refresh = draw;
    $('.b-read', page).onclick = () => { (D().msgs || []).forEach(x => { x.read = true; }); Ap.refresh(); };
    $('.b-del', page).onclick = () => { const idx = $$('tbody tr[data-i]', page).filter(tr => $('.ck', tr).checked).map(tr => +tr.dataset.i); D().msgs = (D().msgs || []).filter((x, i) => !idx.includes(i)); Ap.refresh(); };
    draw();
  };
})();
