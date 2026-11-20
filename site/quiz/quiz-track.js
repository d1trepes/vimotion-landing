/* ViMotion: анкета. Карта трассы (только оформление). Трасса: прямые со скруглёнными поворотами разной крутизны (стартовая прямая внизу, шикана, шпилька).
   Скрипт ничего не меняет в логике анкеты: он рисует слева тёмную панель с картой трассы на 10 отметок
   и следит за текстом #stepLabel («Шаг N из 10»), который обновляет основной скрипт анкеты.
   При смене шага болид едет по трассе к отметке N, за ним прорисовывается красная линия, номер шага в углу.
   На телефоне панель скрыта стилями (там прогресс показывает прямая дорожка). При prefers-reduced-motion болид переставляется без езды. */
(function () {
  "use strict";
  var label = document.getElementById("stepLabel");
  var shell = document.querySelector(".shell");
  if (!label || !shell || !document.createElementNS) return;

  var NS = "http://www.w3.org/2000/svg";
  var D = "M220 684 L128.0 684.0 Q88 684 82.0 644.5 L71.4 575.6 Q66 540 96.4 520.7 L147.3 488.3 Q176 470 181.2 436.4 L184.0 417.7 Q188 392 164.7 380.4 L118.8 357.4 Q92 344 92.0 314.0 L92.0 220.0 Q92 186 110.4 157.4 L130.5 126.3 Q150 96 178.8 117.6 L204.4 136.8 Q222 150 239.0 136.0 L279.9 102.5 Q300 86 322.2 99.5 L340.3 110.5 Q366 126 360.5 155.5 L337.3 280.7 Q330 320 344.9 357.1 L357.4 388.4 Q370 420 370.0 454.0 L370.0 572.0 Q370 612 345.4 643.6 L338.6 652.4 Q314 684 274.0 684.0 L220 684Z";
  var CAR = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 92"><path d="M4 7h36v8H4z" fill="#141414"/><path d="M7 9h30v4H7z" fill="#9A0002"/><rect x="2" y="18" width="9" height="17" rx="3.5" fill="#0d0d0d"/><rect x="33" y="18" width="9" height="17" rx="3.5" fill="#0d0d0d"/><rect x="1" y="60" width="10" height="20" rx="3.5" fill="#0d0d0d"/><rect x="33" y="60" width="10" height="20" rx="3.5" fill="#0d0d0d"/><path d="M19 2h6l2.5 20 6 10v12l-2 6 2 6v14l-4 14H14.5l-4-14V56l2-6-2-6V32l6-10z" fill="#9A0002"/><path d="M20 4h4l2 18h-8z" fill="#b8191b"/><path d="M12 50l-5 2v14l5 2zM32 50l5 2v14l-5 2z" fill="#7d0002"/><ellipse cx="22" cy="43" rx="5" ry="7.5" fill="#111"/><circle cx="22" cy="42" r="3" fill="#EFE6DE"/><path d="M5 82h34v8H5z" fill="#141414"/><path d="M8 84h28v3H8z" fill="#9A0002"/></svg>');
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* панель */
  var aside = document.createElement("aside");
  aside.className = "qmap";
  aside.setAttribute("aria-hidden", "true");
  var count = document.createElement("p");
  count.className = "qmap-n";
  count.innerHTML = '<b>01</b><span> / 10</span>';
  aside.appendChild(count);
  var svg = el("svg", { viewBox: "36 56 366 660", preserveAspectRatio: "xMidYMid meet" });
  aside.appendChild(svg);
  shell.insertBefore(aside, shell.firstChild);
  document.documentElement.classList.add("has-qmap");

  var defs = el("defs", {}, svg);
  var pat = el("pattern", { id: "qmap-chk", width: 8, height: 8, patternUnits: "userSpaceOnUse" }, defs);
  el("rect", { width: 8, height: 8, fill: "#111" }, pat);
  el("rect", { width: 4, height: 4, fill: "#F6EEE6" }, pat);
  el("rect", { x: 4, y: 4, width: 4, height: 4, fill: "#F6EEE6" }, pat);

  el("path", { d: D, fill: "none", stroke: "#2b2927", "stroke-width": 40, "stroke-linejoin": "round" }, svg); /* обочина */
  var road = el("path", { d: D, fill: "none", stroke: "#3a3735", "stroke-width": 30, "stroke-linejoin": "round" }, svg);
  el("path", { d: D, fill: "none", stroke: "rgba(246,238,230,.28)", "stroke-width": 1.5, "stroke-dasharray": "9 11" }, svg);

  var total = road.getTotalLength();
  /* старт/финиш у точки начала пути, отметки 1..10 равномерно по кругу */
  var START = 0.035, END = 0.965;
  function lenFor(step, steps) { return total * (START + (END - START) * (step - 1) / Math.max(1, steps - 1)); }

  var trail = el("path", { d: D, fill: "none", stroke: "#9A0002", "stroke-width": 4, "stroke-linecap": "round" }, svg);
  trail.style.strokeDasharray = total + " " + total;
  trail.style.strokeDashoffset = total;

  /* финишная клетка поперёк дороги в начале пути */
  var p0 = road.getPointAtLength(0), p1 = road.getPointAtLength(2);
  var a0 = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  el("rect", { x: p0.x - 5, y: p0.y - 15, width: 10, height: 30, fill: "url(#qmap-chk)", transform: "rotate(" + a0 + " " + p0.x + " " + p0.y + ")" }, svg);

  var gDots = el("g", {}, svg); /* отметки отдельной группой под болидом */
  var dots = [], steps = 10;
  function drawDots(n) {
    dots.forEach(function (d) { d.remove(); });
    dots = [];
    for (var i = 1; i <= n; i++) {
      var p = road.getPointAtLength(lenFor(i, n));
      dots.push(el("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7, class: "qmap-dot" }, gDots));
    }
  }
  drawDots(steps);

  var car = el("image", { href: CAR, width: 26, height: 54, x: -13, y: -27 }, svg);

  var cur = lenFor(1, steps), raf = 0;
  function place(L) {
    var p = road.getPointAtLength(L), q = road.getPointAtLength(Math.min(total, L + 1.5));
    var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI + 90;
    car.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ") rotate(" + ang.toFixed(1) + ")");
    trail.style.strokeDashoffset = (total - L).toFixed(1);
  }
  function drive(to) {
    cancelAnimationFrame(raf);
    if (reduce) { cur = to; place(cur); return; }
    var from = cur, t0 = 0, dur = Math.min(1400, 500 + Math.abs(to - from) * 2);
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tick(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur);
      cur = from + (to - from) * ease(k);
      place(cur);
      if (k < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    var m = (label.textContent || "").match(/(\d+)\D+(\d+)/);
    if (!m) return;
    var n = parseInt(m[1], 10), all = parseInt(m[2], 10);
    if (all !== steps) { steps = all; drawDots(steps); }
    dots.forEach(function (d, i) { d.classList.toggle("on", i < n); });
    count.querySelector("b").textContent = (n < 10 ? "0" : "") + n;
    count.querySelector("span").textContent = " / " + steps;
    drive(lenFor(n, steps));
  }

  place(cur);
  sync();
  if (window.MutationObserver) new MutationObserver(sync).observe(label, { childList: true, characterData: true, subtree: true });
})();
