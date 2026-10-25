// 공문 본문 구성과 저장(내려받기). 본 화면의 PC저장과 문서창이 함께 쓴다.
(function () {
  var VE = window.VE, C = VE.CONFIG;
  var PUB = { o: '공개', p: '부분공개', n: '비공개' };

  function signer(org) {
    if (/교육지원청$/.test(org)) return org + '교육장';
    if (/교육청$/.test(org)) return org.replace(/교육청$/, '교육감');
    return org + '장';
  }
  // 공문 한 건을 화면·파일 양쪽에서 쓸 수 있는 조각으로 나눈다 (강원특별자치도교육청 공문 서식의 구성을 따른다)
  var HEADS = ['남기훈', '서미란', '차준혁', '우정아', '봉태식', '심가은', '여운형'];
  function headOf(key) { var h = 0; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 997; return HEADS[h % HEADS.length]; }
  VE.pubLabel = function (d) { return d.pub === 'o' ? '공개' : PUB[d.pub] + '(6)'; };
  VE.docParts = function (d) {
    var recv = d.k === 'r', org = recv ? d.from[0] : C.school, lines = d.b.slice(), att = d.att || [];
    var office = /교육(지원)?청$/.test(org), attLine = '';
    if (att.length) {
      var names = att.map(function (x) { return x[0].replace(/^\[붙임\d*\]\s*/, '').replace(/\.[a-z0-9]+$/i, ''); });
      attLine = names.length === 1 ? '붙임  ' + names[0] + ' 1부.  끝.' : names.map(function (n, i) { return (i === 0 ? '붙임  ' : '      ') + (i + 1) + '. ' + n + ' 1부.' + (i === names.length - 1 ? '  끝.' : ''); }).join('\n');
    } else if (lines.length && !/끝\.\s*$/.test(lines[lines.length - 1])) lines[lines.length - 1] += '  끝.';
    var sign, w = recv ? d.w.split(' ') : null;
    if (!recv) sign = VE.lines(d).map(function (l, i) { return [(i === 0 ? '★' : '') + (l.pos === '교장' ? '학교장' : l.pos), l.who]; });
    else if (office) sign = [['★' + w[0], w[1]], [(d.from[1] || '') + '장', '전결 ' + headOf(org + d.from[1])]];
    else sign = [['★' + w[0], w[1]], ['교감', headOf(org + '교감')], ['학교장', headOf(org + '교장')]];
    var no = d.no ? C.school + '-' + d.no : '';
    return {
      slogan: recv ? (office ? C.officeSlogan : '꿈을 키우는 행복한 학교') : C.slogan,
      org: org, recv: recv ? '수신자 참조' : (d.recv || '내부결재'), via: '(경유)', title: d.t, lines: lines, att: attLine,
      signer: recv ? signer(org) : '', recvList: recv ? '관내 초등학교장' : '',
      sign: sign,
      enfNo: recv ? (d.from[1] || org) + '-' + d.on : no, enfDate: recv ? VE.dots(VE.addDays(d.d, -1)) : (d.no ? VE.dots(d.d) : ''),
      rcvNo: recv ? no : '', rcvDate: recv ? VE.dots(d.d) : '',
      zip: recv ? '00000' : C.zip, addr: recv ? (office ? '강원특별자치도 가상시 연수로 1' : '강원특별자치도 가상시 배움로 10') : C.addr,
      home: recv ? (office ? 'http://office.example.go.kr' : 'http://school.example.es.kr') : C.home,
      tel: recv ? '033-000-1000' : C.tel, fax: recv ? '033-000-1001' : C.fax, email: recv ? '' : C.email,
      pub: VE.pubLabel(d), foot: C.footSlogan
    };
  };
  VE.bodyParas = function (d) {
    var p = VE.docParts(d), out = [p.slogan, p.org, '', '수신  ' + p.recv, p.via, '제목  ' + p.title, ''];
    p.lines.forEach(function (l) { out.push(l.replace(/^ +/, function (sp) { return new Array(sp.length + 1).join('  '); })); });
    if (p.att) { out.push(''); p.att.split('\n').forEach(function (l) { out.push(l); }); }
    out.push('');
    if (p.signer) out.push(p.signer, '');
    if (p.recvList) out.push('수신자  ' + p.recvList);
    out.push(p.sign.map(function (x) { return x[0] + ' ' + x[1]; }).join('    '), '협조자',
      '시행  ' + p.enfNo + ' (' + p.enfDate + ')    접수  ' + p.rcvNo + (p.rcvDate ? ' (' + p.rcvDate + ')' : ' (  )'),
      '우 ' + p.zip + '  ' + p.addr + '  / ' + p.home,
      '전화 ' + p.tel + '  /전송 ' + p.fax + '  / ' + p.email + '  / ' + p.pub, '', p.foot, '', '※ 연수용 가상 문서입니다. 실제 공문이 아닙니다.');
    return out;
  };

  // ── 내려받기 ──
  VE.download = function (name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name.replace(/[\\/:*?"<>|]/g, '_');
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  // 압축 없는 ZIP 으로 ODT 를 만든다 (외부 라이브러리 없이)
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u16(v) { return [v & 255, (v >> 8) & 255]; }
  function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f[0]), dat = enc.encode(f[1]), crc = crc32(dat);
      var head = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dat.length), u32(dat.length), u16(nm.length), u16(0));
      parts.push(new Uint8Array(head), nm, dat);
      central.push({ h: [].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dat.length), u32(dat.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), nm: nm });
      off += head.length + nm.length + dat.length;
    });
    var cs = 0;
    central.forEach(function (c) { parts.push(new Uint8Array(c.h), c.nm); cs += c.h.length + c.nm.length; });
    parts.push(new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(files.length), u16(files.length), u32(cs), u32(off), u16(0))));
    return new Blob(parts, { type: 'application/vnd.oasis.opendocument.text' });
  }
  function x(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  VE.odt = function (paras) {
    var body = paras.map(function (p, i) { return '<text:p text:style-name="' + (i === 1 ? 'T' : i === 0 ? 'S' : 'P') + '">' + x(p).replace(/ {2,}/g, function (s) { return '<text:s text:c="' + s.length + '"/>'; }) + '</text:p>'; }).join('');
    var content = '<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2"><office:automatic-styles><style:style style:name="T" style:family="paragraph"><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="20pt" fo:font-weight="bold" style:font-size-asian="20pt" style:font-weight-asian="bold"/></style:style><style:style style:name="S" style:family="paragraph"><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="10pt" style:font-size-asian="10pt"/></style:style><style:style style:name="P" style:family="paragraph"><style:text-properties fo:font-size="12pt" style:font-size-asian="12pt"/></style:style></office:automatic-styles><office:body><office:text>' + body + '</office:text></office:body></office:document-content>';
    var manifest = '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>';
    return zip([['mimetype', 'application/vnd.oasis.opendocument.text'], ['content.xml', content], ['META-INF/manifest.xml', manifest]]);
  };
  // 저장 파일 이름: 3 = (문서번호 (본문) 발송기관) 제목 / 2 = 제목 [문서번호 (본문)] / 4 = 제목 (문서번호 (본문))
  VE.saveName = function (d, kind, label, nameFmt) {
    var no = d.no ? C.school + '-' + d.no : C.school + '-임시', who = VE.val(d, 'sender');
    if (nameFmt === 2) return label + ' [' + no + ' (' + kind + ')]';
    if (nameFmt === 4) return label + ' (' + no + ' (' + kind + '))';
    return '(' + no + ' (' + kind + ') ' + who + ') ' + label;
  };
  VE.saveDoc = function (d, opt) {
    var saved = [];
    if (opt.body) { var n = VE.saveName(d, '본문', d.t, opt.name) + '.odt'; VE.download(n, VE.odt(VE.bodyParas(d))); saved.push(n); }
    if (opt.att) (d.att || []).forEach(function (a, i) {
      var nm = VE.saveName(d, '첨부', a[0], opt.name) + '.txt';
      setTimeout(function () { VE.download(nm, '연수용 가상 첨부파일입니다.\r\n\r\n원래 파일 이름: ' + a[0] + '\r\n용량: ' + a[1] + '\r\n문서: ' + d.t + '\r\n\r\n실제 내용은 없습니다. (연수용 가상 K-에듀파인)\r\n'); }, 350 * (i + 1));
      saved.push(nm);
    });
    if (opt.info) {
      var m = VE.saveName(d, '문서정보', d.t, opt.name) + '.txt';
      setTimeout(function () { VE.download(m, ['제목: ' + d.t, '문서번호: ' + VE.val(d, 'noFull'), '과제카드: ' + (VE.TASKS[d.task] || ''), '대국민공개여부: ' + PUB[d.pub], '등록일시: ' + VE.val(d, 'regDT'), '결재경로: ' + VE.lines(d).map(function (l) { return l.how + ' ' + l.who; }).join(' → ')].join('\r\n')); }, 200);
      saved.push(m);
    }
    return saved;
  };
})();
