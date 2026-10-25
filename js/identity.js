/* 수강자 이름(연수용 가상 이름) — 의견 나누기에서 성별을 고르면 정해지고,
 * 같은 브라우저의 가상 나이스·가상 에듀파인 접속자 이름으로도 그대로 쓰인다(같은 사이트 주소라 localStorage 공유).
 * 가상 나이스 학생 이름, 가상 에듀파인 교직원 이름과 겹치지 않게 골랐다. */
window.MIDONG_ID = (function () {
  var KEY = 'midong.me';
  var POOL = {
    f: ['송혜교', '김태리', '김고은', '김유정', '박신혜', '이효리', '김연아', '한효주', '신세경', '문채원', '정소민', '고윤정', '이성경', '박민영', '서현진', '전도연'],
    m: ['정우성', '조인성', '이민호', '이병헌', '강동원', '소지섭', '지창욱', '이종석', '김우빈', '류준열', '안보현', '이제훈', '서강준', '박해진', '이상윤', '황정민']
  };
  function get() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.name ? v : null; } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } return v; }
  // 성별로 이름 정하기 (이미 쓰인 이름은 피한다)
  function pick(g, taken) {
    var list = POOL[g] || POOL.f, free = list.filter(function (n) { return (taken || []).indexOf(n) < 0; });
    var name = (free.length ? free : list)[Math.floor(Math.random() * (free.length || list.length))];
    return set({ name: name, g: g === 'm' ? 'm' : 'f', at: Date.now() });
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } }
  return { get: get, pick: pick, clear: clear, POOL: POOL, all: POOL.f.concat(POOL.m) };
})();
