// 문서관리 목록 화면: 버튼 줄, 조회조건, 목록, 쪽 번호, 문서정보
(function () {
  var VE = window.VE, C = VE.CONFIG, I = VE.I, esc = VE.esc;
  var List = VE.List = {};
  var POPUPS = {
    '마스킹': ['제목마스킹', '첨부마스킹', '수신자숨김'], '비전자문서등록': ['비전자문서등록', '비전자소급(2025년도)등록'],
    '수정': ['한건수정', '일괄수정'], '추가기능': ['재작성', '참조기안', '과제변경', '사후보고', '정보공개목록', '일괄접수공문게시']
  };

  // 문서창 열기 (실제로는 별도 프로그램 창이 뜬다)
  VE.openDoc = function (id, from) {
    var h = Math.min(1000, (screen.availHeight || 1000) - 60);
    var w = window.open('card.html?id=' + encodeURIComponent(id) + '&from=' + (from || ''), 'card_' + id, 'width=900,height=' + h + ',left=260,top=0,resizable=yes,scrollbars=yes');
    if (!w) VE.alert('문서창이 차단되었습니다.\n브라우저 주소창 오른쪽의 팝업 차단을 해제한 뒤 다시 눌러 주세요.');
    return w;
  };
  VE.openDraft = function (form, id) {
    var h = Math.min(1000, (screen.availHeight || 1000) - 60);
    var w = window.open('card.html?mode=draft' + (id ? '&id=' + encodeURIComponent(id) : '') + '&form=' + encodeURIComponent(form || ''), 'draft_' + (id || Date.now()), 'width=900,height=' + h + ',left=260,top=0,resizable=yes,scrollbars=yes');
    if (!w) VE.alert('기안창이 차단되었습니다.\n브라우저 주소창 오른쪽의 팝업 차단을 해제한 뒤 다시 눌러 주세요.');
    return w;
  };

  List.mount = function (box, menuId, preset) {
    var cfg = VE.SCREENS[menuId], m = VE.findMenu(menuId);
    if (!cfg) { box.innerHTML = '<div class="wNone"><b>' + esc(m.name) + '</b>연수용 가상 화면에서는 문서관리 메뉴만 제공합니다.<br>왼쪽 메뉴에서 문서관리의 화면을 선택하세요.</div>'; return; }
    if (cfg.type === 'forms') return mountForms(box, cfg, m);
    var st = { title: (preset && preset.title) || '', user: '', docNo: '', pub: '', from: VE.addMonths(C.today, -1), to: C.today, page: 1, unit: 100, sort: null, asc: true, checked: {}, info: null, detail: false };
    var hasDate = cfg.s1.some(function (r) { return r.some(function (f) { return f[1] === 'd'; }); });
    var api = box._veList = { reload: function () { st.checked = {}; draw(); } };

    function rows() {
      var a = VE.SOURCES[cfg.src]().filter(function (d) {
        if (st.title && d.t.indexOf(st.title) < 0) return false;
        if (st.user && VE.val(d, 'cnrsBy').indexOf(st.user) < 0 && VE.val(d, 'drafter').indexOf(st.user) < 0) return false;
        if (st.docNo && VE.val(d, 'noFull').indexOf(st.docNo) < 0) return false;
        if (st.pub && d.pub !== st.pub) return false;
        if (hasDate && st.from && d.d < st.from) return false;
        if (hasDate && st.to && d.d > st.to) return false;
        return true;
      });
      if (st.sort) a = a.slice().sort(function (x, y) { var p = VE.val(x, st.sort), q = VE.val(y, st.sort); return (p < q ? -1 : p > q ? 1 : 0) * (st.asc ? 1 : -1); });
      return a;
    }

    function searchHtml() {
      var h = '<table><tbody>';
      cfg.s1.forEach(function (r) {
        h += '<tr>';
        r.forEach(function (f, i) {
          var wide = r.length === 1 ? ' colspan="3"' : '';
          var w1 = (r[0][2] && r[0][2].w) || '40%';
          h += '<th style="width:10%"><label>' + f[0] + '</label></th><td' + wide + ' style="width:' + (r.length === 1 ? '90%' : (i === 0 ? w1 : (80 - parseInt(w1, 10)) + '%')) + '">';
          if (f[1] === 't') h += '<input class="Ltext" type="text" data-f="' + (i === 0 && f[0] === '제목' ? 'title' : 'user') + '"' + (f[0] === '제목' && !(f[2] && f[2].w) ? ' size="25"' : '') + '>';
          else if (f[1] === 'u') h += '<input class="Ltext" type="text" data-f="user">' + I.uSearch + I.uOrgan;
          else if (f[1] === 'd') {
            h += '<input class="Ltext Lcal" type="text" data-f="from" maxlength="10"><a class="LcalPosition" data-cal="from">' + I.cal + '</a><span> ~ </span><input class="Ltext Lcal" type="text" data-f="to" maxlength="10"><a class="LcalPosition" data-cal="to">' + I.cal + '</a>';
            if (f[2] && f[2].m) h += '<select data-sel="m"><option value="0">개월</option><option value="1">1M</option><option value="3">3M</option><option value="6">6M</option><option value="12">12M</option></select>';
            if (f[2] && f[2].y) h += '<select data-sel="y"><option value="">년도</option><option>2026</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option><option>2020</option></select>';
          }
          h += '</td>';
        });
        h += '</tr>';
      });
      h += '<tr class="det" style="display:none"><th><label>문서번호</label></th><td><input class="Ltext" type="text" data-f="docNo" size="30"></td><th><label>대국민공개여부</label></th><td><select data-f="pub" style="width:110px;margin-left:0"><option value="">전체</option><option value="o">공개</option><option value="p">부분공개</option><option value="n">비공개</option></select></td></tr>';
      return h + '</tbody></table><div class="searchBtn" data-act="unfold">' + I.unfold + '</div>';
    }

    function build() {
      var h = '<div class="bms"><div class="LblockButton"><ul>';
      cfg.btns.forEach(function (b) {
        var pop = b.slice(-1) === '>', nm = pop ? b.slice(0, -1) : b;
        h += '<li><a class="Lbtn' + (pop ? ' popup' : '') + '" data-btn="' + nm + '"><span>' + nm + (pop ? I.btnMore : '') + '</span></a>';
        if (pop) h += '<div class="layer_bubble" data-bub="' + nm + '">' + (POPUPS[nm] || []).map(function (x) { return '<a data-btn="' + x + '">' + x + '</a>'; }).join('') + '</div>';
        h += '</li>';
      });
      h += '<li class="bar"></li><li><a class="Lbtn5" data-btn="조회"><span>조회</span></a></li></ul></div>';
      h += '<div class="LblockSearch"><div class="corner_RoundBox01">' + searchHtml() + '</div></div>';
      h += '<div class="LblockButton"><ul><li>' + (cfg.img.indexOf('e') >= 0 ? '<a class="imgbutton" data-btn="엑셀다운로드" title="엑셀다운로드">' + I.excel + '</a>' : '') + (cfg.img.indexOf('s') >= 0 ? '<a class="imgbutton" data-btn="PC저장" title="PC저장">' + I.pcsave + '</a>' : '') + (cfg.img.indexOf('p') >= 0 ? '<a class="imgbutton" data-btn="출력" title="출력">' + I.print + '</a>' : '') + '</li></ul></div>';
      h += '<div class="LblockListTable"><table id="tbList" class="tbList"><colgroup>' + cfg.cols.map(function (c) { return '<col style="width:' + (c[1] || 'auto') + '">'; }).join('') + '</colgroup><thead><tr>';
      cfg.cols.forEach(function (c) {
        if (c[0] === 'chk') h += '<th scope="col"><span class="chk" data-all="1" title="전체선택"></span></th>';
        else if (c[0] === '상태') h += '<th scope="col">상태 <a data-btn="상태아이콘설명" title="상태아이콘설명">' + I.que + '</a></th>';
        else if (c[3]) h += '<th scope="col"><a data-sort="' + c[2] + '">' + c[0] + '</a></th>';
        else h += '<th scope="col">' + c[0] + '</th>';
      });
      h += '</tr></thead><tbody></tbody></table><div class="pageNum"><div class="TotalNum"></div><div class="pageNum_page"><span>페이지당 </span><select data-unit="1">' + [5, 10, 15, 20, 30, 50, 100].map(function (n) { return '<option' + (n === st.unit ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div><ul class="pg"></ul></div><div class="docInfoBox"></div></div></div>';
      box.innerHTML = h;
      setInputs();
    }
    function q(sel) { return box.querySelector(sel); }
    function setInputs() {
      ['title', 'user', 'docNo', 'from', 'to'].forEach(function (k) { var n = q('[data-f="' + k + '"]'); if (n) n.value = st[k]; });
    }
    function readInputs() {
      ['title', 'user', 'docNo', 'from', 'to', 'pub'].forEach(function (k) { var n = q('[data-f="' + k + '"]'); if (n) st[k] = n.value.trim(); });
    }

    function cell(d, c, wrap) {
      var k = c[2], v;
      if (c[0] === 'chk') return '<td><span class="chk' + (st.checked[d.id] ? ' on' : '') + '" data-chk="' + d.id + '"></span></td>';
      if (k === 'state') {
        v = (d.link === '지출결의' ? I.stLink : d.k === 'r' ? I.stRecv : I.stDraft) + (d.att && d.att.length ? I.clip : '') + (d.urg ? I.urgent : (d.cn ? I.ring : ''));
        return '<td class="st" title="' + (d.k === 'r' ? '수신문서' : '기안문서') + (d.att && d.att.length ? '/첨부' : '') + (d.urg ? '/긴급' : '') + '">' + v + '<span class="pub" title="' + VE.val(d, 'pubNm') + '문서">' + I.pub[d.pub] + '</span></td>';
      }
      if (k === 'title') return '<td class="tl' + (wrap ? ' wrap' : '') + '">' + (d.k === 'r' ? '<span class="ra" title="수신문서">' + I.recvArr + '</span>' : '') + '<a class="ellipsisTitle" data-doc="' + d.id + '" title="' + esc(d.t) + ' 문서열기(새창열기)">' + esc(d.t) + '</a></td>';
      if (k === 'rel') return '<td>' + (d.link === '지출결의' ? '<a data-btn="관련정보" title="관련정보">' + I.rel + '</a>' : '') + '</td>';
      v = k ? VE.val(d, k) : '';
      return '<td title="' + esc(v) + '">' + (k === 'status' || k === 'progSt' ? ' ' + esc(v) + ' ' : esc(v)) + '</td>';
    }

    function draw() {
      var all = rows(), total = VE.SOURCES[cfg.src]().length, pages = Math.max(1, Math.ceil(all.length / st.unit));
      if (st.page > pages) st.page = pages;
      var view = all.slice((st.page - 1) * st.unit, st.page * st.unit), tb = q('#tbList tbody');
      tb.innerHTML = view.length ? view.map(function (d, i) { return '<tr class="' + (i % 2 ? 'bgGray' : 'bgWhite') + '">' + cfg.cols.map(function (c) { return cell(d, c, cfg.wrapTitle); }).join('') + '</tr>'; }).join('') : '<tr><td class="none" colspan="' + cfg.cols.length + '">조회 결과가 없습니다.</td></tr>';
      q('.TotalNum').innerHTML = '<span>총 </span><span class="pageNum_count">' + all.length + '</span><span>건 / 조회</span><span class="pageNum_count">' + view.length + '</span><span>건</span>';
      var pg = '';
      if (all.length) {
        pg += '<li><a data-pg="1">' + I.pFirst + '</a></li><li><a data-pg="' + Math.max(1, st.page - 1) + '">' + I.pPrev + '</a></li>';
        for (var p = 1; p <= pages; p++) pg += p === st.page ? '<li class="cur">' + p + '</li>' : '<li><a data-pg="' + p + '">' + p + '</a></li>';
        pg += '<li><a data-pg="' + Math.min(pages, st.page + 1) + '">' + I.pNext + '</a></li><li><a data-pg="' + pages + '">' + I.pLast + '</a></li>';
      }
      q('ul.pg').innerHTML = pg;
      var allChk = q('[data-all]'); if (allChk) allChk.className = 'chk';
      drawInfo(); void total;
    }

    function picked() { return Object.keys(st.checked).filter(function (k) { return st.checked[k]; }); }
    function needOne(what) {
      var p = picked();
      if (p.length !== 1) { VE.alert(p.length ? what + '은(는) 문서를 1건만 선택하세요.' : '문서를 선택하세요.'); return null; }
      return VE.doc(p[0]);
    }
    function drawInfo() {
      var b = q('.docInfoBox'), d = st.info && VE.doc(st.info);
      if (!d) { b.innerHTML = ''; return; }
      var ln = VE.lines(d).map(function (l) { return l.how + ' ' + l.who + '(' + l.pos + ')' + (l.st ? ' ' + l.st : ''); }).join(' → ');
      b.innerHTML = '<div class="docInfo"><h4>문서정보<a data-btn="문서정보닫기">닫기 ×</a></h4><table><tbody>' +
        '<tr><th>제목</th><td colspan="3">' + esc(d.t) + '</td></tr>' +
        '<tr><th>문서번호</th><td>' + esc(VE.val(d, 'noFull') || '(결재 진행 중)') + '</td><th>대국민공개여부</th><td>' + VE.val(d, 'pubNm') + '</td></tr>' +
        '<tr><th>과제카드</th><td colspan="3">' + esc(VE.TASKS[d.task] || '') + '</td></tr>' +
        '<tr><th>' + (d.k === 'r' ? '발신기관명' : '기안자') + '</th><td>' + esc(d.k === 'r' ? VE.val(d, 'sender') : VE.val(d, 'drafter')) + '</td><th>등록일시</th><td>' + VE.val(d, 'regDT') + '</td></tr>' +
        '<tr><th>결재경로</th><td colspan="3">' + esc(ln) + '</td></tr>' +
        '<tr><th>첨부</th><td colspan="3">' + (d.att && d.att.length ? d.att.map(function (a) { return esc(a[0]) + ' (' + a[1] + ')'; }).join('<br>') : '첨부 없음') + '</td></tr></tbody></table></div>';
    }

    function action(nm) {
      var p;
      switch (nm) {
        case '조회': readInputs(); st.page = 1; st.checked = {}; draw(); return;
        case '문서정보': p = needOne('문서정보'); if (p) { st.info = p.id; drawInfo(); q('.docInfoBox').scrollIntoView({ block: 'nearest' }); } return;
        case '문서정보닫기': st.info = null; drawInfo(); return;
        case '일괄처리':
          p = picked(); if (!p.length) { VE.alert('일괄처리할 문서를 선택하세요.'); return; }
          VE.confirm('선택한 ' + p.length + '건의 문서를 공람 확인 처리하시겠습니까?', function () { var n = VE.confirmCnrs(p); VE.Shell.refreshAll(); VE.alert(n + '건이 공람 확인 처리되었습니다.'); });
          return;
        case '즐겨찾기': p = picked(); VE.alert(p.length ? p.length + '건의 문서가 즐겨찾기에 등록되었습니다.' : '문서를 선택하세요.'); return;
        case '문서의견': p = needOne('문서의견'); if (p) VE.alert('등록된 문서의견이 없습니다.'); return;
        case '엑셀다운로드': csv(); return;
        case 'PC저장':
          p = picked(); if (!p.length) { VE.alert('PC저장할 문서를 선택하세요.'); return; }
          p.forEach(function (id) { VE.saveDoc(VE.doc(id), { body: true, att: true, fmt: 'odt', name: 3 }); });
          VE.alert(p.length + '건의 문서를 저장하였습니다.\n(브라우저의 다운로드 폴더를 확인하세요.)'); return;
        case '출력': VE.alert('출력할 프린터가 연결되어 있지 않습니다. (연수용 가상 화면)'); return;
        case '상태아이콘설명': VE.alert('상태 아이콘 설명\n\n파란 화살표: 수신문서 / 초록 화살표: 기안문서\n클립: 첨부 있음 / 주황 동그라미: 공람 / 느낌표: 긴급\n공: 공개  부: 부분공개  비: 비공개'); return;
        case '재작성': if (cfg.src === 'temp') { p = needOne('재작성'); if (p) VE.openDraft('', p.id); return; } break;
        case '삭제':
          if (cfg.src === 'temp') { p = picked(); if (!p.length) { VE.alert('삭제할 문서를 선택하세요.'); return; } VE.confirm('선택한 임시저장 문서를 삭제하시겠습니까?', function () { VE.S.data.mine = VE.S.data.mine.filter(function (d) { return p.indexOf(d.id) < 0; }); VE.S.save(); VE.Shell.refreshAll(); }); return; }
          break;
      }
      if (picked().length === 0 && ['공람', '보안공유', '회수', '삭제', '참조기안', '재작성', '첨부물분리등록', '담당확인', '공람의견등록'].indexOf(nm) >= 0) { VE.alert('문서를 선택하세요.'); return; }
      VE.notReady(nm);
    }

    function csv() {
      var heads = cfg.cols.filter(function (c) { return c[0] !== 'chk' && c[2] !== 'state' && c[2] !== 'rel'; });
      var lines = [heads.map(function (c) { return c[0]; }).join(',')];
      rows().forEach(function (d) { lines.push(heads.map(function (c) { return '"' + String(c[2] ? VE.val(d, c[2]) : '').replace(/"/g, '""') + '"'; }).join(',')); });
      VE.download(m.name + '_' + C.today.replace(/-/g, '') + '.csv', '﻿' + lines.join('\r\n'), 'text/csv');
    }

    box.onclick = function (e) {
      var t = e.target, n;
      Array.prototype.forEach.call(box.querySelectorAll('.layer_bubble'), function (b) { if (!t.closest('.popup') || b.getAttribute('data-bub') !== t.closest('.popup').getAttribute('data-btn')) b.style.display = 'none'; });
      if ((n = t.closest('[data-doc]'))) {
        var d = VE.doc(n.getAttribute('data-doc'));
        if (d && d.temp) VE.openDraft('', d.id); else VE.openDoc(n.getAttribute('data-doc'), menuId);
        return;
      }
      if ((n = t.closest('[data-chk]'))) { var id = n.getAttribute('data-chk'); st.checked[id] = !st.checked[id]; n.classList.toggle('on', st.checked[id]); return; }
      if ((n = t.closest('[data-all]'))) { var on = !n.classList.contains('on'); n.classList.toggle('on', on); Array.prototype.forEach.call(box.querySelectorAll('[data-chk]'), function (c) { st.checked[c.getAttribute('data-chk')] = on; c.classList.toggle('on', on); }); return; }
      if ((n = t.closest('[data-sort]'))) { var k = n.getAttribute('data-sort'); st.asc = st.sort === k ? !st.asc : true; st.sort = k; draw(); return; }
      if ((n = t.closest('[data-pg]'))) { st.page = +n.getAttribute('data-pg'); draw(); return; }
      if ((n = t.closest('[data-cal]'))) { VE.Cal.open(q('[data-f="' + n.getAttribute('data-cal') + '"]')); e.stopPropagation(); return; }
      if ((n = t.closest('[data-act="unfold"]'))) { st.detail = !st.detail; q('tr.det').style.display = st.detail ? '' : 'none'; n.innerHTML = st.detail ? I.fold : I.unfold; return; }
      if ((n = t.closest('.ibtn'))) { VE.notReady('사용자검색'); return; }
      if ((n = t.closest('[data-btn]'))) {
        if (n.classList.contains('popup')) { var b = n.parentNode.querySelector('.layer_bubble'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; return; }
        action(n.getAttribute('data-btn'));
      }
    };
    box.onchange = function (e) {
      var t = e.target;
      if (t.getAttribute('data-unit')) { st.unit = +t.value; st.page = 1; draw(); }
      else if (t.getAttribute('data-sel') === 'm' && +t.value) { st.to = C.today; st.from = VE.addMonths(C.today, -(+t.value)); setInputs(); }
      else if (t.getAttribute('data-sel') === 'y' && t.value) { st.from = t.value + '-01-01'; st.to = t.value + '-12-31'; setInputs(); }
    };
    box.onkeydown = function (e) { if (e.key === 'Enter' && e.target.classList.contains('Ltext')) action('조회'); };

    build(); draw();
  };

  // 공용서식
  function mountForms(box, cfg, m) {
    var st = { nm: '', cl: '' };
    function draw() {
      var a = cfg.empty ? [] : VE.FORMS.filter(function (f) { return (!st.nm || f[0].indexOf(st.nm) >= 0) && (!st.cl || f[1] === st.cl); });
      box.querySelector('tbody.fl').innerHTML = a.length ? a.map(function (f, i) { return '<tr class="' + (i % 2 ? 'bgGray' : 'bgWhite') + '"><td class="tl"><a class="ellipsisTitle" data-form="' + esc(f[0]) + '" title="' + esc(f[0]) + ' 기안문 작성(새창열기)">&nbsp;' + esc(f[0]) + '</a></td><td> ' + f[1] + ' </td><td class="tl"> ' + esc(f[2]) + ' </td></tr>'; }).join('') : '<tr><td class="none" colspan="3">조회 결과가 없습니다.</td></tr>';
      box.querySelector('.TotalNum').innerHTML = '<span>총 </span><span class="pageNum_count">' + a.length + '</span><span>건 / 조회</span><span class="pageNum_count">' + a.length + '</span><span>건</span>';
    }
    box.innerHTML = '<div class="bms"><div class="LblockButton"><ul><li class="bar"></li><li><a class="Lbtn5" data-btn="조회"><span>조회</span></a></li></ul></div>' +
      '<div class="LblockSearch"><div class="corner_RoundBox01"><table><tbody><tr><th style="width:10%"><label>서식명</label></th><td style="width:30%"><input class="Ltext" type="text" data-f="nm"></td><th style="width:10%"><label>서식분류</label></th><td style="width:50%"><select data-f="cl" style="width:50%;margin-left:0"><option value="">전체</option><option>연계서식</option><option>일반서식</option><option>조례서식</option></select></td></tr></tbody></table></div></div>' +
      '<div class="LblockListTable"><table class="tbList"><colgroup><col style="width:50%"><col style="width:25%"><col style="width:25%"></colgroup><thead><tr><th><a>서식명</a></th><th>서식분류</th><th>설명</th></tr></thead><tbody class="fl"></tbody></table>' +
      '<div class="pageNum"><div class="TotalNum"></div><div class="pageNum_page"><span>페이지당 </span><select><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option><option>50</option><option>100</option></select></div><ul class="pg"><li>' + I.pFirst + '</li><li>' + I.pPrev + '</li><li class="cur">1</li><li>' + I.pNext + '</li><li>' + I.pLast + '</li></ul></div></div></div>';
    box._veList = { reload: draw };
    box.onclick = function (e) {
      var n = e.target.closest('[data-form]');
      if (n) { VE.openDraft(n.getAttribute('data-form')); return; }
      if (e.target.closest('[data-btn="조회"]')) { st.nm = box.querySelector('[data-f="nm"]').value.trim(); st.cl = box.querySelector('[data-f="cl"]').value; draw(); }
    };
    box.onkeydown = function (e) { if (e.key === 'Enter') { st.nm = box.querySelector('[data-f="nm"]').value.trim(); draw(); } };
    draw(); void m;
  }

  // 달력
  var Cal = VE.Cal = { target: null, y: 0, m: 0 };
  Cal.open = function (input) {
    Cal.target = input; var v = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.value) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(C.today);
    Cal.y = +v[1]; Cal.m = +v[2] - 1; Cal.draw();
    var r = input.getBoundingClientRect(), c = document.getElementById('veCal');
    c.style.left = r.left + 'px'; c.style.top = (r.bottom + 2) + 'px'; c.style.display = 'block';
  };
  Cal.draw = function () {
    var c = document.getElementById('veCal'), first = new Date(Cal.y, Cal.m, 1), start = new Date(Cal.y, Cal.m, 1 - first.getDay()), h = '<div class="ch"><a style="left:0" data-mv="-1">◀</a>' + Cal.y + '년 ' + (Cal.m + 1) + '월<a style="right:0" data-mv="1">▶</a></div><table><thead><tr>' + ['일', '월', '화', '수', '목', '금', '토'].map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var w = 0; w < 6; w++) {
      h += '<tr>';
      for (var d = 0; d < 7; d++) { var dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d), s = VE.fmt(dt); h += '<td class="' + (dt.getMonth() !== Cal.m ? 'oth' : d === 0 ? 'sun' : '') + (Cal.target && Cal.target.value === s ? ' sel' : '') + '" data-d="' + s + '">' + dt.getDate() + '</td>'; }
      h += '</tr>';
    }
    c.innerHTML = h + '</tbody></table>';
  };
  document.addEventListener('click', function (e) {
    var c = document.getElementById('veCal'); if (!c) return;
    var mv = e.target.closest && e.target.closest('#veCal [data-mv]'), dd = e.target.closest && e.target.closest('#veCal [data-d]');
    if (mv) { Cal.m += +mv.getAttribute('data-mv'); if (Cal.m < 0) { Cal.m = 11; Cal.y--; } if (Cal.m > 11) { Cal.m = 0; Cal.y++; } Cal.draw(); return; }
    if (dd) { Cal.target.value = dd.getAttribute('data-d'); c.style.display = 'none'; return; }
    if (!e.target.closest('#veCal')) c.style.display = 'none';
  });
})();
