/* 업무 화면 — 성적 > 평가계획 > 평가계획(안)관리
 * 실제 4세대 나이스 화면(2026.10. 캡처)의 배치·크기·색을 그대로 옮겼다. 안에 든 자료는 모두 가상.
 *  1단계 성취기준관리 : 영역명·성취기준·평가요소·정렬순서를 행 단위로 입력 (+ 행추가, − 행삭제, 저장, 출력)
 *  2단계 성취기준(평가기준)관리 : 성취기준별 단계 평가기준 입력
 * 교과평가에 쓰인 성취기준(교과평가 ○)은 영역명·성취기준을 고칠 수 없고 삭제할 수 없다. */
(function () {
  'use strict';
  const A = () => window.App;
  const D = () => window.App.Store.data;
  const S = window.SCREENS;
  const H = window.SH;
  const esc = s => A().esc(s);

  const AREAS = {
    국어: ['듣기·말하기', '읽기', '쓰기', '문법', '문학', '매체'],
    사회: ['지리 인식', '자연환경과 인간 생활', '인문환경과 인간 생활', '지속가능한 세계', '정치', '법', '경제', '사회·문화', '역사 일반', '지역사', '한국사'],
    도덕: ['자신과의 관계', '타인과의 관계', '사회·공동체와의 관계', '자연과의 관계'],
    수학: ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성'],
    과학: ['운동과 에너지', '물질', '생명', '지구와 우주', '과학과 사회'],
    실과: ['인간 발달과 주도적 삶', '생활환경과 지속가능한 선택', '기술적 문제해결과 혁신', '지속가능한 기술과 융합'],
    체육: ['운동', '스포츠', '표현'],
    음악: ['연주', '감상', '창작'],
    미술: ['미적 체험', '표현', '감상'],
    영어: ['이해', '표현'],
    '바른 생활': ['우리는 누구로 살아갈까', '우리는 어디서 살아갈까', '우리는 지금 어떻게 살아갈까', '우리는 무엇을 하며 살아갈까'],
    '슬기로운 생활': ['우리는 누구로 살아갈까', '우리는 어디서 살아갈까', '우리는 지금 어떻게 살아갈까', '우리는 무엇을 하며 살아갈까'],
    '즐거운 생활': ['우리는 누구로 살아갈까', '우리는 어디서 살아갈까', '우리는 지금 어떻게 살아갈까', '우리는 무엇을 하며 살아갈까']
  };
  const SUBJ = Object.keys(AREAS);
  const SEED = window.NEIS_PLAN_SEED || { subjects: {}, bands: {}, fixed: {}, teachers: {} };
  // 학년별 교과(목) + 학교자율시간관리에서 개설한(담당교사를 지정한) 학교자율 과목
  const autoSubj = g => ((D().autonomy) || []).filter(a => a.grade === +g && a.type === '과목' && Object.keys(a.teachers || {}).length).map(a => a.name);
  const subjectsOf = g => (SEED.subjects[g] || SUBJ.filter(s => !/생활$/.test(s))).concat(autoSubj(g));
  const areasOf = s => AREAS[s] || [s];   // 학교자율 과목은 과목명을 영역명으로
  const LEVELS = { 2: ['도달', '미도달'], 3: ['잘함', '보통', '노력요함'], 4: ['매우잘함', '잘함', '보통', '노력요함'], 5: ['매우잘함', '잘함', '보통', '노력요함', '매우노력요함'] };
  const ELEM = { '[6국01-02]': '의견을 조정하며 토의하기', '[6국03-03]': '목적에 맞는 내용과 매체를 선정하여 글쓰기', '[6수01-06]': '분수의 곱셈 계산하기' };

  const IC = {
    step1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18h18v1.5H3z"/><rect x="4.5" y="6" width="15" height="11" rx="1"/><path d="M14.5 4.2a3.4 3.4 0 1 1-2.2 6" stroke-linecap="round"/><path d="M14.6 2.6l.1 1.8-1.8.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    step2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 3.5h8.5l3 3V20H8z"/><path d="M5 6.5v15h11"/><path d="M10.5 9.5h6M10.5 12.5h6M10.5 15.5h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.2 2.4 1.2 2.4-2.3 1.6-.6 2.7-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6L6 12.8 4.8 10.4l2.3-1.6.6-2.7 2.7.6z" stroke-linejoin="round"/></svg>'
  };

  // ---------- 자료 ----------
  function plans() {
    const d = D();
    if (!d.evalPlans) {
      const user = d.user.name;
      d.evalPlans = (d.standards || []).map((x, i) => ({
        id: 'p' + (i + 1), year: String(d.year || 2026), sem: '2', grade: String(d.user.grade || 5), subj: x.subj,
        area: x.area, ord: 0, std: `${x.code} ${x.text}`, elem: ELEM[x.code] || '', evalUsed: true, obsUsed: false, sort: '1', user, steps: x.steps || {}
      }));
      renumber(d.evalPlans);
    }
    if (d.planSeedV !== 2) { fillAllGrades(d.evalPlans); d.planSeedV = 2; }
    return d.evalPlans;
  }
  // 1~6학년 · 1·2학기 · 학년별 교과마다 예시 성취기준을 채운다(이미 자료가 있는 조합은 그대로 둔다)
  function fillAllGrades(list) {
    const d = D(), year = String(d.year || 2026), me = d.user.name, myGrade = String(d.user.grade || 5);
    const has = new Set(list.map(p => [p.year, p.sem, p.grade, p.subj].join('|')));
    for (let g = 1; g <= 6; g++) {
      const band = g <= 2 ? 12 : g <= 4 ? 34 : 56, lower = g % 2 === 1;
      for (const subj of subjectsOf(g)) {
        const pool = (SEED.bands[band] || {})[subj] || [];
        const mine = lower ? pool.slice(0, pool.length / 2) : pool.slice(pool.length / 2);
        const per = mine.length / 2;
        ['1', '2'].forEach((sem, si) => {
          const key = [year, sem, String(g), subj].join('|');
          if (has.has(key)) return;
          const rows = SEED.fixed[`${g}|${sem}|${subj}`] || mine.slice(si * per, si * per + per).map((r, j) => r.concat([sem === '1' || j === 0]));
          rows.forEach((r, j) => list.push({ id: `s${g}${sem}-${subj}-${j}`, year, sem, grade: String(g), subj, area: r[0], ord: 0, std: r[1], elem: r[2], evalUsed: !!r[3], obsUsed: false, sort: '1', user: String(g) === myGrade ? me : (SEED.teachers[g] || me), steps: {} }));
          has.add(key);
        });
      }
    }
    renumber(list);
  }
  // 영역순번: 같은 학년도·학기·학년·교과 안에서 1부터
  function renumber(list) {
    const seen = {};
    list.forEach(p => { const k = [p.year, p.sem, p.grade, p.subj].join('|'); seen[k] = (seen[k] || 0) + 1; p.ord = seen[k]; });
  }
  const codeOf = std => (/^\s*(\[[^\]]+\])/.exec(std || '') || [])[1] || '';
  // 교과평가 등 다른 화면이 쓰는 성취기준 목록과 맞춘다
  function syncStandards() {
    const d = D(), old = {};
    (d.standards || []).forEach(x => { old[x.code] = x; });
    d.standards = plans().filter(p => p.std.trim() && p.grade === String(d.user.grade || 5) && p.year === String(d.year || 2026) && p.sem === '2').map(p => {
      const code = codeOf(p.std) || `[${p.subj}-${p.ord}]`;
      return { subj: p.subj, area: p.area, code, text: p.std.replace(/^\s*\[[^\]]+\]\s*/, ''), steps: Object.assign({}, (old[code] || {}).steps, p.steps) };
    });
  }

  // ---------- 화면 ----------
  function render(page, title, app) {
    const d = D();
    page.classList.add('ep-page');
    page.insertAdjacentHTML('beforeend', `
      <div class="ep-top">
        <div class="ep-steps">
          <button class="ep-step on" data-step="1">${IC.step1}<span>성취기준관리</span></button>
          <span class="ep-arrow"></span>
          <button class="ep-step" data-step="2">${IC.step2}<span>성취기준(평가기준)관리</span></button>
        </div>
        <div class="ep-search">
          <div class="ep-f" style="width:250px"><label class="req">*학년도</label><span class="ep-rq"><select class="sel s-year" aria-label="학년도">${app.opts(['2026', '2025', '2024'], String(d.year || 2026))}</select></span></div>
          <div class="ep-f"><label class="req">*학기</label><span class="ep-rq"><select class="sel s-sem" aria-label="학기">${app.opts(['1', '2'], '2')}</select></span></div>
          <div class="ep-f"><label class="req">*학년</label><span class="ep-rq"><select class="sel s-grade" aria-label="학년">${app.opts(['1', '2', '3', '4', '5', '6'], String(d.user.grade || 5))}</select></span></div>
          <div class="ep-f"><label class="req">*교과(목)</label><span class="ep-rq"><select class="sel s-subj" aria-label="교과(목)">${app.opts(subjectsOf(d.user.grade || 5), '국어')}</select></span></div>
          <div class="ep-f ep-area"><label>영역</label><select class="sel s-area" aria-label="영역"></select></div>
          <span class="sp"></span>
          <button class="ep-btn-search b-search">${IC.search}조회</button>
        </div>
      </div>
      <div class="ep-fold"><button class="ep-foldbtn" title="조회조건 접기"></button></div>
      <div class="ep-body"></div>`);

    const $ = s => H.$(s, page);
    const st = { step: 1, rows: [], sel: -1, sel2: -1, sortKey: null, sortDir: 1, loaded: false };

    headerExtras(page);
    const fillArea = () => { $('.s-area').innerHTML = `<option value="">-전체-</option>` + areasOf($('.s-subj').value).map(a => `<option>${esc(a)}</option>`).join(''); };
    fillArea();
    $('.s-subj').onchange = fillArea;
    $('.s-grade').onchange = () => { const cur = $('.s-subj').value, list = subjectsOf(+$('.s-grade').value); $('.s-subj').innerHTML = app.opts(list, list.includes(cur) ? cur : list[0]); fillArea(); };

    const key = () => ({ year: $('.s-year').value, sem: $('.s-sem').value, grade: $('.s-grade').value, subj: $('.s-subj').value, area: $('.s-area').value });
    const load = () => {
      const k = key();
      st.k = k;
      st.rows = plans().filter(p => p.year === k.year && p.sem === k.sem && p.grade === k.grade && p.subj === k.subj && (!k.area || p.area === k.area)).map(p => JSON.parse(JSON.stringify(p)));
      st.sel = st.rows.length ? 0 : -1; st.sel2 = -1; st.loaded = true; st.dirty = false;
      draw();
    };
    $('.b-search').onclick = load;
    H.$$('.ep-step', page).forEach(b => { b.onclick = () => { st.step = +b.dataset.step; st.sel2 = -1; page.classList.toggle('ep-s2', st.step === 2); H.$$('.ep-step', page).forEach(x => x.classList.toggle('on', x === b)); draw(); }; });
    $('.ep-foldbtn').onclick = () => { page.classList.toggle('ep-folded'); };

    function draw() { if (st.step === 1) drawStd(); else drawCrit(); }

    // ----- 1단계: 성취기준관리 -----
    function drawStd() {
      const body = $('.ep-body');
      const areas = areasOf((st.k || key()).subj);
      const cols = [['', 49], ['영역순번', 80, 'ord'], ['영역명', 155, 'area'], ['성취기준', null, 'std'], ['평가요소', '24%', 'elem'], ['교과평가', 78, 'evalUsed'], ['관찰내용', 77, 'obsUsed'], ['*정렬순서', 69, 'sort', 'req'], ['등록사용자', 102, 'user']];
      body.innerHTML = `
        <div class="ep-bar">
          <div class="ep-note">※ 결재상태 : ${esc(approvalState())}</div>
          <div class="ep-total">Total ${st.rows.length}<button class="ep-gear" title="열 설정">${IC.gear}</button></div>
          <span class="sp"></span>
          <button class="ep-ib b-add" title="행추가" aria-label="행추가">+</button><button class="ep-ib b-del" title="행삭제" aria-label="행삭제">−</button>
          <button class="ep-pb b-save">저장</button><button class="ep-pb b-print">출력</button>
        </div>
        <div class="ep-grid"><table>
          <colgroup>${cols.map(c => `<col${c[1] ? ` style="width:${typeof c[1] === 'number' ? c[1] + 'px' : c[1]}"` : ''}>`).join('')}</colgroup>
          <thead><tr>${cols.map((c, i) => i === 0 ? '<th><input type="checkbox" class="ep-ck ck-all"></th>' : `<th class="${c[3] || ''}" data-k="${c[2]}">${c[0]}<span class="ep-sort">△</span></th>`).join('')}</tr></thead>
          <tbody>${st.rows.length ? st.rows.map((r, i) => {
            const lock = r.evalUsed;
            return `<tr data-i="${i}" class="${i === st.sel ? 'cur' : ''}">
              <td><input type="checkbox" class="ep-ck ck" aria-label="${i + 1}행 선택" ${lock ? 'disabled' : ''}></td>
              <td>${r.ord}</td>
              <td><select class="ep-sel f" data-f="area" aria-label="${i + 1}행 영역명" ${lock ? 'disabled' : ''}><option value="">-선택-</option>${areas.map(a => `<option ${a === r.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}${r.area && !areas.includes(r.area) ? `<option selected>${esc(r.area)}</option>` : ''}</select></td>
              <td><textarea class="ep-ta f" data-f="std" rows="1" ${lock ? 'readonly' : ''} title="성취기준" aria-label="${i + 1}행 성취기준">${esc(r.std)}</textarea></td>
              <td><textarea class="ep-ta f" data-f="elem" rows="1" title="평가요소" aria-label="${i + 1}행 평가요소">${esc(r.elem)}</textarea></td>
              <td class="ep-ox">${r.evalUsed ? '○' : '×'}</td>
              <td class="ep-ox">${r.obsUsed ? '○' : '×'}</td>
              <td><span class="ep-rq cell"><input class="ep-num f" data-f="sort" value="${esc(r.sort)}" inputmode="numeric" title="정렬순서" aria-label="${i + 1}행 정렬순서"></span></td>
              <td>${esc(r.user)}</td></tr>`;
          }).join('') : `<tr class="ep-empty"><td colspan="9">${st.loaded ? '조회된 데이터가 없습니다.' : '조회 버튼을 눌러 주십시오.'}</td></tr>`}</tbody>
        </table></div>`;

      fitAll();
      H.$$('tbody tr[data-i]', body).forEach(tr => {
        const r = st.rows[+tr.dataset.i];
        tr.addEventListener('focusin', () => select(+tr.dataset.i));
        tr.addEventListener('click', () => select(+tr.dataset.i));
        H.$$('.f', tr).forEach(f => {
          const upd = () => { r[f.dataset.f] = f.value; st.dirty = true; if (f.tagName === 'TEXTAREA') autosize(f); };
          f.addEventListener('input', upd); f.addEventListener('change', upd);
        });
        H.$('.ep-num', tr).addEventListener('input', e => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3); r.sort = e.target.value; });
      });
      H.$('.ck-all', body).onchange = e => H.$$('.ck:not(:disabled)', body).forEach(c => { c.checked = e.target.checked; });
      H.$$('thead th[data-k]', body).forEach(th => { th.onclick = () => sortBy(th.dataset.k); });
      H.$('.ep-gear', body).onclick = () => A().alertBox('연수용 가상 환경에서는 제공되지 않는 기능입니다.');
      H.$('.b-add', body).onclick = addRow;
      H.$('.b-del', body).onclick = delRows;
      H.$('.b-save', body).onclick = saveStd;
      H.$('.b-print', body).onclick = printStd;
    }
    function select(i) { st.sel = i; H.$$('.ep-body tbody tr[data-i]', page).forEach(tr => tr.classList.toggle('cur', +tr.dataset.i === i)); }
    function autosize(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(32, ta.scrollHeight + 2) + 'px'; const tr = ta.closest('tr'); if (tr && tr.dataset.i != null) fitRow(tr); }
    // 같은 행의 선택상자·정렬순서 칸을 글상자 높이에 맞춘다
    // 화면이 보인 뒤·창 크기가 바뀔 때 글상자 높이를 다시 맞춘다
    function fitAll() { const run = () => H.$$('.ep-body textarea.ep-ta', page).forEach(autosize); run(); requestAnimationFrame(run); }
    new ResizeObserver(() => { if (page.offsetWidth) fitAll(); }).observe(page);
    function fitRow(tr) { const h = Math.max(32, ...H.$$('textarea', tr).map(t => t.offsetHeight)); H.$$('.ep-sel, .ep-num', tr).forEach(x => { x.style.height = h + 'px'; }); }
    function sortBy(k) {
      if (!st.rows.length) return;
      st.sortDir = st.sortKey === k ? -st.sortDir : 1; st.sortKey = k;
      st.rows.sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'ko', { numeric: true })) * st.sortDir; });
      draw();
    }
    function addRow() {
      if (!st.loaded) { A().alertBox('조회 후 행을 추가하십시오.'); return; }
      const k = st.k;
      const max = plans().filter(p => p.year === k.year && p.sem === k.sem && p.grade === k.grade && p.subj === k.subj).length;
      st.rows.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 5), year: k.year, sem: k.sem, grade: k.grade, subj: k.subj, area: k.area || '', ord: Math.max(max, ...st.rows.map(r => r.ord), 0) + 1, std: '', elem: '', evalUsed: false, obsUsed: false, sort: '1', user: D().user.name, steps: {}, isNew: true });
      st.sel = st.rows.length - 1; st.dirty = true;
      drawStd();
      const tr = H.$(`.ep-body tbody tr[data-i="${st.sel}"]`, page);
      if (tr) { tr.scrollIntoView({ block: 'nearest' }); H.$('select', tr).focus(); }
    }
    function delRows() {
      const idx = H.$$('.ep-body tbody tr[data-i]', page).filter(tr => H.$('.ck', tr).checked).map(tr => +tr.dataset.i);
      if (!idx.length) { A().alertBox('삭제할 행을 선택하십시오.'); return; }
      A().confirmBox(`선택한 ${idx.length}건을 삭제하시겠습니까?\n(저장을 눌러야 반영됩니다.)`, () => { st.rows = st.rows.filter((r, i) => !idx.includes(i)); st.sel = -1; st.dirty = true; drawStd(); });
    }
    function saveStd() {
      if (!st.loaded) { A().alertBox('조회 후 저장하십시오.'); return; }
      for (let i = 0; i < st.rows.length; i++) {
        const r = st.rows[i], n = i + 1;
        if (!r.area) return fail(i, `${n}번째 행의 [영역명]은(는) 필수 입력 항목입니다.`);
        if (!r.std.trim()) return fail(i, `${n}번째 행의 [성취기준]은(는) 필수 입력 항목입니다.`);
        if (!r.elem.trim()) return fail(i, `${n}번째 행의 [평가요소]은(는) 필수 입력 항목입니다.`);
        if (!String(r.sort).trim()) return fail(i, `${n}번째 행의 [정렬순서]은(는) 필수 입력 항목입니다.`);
      }
      A().confirmBox('저장하시겠습니까?', () => {
        const k = st.k, all = plans();
        const inScope = p => p.year === k.year && p.sem === k.sem && p.grade === k.grade && p.subj === k.subj && (!k.area || p.area === k.area);
        const kept = all.filter(p => !inScope(p));
        const pos = all.findIndex(inScope);
        const fresh = st.rows.map(r => { const c = Object.assign({}, r); delete c.isNew; return c; });
        kept.splice(pos < 0 ? kept.length : pos, 0, ...fresh);
        D().evalPlans = kept;
        renumber(D().evalPlans);
        D().planApproval = '저장';
        syncStandards();
        A().Store.save();
        A().alertBox('저장되었습니다.', load);
      });
    }
    function fail(i, msg) {
      A().alertBox(msg, () => { const tr = H.$(`.ep-body tbody tr[data-i="${i}"]`, page); if (tr) { select(i); const f = H.$$('.f', tr).find(x => !x.value.trim() && !x.disabled && !x.readOnly); (f || tr).focus && (f || tr).focus(); } });
    }
    function printStd() {
      if (!st.rows.length) { A().alertBox('출력할 자료가 없습니다.'); return; }
      const k = st.k;
      A().modal({ title: '평가계획(안) 출력', width: 940, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:19px">${k.year}학년도 ${k.sem}학기 ${k.grade}학년 ${esc(k.subj)} 평가계획(안)</h2><p style="text-align:right">${esc(D().org.school)} · 작성자 ${esc(D().user.name)}</p><table><tr><th style="width:50px">순번</th><th style="width:90px">영역명</th><th>성취기준</th><th style="width:220px">평가요소</th><th style="width:60px">교과평가</th></tr>${st.rows.map(r => `<tr><td style="text-align:center">${r.ord}</td><td style="text-align:center">${esc(r.area)}</td><td>${esc(r.std)}</td><td>${esc(r.elem)}</td><td style="text-align:center">${r.evalUsed ? '○' : '×'}</td></tr>`).join('')}</table></div></div>` });
    }

    // ----- 2단계: 성취기준(평가기준)관리 (실제 화면 2026.10. 캡처 기준) -----
    // 왼쪽: 성취기준 목록(읽기 전용) / 오른쪽: 평가기준(단계선택 → 평가단계·평가결과)
    // 평가계획(안)마감에서 마감한 교과는 '마감됨'으로 표시되고 입력 버튼이 회색으로 잠긴다.
    function drawCrit() {
      const body = $('.ep-body');
      if (!st.loaded) load();
      const k = st.k, rows = st.rows;
      const closed = !!(D().planClose || {})[`${k.year}|${k.sem}|${k.subj}`];
      const r = rows[st.sel2];
      const levels = r ? (r.levels || levelsOf(r.steps)) : null;
      const dis = closed ? 'disabled' : '';
      body.innerHTML = `
        <div class="ep-split2">
          <div class="ep-pane">
            <div class="ep-bar2">
              <div class="ep-total2">Total ${rows.length}<button class="ep-gear" title="열 설정">${IC.gear}</button></div>
              <span class="sp"></span>
              ${closed ? '<span class="ep-closed">마감됨</span>' : ''}
              <span class="ep-note2">※ 결재상태 : ${esc(approvalState())}</span>
              <button class="ep-pb b-bulk" ${dis}>일괄입력</button><button class="ep-pb b-allsubj" ${dis}>전과목일괄입력</button><button class="ep-pb b-print2">출력</button>
            </div>
            <div class="ep-grid ep-left"><table>
              <colgroup><col style="width:49px"><col style="width:147px"><col style="width:369px"><col></colgroup>
              <thead><tr><th><input type="checkbox" class="ep-ck ck-all2" ${dis}></th><th data-k="area">영역명<span class="ep-sort">△</span></th><th data-k="std">성취기준<span class="ep-sort">△</span></th><th data-k="elem">평가요소<span class="ep-sort">△</span></th></tr></thead>
              <tbody>${rows.length ? rows.map((x, i) => `<tr data-i="${i}" class="${i === st.sel2 ? 'cur' : ''}" tabindex="0" aria-label="${i + 1}행 ${esc(x.area)} 성취기준 선택"><td class="c"><input type="checkbox" class="ep-ck ck2" ${x.evalUsed || closed ? 'disabled' : ''}></td><td>${esc(x.area)}</td><td>${esc(x.std)}</td><td>${esc(x.elem)}</td></tr>`).join('') : `<tr class="ep-empty"><td colspan="4">조회된 데이터가 없습니다.</td></tr>`}</tbody>
            </table></div>
          </div>
          <div class="ep-pane">
            <div class="ep-bar2">
              <b class="ep-rtit">평가기준</b><span class="ep-total2 r">Total ${levels ? levels.length : 0}<button class="ep-gear" title="열 설정">${IC.gear}</button></span>
              <span class="sp"></span>
              <button class="ep-pb b-char" ${dis}>특수문자</button><button class="ep-pb b-save2" ${dis}>저장</button><button class="ep-pb b-del2" ${dis}>삭제</button>
            </div>
            <div class="ep-band"><select class="ep-stepsel" aria-label="단계선택" ${!r || closed ? 'disabled' : ''}><option value="">단계선택</option>${Object.keys(LEVELS).map(n => `<option value="${n}" ${levels && levels.length === +n ? 'selected' : ''}>${n}단계</option>`).join('')}</select></div>
            <div class="ep-grid ep-right"><table>
              <colgroup><col style="width:129px"><col></colgroup>
              <thead><tr><th>평가단계</th><th>평가결과</th></tr></thead>
              <tbody>${levels && levels.length ? levels.map(lv => `<tr><td>${esc(lv)}</td><td><textarea class="ep-ta g" data-s="${esc(lv)}" rows="2" ${closed ? 'readonly' : ''} title="평가결과" aria-label="${esc(lv)} 평가결과">${esc((r.steps || {})[lv] || '')}</textarea></td></tr>`).join('') : ''}</tbody>
            </table>${levels && levels.length ? '' : `<div class="ep-nodata">${A().nodata('조회된 데이터가 없습니다.')}</div>`}</div>
          </div>
        </div>`;

      H.$$('.ep-left tbody tr[data-i]', body).forEach(tr => { tr.onclick = e => { if (e.target.matches('input')) return; st.sel2 = +tr.dataset.i; drawCrit(); }; tr.onkeydown = e => { if (e.key === 'Enter') tr.click(); }; });
      const ca = H.$('.ck-all2', body); if (ca) ca.onchange = () => H.$$('.ck2:not(:disabled)', body).forEach(c => { c.checked = ca.checked; });
      H.$$('.ep-gear', body).forEach(g => { g.onclick = () => A().alertBox('연수용 가상 환경에서는 제공되지 않는 기능입니다.'); });
      H.$$('.ep-left thead th[data-k]', body).forEach(th => { th.onclick = () => sortBy(th.dataset.k); });
      fitAll();
      let lastTa = null;
      H.$$('textarea.g', body).forEach(ta => { ta.onfocus = () => { lastTa = ta; }; ta.oninput = () => { r.steps = r.steps || {}; r.steps[ta.dataset.s] = ta.value; autosize(ta); st.dirty = true; }; });
      const sel = H.$('.ep-stepsel', body);
      sel.onchange = () => { if (!r) return; r.levels = sel.value ? LEVELS[sel.value].slice() : []; drawCrit(); };
      H.$('.b-print2', body).onclick = printCrit;
      if (closed) return;
      H.$('.b-save2', body).onclick = () => {
        if (!r) { A().alertBox('성취기준을 선택하십시오.'); return; }
        if (!levels || !levels.length) { A().alertBox('단계를 선택하십시오.'); return; }
        const empty = levels.find(lv => !((r.steps || {})[lv] || '').trim());
        if (empty) { A().alertBox(`[${empty}]의 평가결과를 입력하십시오.`); return; }
        A().confirmBox('저장하시겠습니까?', () => { commitCrit([r]); A().alertBox('저장되었습니다.'); });
      };
      H.$('.b-del2', body).onclick = () => {
        if (!r || !levels || !levels.length) { A().alertBox('삭제할 평가기준이 없습니다.'); return; }
        A().confirmBox('선택한 성취기준의 평가기준을 삭제하시겠습니까?', () => { r.steps = {}; r.levels = []; commitCrit([r]); drawCrit(); A().alertBox('삭제되었습니다.'); });
      };
      H.$('.b-char', body).onclick = () => {
        const chars = ['·', '○', '●', '◎', '□', '■', '△', '▲', '※', '→', '①', '②', '③', '④', '⑤', '「', '」', '『', '』', '…'];
        const m = A().modal({ title: '특수문자', width: 420, body: `<div class="ep-chars">${chars.map(c => `<button type="button">${c}</button>`).join('')}</div>`, buttons: [{ text: '닫기' }] });
        H.$$('.ep-chars button', m.pop).forEach(b => {
          b.onclick = () => {
            const ta = lastTa || H.$('textarea.g', body); if (!ta) return;
            const p = ta.selectionStart == null ? ta.value.length : ta.selectionStart, q = ta.selectionEnd == null ? p : ta.selectionEnd;
            ta.value = ta.value.slice(0, p) + b.textContent + ta.value.slice(q); ta.dispatchEvent(new Event('input')); ta.focus(); ta.selectionStart = ta.selectionEnd = p + 1;
          };
        });
      };
      H.$('.b-bulk', body).onclick = () => {
        const idx = H.$$('.ep-left tbody tr[data-i]', body).filter(tr => H.$('.ck2', tr).checked).map(tr => +tr.dataset.i);
        if (!idx.length) { A().alertBox('일괄입력할 성취기준을 선택하십시오.'); return; }
        const m = A().modal({
          title: '평가기준 일괄입력', width: 640,
          body: `<table class="form"><tr><th>단계선택</th><td><select class="sel bl-n">${Object.keys(LEVELS).map(n => `<option value="${n}" ${n === '4' ? 'selected' : ''}>${n}단계</option>`).join('')}</select></td></tr></table><div class="bl-rows" style="margin-top:10px"></div><p style="color:#5e79dd;margin:8px 0 0">※ 선택한 ${idx.length}개 성취기준에 같은 평가기준을 넣습니다.</p>`,
          buttons: [{ text: '적용', cls: 'primary', onClick: () => {
            const n = H.$('.bl-n', m.pop).value, vals = {}; let ok = true;
            LEVELS[n].forEach(lv => { vals[lv] = H.$(`.bl-t[data-s="${lv}"]`, m.pop).value.trim(); if (!vals[lv]) ok = false; });
            if (!ok) { A().alertBox('평가결과를 모두 입력하십시오.'); return false; }
            const list = idx.map(i => rows[i]);
            list.forEach(x => { x.levels = LEVELS[n].slice(); x.steps = Object.assign({}, vals); });
            commitCrit(list); drawCrit(); A().alertBox('저장되었습니다.');
          } }, { text: '닫기' }]
        });
        const fill = () => { H.$('.bl-rows', m.pop).innerHTML = `<table class="form">${LEVELS[H.$('.bl-n', m.pop).value].map(lv => `<tr><th>${lv}</th><td><textarea class="ta bl-t" data-s="${lv}" style="height:52px"></textarea></td></tr>`).join('')}</table>`; };
        H.$('.bl-n', m.pop).onchange = fill; fill();
      };
      H.$('.b-allsubj', body).onclick = () => A().alertBox('연수용 가상 환경에서는 제공되지 않는 기능입니다.');
    }
    function levelsOf(steps) {
      const ks = Object.keys(steps || {}).filter(x => (steps[x] || '').trim());
      if (!ks.length) return null;
      const n = Object.keys(LEVELS).find(c => LEVELS[c].length === ks.length && LEVELS[c].every(x => ks.includes(x)));
      return n ? LEVELS[n].slice() : ks;
    }
    function commitCrit(list) {
      const all = plans();
      list.forEach(x => {
        const p = all.find(y => y.id === x.id); if (!p) return;
        const lv = x.levels && x.levels.length ? x.levels : (levelsOf(x.steps) || []);
        p.steps = {}; lv.forEach(l => { if ((x.steps || {})[l]) p.steps[l] = x.steps[l]; });  // 고른 단계에 없는 예전 기준은 버린다
        p.levels = lv.slice(); x.steps = Object.assign({}, p.steps);
      });
      syncStandards(); A().Store.save();
    }
    function printCrit() {
      const rows = st.rows; if (!rows.length) { A().alertBox('출력할 자료가 없습니다.'); return; }
      const k = st.k;
      const body = rows.map(x => {
        const lv = x.levels && x.levels.length ? x.levels : (levelsOf(x.steps) || []);
        if (!lv.length) return `<tr><td style="text-align:center">${esc(x.area)}</td><td>${esc(x.std)}</td><td colspan="2" style="color:#888">미입력</td></tr>`;
        return lv.map((l, j) => `<tr>${j ? '' : `<td rowspan="${lv.length}" style="text-align:center">${esc(x.area)}</td><td rowspan="${lv.length}">${esc(x.std)}</td>`}<td style="text-align:center">${esc(l)}</td><td>${esc((x.steps || {})[l] || '')}</td></tr>`).join('');
      }).join('');
      A().modal({ title: '성취기준(평가기준) 출력', width: 940, body: `<div class="print-wrap"><div class="print-bar"><button class="btn" onclick="window.print()">인쇄</button></div><div class="print-doc"><h2 style="font-size:19px">${k.year}학년도 ${k.sem}학기 ${k.grade}학년 ${esc(k.subj)} 평가기준</h2><table><tr><th style="width:90px">영역명</th><th>성취기준</th><th style="width:90px">평가단계</th><th>평가결과</th></tr>${body}</table></div></div>` });
    }

    load();
    if (new URLSearchParams(location.search).get('step') === '2' || new URLSearchParams(location.search).get('open') === 'plan2') H.$('.ep-step[data-step="2"]', page).click();
  }

  // 평가계획(안) 결재상태 (연수용: 저장 전 '작성중', 저장 후 '저장')
  function approvalState() { return D().planApproval || '작성중'; }

  // 화면 머리: 글자크기(A A)·조회숨김 (실제 화면과 같은 배치)
  function headerExtras(page) {
    const hd = H.$('.app-hd', page); if (!hd || H.$('.hd-a', hd)) return;
    const u = H.$('.utils', hd);
    const a1 = A().el('<button class="hd-a" title="글자 크게">A</button>'), a2 = A().el('<button class="hd-a" title="글자 작게" style="font-size:11px">A</button>');
    hd.insertBefore(a1, u); hd.insertBefore(a2, u);
    let z = 1; a1.onclick = () => { z = Math.min(1.3, z + 0.1); page.style.zoom = z; }; a2.onclick = () => { z = Math.max(0.8, z - 0.1); page.style.zoom = z; };
    const hide = A().el('<button class="hd-hide">조회숨김</button>'); hd.appendChild(hide);
    hide.onclick = () => { const v = page.classList.toggle('ep-nosearch'); hide.textContent = v ? '조회보이기' : '조회숨김'; };
  }

  S['평가계획(안)관리'] = render;
  S['평가계획(안)관리(반별)'] = render;

  // 평가계획(안)마감
  S['평가계획(안)마감'] = function (page, title, app) {
    const d = D();
    d.planClose = d.planClose || {};
    page.insertAdjacentHTML('beforeend', `<div class="search-box">${app.sf('학년도', `<select class="sel s-y">${app.opts(['2026', '2025'], '2026')}</select>`, true)}${app.sf('학기', `<select class="sel s-s">${app.opts(['1', '2'], '2')}</select>`, true)}${app.searchBtn()}</div>
      <div class="toolbar"><span class="sp"></span><button class="btn outline b-open">마감취소</button><button class="btn primary b-close">마감</button></div><div class="area"></div>`);
    const draw = () => {
      const y = H.$('.s-y', page).value, s = H.$('.s-s', page).value;
      H.$('.area', page).innerHTML = H.grid([{ t: '', w: 40 }, { t: '교과(목)', w: 140 }, { t: '성취기준 수', w: 120 }, { t: '마감여부', w: 120 }, { t: '마감일시' }], subjectsOf(d.user.grade || 5).map(sj => {
        const n = plans().filter(p => p.year === y && p.sem === s && p.subj === sj && p.grade === String(d.user.grade || 5)).length;
        const c = d.planClose[`${y}|${s}|${sj}`];
        return `<tr data-k="${y}|${s}|${sj}"><td><input type="checkbox" class="ck"></td><td>${sj}</td><td>${n}</td><td>${c ? '<b style="color:#3772ff">마감</b>' : '미마감'}</td><td>${c || ''}</td></tr>`;
      }).join(''));
    };
    const set = v => { const ks = H.$$('tbody tr', page).filter(tr => H.$('.ck', tr).checked).map(tr => tr.dataset.k); if (!ks.length) { app.alertBox('교과를 선택하십시오.'); return; } ks.forEach(k => { if (v) d.planClose[k] = new Date().toLocaleString('ko-KR'); else delete d.planClose[k]; }); H.save(v ? '마감되었습니다.' : '마감이 취소되었습니다.'); draw(); };
    H.$('.b-search', page).onclick = draw;
    H.$('.b-close', page).onclick = () => set(true);
    H.$('.b-open', page).onclick = () => set(false);
    draw();
  };
})();
