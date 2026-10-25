/* 접속자: 접속할 때마다 아래 연예인 이름 중 한 명이(학생 이름과 겹치지 않게) 미동초등학교 교사로 로그인된다 (연수용, 이름만 빌린 가상 인물).
 * 새로고침은 같은 사람으로 유지되고, 새 탭으로 열거나 로그아웃·초기화 뒤 다시 접속하면 바뀐다. */
(function () {
  var POOL = ['송중기', '이병헌', '정우성', '조인성', '이민호', '현빈', '송혜교', '전지현', '손예진', '한지민', '박신혜', '김혜수', '이효리', '유재석', '김연아', '박은빈'];
  var KEY = 'neis-me';
  var name = null;
  // 발표 화면 '의견 나누기'에서 정한 이름(미동초 ○○○)이 있으면 그 이름으로 접속한다
  try { var me = JSON.parse(localStorage.getItem('midong.me')); if (me && me.name) { name = me.name; POOL.push(name); sessionStorage.setItem(KEY, name); } } catch (e) { /* 없음 */ }
  if (!name) { try { name = sessionStorage.getItem(KEY); } catch (e) { /* 저장 불가 환경 */ } }
  if (POOL.indexOf(name) < 0) {
    name = POOL[Math.floor(Math.random() * POOL.length)];
    try { sessionStorage.setItem(KEY, name); } catch (e) { /* noop */ }
  }
  window.NEIS_ME = name;
  window.NEIS_NEW_ME = function () { try { sessionStorage.removeItem(KEY); } catch (e) { /* noop */ } };
  // 예시 자료 속 담임 이름(채성아)을 접속자 이름으로 바꾼다
  window.NEIS_SEED = JSON.parse(JSON.stringify(window.NEIS_SEED).split('채성아').join(name));
})();
