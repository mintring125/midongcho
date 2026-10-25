// 바깥 틀 동작: 상단, 메뉴, 탭(MDI), 처음 화면, 알림창
(function () {
  var VE = window.VE, C = VE.CONFIG, I = VE.I, esc = VE.esc;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; };
  var Shell = VE.Shell = { tabs: [], cur: null, top: 'A00AAB01', open: {} };
  var remain = 3600, timer = null;

  // ── 알림창 ──
  VE.alert = function (msg, cb) { dlg(msg, [['확인', cb]]); };
  VE.confirm = function (msg, ok, no) { dlg(msg, [['확인', ok], ['취소', no, 'c']]); };
  function dlg(msg, btns) {
    var d = el('<div class="veDlg"><div class="hd">알림<a>' + I.closeW + '</a></div><div class="bd"></div><div class="ft"></div></div>');
    d.querySelector('.bd').textContent = msg;
    function close(cb) { d.remove(); $('veMask').style.display = 'none'; if (cb) cb(); }
    btns.forEach(function (b) { var a = el('<a class="' + (b[2] || '') + '">' + b[0] + '</a>'); a.onclick = function () { close(b[1]); }; d.querySelector('.ft').appendChild(a); });
    d.querySelector('.hd a').onclick = function () { close(btns.length > 1 ? btns[1][1] : btns[0][1]); };
    $('veMask').style.display = 'block'; document.body.appendChild(d);
  }
  VE.notReady = function (name) { VE.alert((name ? '[' + name + '] ' : '') + '연수용 가상 화면에서는 제공하지 않는 기능입니다.'); };

  // ── 상단 ──
  function buildTop() {
    var u = C.user, org = C.school + '[원소속]';
    var gnb = VE.MENU.map(function (m) { return '<a data-id="' + m[0] + '"' + (m[1].length > 4 ? ' class="w6"' : '') + '>' + m[1] + '</a>'; }).join('');
    $('top').innerHTML =
      '<div id="veNote">⚠ 연수용 가상 화면입니다 · 실제 K-에듀파인 사이트가 아닙니다<a id="veReset">처음 상태로 되돌리기</a></div>' +
      '<div id="logo" title="처음 화면">' + I.logo + '</div>' +
      '<div id="useTime">60:00</div><div id="btnExt">연장</div>' +
      '<div id="cboOrg" class="combo">' + org + '<span class="dd">' + I.dropDark + '</span></div>' +
      '<div id="btnRefresh" title="새로고침">' + I.refresh + '</div>' +
      '<div id="ntzn"></div>' +
      '<div id="totSearch"><input type="text" value="통합검색"></div><div id="btnTotSearch">' + I.search + '</div>' +
      '<div class="topIc" style="right:126px" title="사용자검색" data-nr="사용자검색">' + I.tUser + '</div><i class="topSep" style="right:122px"></i>' +
      '<div class="topIc" style="right:84px" title="개인설정" data-nr="개인설정">' + I.tSetting + '</div><i class="topSep" style="right:81px"></i>' +
      '<div class="topIc" style="right:43px" title="원격지원" data-nr="원격지원">' + I.tAccess + '</div><i class="topSep" style="right:40px"></i>' +
      '<div class="topIc" id="btnLogout" style="right:6px" title="로그아웃">' + I.tLogout + '</div>' +
      '<div id="cboAuthor" class="combo">' + org + '<span class="dd">' + I.dropBlue + '</span></div>' +
      '<div id="userNm"><b>' + esc(u.name) + '</b>님</div>' +
      '<div id="gnb"><div id="cboJob">업무관리<span class="dd">' + I.plus + '</span></div><div id="gnbMenu">' + gnb + '</div></div>';
    $('jobList').innerHTML = '<a>업무관리</a><a>지식관리</a><a>학교회계</a>';
    $('logo').onclick = function () { Shell.showHome(); };
    $('btnExt').onclick = function () { remain = 3600; tick(); };
    $('btnRefresh').onclick = function () { Shell.refreshCounts(); };
    $('veReset').onclick = function () { VE.confirm('연수 중에 처리한 내용(공람 확인, 기안 등)을 모두 지우고 처음 상태로 되돌립니다.\n접속자도 새로 정해집니다. 계속할까요?', function () { VE.S.reset(); VE.logout(); location.reload(); }); };
    $('btnLogout').onclick = function () { VE.confirm('로그아웃 하시겠습니까?', logout); };
    $('cboJob').onclick = function (e) { e.stopPropagation(); var j = $('jobList'); j.style.display = j.style.display === 'block' ? 'none' : 'block'; };
    $('jobList').onclick = function (e) { if (e.target.tagName === 'A' && e.target.textContent !== '업무관리') VE.notReady(e.target.textContent); $('jobList').style.display = 'none'; };
    document.addEventListener('click', function () { $('jobList').style.display = 'none'; });
    var ts = $('totSearch').firstChild;
    ts.onfocus = function () { if (ts.value === '통합검색') ts.value = ''; };
    ts.onblur = function () { if (!ts.value) ts.value = '통합검색'; };
    function totSearch() { var q = ts.value === '통합검색' ? '' : ts.value.trim(); if (!q) { VE.alert('검색어를 입력하세요.'); return; } Shell.openMenu('A00AAB0107001', { title: q }); }
    ts.onkeydown = function (e) { if (e.key === 'Enter') totSearch(); };
    $('btnTotSearch').onclick = totSearch;
    $('gnbMenu').onclick = function (e) { var id = e.target.getAttribute('data-id'); if (id) Shell.setTop(id); };
    Array.prototype.forEach.call(document.querySelectorAll('#top [data-nr]'), function (n) { n.onclick = function () { VE.notReady(n.getAttribute('data-nr')); }; });
    Shell.refreshCounts();
    if (timer) clearInterval(timer);
    timer = setInterval(function () { remain--; if (remain <= 0) { remain = 0; clearInterval(timer); VE.alert('사용 시간이 만료되어 로그아웃됩니다.', logout); } tick(); }, 1000);
  }
  function tick() { $('useTime').textContent = ('0' + Math.floor(remain / 60)).slice(-2) + ':' + ('0' + remain % 60).slice(-2); }
  function logout() {
    VE.logout();
    $('loggedOut').innerHTML = '<div class="box">' + I.logo + '<p><b>로그아웃되었습니다.</b><br><span style="color:#e60012;font-weight:700">⚠ 연수용 가상 화면입니다. 실제 K-에듀파인 사이트가 아닙니다.</span><br>다시 접속하면 다른 선생님으로 접속됩니다.</p><a id="reLogin">다시 접속</a></div>';
    $('loggedOut').style.display = 'block';
    $('reLogin').onclick = function () { location.reload(); };
  }
  Shell.refreshCounts = function () {
    var c = VE.counts();
    var items = [['결재', '(긴급)', 0, '(0)', 'A00AAB0102001'], ['공람', '', c.cnrs, '', 'A00AAB0103001'], ['문서진행', '', c.prog, '', 'A00AAB0102002'], ['발송대기', '', 0, '', 'A00AAB0104001'], ['메모', '(긴급)', 0, '(0)', ''], ['메일', '', 0, '', '']];
    $('ntzn').innerHTML = items.map(function (t) { return '<a data-id="' + t[4] + '" data-nm="' + t[0] + '">' + t[0] + (t[1] ? '<i>' + t[1] + '</i>' : '') + '<b>' + t[2] + '</b>' + (t[3] ? '<i>' + t[3] + '</i>' : '') + '<u>|</u></a>'; }).join('');
    Array.prototype.forEach.call($('ntzn').children, function (a) { a.onclick = function () { var id = a.getAttribute('data-id'); if (id) Shell.openMenu(id); else VE.notReady(a.getAttribute('data-nm')); }; });
  };

  // ── 왼쪽 메뉴 ──
  function topNode(id) { for (var i = 0; i < VE.MENU.length; i++) if (VE.MENU[i][0] === id) return VE.MENU[i]; return VE.MENU[0]; }
  function buildLeft() {
    $('left').innerHTML = '<div id="lnbTab1" class="lnbOn">업무메뉴</div><div id="lnbTab2" class="lnbOff">즐겨찾기</div><div id="lnbTitle"></div><div id="lnbGrid"></div>' +
      '<div id="btnLnb">' + I.arrL + '</div>' +
      '<div id="lnbQuick">' +
      '<div class="ql" style="top:-1px" data-nr="K-에듀파인 뉴스레터"><span class="ic">' + I.qDocD + '</span><b style="letter-spacing:1px">K-에듀파인 뉴스레터</b></div>' +
      '<div class="ql" style="top:35px" data-nr="사용자지원서비스"><span class="ic">' + I.qMemoD + '</span><b style="letter-spacing:1px">사용자지원서비스(Q&amp;A, FAQ등)</b></div>' +
      '<div class="ql" style="top:69px" data-nr="원격지원서비스"><span class="ic">' + I.qSurveyD + '</span><b style="letter-spacing:3px">원격지원서비스</b></div>' +
      '<div class="call" style="top:103px;font-size:13px;letter-spacing:6px">중앙상담센터</div><div class="call" style="top:117px;font-size:20px;letter-spacing:-1px">' + I.phone + ' 1566-0066</div></div>';
    $('lnbTab1').onclick = function () { Shell.fav = false; lnbTabs(); renderTree(); };
    $('lnbTab2').onclick = function () { Shell.fav = true; lnbTabs(); renderTree(); };
    $('btnLnb').onclick = function () { var h = document.body.classList.toggle('lnbHide'); $('btnLnb').innerHTML = h ? I.arrR : I.arrL; };
    Array.prototype.forEach.call(document.querySelectorAll('#lnbQuick [data-nr]'), function (n) { n.onclick = function () { VE.notReady(n.getAttribute('data-nr')); }; });
    renderTree();
  }
  function lnbTabs() { $('lnbTab1').className = Shell.fav ? 'lnbOff' : 'lnbOn'; $('lnbTab2').className = Shell.fav ? 'lnbOn' : 'lnbOff'; }
  function renderTree() {
    var g = $('lnbGrid'), h = '';
    if (Shell.fav) {
      $('lnbTitle').textContent = '즐겨찾기';
      var fav = VE.S.data.fav || [];
      h = fav.length ? fav.map(function (id) { var m = VE.findMenu(id); return m ? '<div class="mRow mLeaf' + (Shell.cur === id ? ' on' : '') + '" data-leaf="' + id + '">' + m.name + '</div>' : ''; }).join('') : '<div id="lnbEmpty">등록된 즐겨찾기가 없습니다.</div>';
    } else {
      var t = topNode(Shell.top);
      $('lnbTitle').textContent = t[1];
      (t[2] || []).forEach(function (m) {
        if (m[2]) {
          h += '<div class="mRow mGrp" data-grp="' + m[0] + '">' + m[1] + '<span class="chev">' + I.chev + '</span></div>';
          if (Shell.open[m[0]]) m[2].forEach(function (c) { h += '<div class="mRow mLeaf' + (Shell.cur === c[0] ? ' on' : '') + '" data-leaf="' + c[0] + '">' + c[1] + '</div>'; });
        } else h += '<div class="mRow mGrp" data-leaf="' + m[0] + '">' + m[1] + '</div>';
      });
    }
    g.innerHTML = h;
  }
  Shell.renderTree = renderTree;
  Shell.setTop = function (id) {
    Shell.top = id; Shell.fav = false; lnbTabs();
    Array.prototype.forEach.call($('gnbMenu').children, function (a) { a.classList.toggle('on', a.getAttribute('data-id') === id); });
    renderTree();
  };
  document.addEventListener('click', function (e) {
    var r = e.target.closest ? e.target.closest('#lnbGrid .mRow') : null; if (!r) return;
    var g = r.getAttribute('data-grp'), l = r.getAttribute('data-leaf');
    if (g) { Shell.open[g] = !Shell.open[g]; renderTree(); }
    else if (l) Shell.openMenu(l);
  });

  // ── Quick Link ──
  function buildQuick() {
    var h = '<div id="btnRnb">' + I.arrR + '</div><div id="qPanel"><div id="qHead">Quick Link</div>';
    [['문서', I.qDoc, 59, 'A00AAB0101001'], ['메모', I.qMemo, 89, ''], ['메일', I.qMail, 119, ''], ['설문', I.qSurvey, 149, '']].forEach(function (q) { h += '<a class="q1" style="top:' + q[2] + 'px" data-id="' + q[3] + '" data-nm="' + q[0] + '"><span>' + q[1] + '</span>' + q[0] + '</a>'; });
    h += '<div class="qSep" style="top:182px"></div><div class="qH" style="top:196px">설치가이드</div>';
    [['프로그램<br>설치확인', 227], ['리포트뷰어설치', 262], ['ODT설치파일', 297], ['고해상도<br>모니터 지원', 332], ['DRM설치파일', 367]].forEach(function (q) { h += '<a class="q2" style="top:' + q[1] + 'px" data-nm="' + q[0].replace('<br>', '') + '">' + q[0] + '</a>'; });
    h += '<div class="qSep" style="top:409px"></div><div class="qH" style="top:423px">바로가기</div>';
    [['사용자지원서비스', 446], ['원격지원서비스', 481], ['교육조달 S2B', 516], ['담당자연락처', 551]].forEach(function (q) { h += '<a class="q2" style="top:' + q[1] + 'px" data-nm="' + q[0] + '">' + q[0] + '</a>'; });
    $('quick').innerHTML = h + '</div>';
    $('btnRnb').onclick = function () { var x = document.body.classList.toggle('rnbHide'); $('btnRnb').innerHTML = x ? I.arrL : I.arrR; };
    Array.prototype.forEach.call(document.querySelectorAll('#qPanel a'), function (a) { a.onclick = function () { var id = a.getAttribute('data-id'); if (id) Shell.openMenu(id); else VE.notReady(a.getAttribute('data-nm')); }; });
  }

  // ── 탭(MDI) ──
  function buildMdi() {
    var b = [['mMax', 185, '최대화'], ['mCas', 159, '바둑판'], ['mHor', 133, '가로'], ['mVer', 107, '세로'], ['mPrev', 79, '이전'], ['mNext', 53, '다음'], ['mClose', 25, '전체닫기']];
    $('mdiBtns').innerHTML = b.map(function (x) { return '<a style="right:' + (x[1] - 25) + 'px" title="' + x[2] + '" data-k="' + x[0] + '">' + I[x[0]] + '</a>'; }).join('') + '<i style="right:82px"></i><i style="right:28px"></i>';
    $('mdiBtns').onclick = function (e) {
      var a = e.target.closest('a'); if (!a) return; var k = a.getAttribute('data-k'), i = Shell.tabs.indexOf(Shell.cur);
      if (k === 'mClose') { Shell.tabs.slice().forEach(function (id) { Shell.closeTab(id, true); }); Shell.showHome(); }
      else if (k === 'mPrev' && i > 0) Shell.activate(Shell.tabs[i - 1]);
      else if (k === 'mNext' && i >= 0 && i < Shell.tabs.length - 1) Shell.activate(Shell.tabs[i + 1]);
    };
    $('mdiTabs').onclick = function (e) {
      var t = e.target.closest('.mTab'); if (!t) return; var id = t.getAttribute('data-id');
      if (e.target.closest('i')) Shell.closeTab(id); else Shell.activate(id);
    };
  }
  function renderTabs() {
    $('mdiTabs').innerHTML = Shell.tabs.map(function (id) { var m = VE.findMenu(id); return '<span class="mTab' + (Shell.cur === id ? ' on' : '') + '" data-id="' + id + '">' + m.name + '<i>' + I.tabX + '</i></span>'; }).join('');
  }
  Shell.openMenu = function (id, preset) {
    var m = VE.findMenu(id); if (!m) return;
    // 왼쪽 메뉴를 그 화면 위치로 맞춘다
    var topId = null, grpId = null;
    VE.MENU.forEach(function (t) { (t[2] || []).forEach(function (g) { if (g[0] === id) topId = t[0]; (g[2] || []).forEach(function (c) { if (c[0] === id) { topId = t[0]; grpId = g[0]; } }); }); });
    if (topId) { Shell.top = topId; if (grpId) Shell.open[grpId] = true; Array.prototype.forEach.call($('gnbMenu').children, function (a) { a.classList.toggle('on', a.getAttribute('data-id') === topId); }); }
    if (Shell.tabs.indexOf(id) < 0) {
      Shell.tabs.push(id);
      var w = el('<div class="win" data-id="' + id + '"><div class="wTitle"><div class="tt"><b>' + m.name + '</b><span class="par">(</span><span class="org">' + C.school + '</span><span class="sl">/</span><span class="mid">' + id + '</span><span class="par" style="margin:0 0 0 10px">)</span><span class="hm">' + I.home + '</span><span class="nav">&gt;' + m.path.join(' &gt; ') + '</span></div>' +
        '<div class="impr">현재 화면이 최근 3개월 내 <em>개선내역</em>이 있습니다.<br>우측 <em>도움말</em>을 클릭하여 개선내역을 확인해보세요.</div>' +
        '<div class="btnHelp"><span>' + I.help + '</span><b>도움말</b></div><div class="btnFav"><span>' + I.star + '</span><b>즐겨찾기</b></div></div>' +
        '<div class="wBox"></div><div class="wBody"></div></div>');
      $('wins').appendChild(w);
      w.querySelector('.btnHelp').onclick = function () { VE.alert('[' + m.name + '] 도움말\n\n연수용 가상 화면입니다. 목록의 제목을 누르면 문서를 볼 수 있습니다.'); };
      w.querySelector('.btnFav').onclick = function () { var f = VE.S.data.fav = VE.S.data.fav || []; var i = f.indexOf(id); if (i < 0) { f.push(id); VE.alert('즐겨찾기에 등록되었습니다.'); } else { f.splice(i, 1); VE.alert('즐겨찾기에서 해제되었습니다.'); } VE.S.save(); renderTree(); };
      w.querySelector('.hm').onclick = function () { Shell.showHome(); };
      VE.List.mount(w.querySelector('.wBody'), id, preset);
    } else if (preset) VE.List.mount(document.querySelector('.win[data-id="' + id + '"] .wBody'), id, preset);
    Shell.activate(id);
  };
  Shell.activate = function (id) {
    Shell.cur = id; $('home').className = 'hide';
    Array.prototype.forEach.call($('wins').children, function (w) { w.className = 'win' + (w.getAttribute('data-id') === id ? ' on' : ''); });
    renderTabs(); renderTree();
  };
  Shell.closeTab = function (id, quiet) {
    var i = Shell.tabs.indexOf(id); if (i < 0) return;
    Shell.tabs.splice(i, 1);
    var w = document.querySelector('.win[data-id="' + id + '"]'); if (w) w.remove();
    if (quiet) return;
    if (Shell.cur === id) { if (Shell.tabs.length) Shell.activate(Shell.tabs[Math.min(i, Shell.tabs.length - 1)]); else Shell.showHome(); }
    else renderTabs();
  };
  Shell.showHome = function () {
    Shell.cur = null; $('home').className = '';
    Array.prototype.forEach.call($('wins').children, function (w) { w.className = 'win'; });
    renderTabs(); renderTree();
  };
  // 열려 있는 목록 화면을 모두 다시 그린다 (공람 확인·기안 뒤)
  Shell.refreshAll = function () {
    Shell.refreshCounts();
    Array.prototype.forEach.call($('wins').children, function (w) { var b = w.querySelector('.wBody'); if (b && b._veList) b._veList.reload(); });
  };

  // ── 처음 화면 ──
  function buildHome() {
    var tabs = [['전체', 6, 60], ['공지사항', 66, 90], ['법령/지침', 156, 105], ['인사/포상', 261, 105], ['(교직원)공모/연수', 366, 180], ['(학생)공모/대회/체험', 546, 210]];
    var h = tabs.map(function (t, i) { return '<div class="hTab' + (i === 0 ? ' on' : '') + '" style="left:' + t[1] + 'px;width:' + t[2] + 'px">' + t[0] + '</div>'; }).join('');
    h += '<div class="hMore">더보기' + I.more + '</div><div id="hBoard"><table><colgroup><col style="width:47px"><col style="width:74px"><col><col style="width:133px"><col style="width:107px"><col style="width:95px"><col style="width:65px"><col style="width:48px"></colgroup>' +
      '<thead><tr><th>열람여부</th><th>게시일(발송일)</th><th>제목</th><th>발신기관</th><th>기관명</th><th>게시부서</th><th>게시자</th><th>조회수</th></tr></thead><tbody>' +
      VE.POSTS.map(function (p) { return '<tr><td></td><td>' + p.date + '</td><td class="tl">' + (p.isNew ? I.newTag : '') + esc(p.title) + '</td><td>' + esc(p.sender) + '</td><td>' + esc(p.org) + '</td><td>' + esc(p.dept) + '</td><td>' + esc(p.by) + '</td><td>' + p.hit + '</td></tr>'; }).join('') + '</tbody></table></div>';
    function port(x, title, items) { return '<div class="hPort" style="left:' + x + 'px"><h3>' + I.bullet + title + '</h3><span class="more">더보기' + I.more + '</span><ul>' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>'; }
    h += port(6, '공지사항', VE.NOTICES) + port(296, '자료실', VE.ARCHIVE);
    h += '<div class="hAdd" style="left:587px"><p>클릭 시 개인설정 &gt; 개인환경설정으로 이동</p><span>' + I.addBox + '</span></div><div class="hAdd" style="left:877px"><p>클릭 시 개인설정 &gt; 개인환경설정으로 이동</p><span>' + I.addBox + '</span></div>';
    h += '<div id="hFoot">권장 사용 환경 : [운영체제] 윈도우 10 이상 (맥OS, ARM CPU 미지원) / [브라우저] 엣지, 크롬 / [해상도] 1920 x 1080</div>';
    h += '<div class="hFBtn" style="right:176px;width:126px;background:#3f8606">업무순기별 시스템 안내 ›</div><div class="hFBtn" style="right:45px;width:126px;background:#2c85bf">사용자지원서비스 ›</div>';
    $('homeIn').innerHTML = h;
    $('homeIn').onclick = function (e) {
      var t = e.target;
      if (t.classList.contains('hTab')) { Array.prototype.forEach.call(document.querySelectorAll('.hTab'), function (x) { x.classList.toggle('on', x === t); }); return; }
      if (t.closest('.tl') || t.closest('.hPort li')) { VE.alert('게시물 보기는 연수용 가상 화면에서 제공하지 않습니다.\n\n' + (t.closest('.tl') || t.closest('li')).textContent); return; }
      if (t.closest('.hAdd') || t.closest('.hMore') || t.closest('.more') || t.closest('.hFBtn')) VE.notReady();
    };
  }

  // 문서창(card.html)에서 처리 결과가 오면 목록을 다시 그린다
  window.addEventListener('message', function (e) { if (e.data && e.data.ve === 'changed') { VE.S.load(); Shell.refreshAll(); } });
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('ve_state') === 0) { VE.S.load(); Shell.refreshAll(); } });
  window.addEventListener('focus', function () { VE.S.load(); Shell.refreshCounts(); });

  VE.login(false);
  document.title = '[연수용 가상 화면] K-에듀파인';
  buildTop(); buildLeft(); buildQuick(); buildMdi(); buildHome();
  Shell.setTop('A00AAB01');
  // 실제 화면처럼 문서함을 펼친 상태로 시작
  Shell.open.A00AAB0107 = true; renderTree();
  if (/[?&]open=([A-Z0-9,]+)/.test(location.search)) RegExp.$1.split(',').forEach(function (id) { Shell.openMenu(id); });
})();
