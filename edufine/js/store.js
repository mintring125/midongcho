// 접속자, 저장 상태(localStorage), 문서 값 계산. 본 화면(index.html)과 문서창(card.html)이 함께 쓴다.
(function () {
  var VE = window.VE, C = VE.CONFIG, KEY = 've_state_v1', UKEY = 've_user_v1';

  function get(st, k) { try { return st.getItem(k); } catch (e) { return null; } }
  function set(st, k, v) { try { st.setItem(k, v); } catch (e) { } }

  // 접속자: 새로 접속(새 탭·로그아웃 후 재접속)할 때마다 ME_POOL 에서 무작위로 고른다. 새로고침·문서창에서는 유지.
  VE.login = function (fresh) {
    var name = !fresh && (get(sessionStorage, UKEY) || (window.opener ? get(localStorage, UKEY) : null));
    // 발표 화면 '의견 나누기'에서 정한 이름(미동초 ○○○)이 있으면 그 이름으로 접속한다
    try { var me = JSON.parse(get(localStorage, 'midong.me')); if (me && me.name) { name = me.name; if (VE.ME_POOL.indexOf(name) < 0) VE.ME_POOL.push(name); } } catch (e) { }
    if (!name || VE.ME_POOL.indexOf(name) < 0) name = VE.ME_POOL[Math.floor(Math.random() * VE.ME_POOL.length)];
    set(sessionStorage, UKEY, name); set(localStorage, UKEY, name);
    C.user = { name: name, pos: '교사', id: 'mido' + ('0' + (VE.ME_POOL.indexOf(name) + 1)).slice(-2) + '**' };
    return C.user;
  };
  VE.logout = function () { try { sessionStorage.removeItem(UKEY); } catch (e) { } };

  // 저장 상태
  var S = VE.S = {
    data: null,
    load: function () {
      var d = null; try { d = JSON.parse(get(localStorage, KEY) || 'null'); } catch (e) { }
      S.data = d || { cnrs: {}, mine: [], fav: [], seq: 0 };
      return S.data;
    },
    save: function () { set(localStorage, KEY, JSON.stringify(S.data)); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) { } S.load(); }
  };
  S.load();

  function me(v) { return v === '@ME' ? C.user.name : v; }
  VE.me = me;
  VE.staff = function (name) {
    name = me(name);
    if (name === C.user.name) return C.user;
    for (var i = 0; i < VE.STAFF.length; i++) if (VE.STAFF[i].name === name) return VE.STAFF[i];
    return { name: name, pos: '', id: '' };
  };
  VE.allStaff = function () { var a = VE.STAFF.slice(0, 3); a.push(C.user); return a.concat(VE.STAFF.slice(3)); };

  // 전체 문서 = 기본 문서 + 연수 중 직접 만든 기안문
  VE.docs = function () { return S.data.mine.concat(VE.DOCS); };
  VE.doc = function (id) { var a = VE.docs(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; };
  VE.cnrsState = function (d) { var s = S.data.cnrs[d.id]; return s ? s.st : (d.cn || ''); };
  VE.isMine = function (d) { return d.k === 'd' && me(d.by) === C.user.name; };

  VE.SOURCES = {
    none: function () { return []; },
    regist: function () { return VE.docs().filter(function (d) { return d.no; }); },
    cnrsWait: function () { return VE.docs().filter(function (d) { return VE.cnrsState(d) === 'w'; }); },
    cnrsDone: function () {
      return VE.docs().filter(function (d) { return VE.cnrsState(d) === 'c'; }).sort(function (a, b) { return VE.val(b, 'cnrsDT') < VE.val(a, 'cnrsDT') ? -1 : 1; });
    },
    progress: function () { return VE.docs().filter(function (d) { return VE.isMine(d) && d.st === '진행' && !d.temp; }); },
    myDraft: function () { return VE.docs().filter(function (d) { return VE.isMine(d) && d.no && d.st !== '진행'; }); },
    myRecv: function () { return []; },
    temp: function () { return VE.docs().filter(function (d) { return d.temp; }); }
  };

  var PUB = { o: '공개', p: '부분공개', n: '비공개' };
  VE.val = function (d, key) {
    switch (key) {
      case 'no': return d.no ? String(d.no) : '';
      case 'noFull': return d.no ? C.school + '-' + d.no : '';
      case 'title': return d.t;
      case 'kind': return d.k === 'r' ? '수신' : '기안';
      case 'sender': return d.k === 'r' ? (d.from[0] + (d.from[1] ? ' ' + d.from[1] : '')) : C.school;
      case 'recvSend': return d.k === 'r' ? (d.from[0] + (d.from[1] ? ' ' + d.from[1] : '')) : (d.recv || '내부결재');
      case 'cnrsBy': return d.k === 'r' ? me(d.h) : me(d.by);
      case 'school': case 'dept': return C.school;
      case 'drafter': return d.k === 'r' ? '박보영' : me(d.by);
      case 'approver': return d.k === 'r' ? me(d.h) : me(d.ap[d.ap.length - 1]);
      case 'regDate': return d.d;
      case 'regDT': return d.d + ' ' + d.tm;
      case 'draftDT': return d.k === 'r' ? VE.addDays(d.d, -1) + ' ' + (d.dtm || '17:10') : d.d + ' ' + d.tm;
      case 'cnrsDT': var s = S.data.cnrs[d.id]; return s && s.at ? s.at : VE.addDays(d.d, 1) + ' 08:5' + (d.no % 10);
      case 'procType': return '공람';
      case 'status': return d.st || '종료';
      case 'progSt': return '진행';
      case 'link': return d.link || '일반';
      case 'enf': return '내부결재';
      case 'pubNm': return PUB[d.pub];
      case 'orgNo': return d.k === 'r' ? (d.from[1] || d.from[0]) + '-' + d.on : '';
      case 'attSize': return d.att && d.att.length ? d.att[0][1] : '0 KB';
    }
    return '';
  };

  // 날짜 도우미 (YYYY-MM-DD)
  VE.addDays = function (s, n) { var p = s.split('-'); var dt = new Date(+p[0], +p[1] - 1, +p[2] + n); return VE.fmt(dt); };
  VE.addMonths = function (s, n) { var p = s.split('-'); var dt = new Date(+p[0], +p[1] - 1 + n, +p[2]); return VE.fmt(dt); };
  VE.fmt = function (dt) { function z(v) { return ('0' + v).slice(-2); } return dt.getFullYear() + '-' + z(dt.getMonth() + 1) + '-' + z(dt.getDate()); };
  VE.nowHM = function () { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); };
  VE.dots = function (s) { var p = s.split('-'); return p[0] + '. ' + (+p[1]) + '. ' + (+p[2]) + '.'; };

  // 결재경로
  VE.lines = function (d) {
    var out = [];
    if (d.k === 'r') {
      var h = VE.staff(d.h);
      out.push({ how: '접수', pos: '교무행정사', who: '박보영', id: 'seoy****', st: '완료', at: d.d + ' ' + d.tm });
      out.push({ how: '업무담당자', pos: h.pos, who: h.name, id: h.id, st: d.st === '진행' ? '대기' : '완료', at: d.st === '진행' ? '' : d.d + ' ' + VE.plusMin(d.tm, 12) });
    } else {
      var roles = ['기안', '검토', '결재'];
      d.ap.forEach(function (n, i) {
        var p = VE.staff(n), last = i === d.ap.length - 1, done = d.st !== '진행' || i === 0;
        out.push({ how: last ? '결재' : roles[Math.min(i, 1)], pos: p.pos, who: p.name, id: p.id, st: done ? '완료' : (i === 1 ? '대기' : ''), at: done ? d.d + ' ' + VE.plusMin(d.tm, i === 0 ? -95 : (last ? 0 : -40)) : '' });
      });
    }
    return out;
  };
  VE.plusMin = function (hm, n) { var p = hm.split(':'); var t = +p[0] * 60 + +p[1] + n; if (t < 0) t = 0; return ('0' + Math.floor(t / 60) % 24).slice(-2) + ':' + ('0' + t % 60).slice(-2); };

  // 공람 확인 처리
  VE.confirmCnrs = function (ids) {
    var at = C.today + ' ' + VE.nowHM(), n = 0;
    ids.forEach(function (id) { var d = VE.doc(id); if (d && VE.cnrsState(d) === 'w') { S.data.cnrs[id] = { st: 'c', at: at }; n++; } });
    S.save(); return n;
  };

  VE.counts = function () {
    return { cnrs: VE.SOURCES.cnrsWait().length, prog: VE.SOURCES.progress().length };
  };

  VE.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
})();
