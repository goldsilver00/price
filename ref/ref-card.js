// public/js/ref-card.js — แบบบัตรแนะนำเพื่อน (ใช้ร่วมกัน: พิมพ์กระดาษ / เว็บลูกค้า / รูปที่ส่งใน LINE)
// variant 'print' = พื้นขาว (ประหยัดหมึก) · 'line' = พื้นแดงทอง (แสดงในมือถือ/ส่งใน LINE)
// ตำแหน่งทุกอย่างกำหนดเป็นหน่วย u (บัตร 85.6 × 54 u = ขนาดบัตรเครดิตเป็นมิลลิเมตร)
// ต้องโหลด code128.js ก่อน และหน้าเว็บต้องมี @font-face: Anuphan, Public Sans, Bodoni Moda (RefCard.fontCss)
(function (root) {
  'use strict';
  // ที่อยู่ของรูป/ฟอนต์: โฟลเดอร์เดียวกับไฟล์นี้ (บน GitHub = .../price/ref/) · ถ้าเป็นสำเนาในโปรแกรมร้าน (/js/) ใช้ /ref/ ของเซิร์ฟเวอร์ร้าน
  var BASE = (function () {
    try {
      var src = (document.currentScript && document.currentScript.src) || '';
      if (!src) return '/ref/';
      var dir = src.replace(/[^/]*(\?.*)?$/, '');
      return /\/js\/$/.test(dir) ? dir.replace(/\/js\/$/, '/ref/') : dir;
    } catch (e) { return '/ref/'; }
  })();
  var W = 85.6, H = 54;
  var THEME = {
    print: { logo: '#6d0c13', divider: '#c9a24a', title: '#6d0c13', sub: '#b07d1e', boxLine: '#6d0c13', label: '#ffffff', labelBg: '#6d0c13',
      code: '#6d0c13', cond: '#4a1a1d', condHead: '#a31f24', foot: '#ffffff', footBg: '#6d0c13' },
    line: { logo: '#f5c75a', divider: '#d9a94a', title: '#ffffff', sub: '#f5c75a', boxLine: null, label: '#6d0c13', labelBg: null,
      code: '#6d0c13', cond: '#ffffff', condHead: '#ffde59', foot: '#ffde59', footBg: 'rgba(0,0,0,.28)' },
  };
  var F = {
    th: "'Anuphan','Leelawadee UI','Tahoma',sans-serif",
    en: "'Public Sans','Anuphan',sans-serif",
    bod: "'Bodoni Moda','Times New Roman',serif",
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return Number(n || 0).toLocaleString('en-US'); }
  // ข้อมูลบัตร: { code, name (ชื่อผู้แนะนำ), min (ยอดขั้นต่ำ), footer (เบอร์ร้าน) }
  function condParts(d) {
    return ['ลูกค้าใหม่ต้องมียอดขายขั้นต่ำ ' + money(d.min) + ' บาท', 'และทำธุรกรรมสำเร็จ ผู้แนะนำจึงจะได้รับรางวัลตอบแทน'];
  }
  function label(d) { return 'รหัสแนะนำ · คุณ' + (d.name || ''); }

  // ---------- โครงตำแหน่ง (หน่วย u) ----------
  var L = {
    lh: { x: 4.6, cy: 9.2, size: 10.2 },
    th: { x: 4.7, cy: 15.4, size: 3.95 },
    div: { x: 23.0, y: 4.6, w: 0.32, h: 11.6 },
    title: { x: 25.4, cy: 8.8, size: 5.3 },
    sub: { x: 25.5, cy: 13.8, size: 3.35 },
    box: { x: 4.5, y: 18.2, w: 45.5, h: 13.2, r: 2.2 },
    labelH: 4.3,
    code: { cy: 27.0, size: 7.4, ls: 0.45 },
    bc: { x: 4.5, y: 32.6, w: 45.5, h: 7.4 },
    cond: { x: 4.5, y: 41.3, w: 49, size: 2.08, lh: 2.7 },
    foot: { y: 49.7, size: 2.3 },
    masc: { x: 52.5, bottom: 49.7, h: 38.5 },
  };

  // ---------- HTML (พิมพ์ / แสดงในเว็บ) ----------
  // ใช้ CSS ตัวแปร --u เป็นขนาด 1 หน่วย (พิมพ์: 1mm · เว็บ: กว้างกล่อง/85.6)
  function u(v) { return 'calc(var(--u) * ' + v + ')'; }
  function css() {
    return '' +
      '.rc{position:relative;width:' + u(W) + ';height:' + u(H) + ';overflow:hidden;font-family:' + F.th + ';-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.rc *{position:absolute;margin:0;padding:0;box-sizing:border-box;white-space:nowrap;}' +
      '.rc.print{background:#fff;}' +
      '.rc.line{background:radial-gradient(120% 140% at 80% 30%,#b3262c 0%,#86141b 38%,#5a0d12 75%,#3d0a0e 100%);}' +
      '.rc.line .swirl{inset:0;background:radial-gradient(60% 45% at 18% 110%,rgba(255,200,90,.16),rgba(255,200,90,0) 70%),radial-gradient(45% 40% at 100% 0%,rgba(255,215,120,.18),rgba(255,215,120,0) 70%);}' +
      '.rc .t{line-height:1;}' +
      '.rc .cond{white-space:normal;}' +
      '.rc .bc svg{position:static;display:block;width:100%;height:100%;}' +
      '.rc img{display:block;}';
  }
  function txt(cls, text, x, cy, size, font, weight, color, extra) {
    return '<div class="t ' + cls + '" style="left:' + u(x) + ';top:' + u(cy - size / 2) + ';height:' + u(size) + ';line-height:' + u(size) + ';font-size:' + u(size) +
      ';font-family:' + font + ';font-weight:' + weight + ';color:' + color + ';' + (extra || '') + '">' + esc(text) + '</div>';
  }
  function html(d, variant, origin) {
    var v = variant === 'line' ? 'line' : 'print', T = THEME[v], o = origin || '';
    var b = L.box, cx = b.x + b.w / 2;
    var s = '<div class="rc ' + v + '">';
    if (v === 'line') s += '<div class="swirl"></div>';
    s += txt('lh', 'LH', L.lh.x, L.lh.cy, L.lh.size, F.bod, 600, T.logo, 'letter-spacing:' + u(0.2));
    s += txt('th', 'หลอมทอง', L.th.x, L.th.cy, L.th.size, F.th, 800, T.logo, 'font-style:italic');
    s += '<div style="left:' + u(L.div.x) + ';top:' + u(L.div.y) + ';width:' + u(L.div.w) + ';height:' + u(L.div.h) + ';background:' + T.divider + '"></div>';
    s += txt('title', 'บัตรแนะนำเพื่อน', L.title.x, L.title.cy, L.title.size, F.th, 700, T.title);
    s += txt('sub', 'Friend Referral Card', L.sub.x, L.sub.cy, L.sub.size, F.bod, 600, T.sub, 'font-style:italic');
    // กรอบรหัส
    if (v === 'print') {
      s += '<div style="left:' + u(b.x) + ';top:' + u(b.y) + ';width:' + u(b.w) + ';height:' + u(b.h) + ';border:' + u(0.45) + ' solid ' + T.boxLine + ';border-radius:' + u(b.r) + ';background:#fff;overflow:hidden">' +
        '<div style="left:0;top:0;right:0;height:' + u(L.labelH) + ';background:' + T.labelBg + '"></div></div>';
    } else {
      s += '<div style="left:' + u(b.x) + ';top:' + u(b.y) + ';width:' + u(b.w) + ';height:' + u(b.h) + ';border-radius:' + u(b.r) +
        ';background:linear-gradient(180deg,#ffeeb0 0%,#f7cf63 55%,#e9b544 100%);box-shadow:0 ' + u(0.4) + ' ' + u(1.2) + ' rgba(0,0,0,.35)"></div>';
    }
    s += '<div class="t" style="left:' + u(b.x) + ';width:' + u(b.w) + ';text-align:center;top:' + u(b.y) + ';height:' + u(L.labelH) + ';line-height:' + u(L.labelH) +
      ';font-size:' + u(2.35) + ';font-weight:700;color:' + T.label + ';overflow:hidden;text-overflow:ellipsis;padding:0 ' + u(1) + '">' + esc(label(d)) + '</div>';
    s += '<div class="t" style="left:' + u(b.x) + ';width:' + u(b.w) + ';text-align:center;top:' + u(L.code.cy - L.code.size / 2) + ';height:' + u(L.code.size) + ';line-height:' + u(L.code.size) +
      ';font-size:' + u(L.code.size) + ';font-family:' + F.en + ';font-weight:800;color:' + T.code + ';letter-spacing:' + u(L.code.ls) + ';padding-left:' + u(L.code.ls) + '">' + esc(d.code) + '</div>';
    // บาร์โค้ด
    var bc = L.bc;
    if (v === 'line') {
      s += '<div style="left:' + u(bc.x) + ';top:' + u(bc.y - 0.6) + ';width:' + u(bc.w) + ';height:' + u(bc.h + 1.2) + ';background:#fff;border-radius:' + u(1.3) + '"></div>';
      s += '<div class="bc" style="left:' + u(bc.x + 2) + ';top:' + u(bc.y + 0.2) + ';width:' + u(bc.w - 4) + ';height:' + u(bc.h - 0.4) + '">' + Code128.svg(d.code, { height: 60, module: 2, quiet: 0 }) + '</div>';
    } else {
      s += '<div class="bc" style="left:' + u(bc.x) + ';top:' + u(bc.y) + ';width:' + u(bc.w) + ';height:' + u(bc.h) + '">' + Code128.svg(d.code, { height: 60, module: 2, quiet: 0 }) + '</div>';
    }
    // เงื่อนไข
    var c = L.cond;
    s += '<div class="cond" style="left:' + u(c.x) + ';top:' + u(c.y) + ';width:' + u(c.w) + ';font-size:' + u(c.size) + ';line-height:' + u(c.lh) + ';color:' + T.cond + '">' +
      '<b style="position:static;color:' + T.condHead + '">เงื่อนไข: </b>' + condParts(d).map(esc).join('<br>') + '</div>';
    // มาสคอต
    var m = L.masc;
    s += '<img alt="" src="' + BASE + 'img/mascot-wave.webp" style="left:' + u(m.x) + ';top:' + u(m.bottom - m.h) + ';height:' + u(m.h) + '">';
    // ขอบล่าง: เบอร์ร้าน
    s += '<div style="left:0;right:0;top:' + u(L.foot.y) + ';bottom:0;background:' + T.footBg + '"></div>';
    s += '<div class="t" style="left:0;width:' + u(W) + ';text-align:center;top:' + u(L.foot.y) + ';height:' + u(H - L.foot.y) + ';line-height:' + u(H - L.foot.y) +
      ';font-size:' + u(L.foot.size) + ';font-weight:600;color:' + T.foot + '">' + esc(d.footer || '') + '</div>';
    return s + '</div>';
  }

  // ---------- วาดลง canvas (รูปบัตรที่ลูกค้าบันทึก/ส่งใน LINE) ----------
  function img(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  async function toCanvas(d, variant, scale) {
    var v = variant === 'print' ? 'print' : 'line', T = THEME[v], k = scale || 12;
    var cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    var x = cv.getContext('2d');
    try {
      await Promise.all(['800 40px Anuphan', '700 40px Anuphan', 'italic 800 40px Anuphan', '800 40px "Public Sans"', '600 40px "Bodoni Moda"', 'italic 600 40px "Bodoni Moda"']
        .map(function (f) { return document.fonts.load(f); }));
    } catch (e) {}
    var masc = await img(BASE + 'img/mascot-wave.webp');
    function rr(px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
    function font(style, weight, size, fam) { x.font = (style ? style + ' ' : '') + weight + ' ' + (size * k) + 'px ' + fam; }
    function text(t, px, cy, color, align) { x.fillStyle = color; x.textAlign = align || 'left'; x.textBaseline = 'middle'; x.fillText(t, px * k, cy * k); }
    // พื้น
    rr(0, 0, cv.width, cv.height, 3.2 * k); x.save(); x.clip();
    if (v === 'line') {
      var g = x.createRadialGradient(0.8 * cv.width, 0.3 * cv.height, 0, 0.8 * cv.width, 0.3 * cv.height, 1.15 * cv.width);
      g.addColorStop(0, '#b3262c'); g.addColorStop(0.33, '#86141b'); g.addColorStop(0.66, '#5a0d12'); g.addColorStop(1, '#3d0a0e');
      x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
      var g2 = x.createRadialGradient(0.18 * cv.width, 1.1 * cv.height, 0, 0.18 * cv.width, 1.1 * cv.height, 0.5 * cv.width);
      g2.addColorStop(0, 'rgba(255,200,90,.18)'); g2.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = g2; x.fillRect(0, 0, cv.width, cv.height);
      var g3 = x.createRadialGradient(cv.width, 0, 0, cv.width, 0, 0.4 * cv.width);
      g3.addColorStop(0, 'rgba(255,215,120,.2)'); g3.addColorStop(1, 'rgba(255,215,120,0)'); x.fillStyle = g3; x.fillRect(0, 0, cv.width, cv.height);
    } else { x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); }
    // หัวบัตร
    font('', 600, L.lh.size, '"Bodoni Moda", serif'); if ('letterSpacing' in x) x.letterSpacing = (0.2 * k) + 'px';
    text('LH', L.lh.x, L.lh.cy, T.logo); if ('letterSpacing' in x) x.letterSpacing = '0px';
    font('italic', 800, L.th.size, 'Anuphan, sans-serif'); text('หลอมทอง', L.th.x, L.th.cy, T.logo);
    x.fillStyle = T.divider; x.fillRect(L.div.x * k, L.div.y * k, L.div.w * k, L.div.h * k);
    font('', 700, L.title.size, 'Anuphan, sans-serif'); text('บัตรแนะนำเพื่อน', L.title.x, L.title.cy, T.title);
    font('italic', 600, L.sub.size, '"Bodoni Moda", serif'); text('Friend Referral Card', L.sub.x, L.sub.cy, T.sub);
    // กรอบรหัส
    var b = L.box, cx = b.x + b.w / 2;
    if (v === 'line') {
      x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 1.2 * k; x.shadowOffsetY = 0.4 * k;
      var gg = x.createLinearGradient(0, b.y * k, 0, (b.y + b.h) * k); gg.addColorStop(0, '#ffeeb0'); gg.addColorStop(0.55, '#f7cf63'); gg.addColorStop(1, '#e9b544');
      rr(b.x * k, b.y * k, b.w * k, b.h * k, b.r * k); x.fillStyle = gg; x.fill(); x.restore();
    } else {
      rr(b.x * k, b.y * k, b.w * k, b.h * k, b.r * k); x.fillStyle = '#fff'; x.fill();
      x.save(); x.clip(); x.fillStyle = T.labelBg; x.fillRect(b.x * k, b.y * k, b.w * k, L.labelH * k); x.restore();
      x.lineWidth = 0.45 * k; x.strokeStyle = T.boxLine; rr((b.x + 0.225) * k, (b.y + 0.225) * k, (b.w - 0.45) * k, (b.h - 0.45) * k, (b.r - 0.2) * k); x.stroke();
    }
    font('', 700, 2.35, 'Anuphan, sans-serif');
    var lab = label(d); while (x.measureText(lab).width > (b.w - 2) * k && lab.length > 4) lab = lab.slice(0, -2) + '…';
    text(lab, cx, b.y + L.labelH / 2, T.label, 'center');
    font('', 800, L.code.size, '"Public Sans", sans-serif'); if ('letterSpacing' in x) x.letterSpacing = (L.code.ls * k) + 'px';
    text(d.code, cx + L.code.ls / 2, L.code.cy, T.code, 'center'); if ('letterSpacing' in x) x.letterSpacing = '0px';
    // บาร์โค้ด
    var bc = L.bc;
    if (v === 'line') {
      rr(bc.x * k, (bc.y - 0.6) * k, bc.w * k, (bc.h + 1.2) * k, 1.3 * k); x.fillStyle = '#fff'; x.fill();
      Code128.draw(x, d.code, (bc.x + 2) * k, (bc.y + 0.2) * k, (bc.w - 4) * k, (bc.h - 0.4) * k, '#000');
    } else Code128.draw(x, d.code, bc.x * k, bc.y * k, bc.w * k, bc.h * k, '#000');
    // เงื่อนไข (ตัดบรรทัดตามความกว้าง)
    var c = L.cond, head = 'เงื่อนไข: ';
    font('', 700, c.size, 'Anuphan, sans-serif'); var hw = x.measureText(head).width;
    font('', 400, c.size, 'Anuphan, sans-serif');
    var lines = condParts(d);
    lines.forEach(function (ln, i) {
      var y = c.y + c.lh * (i + 0.5);
      if (i === 0) { font('', 700, c.size, 'Anuphan, sans-serif'); text(head, c.x, y, T.condHead); font('', 400, c.size, 'Anuphan, sans-serif'); text(ln, c.x + hw / k, y, T.cond); }
      else text(ln, c.x, y, T.cond);
    });
    // มาสคอต
    if (masc) { var m = L.masc, mw = m.h * masc.width / masc.height; x.drawImage(masc, m.x * k, (m.bottom - m.h) * k, mw * k, m.h * k); }
    // ขอบล่าง
    x.fillStyle = T.footBg; x.fillRect(0, L.foot.y * k, cv.width, (H - L.foot.y) * k);
    font('', 600, L.foot.size, 'Anuphan, sans-serif'); text(d.footer || '', W / 2, (L.foot.y + H) / 2, T.foot, 'center');
    x.restore();
    return cv;
  }
  function fontCss() {
    return "@font-face{font-family:'Anuphan';src:url('" + BASE + "fonts/Anuphan.ttf') format('truetype');font-weight:100 900;}" +
      "@font-face{font-family:'Public Sans';src:url('" + BASE + "fonts/PublicSans.ttf') format('truetype');font-weight:100 900;}" +
      "@font-face{font-family:'Bodoni Moda';src:url('" + BASE + "fonts/Bodoni.ttf') format('truetype');font-weight:400 900;}";
  }
  root.RefCard = { base: BASE, html: html, css: css, fontCss: fontCss, toCanvas: toCanvas, W: W, H: H };
})(typeof window !== 'undefined' ? window : this);
