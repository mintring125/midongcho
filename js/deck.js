// 라이브 프레젠테이션 넘기기·확대·전체보기
(function () {
  const stage = document.getElementById('stage');
  if (/[?&]static/.test(location.search)) document.documentElement.classList.add('no-anim');
  const slides = [...document.querySelectorAll('[data-n]')].sort((a, b) => a.dataset.n - b.dataset.n);
  const N = slides.length;
  let cur = -1;

  // 슬라이드 내용은 1600×900 틀(.frame)에 두고, 배경은 화면 비율에 맞춰 꽉 채운다(검은 여백 없음)
  slides.forEach(s => {
    if (s.classList.contains('app') || s.classList.contains('s-video')) return;
    const f = document.createElement('div'); f.className = 'frame';
    while (s.firstChild) f.appendChild(s.firstChild);
    s.appendChild(f);
  });
  // 휴대폰을 세로로 들고 있으면 화면 전체를 90° 돌려 가로(와이드)로 보여 준다
  const isPhoneDev = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  let rotated = false;
  function applyRotate() {
    // 글자를 입력하는 중(키보드가 떠서 화면 높이가 줄어든 것)에는 가로·세로가 바뀐 것으로 보지 않는다
    const a = document.activeElement;
    if (isPhoneDev() && a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return;
    rotated = isPhoneDev() && innerHeight > innerWidth;
    const b = document.body;
    document.documentElement.classList.toggle('force-wide', rotated);
    if (rotated) { b.style.width = innerHeight + 'px'; b.style.height = innerWidth + 'px'; b.style.transform = `translateX(${innerWidth}px) rotate(90deg)`; }
    else { b.style.width = b.style.height = b.style.transform = ''; }
  }
  const viewW = () => rotated ? innerHeight : innerWidth;
  const viewH = () => rotated ? innerWidth : innerHeight;
  applyRotate();
  function fit() {
    const vw = viewW(), vh = viewH();
    const s = Math.min(vw / 1600, vh / 900);
    stage.style.width = vw / s + 'px';
    stage.style.height = vh / s + 'px';
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  // 실습 화면: data-minw × data-minh 보다 좁으면 그 크기로 그린 뒤 통째로 축소
  function fitApps() {
    document.querySelectorAll('.app.active .app-stage').forEach(st => {
      const w = st.clientWidth, h = st.clientHeight, el = st.firstElementChild;
      if (!w || !h || !el) return;
      const s = Math.min(1, w / (+st.dataset.minw || 1280), h / (+st.dataset.minh || 720));
      el.style.width = w / s + 'px'; el.style.height = h / s + 'px';
      el.style.transform = s < 1 ? `scale(${s})` : '';
    });
  }
  // 눌러서 복사 (프롬프트 칸 등)
  async function copyText(text, el) {
    try { await navigator.clipboard.writeText(text); }
    catch (err) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    el.classList.add('copied');
    const tag = el.querySelector('.sv-copytag'); if (tag) tag.textContent = '✓ 복사됨';
    clearTimeout(el._t); el._t = setTimeout(() => { el.classList.remove('copied'); if (tag) tag.textContent = '📋 누르면 복사'; }, 1600);
  }
  // 눌러서 사진 복사 (AI 채팅창에 붙여 넣기용) — 클립보드는 PNG만 받으므로 바꿔서 넣는다
  async function copyImage(src, el) {
    const label = el.textContent;
    try {
      const png = new Promise((ok, no) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); c.toBlob(b => b ? ok(b) : no(), 'image/png'); }; im.onerror = no; im.src = src; });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      el.textContent = '✓ 사진 복사됨'; el.classList.add('copied');
    } catch { el.textContent = '복사 안 됨 · 「사진 받기」로'; }
    clearTimeout(el._t); el._t = setTimeout(() => { el.textContent = label; el.classList.remove('copied'); }, 1800);
  }
  // 실습 화면 위 안내 팝업: 같은 버튼으로 열고 닫는다. 화면이 작으면 통째로 줄인다.
  function toggleGuide(id, force) {
    const pop = document.getElementById(id); if (!pop) return;
    const open = force === undefined ? pop.hidden : force;
    pop.hidden = !open;
    document.querySelectorAll(`.guide-btn[data-guide="${id}"]`).forEach(b => { b.classList.toggle('on', open); b.setAttribute('aria-pressed', open); });
    if (open) fitGuides();
    document.dispatchEvent(new CustomEvent('guidechange', { detail: { id, open } }));
  }
  function fitGuides() {
    document.querySelectorAll('.guide-pop:not([hidden])').forEach(pop => {
      const box = pop.firstElementChild;
      const s = Math.min(1, (pop.clientWidth - 32) / box.offsetWidth, (pop.clientHeight - 32) / box.offsetHeight);
      box.style.transform = `translate(-50%, -50%) scale(${s})`;   // 가운데 고정 + 화면에 맞춰 축소
    });
  }
  addEventListener('resize', () => { applyRotate(); fit(); fitApps(); fitGuides(); }); fit();
  addEventListener('orientationchange', () => setTimeout(() => { applyRotate(); fit(); fitApps(); fitGuides(); }, 200));
  // 입력을 마치고 키보드가 내려가면 그때 화면 방향을 다시 맞춘다
  addEventListener('focusout', () => setTimeout(() => { if (!isPhoneDev()) return; applyRotate(); fit(); fitApps(); fitGuides(); }, 300));

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur) return;
    const prev = slides[cur];
    if (prev) {
      prev.classList.remove('active');
      if (prev.classList.contains('s-video')) pauseVideo();
    }
    const el = slides[i];
    // 재진입 시 애니메이션 다시 재생
    if (!el.classList.contains('app')) { void el.offsetWidth; }
    el.classList.add('active');
    const isApp = el.classList.contains('app');
    document.body.classList.toggle('on-app', isApp);
    if (isApp && el.dataset.src) {
      const f = el.querySelector('iframe');
      if (!f.getAttribute('src')) f.src = el.dataset.src;
    }
    cur = i;
    document.getElementById('hudNum').textContent = `${i + 1} / ${N}`;
    if (!opts.noHash) history.replaceState(null, '', '#' + el.dataset.n);   // 주소의 #번호 = 슬라이드 번호(data-n)
    document.title = `${el.dataset.title} · 생성형 AI 활용 연수`;
    document.dispatchEvent(new CustomEvent('slidechange', { detail: { n: i + 1, el } }));
    if (isApp) fitApps();
    if (el.classList.contains('s-video')) setTimeout(autoPlay, 350);
    if (isApp) { const t = el.querySelector('textarea'); if (t && !opts.noFocus && !matchMedia('(pointer: coarse)').matches) setTimeout(() => t.focus(), 50); }   // 휴대폰은 가상 키보드가 떠서 자동 포커스 안 함
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);
  const byNumber = n => go(slides.findIndex(s => +s.dataset.n === +n));
  window.Deck = { go: byNumber, next, prev, guide: (id, open) => toggleGuide(id, open), get current() { return cur + 1; }, get n() { return slides[cur] ? +slides[cur].dataset.n : null; } };

  // 영상
  const video = document.getElementById('storyVideo');
  const vSlide = video.closest('.slide');
  const liveViewer = () => document.documentElement.classList.contains('live-viewer');   // 강사 화면을 따라가는 수강자
  document.addEventListener('liveviewer', () => { if (liveViewer()) video.pause(); });
  function playVideo() { if (liveViewer()) return; video.muted = false; vSlide.classList.remove('muted'); video.play().catch(() => {}); }
  // 영상 화면에 들어오면 자동 재생. 끝까지 본 영상이면 처음부터.
  // 브라우저가 소리 있는 자동 재생을 막으면(페이지를 열자마자 바로 3번일 때) 소리 없이 재생하고 '소리 켜기'를 보여 준다.
  function autoPlay() {
    if (slides[cur] !== vSlide || liveViewer()) return;
    if (video.ended) video.currentTime = 0;
    video.muted = false;
    video.play().catch(() => { video.muted = true; vSlide.classList.add('muted'); video.play().catch(() => {}); });
  }
  function pauseVideo() { video.pause(); }
  function toggleVideo() { video.paused ? playVideo() : pauseVideo(); }
  video.addEventListener('play', () => vSlide.classList.add('playing'));
  video.addEventListener('pause', () => vSlide.classList.remove('playing'));
  video.addEventListener('ended', () => { vSlide.classList.remove('playing'); });
  document.getElementById('storyPlay').addEventListener('click', e => { e.stopPropagation(); playVideo(); });
  document.getElementById('storyUnmute').addEventListener('click', e => { e.stopPropagation(); video.muted = false; vSlide.classList.remove('muted'); });
  video.addEventListener('click', e => { e.stopPropagation(); toggleVideo(); });

  // 클릭으로 이동
  document.addEventListener('click', e => {
    const cp = e.target.closest('[data-copy]');
    if (cp) { copyText(cp.dataset.copy, cp); return; }
    const ci = e.target.closest('[data-copy-img]');
    if (ci) { copyImage(ci.dataset.copyImg, ci); return; }
    const t = e.target.closest('[data-go],[data-prev],[data-next],[data-reload],[data-try],[data-full],[data-guide]');
    if (!t) return;
    if (t.dataset.guide) toggleGuide(t.dataset.guide);
    else if (t.hasAttribute('data-full')) toggleFull();
    else if (t.dataset.go) byNumber(t.dataset.go);
    else if (t.hasAttribute('data-prev')) prev();
    else if (t.hasAttribute('data-next')) next();
    else if (t.hasAttribute('data-reload')) { const f = t.closest('.app').querySelector('iframe'); f.src = f.closest('.app').dataset.src; }
    else if (t.dataset.try) { byNumber(13); document.dispatchEvent(new CustomEvent('codex-try', { detail: +t.dataset.try })); }
  });

  // 키보드 (입력칸에 있을 때는 넘기지 않음)
  let typed = '';
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { const op = document.querySelector('.app.active .guide-pop:not([hidden])'); if (op) { toggleGuide(op.id, false); return; } }
    if (tag === 'textarea' || tag === 'input' || e.target.isContentEditable) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ov = document.getElementById('overview');
    if (ov.classList.contains('open')) { if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') toggleOverview(false); return; }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case 'ArrowDown': case ' ': case 'Enter':
        if (e.key === 'Enter' && typed) { byNumber(typed); typed = ''; break; }
        if (e.key === ' ' && slides[cur] === vSlide) { toggleVideo(); break; }
        next(); break;
      case 'ArrowLeft': case 'PageUp': case 'ArrowUp': case 'Backspace': prev(); break;
      case 'Home': go(0); break;
      case 'End': go(N - 1); break;
      case 'f': case 'F': toggleFull(); break;
      case 'o': case 'O': case 'g': case 'G': toggleOverview(true); break;
      case 'p': case 'P': case 'k': case 'K': if (slides[cur] === vSlide) toggleVideo(); break;
      default:
        if (/^[0-9]$/.test(e.key)) { typed = (typed + e.key).slice(-2); clearTimeout(go.t); go.t = setTimeout(() => typed = '', 1500); return; }
        return;
    }
    e.preventDefault();
  });


  // 전체 화면
  // 휴대폰: 전체 화면을 켜면 가로(와이드)로 고정한다. (안드로이드 크롬 등. 아이폰은 웹에서 전체 화면·방향 고정이 안 돼 안내만 띄움)
  const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  function toggleFull() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const el = document.documentElement;
    if (!el.requestFullscreen && !el.webkitRequestFullscreen) { if (isPhone()) rotateHint(); return; }
    const req = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
    setTimeout(() => { if (!document.fullscreenElement && !document.webkitFullscreenElement) rotateHint(); }, 1200);   // 전체 화면이 안 켜진 환경
    Promise.resolve(req).then(() => {
      if (!isPhone()) return;
      const o = screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(rotateHint);
      else rotateHint();
    }).catch(rotateHint);   // 전체 화면이 막힌 환경이면 돌리라는 안내라도
  }
  function rotateHint() {
    if (!isPhone() || innerWidth > innerHeight || rotated) return;
    let h = document.getElementById('rotateHint');
    if (!h) { h = document.createElement('div'); h.id = 'rotateHint'; h.textContent = '📱 화면을 가로로 돌려 주세요'; document.body.appendChild(h); }
    h.classList.add('on'); clearTimeout(rotateHint.t); rotateHint.t = setTimeout(() => h.classList.remove('on'), 3000);
  }
  function onFull() {
    const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!full && screen.orientation && screen.orientation.unlock) { try { screen.orientation.unlock(); } catch (e) { /* 지원 안 함 */ } }
    document.body.classList.toggle('is-full', full);
    document.querySelectorAll('[data-full]').forEach(b => {
      b.title = full ? '전체 화면 끝내기 (F)' : '전체 화면 (F)';
      const l = b.querySelector('.lbl'); if (l) l.textContent = full ? '전체 화면 끝내기' : '전체 화면';
    });
    fit();
  }
  document.addEventListener('fullscreenchange', onFull);
  document.addEventListener('webkitfullscreenchange', onFull);

  // 전체 보기
  const ovGrid = document.getElementById('ovGrid');
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<b>${i + 1}</b><span>${s.dataset.title}${s.classList.contains('app') ? '<small>라이브 실습 화면</small>' : ''}</span>`;
    b.onclick = () => { toggleOverview(false); go(i); };
    ovGrid.appendChild(b);
  });
  function toggleOverview(open) {
    const ov = document.getElementById('overview');
    ov.classList.toggle('open', open);
    [...ovGrid.children].forEach((b, i) => b.classList.toggle('cur', i === cur));
  }

  document.getElementById('hudPrev').onclick = prev;
  document.getElementById('hudNext').onclick = next;
  document.getElementById('hudGrid').onclick = () => toggleOverview(true);

  // 마우스를 움직일 때만 컨트롤 표시
  let hideT;
  addEventListener('mousemove', () => {
    document.body.classList.add('show-hud');
    clearTimeout(hideT); hideT = setTimeout(() => document.body.classList.remove('show-hud'), 2200);
  });

  // 휴대폰: 화면을 만지면 컨트롤이 보이고, 일반 슬라이드에서는 좌우로 밀어 넘긴다(탭으로는 안 넘어감)
  let tx = null, ty = 0;
  addEventListener('touchstart', e => {
    document.body.classList.add('show-hud');
    clearTimeout(hideT); hideT = setTimeout(() => document.body.classList.remove('show-hud'), 3000);
    const t = e.touches[0]; tx = t.clientX; ty = t.clientY;
  }, { passive: true });
  document.getElementById('viewport').addEventListener('touchend', e => {
    if (tx === null) return;
    const t = e.changedTouches[0]; let dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
    if (rotated) { const ox = dx; dx = dy; dy = -ox; }   // 90° 돌린 화면 기준으로 바꿈
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  }, { passive: true });

  const fromHash = () => { const n = parseFloat(location.hash.slice(1)); const i = slides.findIndex(s => +s.dataset.n === n); return i; };
  addEventListener('hashchange', () => { const i = fromHash(); if (i >= 0) go(i, { noHash: true }); });
  const start = fromHash();
  go(start >= 0 ? start : 0, { noFocus: true });
  { const gq = new URLSearchParams(location.search).get('guide'); if (gq) setTimeout(() => toggleGuide('guide' + gq, true), 300); }   // ?guide=7 : 실습 안내 팝업을 연 채로 시작
  onFull();
})();
