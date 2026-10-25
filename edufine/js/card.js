// 문서관리카드(문서 보기)와 기안창. 실제로는 별도 프로그램 창으로 뜨는 화면이다.
(function () {
  var VE = window.VE, C = VE.CONFIG, I = VE.I, esc = VE.esc;
  var $ = function (id) { return document.getElementById(id); };
  var qs = {}; location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) { qs[k] = decodeURIComponent(v); });
  VE.login(false); VE.S.load();
  var PUB = { o: '공개', p: '부분공개', n: '비공개' };

  // ── 창 안 대화상자 ──
  function modal(title, bodyHtml, btns, onClose) {
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div class="hd">' + title + '<a data-x="1">' + I.closeW + '</a></div>' + bodyHtml + (btns ? '<div class="ft">' + btns.map(function (b, i) { return '<a class="Lbtn' + (b[2] ? ' blue' : '') + '" data-b="' + i + '"><span>' + b[0] + '</span></a>'; }).join('') + '</div>' : '');
    function close() { m.remove(); if (!document.querySelector('.modal')) $('mask').style.display = 'none'; }
    m.onclick = function (e) {
      var b = e.target.closest('[data-b]'), x = e.target.closest('[data-x]');
      if (x) { close(); if (onClose) onClose(); }
      else if (b) { var f = btns[+b.getAttribute('data-b')][1]; if (!f || f(m) !== false) close(); }
    };
    $('mask').style.display = 'block'; document.body.appendChild(m); return m;
  }
  function alertBox(msg, cb) { modal('알림', '<div class="msg">' + esc(msg) + '</div>', [['확인', cb]], cb); }
  function confirmBox(msg, ok) { modal('알림', '<div class="msg">' + esc(msg) + '</div>', [['확인', ok], ['취소', null, 1]]); }
  function notReady(n) { alertBox((n ? '[' + n + '] ' : '') + '연수용 가상 화면에서는 제공하지 않는 기능입니다.'); }
  function notify() { try { if (window.opener) window.opener.postMessage({ ve: 'changed' }, '*'); } catch (e) { } }
  function closeWin() { window.close(); setTimeout(function () { if (!window.closed) document.body.innerHTML = '<div style="padding:60px;text-align:center;font-size:15px">창을 닫아 주세요.</div>'; }, 300); }

  // ── 본문(공문) 모양 ──
  function pageHtml(d, editable) {
    var p = VE.docParts(d), h = '<div class="page"' + (editable ? ' contenteditable="true" spellcheck="false"' : '') + '><div class="wm" contenteditable="false">연수용 가상 문서</div>';
    h += '<div class="slogan">' + esc(p.slogan) + '</div><div class="org">' + esc(p.org) + '</div>';
    h += '<div class="row hd"><span class="lb">수신</span>' + esc(p.recv) + '</div><div class="row hd">' + p.via + '</div><div class="row hd ttl"><span class="lb">제목</span>' + esc(p.title) + '</div>';
    p.lines.forEach(function (l) { var n = /^ */.exec(l)[0].length; h += '<p class="l' + Math.min(n, 2) + '">' + esc(l.slice(n)) + '</p>'; });
    if (p.att) h += '<p class="att">' + esc(p.att) + '</p>';
    if (p.signer) h += '<div class="signer">' + esc(p.signer) + '</div>';
    if (p.recvList) h += '<div class="row hd rl"><span class="lb" style="width:4.6em">수신자</span>' + esc(p.recvList) + '</div>';
    h += '<div class="tail" contenteditable="false"><table class="sign"><tr>' + p.sign.map(function (x) { return '<td><span class="ti">' + esc(x[0]) + '</span><span class="nm">' + esc(x[1]) + '</span></td>'; }).join('') + '</tr></table>' +
      '<div class="co">협조자</div><div class="ln"><span class="lb">시행</span>' + esc(p.enfNo) + ' (' + esc(p.enfDate || '          ') + ')<span class="lb" style="margin-left:3em">접수</span>' + esc(p.rcvNo) + ' (' + esc(p.rcvDate || '          ') + ')</div>' +
      '<div><span class="lb">우</span>' + p.zip + '&nbsp;&nbsp;' + esc(p.addr) + '<span class="sep">/</span>' + esc(p.home) + '</div>' +
      '<div><span class="lb">전화</span>' + p.tel + '<span class="sep">/전송</span>' + p.fax + '<span class="sep">/</span>' + esc(p.email) + '<span class="sep">/</span>' + p.pub + '</div><div class="fs">' + esc(p.foot) + '</div></div></div>';
    return h;
  }
  function hwp(inner) {
    var t1 = '<i></i><i></i><i class="s"></i><i class="b"></i><i class="b"></i><i class="s"></i><i></i><i></i><i></i><i class="s"></i><i></i><i class="b"></i><i></i><i></i><i class="b"></i><i></i><i class="s"></i><i></i><i></i>';
    return '<div class="hwp"><div class="menu"><span>파일(<u>F</u>)</span><span>편집(<u>E</u>)</span><span>보기(<u>U</u>)</span><span>입력(<u>R</u>)</span><span>모양(<u>J</u>)</span><span>도구(<u>K</u>)</span><span>표(<u>Q</u>)</span><span>도움말(<u>H</u>)</span></div>' +
      '<div class="tool">' + t1 + '</div><div class="tool"><i class="b"></i><i class="b"></i><i></i><i></i><i></i></div><div class="view">' + inner + '</div>' +
      '<div class="stat"><span style="width:205px">1쪽 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1단</span><span style="width:160px">1줄 &nbsp;&nbsp;&nbsp;&nbsp; 1칸</span><span style="width:130px;text-align:left;padding-left:4px">표</span><span style="width:110px">1/ &nbsp;1 구역</span><span style="width:86px;text-align:left;padding-left:4px">삽입</span><span style="flex:1"></span></div></div>';
  }
  function attHtml(att, edit) {
    return '<div class="LblockSubtitle_1"><h2>' + I.h2 + '첨부 <span style="font-weight:normal">' + (att.length ? '(' + att.length + ')' : '') + '</span></h2><div class="LblockButton">' +
      '<a class="Lbtn" data-a="attInfo"><span>첨부파일 오류 조치방안</span></a>' + (edit ? '<a class="Lbtn" data-a="attAdd"><span>파일추가</span></a><a class="Lbtn" data-a="attDel"><span>파일삭제</span></a>' : '<a class="Lbtn" data-a="attOpen"><span>파일읽기</span></a><a class="Lbtn" data-a="attSave"><span>PC저장</span></a>') + '</div></div><div id="attComm">&nbsp;</div>' +
      '<div id="attBox"><table><thead><tr><th><input type="checkbox" data-a="attAll"></th><th>파일명</th><th style="width:15%">용량</th><th style="width:15%">공개여부</th></tr></thead><tbody>' +
      att.map(function (a, i) { return '<tr><td style="text-align:center"><input type="checkbox" class="attChk" data-i="' + i + '"></td><td>' + I.fileIc + '<a class="filename" data-a="attFile" data-i="' + i + '">' + esc(a[0]) + '</a></td><td style="text-align:right">' + a[1] + '</td><td style="text-align:center"><label><input type="radio" disabled checked> 공개</label> <label><input type="radio" disabled> 비공개</label></td></tr>'; }).join('') +
      '</tbody></table></div><div style="height:14px"></div>';
  }

  // ── 문서 보기 ──
  function viewDoc(d) {
    document.title = d.t;
    var isWait = VE.cnrsState(d) === 'w', lines = VE.lines(d), att = d.att || [];
    var viewers = VE.allStaff().map(function (s) { return s.name + '(' + C.school + '/' + s.pos + ')'; });
    var h = '<div id="pop_header"><h1>문서관리카드조회</h1><div class="title_btn"><a class="ub" data-a="savePC" title="PC저장(새창열기)">' + I.pcsave + '</a><a class="ub" data-a="print" title="출력(새창열기)">' + I.print + '</a><a data-a="close" title="닫기">' + I.closeW + '</a></div></div><div id="veBadge">⚠ 연수용 가상 화면 · 실제 사이트 아님</div>' +
      '<div id="pop_content"><div class="LblockButton" id="topBtns"><a class="Lbtn" data-a="copyNo"><span>문서번호복사</span></a><a class="Lbtn" data-a="rewrite"><span>재작성</span></a><a class="Lbtn" data-a="copyBody"><span>본문복사</span></a>' + (isWait ? '<a class="Lbtn" id="bntCnrs" data-a="cnrs" title="공람확인"><span>확인</span></a>' : '') + '</div>' +
      '<div class="LblockTab"><ul><li id="property"><a data-tab="property" title="결재정보">결재정보' + (att.length ? I.clip.replace('#8b8b8b', '#2c85bf') + '<strong class="numberOfData">' + att.length + '</strong>' : '') + '</a></li><li id="maindoc1" class="Lcurrent"><a data-tab="maindoc1" title="본문">본문</a></li></ul></div>' +
      // 결재정보
      '<div class="tabarea" id="property-area"><div class="LblockSubtitle_1"><h2>' + I.h2 + '문서정보</h2></div><div class="LblockDetail"><table><tbody>' +
      '<tr><th>제목</th><td><span style="user-select:text">' + esc(d.t) + '</span><span style="float:right"><input type="checkbox" disabled' + (d.urg ? ' checked' : '') + '><label>긴급</label></span></td></tr>' +
      '<tr><th>문서번호</th><td><span id="docNo" style="user-select:text">' + esc(VE.val(d, 'noFull') || '(결재 진행 중)') + '</span></td></tr>' +
      '<tr><th>과제카드</th><td>' + I.unit + ' ' + esc(VE.TASKS[d.task] || '') + '</td></tr><tr><th>관련정보</th><td></td></tr><tr><th>문서요지</th><td></td></tr>' +
      '<tr><th>키워드</th><td><input class="Ltext" style="width:89.7%" placeholder="예시) #학교 #문서 #결재 #보고"></td></tr>' +
      '<tr><th>대국민공개여부</th><td>' + ['o', 'p', 'n'].map(function (k) { return '<input type="radio" disabled' + (d.pub === k ? ' checked' : '') + '><label>' + PUB[k] + '</label>'; }).join('') + (d.pub === 'o' ? '<span class="note">※ 대국민공개여부 공개 선택 시 직원열람범위 및 직원열람제한 설정은 사용하실 수 없습니다.</span>' : '') + '</td></tr>' +
      '<tr><th>직원열람제한</th><td><input type="radio" disabled><label>설정안함</label><input type="radio" disabled checked><label>결재완료일까지</label><input type="radio" disabled><label>지정날짜까지</label><input type="radio" disabled><label>영구</label></td></tr>' +
      '<tr><th>기타보안</th><td><input type="checkbox" disabled><label>열람시암호확인</label><input type="checkbox" disabled><label>문서암호화(DRM)</label></td></tr>' +
      '<tr><th>결재완료 알림</th><td><input type="checkbox" disabled><label>결재완료시 기안자에게 내부메일 발송</label></td></tr>' +
      (d.k === 'r' ? '<tr><th>발신기관명</th><td>' + esc(VE.val(d, 'sender')) + '</td></tr>' : '') + '</tbody></table></div>' +
      '<div class="LblockTab sub"><ul><li class="Lcurrent" id="st1"><a data-sub="1">결재경로</a></li><li id="st2"><a data-sub="2">공람 (' + viewers.length + ')</a></li><li id="st4"><a data-sub="4">지식공유</a></li></ul></div>' +
      '<div class="sub on" id="sub1"><div class="LblockSubtitle_1"><h2>' + I.h2 + '결재경로</h2></div><div class="LblockListTable"><table><thead><tr><th style="width:6%">순번</th><th style="width:12%">처리방법</th><th>직위(직급)</th><th style="width:22%">처리자</th><th style="width:12%">처리상태</th><th style="width:20%">처리일시</th><th style="width:12%">의견</th></tr></thead><tbody>' +
      lines.slice().reverse().map(function (l, i) { return '<tr><td>' + (lines.length - i) + '</td><td>' + l.how + '</td><td>' + esc(l.pos) + '</td><td>' + esc(l.who) + '(' + l.id + ')</td><td>' + l.st + '</td><td>' + l.at + '</td><td></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="sub" id="sub2" style="display:none"><div class="LblockDetail"><table><tbody><tr><th>공람자 (' + viewers.length + ')</th><td id="viewerList">' + esc(viewers.join(', ')) + '</td></tr></tbody></table></div></div>' +
      '<div class="sub" id="sub4" style="display:none"><div class="LblockSubtitle_1"><h2>' + I.h2 + '지식공유</h2></div><div class="LblockDetail"><table><tbody><tr><th>지식공유범위</th><td><input type="radio" disabled checked><label>설정안함</label><input type="radio" disabled><label>시도내</label><input type="radio" disabled><label>타시도</label></td></tr></tbody></table></div></div></div>' +
      // 본문
      '<div class="tabarea on" id="maindoc1-area">' + hwp(pageHtml(d)) + '</div>' + attHtml(att) + '</div>';
    $('popup').innerHTML = h;

    function saveDialog() {
      var m = modal('파일저장', '<div class="bd"><div class="LblockButton" style="margin-bottom:8px"><a class="Lbtn" data-ok="1"><span>확인</span></a></div><div class="LblockDetail"><table id="checkboxTbl"><tbody>' +
        '<tr><th>파일구분</th><td><input type="checkbox" id="hwpsave" checked><label for="hwpsave">본문</label><input type="checkbox" id="attsave"' + (att.length ? ' checked' : ' disabled') + '><label for="attsave">첨부파일</label><input type="checkbox" id="sisave" disabled><label for="sisave">시행문</label><input type="checkbox" id="hoxsave"><label for="hoxsave">문서정보</label></td></tr>' +
        '<tr><th>문서형식</th><td><input type="radio" name="HWPDISTSAVE" id="HWPDISTSAVE01" checked><label for="HWPDISTSAVE01">비배포(ODT 형식)</label>&nbsp;&nbsp;<input type="radio" name="HWPDISTSAVE" id="HWPDISTSAVE02"><label for="HWPDISTSAVE02">배포(PDF 형식)</label></td></tr>' +
        '<tr><th>저장형식</th><td><input type="radio" name="CHOSAVE" id="CHOSAVE03" value="3" checked><label for="CHOSAVE03">(문서번호 (본문)) 문서의제목</label><br><input type="radio" name="CHOSAVE" id="CHOSAVE02" value="2"><label for="CHOSAVE02">문서의제목 [문서번호 (본문)]</label><br><input type="radio" name="CHOSAVE" id="CHOSAVE04" value="4"><label for="CHOSAVE04">문서의제목 (문서번호 (본문))</label></td></tr></tbody></table></div>' +
        '<div class="guide"><h3>' + I.guide + ' 사용설명</h3><ul><li>기안창에서 저장시 문서형식, 저장형식 선택항목은 보이지 않습니다.</li><li>저장형식에 대한 자세한 설명입니다.<br>&nbsp; 1. (문서번호 (본문)) 문서의제목.odt(pdf)<br>&nbsp;&nbsp;&nbsp; ex) (테스트과-100 (본문)) 제목.odt(pdf)<br>&nbsp; 2. 문서의제목 [문서번호 (본문)].odt(pdf)<br>&nbsp;&nbsp;&nbsp; ex) 제목 [테스트과-100 (본문)].odt(pdf)</li></ul><b>※ \'비배포\' 선택 시 ODT형식, \'배포\' 선택 시 PDF형식으로 저장 됩니다.</b></div></div>');
      m.querySelector('[data-ok]').onclick = function () {
        var opt = { body: $('hwpsave').checked, att: $('attsave').checked, info: $('hoxsave').checked, name: +m.querySelector('[name=CHOSAVE]:checked').value };
        if (!opt.body && !opt.att && !opt.info) { alertBox('저장할 파일구분을 선택하세요.'); return; }
        var pdf = $('HWPDISTSAVE02').checked, saved = VE.saveDoc(d, opt);
        m.querySelector('[data-x]').click();
        modal('문서저장', '<div class="bd"><pre class="res">' + saved.map(function (n) { return esc('다운로드\\' + n) + ' ...... ok'; }).join('\n') + '</pre><div style="text-align:center;color:#333">모두 저장하였습니다.' + (pdf ? '<br><span style="color:#2c85bf">(연수용 가상 화면에서는 본문이 ODT 형식으로 저장됩니다.)</span>' : '') + '<br><span style="color:#888;font-size:12px">저장 위치: 브라우저의 다운로드 폴더</span></div></div>', [['닫기']]);
      };
    }
    function copy(text, msg) {
      function done() { alertBox(msg); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); }); else fallback();
      function fallback() { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove(); done(); }
    }
    $('popup').onclick = function (e) {
      var t = e.target.closest('[data-tab]'), s = e.target.closest('[data-sub]'), a = e.target.closest('[data-a]');
      if (t) { var id = t.getAttribute('data-tab'); ['property', 'maindoc1'].forEach(function (k) { $(k).className = k === id ? 'Lcurrent' : ''; $(k + '-area').className = 'tabarea' + (k === id ? ' on' : ''); }); return; }
      if (s) { var n = s.getAttribute('data-sub'); ['1', '2', '4'].forEach(function (k) { $('st' + k).className = k === n ? 'Lcurrent' : ''; $('sub' + k).style.display = k === n ? '' : 'none'; }); return; }
      if (!a) return;
      switch (a.getAttribute('data-a')) {
        case 'close': closeWin(); break;
        case 'savePC': case 'attSave': saveDialog(); break;
        case 'print': alertBox('출력할 프린터가 연결되어 있지 않습니다. (연수용 가상 화면)'); break;
        case 'copyNo': copy(VE.val(d, 'noFull'), '문서번호가 복사되었습니다.\n' + VE.val(d, 'noFull')); break;
        case 'copyBody': copy(VE.bodyParas(d).join('\r\n'), '본문이 복사되었습니다.'); break;
        case 'rewrite': notReady('재작성'); break;
        case 'attInfo': alertBox('첨부파일이 열리지 않으면 [PC저장] 후 저장된 파일을 직접 열어 주세요.'); break;
        case 'attAll': Array.prototype.forEach.call(document.querySelectorAll('.attChk'), function (c) { c.checked = a.checked; }); break;
        case 'attOpen': case 'attFile':
          var i = a.getAttribute('data-i'); if (i == null) { var c = document.querySelector('.attChk:checked'); if (!c) { alertBox('읽을 파일을 선택하세요.'); break; } i = c.getAttribute('data-i'); }
          alertBox('[' + att[+i][0] + ']\n\n연수용 가상 첨부파일이라 내용이 없습니다.\nPC저장을 하면 견본 파일이 저장됩니다.'); break;
        case 'cnrs':
          confirmBox('공람 확인 처리하시겠습니까?', function () { VE.confirmCnrs([d.id]); notify(); alertBox('공람 확인 처리되었습니다.', closeWin); return true; });
          break;
      }
    };
  }

  // ── 기안문 작성 ──
  function draftDoc(old) {
    document.title = '기안문작성';
    var me = C.user, staff = VE.STAFF, att = old ? (old.att || []).slice() : [];
    var d0 = old || { t: '', task: '', pub: 'o', ap: ['@ME', '김혜수', '송강호'], b: [] };
    function opts(sel, filter) { return staff.filter(filter).map(function (s) { return '<option' + (s.name === sel ? ' selected' : '') + '>' + s.name + '</option>'; }).join(''); }
    var tmp = { k: 'd', t: d0.t || '', b: d0.b.length ? d0.b : ['1. 관련: ', '2. '], att: [], ap: ['@ME', d0.ap[1], d0.ap[2]], d: C.today, tm: VE.nowHM(), pub: 'o', no: 0, st: '진행' };
    var h = '<div id="pop_header"><h1>기안문작성</h1><div class="title_btn"><a data-a="close" title="닫기">' + I.closeW + '</a></div></div><div id="veBadge">⚠ 연수용 가상 화면 · 실제 사이트 아님' + (qs.form ? ' · ' + esc(qs.form) : '') + '</div>' +
      '<div id="pop_content"><div class="LblockButton" id="topBtns"><a class="Lbtn" data-a="submit" id="btnSubmit"><span>결재올림</span></a><a class="Lbtn" data-a="temp"><span>임시저장</span></a><a class="Lbtn" data-a="line"><span>결재경로</span></a><a class="Lbtn blue" data-a="close"><span>닫기</span></a></div>' +
      '<div class="LblockTab"><ul><li id="property" class="Lcurrent"><a data-tab="property" title="결재정보">결재정보</a></li><li id="maindoc1"><a data-tab="maindoc1" title="본문">본문</a></li></ul></div>' +
      '<div class="tabarea on" id="property-area"><div class="LblockSubtitle_1"><h2>' + I.h2 + '문서정보</h2></div><div class="LblockDetail"><table><tbody>' +
      '<tr><th><span class="txtPoint">* </span><label for="Sj">제목</label></th><td><input class="Ltext" id="Sj" style="width:89.7%" maxlength="100" value="' + esc(d0.t) + '"><input type="checkbox" id="emrgncy"><label for="emrgncy">긴급</label></td></tr>' +
      '<tr><th><span class="txtPoint">*</span> 과제카드</th><td><select class="Lsel" id="task" style="width:89.7%"><option value="">[과제카드를 선택하세요]</option>' + Object.keys(VE.TASKS).map(function (k) { return '<option value="' + k + '"' + (d0.task === k ? ' selected' : '') + '>' + VE.TASKS[k] + '</option>'; }).join('') + '</select></td></tr>' +
      '<tr><th><label for="docOutline">문서요지</label></th><td><input class="Ltext" id="docOutline" style="width:89.7%"></td></tr>' +
      '<tr><th><label for="docKeyword">키워드</label></th><td><input class="Ltext" id="docKeyword" style="width:89.7%" placeholder="예시) #학교 #문서 #결재 #보고"></td></tr>' +
      '<tr><th><span class="txtPoint">*</span>대국민공개여부</th><td>' + ['o', 'p', 'n'].map(function (k, i) { return '<input type="radio" name="othbcLmtt" id="othbcLmtt' + (i + 1) + '" value="' + k + '"' + ((d0.pub || 'o') === k ? ' checked' : '') + '><label for="othbcLmtt' + (i + 1) + '">' + PUB[k] + '</label>'; }).join('') + '<span class="note">※ 통합검색을 통해 타기관(시도내)에서 공문을 열람할 수 있습니다.</span></td></tr>' +
      '<tr><th><span class="txtPoint">*</span> 직원열람제한</th><td><input type="radio" name="rl" checked><label>설정안함</label><input type="radio" name="rl"><label>결재완료일까지</label><input type="radio" name="rl"><label>지정날짜까지</label><input type="radio" name="rl"><label>영구</label></td></tr>' +
      '<tr><th>기타보안</th><td><input type="checkbox" id="scrty"><label for="scrty">열람시암호확인</label><input type="checkbox" id="dRM"><label for="dRM">문서암호화(DRM)</label></td></tr>' +
      '<tr><th>결재완료 알림</th><td><input type="checkbox" id="allim"><label for="allim">결재완료시 기안자에게 내부메일 발송</label></td></tr></tbody></table></div>' +
      '<div class="LblockTab sub"><ul><li class="Lcurrent"><a>결재경로</a></li><li><a data-a="nr">공람</a></li><li><a data-a="nr">지식공유</a></li></ul></div>' +
      '<div class="LblockSubtitle_1"><h2>' + I.h2 + '결재경로</h2></div><div class="LblockListTable apprEdit"><table><thead><tr><th style="width:8%">순번</th><th style="width:16%">처리방법</th><th>직위(직급)</th><th style="width:30%">처리자</th><th style="width:16%">처리상태</th></tr></thead><tbody>' +
      '<tr><td>3</td><td>결재</td><td id="pos3"></td><td><select class="Lsel" id="ap3">' + opts(d0.ap[2], function (s) { return /교장|교감|행정실장/.test(s.pos); }) + '</select></td><td></td></tr>' +
      '<tr><td>2</td><td>검토</td><td id="pos2"></td><td><select class="Lsel" id="ap2">' + opts(d0.ap[1], function (s) { return /교감|행정실장|교사/.test(s.pos); }) + '</select></td><td></td></tr>' +
      '<tr><td>1</td><td>기안</td><td>' + me.pos + '</td><td>' + esc(me.name) + '(' + me.id + ')</td><td>기안중</td></tr></tbody></table></div>' +
      '<p class="draftHint">※ 제목과 과제카드를 넣고 [본문] 탭에서 내용을 쓴 뒤 [결재올림]을 누르면 [결재 &gt; 문서진행]에 올라갑니다.</p></div>' +
      '<div class="tabarea" id="maindoc1-area">' + hwp(pageHtml(tmp, true)) + '</div>' + '<div id="attWrap">' + attHtml(att, true) + '</div><input type="file" id="fileIn" multiple style="display:none"></div>';
    $('popup').innerHTML = h;
    function pos() { [2, 3].forEach(function (i) { $('pos' + i).textContent = VE.staff($('ap' + i).value).pos; }); }
    pos(); $('ap2').onchange = $('ap3').onchange = pos;
    $('Sj').oninput = function () { var r = document.querySelector('.page .ttl'); if (r) r.innerHTML = '<span class="lb">제목</span>' + esc($('Sj').value); };
    function redrawAtt() { $('attWrap').innerHTML = attHtml(att, true); }
    $('fileIn').onchange = function () { Array.prototype.forEach.call(this.files, function (f) { att.push([f.name, (f.size / 1024).toFixed(2) + ' KB']); }); this.value = ''; redrawAtt(); };

    // 편집한 본문에서 본문 줄만 뽑는다 (제목 줄 다음부터 발신명의 앞까지)
    function bodyLines() {
      var out = [], pg = document.querySelector('.page'), on = false;
      Array.prototype.forEach.call(pg.children, function (n) {
        if (n.classList.contains('wm')) return;
        if (n.classList.contains('ttl')) { on = true; return; }
        if (n.classList.contains('signer') || n.classList.contains('tail') || n.classList.contains('rl')) { on = false; return; }
        if (!on) return;
        var lv = n.classList.contains('l2') ? 2 : n.classList.contains('l1') ? 1 : 0;
        n.innerText.split(/\n/).forEach(function (t) { if (t.trim()) out.push(new Array(lv + 1).join(' ') + t.replace(/\s+$/, '')); });
      });
      return out;
    }
    function collect(temp) {
      var b = bodyLines();
      return { id: old ? old.id : 'M' + (++VE.S.data.seq) + '_' + Date.now().toString(36), k: 'd', t: $('Sj').value.trim(), by: '@ME', task: $('task').value, pub: document.querySelector('[name=othbcLmtt]:checked').value, urg: $('emrgncy').checked ? 1 : 0,
        ap: ['@ME', $('ap2').value, $('ap3').value], att: att, b: b.length ? b : [''], d: C.today, tm: VE.nowHM(), no: 0, st: '진행', temp: temp ? 1 : 0, form: qs.form || (old && old.form) || '' };
    }
    function store(doc) {
      VE.S.load(); var a = VE.S.data.mine, i = -1; a.forEach(function (x, k) { if (x.id === doc.id) i = k; });
      if (i >= 0) a[i] = doc; else a.unshift(doc);
      VE.S.save(); notify();
    }
    $('popup').onclick = function (e) {
      var t = e.target.closest('[data-tab]'), a = e.target.closest('[data-a]');
      if (t) { var id = t.getAttribute('data-tab'); ['property', 'maindoc1'].forEach(function (k) { $(k).className = k === id ? 'Lcurrent' : ''; $(k + '-area').className = 'tabarea' + (k === id ? ' on' : ''); }); return; }
      if (!a) return;
      switch (a.getAttribute('data-a')) {
        case 'close': confirmBox('작성 중인 내용은 저장되지 않습니다. 닫으시겠습니까?', closeWin); break;
        case 'nr': notReady(); break;
        case 'line': alertBox('결재경로는 [결재정보] 탭 아래의 결재경로 표에서 검토자·결재자를 선택합니다.'); break;
        case 'attInfo': alertBox('첨부할 파일은 [파일추가]로 선택합니다. (연수용 가상 화면에서는 파일 이름만 등록됩니다.)'); break;
        case 'attAdd': $('fileIn').click(); break;
        case 'attAll': Array.prototype.forEach.call(document.querySelectorAll('.attChk'), function (c) { c.checked = a.checked; }); break;
        case 'attDel': var del = Array.prototype.map.call(document.querySelectorAll('.attChk:checked'), function (c) { return +c.getAttribute('data-i'); }); if (!del.length) { alertBox('삭제할 파일을 선택하세요.'); break; } att = att.filter(function (_, i) { return del.indexOf(i) < 0; }); redrawAtt(); break;
        case 'attFile': alertBox('[' + att[+a.getAttribute('data-i')][0] + ']\n\n연수용 가상 화면에서는 첨부파일 내용을 열 수 없습니다.'); break;
        case 'temp':
          if (!$('Sj').value.trim()) { alertBox('제목을 입력하세요.'); break; }
          var td = collect(true); old = td; store(td); alertBox('임시저장 되었습니다.\n[기안 > 임시저장]에서 다시 열 수 있습니다.'); break;
        case 'submit':
          if (!$('Sj').value.trim()) { alertBox('제목을 입력하세요.', function () { $('Sj').focus(); }); break; }
          if (!$('task').value) { alertBox('과제카드를 선택하세요.'); break; }
          if (bodyLines().join('').replace(/[\d.\s관련:]/g, '').length < 2) { alertBox('본문 내용을 입력하세요.\n[본문] 탭에서 내용을 작성합니다.'); break; }
          confirmBox('결재를 올리시겠습니까?', function () { store(collect(false)); alertBox('결재 올림 되었습니다.\n[결재 > 문서진행]에서 확인할 수 있습니다.', closeWin); return true; });
          break;
      }
    };
  }

  if (qs.mode === 'draft') draftDoc(qs.id ? VE.doc(qs.id) : null);
  else {
    var d = VE.doc(qs.id);
    if (d) viewDoc(d); else $('popup').innerHTML = '<div style="padding:60px;text-align:center">문서를 찾을 수 없습니다.</div>';
  }
})();
