// public/js/code128.js — สร้างบาร์โค้ดมาตรฐาน Code 128 (ชุด B) เป็น SVG ใช้บนบัตรรหัสแนะนำ
// เครื่องสแกนบาร์โค้ดทั่วไป (USB) อ่านได้ แล้วพิมพ์รหัสลงช่องที่เคอร์เซอร์อยู่ให้เอง
(function (root) {
  'use strict';
  var P = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
  function modules(text) {
    var s = String(text || '');
    var codes = [104]; // Start B
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i) - 32;
      if (c < 0 || c > 94) c = 0;
      codes.push(c);
    }
    var sum = 104;
    for (var k = 1; k < codes.length; k++) sum += codes[k] * k;
    codes.push(sum % 103);
    codes.push(106); // Stop
    var bars = [];
    codes.forEach(function (code) {
      var p = P[code];
      for (var j = 0; j < p.length; j++) bars.push({ bar: j % 2 === 0, w: Number(p[j]) });
    });
    return bars;
  }
  // svg(text, {height, module, quiet, color, bg}) -> สตริง SVG (ความกว้างเต็มตามจำนวนโมดูล)
  function svg(text, opt) {
    var o = opt || {};
    var m = o.module || 2, h = o.height || 60, q = o.quiet === undefined ? 10 : o.quiet;
    var bars = modules(text);
    var total = bars.reduce(function (a, b) { return a + b.w; }, 0);
    var W = (total + q * 2) * m;
    var x = q * m, rects = '';
    bars.forEach(function (b) {
      if (b.bar) rects += '<rect x="' + x + '" y="0" width="' + (b.w * m) + '" height="' + h + '"/>';
      x += b.w * m;
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + h + '" width="' + W + '" height="' + h + '" preserveAspectRatio="none" role="img" aria-label="บาร์โค้ด ' + String(text).replace(/[<>&"]/g, '') + '">' +
      (o.bg ? '<rect width="' + W + '" height="' + h + '" fill="' + o.bg + '"/>' : '') +
      '<g fill="' + (o.color || '#000') + '">' + rects + '</g></svg>';
  }
  // วาดลง canvas (ใช้ตอนสร้างรูปบัตรให้ลูกค้าบันทึก)
  function draw(ctx, text, x, y, w, h, color) {
    var bars = modules(text);
    var total = bars.reduce(function (a, b) { return a + b.w; }, 0);
    var m = w / total, cx = x;
    ctx.fillStyle = color || '#000';
    bars.forEach(function (b) {
      if (b.bar) ctx.fillRect(Math.round(cx), y, Math.max(1, Math.round(b.w * m)), h);
      cx += b.w * m;
    });
  }
  root.Code128 = { svg: svg, draw: draw, modules: modules };
})(typeof window !== 'undefined' ? window : this);
