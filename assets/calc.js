/* Pocket's calculators, shared (SITE_TO_9.md, Stream 6). The rules are the page's JSON, from the engine
   (tools/site_calculators.py); calc-*.js run them as the engine does. No request: nothing typed leaves the page. */
(function () {
  "use strict";
  var src = document.getElementById("calc-rules");
  if (!src) return;
  var C = window.PocketCalc = {R: JSON.parse(src.textContent), RUN: {}};

  /* numbers, rounded as Python and money.py round them */
  C.top = function (v) { return v === null ? Infinity : v; };
  // round(x, nd): a tie (an exact half: x * 2^(nd+1) is an odd integer) goes to the even digit
  C.pyRound = function (x, nd) {
    var t = x * Math.pow(2, nd + 1), k = Math.pow(10, nd);
    if (Number.isInteger(t) && t % 2) { var n = Math.floor(x * k); return (n % 2 ? n + 1 : n) / k; }
    return Number(x.toFixed(nd));
  };
  // Decimal(str(x)) rounded half away from zero (money.rupees): a count of rupees (nd 0) or paise (nd 2)
  C.half = function (x, nd) {
    var s = String(Math.abs(x));
    if (s.indexOf("e") >= 0) return Math.round(x * Math.pow(10, nd));
    var i = s.indexOf("."), f = ((i < 0 ? "" : s.slice(i + 1)) + "0000").slice(0, nd + 1);
    var n = Number((i < 0 ? s : s.slice(0, i)) + f.slice(0, nd)) + (f.charAt(nd) >= "5" ? 1 : 0);
    return x < 0 ? -n : n;
  };
  var grp = C.grp = function (n) {
    var s = String(n), h = s.slice(0, -3);
    return h ? h.replace(/\B(?=(\d{2})+$)/g, ",") + "," + s.slice(-3) : s;
  };
  C.rs = function (n) { return (n < 0 ? "−₹" : "₹") + grp(Math.abs(n)); };
  var ps = C.ps = function (p) { var a = Math.abs(p); return (p < 0 ? "−₹" : "₹") + grp(Math.floor(a / 100)) + "." + ("0" + a % 100).slice(-2); };
  C.rp = function (p) { return (p < 0 ? -1 : 1) * Math.floor((Math.abs(p) + 50) / 100); };
  C.pc = function (r) { return String(C.pyRound(r * 100, 2)) + "%"; };
  C.plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };

  /* typed values: an amount in paise, half up at the third decimal (working.paise); null when it is not one */
  var paise = C.paise = function (s) {
    s = String(s).replace(/[\s,₹]/g, "");
    if (s === "") return 0;
    var m = /^(\d{0,13})(?:\.(\d*))?$/.exec(s);
    if (!m || !(m[1] || m[2])) return null;
    var f = ((m[2] || "") + "000").slice(0, 3);
    return Number((m[1] || "0") + f.slice(0, 2)) + (f.charAt(2) >= "5" ? 1 : 0);
  };
  C.rate = function (s) { s = String(s).trim().replace(/%$/, ""); return /^\d{1,2}(\.\d{1,2})?$/.test(s) ? Number(s) / 100 : null; };
  C.whole = function (s) { s = String(s).trim(); return /^\d{1,3}$/.test(s) ? Number(s) : null; };

  /* a line of the working: its label and detail, the leader, its amount (paise, or words) */
  C.rows = function (rows) {
    return rows.map(function (r) {
      return '<li class="wr' + (r[3] ? " " + r[3] : "") + '"><span class="wl">' + r[0] + (r[1] ? "<small>" + r[1] + "</small>" : "") +
        '</span><span class="ld" aria-hidden="true"></span><span class="wa">' + (typeof r[2] === "number" ? ps(r[2]) : r[2]) + "</span></li>";
    }).join("");
  };

  var root = document.querySelector(".calc"), form = root && root.querySelector("form"), out = root && root.querySelector(".calc-out");
  if (!form) return;
  var live = out.querySelector(".sr-say"), timer, FIX = "Fix the field marked above to see the figures.";
  C.form = form; C.out = out;
  C.o = function (key, html) { var e = out.querySelector('[data-o="' + key + '"]'); if (e) e.innerHTML = html; return e; };
  C.val = function (name) { var e = form.elements[name]; return e.type === "checkbox" ? e.checked : e.value; };
  C.bad = function (name, msg) {
    var e = form.elements[name], err = document.getElementById(e.id + "-e");
    e.closest(".box").classList.toggle("bad", !!msg); e.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg || ""; err.hidden = !msg;
    return !!msg;
  };
  // a money field in paise; `need` refuses zero; `rupees` refuses paise
  C.money = function (name, need, rupees) {
    var p = paise(C.val(name));
    var msg = p === null ? "Type an amount in rupees, like 18,00,000." : need && !p ? "Type an amount above zero."
      : rupees && p % 100 ? "Whole rupees, like 18,00,000." : "";
    return C.bad(name, msg) ? null : p;
  };

  C.run = function (announce) {
    var say = C.RUN[root.getAttribute("data-calc")]();
    out.classList.toggle("stale", !say);
    if (!say) C.o("say", FIX);
    clearTimeout(timer);
    if (announce) timer = setTimeout(function () { live.textContent = say || FIX; }, 700);
    return say;
  };
  C.start = function () {
    form.addEventListener("submit", function (e) { e.preventDefault(); C.run(true); });
    form.addEventListener("input", function () { C.run(true); });
    form.addEventListener("change", function (e) {        // regroup an amount once the person leaves its field
      var t = e.target, p = paise(t.value);
      if (t.getAttribute("data-kind") === "money" && p !== null && String(t.value).trim()) t.value = p % 100 ? ps(p).slice(1) : grp(p / 100);
    });
    var reset = root.querySelector(".reset");
    if (reset) reset.addEventListener("click", function () { form.reset(); C.run(true); });
    var h = /salary=(\d+)/.exec(location.hash), s = form.salary;
    if (h && s) s.value = grp(h[1]);
    C.run(false);
  };

  /* Show working: open, as on the homepage plate; the trace draws only when the person opens it */
  var sw = out.querySelector(".sw"), still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cs = getComputedStyle(document.documentElement), tok = function (n) { return cs.getPropertyValue("--" + n).trim(); },
      UI = tok("ease-ui"), TRACE = tok("ease-trace"), FAST = parseFloat(tok("t-fast")), MID = parseFloat(tok("t-ui")), SLOW = parseFloat(tok("t-trace"));
  if (sw) sw.addEventListener("click", function () {
    var open = sw.getAttribute("aria-checked") !== "true", work = out.querySelectorAll(".work"), moving = !still.matches && work[0].animate;
    sw.setAttribute("aria-checked", open ? "true" : "false");
    if (!open && moving) {
      var fades = Array.prototype.map.call(work, function (w) { return w.animate([{opacity: 1}, {opacity: 0}], {duration: FAST, easing: UI}); });
      fades[0].onfinish = function () { out.classList.remove("open"); };
      return;
    }
    out.classList.toggle("open", open);
    if (!open || !moving) return;
    out.querySelectorAll(".work .ld").forEach(function (ld, i) {
      if (ld.offsetWidth) ld.animate([{transform: "scaleX(0)"}, {transform: "scaleX(1)"}],
        {duration: SLOW, delay: Math.min(i, 7) * 40, easing: TRACE, fill: "backwards"});
    });
    out.querySelectorAll(".work small").forEach(function (n, i) {
      n.animate([{opacity: 0, transform: "translateY(4px)"}, {opacity: 1, transform: "none"}],
        {duration: MID, delay: Math.min(i, 7) * 40 + MID, easing: UI, fill: "backwards"});
    });
  });
})();
