// 화면에 쓰는 그림은 모두 직접 그린 SVG 이다 (실제 시스템의 이미지 파일은 쓰지 않는다).
(function () {
  var VE = window.VE = window.VE || {};
  function svg(w, h, body, vb) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="' + (vb || '0 0 ' + w + ' ' + h) + '">' + body + '</svg>'; }
  var I = VE.I = {};

  I.logo = svg(144, 32,
    '<path d="M0 16 C9 10 20 11 30 16 L44 16 L44 20 L28 20 C19 15 9 15 2 19 Z" fill="#1d63b8"/>' +
    '<path d="M11 3 h7 v10 l9 -10 h8 l-10 11 l11 14 h-9 l-7 -10 l-2 2 v8 h-8 Z" fill="#e63a33"/>' +
    '<path d="M10 14.5 C16 12.5 22 13.5 27 16.5 L36 28 L28 28 L20 19.5 C16 17.5 13 17.5 10 18.5 Z" fill="#1d63b8"/>' +
    '<text x="43" y="27" font-family="Malgun Gothic,맑은 고딕,sans-serif" font-size="27" font-weight="900" fill="#1d63b8" stroke="#1d63b8" stroke-width="1.1" textLength="99" lengthAdjust="spacingAndGlyphs">에듀파인</text>' +
    '<circle cx="125.5" cy="12.4" r="4.2" fill="#fff"/><circle cx="125.5" cy="12.4" r="4.6" fill="none" stroke="#e63a33" stroke-width="3.2"/>');

  I.search = svg(13, 13, '<circle cx="5.5" cy="5.5" r="4.2" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M8.6 8.6 L12.2 12.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>');
  I.tUser = svg(19, 18, '<circle cx="8" cy="8" r="6.6" fill="none" stroke="#9a9a9a" stroke-width="1.6"/><circle cx="8" cy="6.3" r="2.2" fill="#9a9a9a"/><path d="M4 12 C4.5 9 11.5 9 12 12" fill="#9a9a9a"/><path d="M13 13 L17.5 17" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round"/>');
  I.tSetting = svg(17, 17, '<circle cx="7" cy="4.2" r="3.3" fill="#9a9a9a"/><path d="M1 15 C1 9 13 9 13 15 Z" fill="#9a9a9a"/><circle cx="12.5" cy="12.5" r="3.6" fill="#fff"/><circle cx="12.5" cy="12.5" r="2.6" fill="none" stroke="#777" stroke-width="1.8" stroke-dasharray="1.6 1.1"/><circle cx="12.5" cy="12.5" r="1" fill="#777"/>');
  I.tAccess = svg(19, 18, '<rect x="1" y="1" width="17" height="11.5" rx="1" fill="none" stroke="#9a9a9a" stroke-width="1.6"/><path d="M9.5 12.5 v3 M5 16.5 h9" stroke="#9a9a9a" stroke-width="1.6"/><path d="M4.5 6 h10" stroke="#9a9a9a" stroke-width="1.6" stroke-dasharray="1.4 1.2"/>');
  I.tLogout = svg(18, 18, '<path d="M9 1.2 H1.6 V16.8 H9" fill="none" stroke="#3f8606" stroke-width="2.4"/><path d="M6 6.4 h6 V3 l5.4 6 l-5.4 6 v-3.4 H6 Z" fill="#3f8606"/>');
  I.refresh = svg(14, 14, '<path d="M2.2 6 A5 5 0 0 1 11.4 4.4" fill="none" stroke="#999" stroke-width="1.6"/><path d="M12.6 1.6 v4 h-4 Z" fill="#999"/><path d="M11.8 8 A5 5 0 0 1 2.6 9.6" fill="none" stroke="#999" stroke-width="1.6"/><path d="M1.4 12.4 v-4 h4 Z" fill="#999"/>');
  I.dropDark = svg(8, 5, '<path d="M0 0 h8 L4 5 Z" fill="#444"/>');
  I.dropBlue = svg(9, 6, '<path d="M0 0 h9 L4.5 6 Z" fill="#2c85bf"/>');
  I.plus = svg(13, 13, '<path d="M6.5 0 v13 M0 6.5 h13" stroke="#fff" stroke-width="2.4"/>');
  I.chev = svg(8, 13, '<path d="M1 1 L7 6.5 L1 12" fill="none" stroke="#a9a9a9" stroke-width="1.3"/>');
  I.selBullet = svg(13, 13, '<circle cx="6.5" cy="6.5" r="6.5" fill="#e8500a"/><path d="M5 3.4 L8.6 6.5 L5 9.6 Z" fill="#fff"/>');
  I.arrL = svg(6, 9, '<path d="M6 0 L0 4.5 L6 9 Z" fill="#fff"/>');
  I.arrR = svg(6, 9, '<path d="M0 0 L6 4.5 L0 9 Z" fill="#fff"/>');
  function qDoc(c) { return svg(13, 13, '<rect x="1" y="1" width="11" height="11" fill="none" stroke="' + c + '" stroke-width="1.3"/><path d="M1 4 h11" stroke="' + c + '" stroke-width="1.3"/><path d="M4 8.2 l1.7 1.7 l3.3 -3.4" fill="none" stroke="' + c + '" stroke-width="1.2"/>'); }
  function qMemo(c) { return svg(13, 12, '<path d="M6.5 1 C10 1 12.2 3 12.2 5.3 C12.2 7.7 10 9.6 6.5 9.6 C6 9.6 5.5 9.6 5 9.5 L2.6 11.2 L3 8.6 C1.6 7.8 0.8 6.6 0.8 5.3 C0.8 3 3 1 6.5 1 Z" fill="none" stroke="' + c + '" stroke-width="1.2"/><path d="M4 5.4 h5" stroke="' + c + '" stroke-width="1.2" stroke-dasharray="1.2 0.8"/>'); }
  function qMail(c) { return svg(13, 14, '<path d="M1 6 L6.5 1.4 L12 6 V13 H1 Z" fill="none" stroke="' + c + '" stroke-width="1.3"/><path d="M1 6.4 L6.5 10 L12 6.4" fill="none" stroke="' + c + '" stroke-width="1.2"/>'); }
  function qSurvey(c) { return svg(14, 14, '<rect x="1" y="1" width="12" height="8.4" fill="none" stroke="' + c + '" stroke-width="1.3"/><path d="M4 7.4 v-2 M7 7.4 v-4 M10 7.4 v-3" stroke="' + c + '" stroke-width="1.3"/><path d="M7 9.4 v1.6 M4 13.2 l3 -2.2 l3 2.2" fill="none" stroke="' + c + '" stroke-width="1.2"/>'); }
  I.qDoc = qDoc('#fff'); I.qMemo = qMemo('#fff'); I.qMail = qMail('#fff'); I.qSurvey = qSurvey('#fff');
  I.qDocD = qDoc('#8c8c8c'); I.qMemoD = qMemo('#8c8c8c'); I.qSurveyD = qSurvey('#8c8c8c');
  I.help = svg(28, 23, '<path d="M12 1.5 A9.2 9.2 0 1 1 6.2 17.6 L2.6 21 L3.6 15.6 A9.2 9.2 0 0 1 12 1.5 Z" fill="none" stroke="#fff" stroke-width="2"/><text x="12.2" y="15.6" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#fff">?</text>');
  I.star = svg(14, 14, '<path d="M7 0.6 L8.9 5 L13.6 5.4 L10 8.5 L11.1 13.2 L7 10.7 L2.9 13.2 L4 8.5 L0.4 5.4 L5.1 5 Z" fill="#7c7c7c"/>');
  I.home = svg(16, 14, '<path d="M1 7.2 L8 1 L15 7.2" fill="none" stroke="#9d9d9d" stroke-width="1.5"/><path d="M3.2 6.6 V13 H6.6 V9.2 H9.4 V13 H12.8 V6.6" fill="none" stroke="#9d9d9d" stroke-width="1.5"/>');
  I.tabX = svg(11, 11, '<path d="M1 1 L10 10 M10 1 L1 10" stroke="#fff" stroke-width="1.3"/>');
  function mdi(body) { return svg(15, 14, body); }
  I.mMax = mdi('<rect x="1" y="1" width="13" height="12" fill="none" stroke="#555" stroke-width="1.4"/>');
  I.mCas = mdi('<rect x="1" y="1" width="5.5" height="5" fill="none" stroke="#555" stroke-width="1.4"/><rect x="8.5" y="1" width="5.5" height="5" fill="none" stroke="#555" stroke-width="1.4"/><rect x="1" y="8" width="5.5" height="5" fill="none" stroke="#555" stroke-width="1.4"/><rect x="8.5" y="8" width="5.5" height="5" fill="none" stroke="#555" stroke-width="1.4"/>');
  I.mHor = mdi('<rect x="1" y="1" width="13" height="12" fill="none" stroke="#555" stroke-width="1.4"/><path d="M1 5 h13 M1 9 h13" stroke="#555" stroke-width="1.4"/>');
  I.mVer = mdi('<rect x="1" y="1" width="13" height="12" fill="none" stroke="#555" stroke-width="1.4"/><path d="M5.3 1 v12 M9.7 1 v12" stroke="#555" stroke-width="1.4"/>');
  I.mPrev = svg(8, 12, '<path d="M7 1 L1.5 6 L7 11" fill="none" stroke="#a5a5a5" stroke-width="1.4"/>');
  I.mNext = svg(8, 12, '<path d="M1 1 L6.5 6 L1 11" fill="none" stroke="#a5a5a5" stroke-width="1.4"/>');
  I.mClose = svg(16, 15, '<rect x="1" y="1" width="14" height="13" fill="none" stroke="#555" stroke-width="1.3"/><path d="M1 4.6 h14" stroke="#555" stroke-width="1.3"/><path d="M6 7.4 l4 4 M10 7.4 l-4 4" stroke="#333" stroke-width="1.5"/>');
  I.addBox = svg(50, 47, '<rect x="1" y="1" width="48" height="45" rx="3" fill="none" stroke="#c9c9c9" stroke-width="2" stroke-dasharray="5 4"/><path d="M25 13 v21 M14.5 23.5 h21" stroke="#c9c9c9" stroke-width="3"/>');
  I.more = svg(12, 12, '<rect x="0.5" y="0.5" width="11" height="11" fill="#fff" stroke="#bbb"/><path d="M6 3 v6 M3 6 h6" stroke="#777" stroke-width="1.4"/>');
  I.bullet = svg(6, 14, '<rect x="0" y="1" width="4" height="12" fill="#3f8606"/>');
  I.newTag = svg(11, 11, '<rect width="11" height="11" rx="2" fill="#e8500a"/><text x="5.5" y="9" text-anchor="middle" font-family="Arial" font-size="8.5" font-weight="700" fill="#fff">N</text>');
  I.phone = svg(20, 16, '<path d="M2 6 C2 2 18 2 18 6 V8 H14 V6 H6 V8 H2 Z" fill="none" stroke="#595959" stroke-width="1.3"/><path d="M5 9 h10 l3 6 H2 Z" fill="none" stroke="#595959" stroke-width="1.3"/><circle cx="10" cy="12" r="1.8" fill="none" stroke="#595959" stroke-width="1.2"/>');

  // 목록 화면
  I.btnMore = svg(7, 7, '<path d="M0 1.5 h7 L3.5 6 Z" fill="#fff"/>');
  I.cal = svg(21, 14, '<rect x="3" y="2" width="15" height="11.4" fill="#fff" stroke="#3f7fc1" stroke-width="1.1"/><rect x="3" y="2" width="15" height="3.2" fill="#3f7fc1"/><path d="M6 1 v2.4 M15 1 v2.4" stroke="#3f7fc1" stroke-width="1.3"/><path d="M5.4 7.4 h10.2 M5.4 9.4 h10.2 M5.4 11.4 h10.2" stroke="#3f7fc1" stroke-width="1.1" stroke-dasharray="1.6 1"/>');
  I.unfold = '<span class="unfold">' + svg(8, 8, '<path d="M1 1 L4 3.6 L7 1 M1 4.4 L4 7 L7 4.4" fill="none" stroke="#2c85bf" stroke-width="1.2"/>') + '<b>펼치기</b></span>';
  I.fold = '<span class="unfold">' + svg(8, 8, '<path d="M1 3.6 L4 1 L7 3.6 M1 7 L4 4.4 L7 7" fill="none" stroke="#2c85bf" stroke-width="1.2"/>') + '<b>접기</b></span>';
  I.excel = svg(15, 14, '<rect x="0.6" y="1" width="9" height="12" fill="#fff" stroke="#6b7f95"/><text x="5" y="10" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700" fill="#4a6079">X</text><path d="M10.6 2.4 h3.6 v9.2 h-3.6" fill="#e9eef4" stroke="#6b7f95"/><path d="M10.6 5.2 h3.6 M10.6 8.4 h3.6" stroke="#6b7f95"/>');
  I.pcsave = svg(15, 14, '<path d="M1 1 H12 L14 3 V13 H1 Z" fill="#1d4f86"/><rect x="4" y="1" width="6.4" height="4.2" fill="#fff"/><rect x="7.6" y="1.8" width="1.6" height="2.6" fill="#1d4f86"/><rect x="3.4" y="7.6" width="8.2" height="4.4" fill="#fff"/>');
  I.print = svg(16, 14, '<rect x="4" y="1" width="8" height="4" fill="#fff" stroke="#2f5f93"/><rect x="1" y="5" width="14" height="6" rx="1" fill="#fff" stroke="#2f5f93" stroke-width="1.2"/><rect x="4" y="8.6" width="8" height="4.4" fill="#fff" stroke="#2f5f93"/><circle cx="12.6" cy="7" r="0.7" fill="#2f5f93"/>');
  I.que = svg(16, 16, '<circle cx="8" cy="8" r="7.6" fill="#9c9c9c"/><text x="8" y="12.2" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" font-style="italic" fill="#59595b">i</text>');
  I.sort = svg(7, 10, '<path d="M3.5 0.5 L6.5 4 H0.5 Z M3.5 9.5 L0.5 6 H6.5 Z" fill="#cfcfcf"/>');
  I.pFirst = svg(10, 9, '<path d="M9 0.5 L5 4.5 L9 8.5 M5 0.5 L1 4.5 L5 8.5" fill="none" stroke="#7c8ea3" stroke-width="1.4"/>');
  I.pPrev = svg(10, 9, '<path d="M7 0.5 L3 4.5 L7 8.5" fill="none" stroke="#7c8ea3" stroke-width="1.4"/>');
  I.pNext = svg(10, 9, '<path d="M3 0.5 L7 4.5 L3 8.5" fill="none" stroke="#7c8ea3" stroke-width="1.4"/>');
  I.pLast = svg(10, 9, '<path d="M1 0.5 L5 4.5 L1 8.5 M5 0.5 L9 4.5 L5 8.5" fill="none" stroke="#7c8ea3" stroke-width="1.4"/>');
  I.uSearch = '<span class="ibtn">' + svg(14, 14, '<circle cx="6" cy="6" r="4.6" fill="none" stroke="#2c85bf" stroke-width="1.6"/><path d="M9.4 9.4 L13 13" stroke="#2c85bf" stroke-width="1.8" stroke-linecap="round"/>') + '</span>';
  I.uOrgan = '<span class="ibtn">' + svg(15, 14, '<circle cx="7.5" cy="3.4" r="2.2" fill="none" stroke="#2c85bf" stroke-width="1.3"/><circle cx="3" cy="9" r="1.9" fill="none" stroke="#2c85bf" stroke-width="1.3"/><circle cx="12" cy="9" r="1.9" fill="none" stroke="#2c85bf" stroke-width="1.3"/><path d="M4.6 12.6 C5 10.4 10 10.4 10.4 12.6" fill="none" stroke="#2c85bf" stroke-width="1.3"/>') + '</span>';

  // 상태 아이콘: 문서(수신=파란 왼쪽 화살표, 기안=초록 오른쪽 화살표, 연계=자주 화살표) + 첨부 + 공람/긴급 + 공개구분
  function docIc(color, right) {
    var arrow = right ? '<path d="M7 5.4 h6 V2.6 l5.4 4.4 l-5.4 4.4 V8.6 H7 Z" fill="' + color + '"/>' : '<path d="M18 5.4 h-6 V2.6 L6.6 7 l5.4 4.4 V8.6 h6 Z" fill="' + color + '"/>';
    return svg(19, 13, '<path d="M1 0.6 H8.4 L11 3.2 V12.4 H1 Z" fill="#fff" stroke="#a9a9a9"/><path d="M3 4 h4 M3 6.4 h3 M3 8.8 h4" stroke="#c9c9c9"/>' + arrow);
  }
  I.stRecv = docIc('#3f7fd6'); I.stDraft = docIc('#3f9a1f', 1); I.stLink = docIc('#e040d8');
  I.clip = svg(7, 11, '<path d="M5.6 3 V8.2 A2.1 2.1 0 0 1 1.4 8.2 V2.8 A1.4 1.4 0 0 1 4.2 2.8 V7.8 A0.7 0.7 0 0 1 2.8 7.8 V3.6" fill="none" stroke="#8b8b8b" stroke-width="1"/>');
  I.ring = svg(8, 8, '<circle cx="4" cy="4" r="2.7" fill="none" stroke="#f39800" stroke-width="2"/>');
  I.urgent = svg(5, 12, '<rect x="1" y="0.5" width="3" height="7.4" fill="#f39800"/><rect x="1" y="9.2" width="3" height="2.6" fill="#f39800"/>');
  function pubIc(bg, ch) { return svg(13, 13, '<rect width="13" height="13" rx="2" fill="' + bg + '"/><text x="6.5" y="10.2" text-anchor="middle" font-family="Malgun Gothic,맑은 고딕,sans-serif" font-size="9.5" font-weight="700" fill="#fff">' + ch + '</text>'); }
  I.pub = { o: pubIc('#2f8ae8', '공'), p: pubIc('#ee7a2b', '부'), n: pubIc('#f0496b', '비') };
  I.recvArr = svg(11, 11, '<path d="M10.6 4 H6 V1.2 L0.6 5.5 L6 9.8 V7 h4.6 Z" fill="#e040d8"/>');
  I.rel = svg(13, 13, '<path d="M1.5 0.6 H8.6 L11.5 3.4 V12.4 H1.5 Z" fill="#fff" stroke="#b5b5b5"/><path d="M8.4 0.8 V3.6 H11.2" fill="none" stroke="#b5b5b5"/>');
  I.closeW = svg(13, 13, '<path d="M1.5 1.5 L11.5 11.5 M11.5 1.5 L1.5 11.5" stroke="#fff" stroke-width="1.6"/>');
  I.unit = svg(22, 13, '<rect width="22" height="13" rx="2" fill="#6f8fb3"/><text x="11" y="10" text-anchor="middle" font-family="Malgun Gothic,맑은 고딕,sans-serif" font-size="9" font-weight="700" fill="#fff">단위</text>');
  I.h2 = svg(5, 9, '<path d="M0 0 L5 4.5 L0 9 Z" fill="#3f8606"/>');
  I.guide = svg(16, 16, '<rect x="2" y="2" width="12" height="13" fill="#fff" stroke="#3f8606" stroke-width="1.3"/><path d="M5 1 v3 M11 1 v3" stroke="#3f8606" stroke-width="1.4"/><path d="M5 7.4 h6 M5 10 h6 M5 12.4 h4" stroke="#3f8606"/>');
  I.fileIc = svg(12, 14, '<path d="M1 0.6 H7.6 L11 4 V13.4 H1 Z" fill="#fff" stroke="#8fa0b5"/><path d="M3 6 h6 M3 8.4 h6 M3 10.8 h4" stroke="#b9c4d1"/>');
})();
