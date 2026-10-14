/* The SIP calculator: planning.sip_fv_months and cost_of_delay. Every instalment is paid at the start of its month,
   as every SIP in Pocket is, and a step-up comes after every twelfth instalment. */
(function () {
  "use strict";
  var C = window.PocketCalc;
  if (!C) return;
  var rs = C.rs, pc = C.pc, pr = C.pyRound, pl = C.plural;

  function sip(m, months, r, s) {
    var mr = Math.pow(1 + r, 1 / 12) - 1, bal = 0, mm = m, paid = 0, years = [];
    for (var i = 0; i < months; i++) {
      bal = (bal + mm) * (1 + mr); paid += mm;
      if ((i + 1) % 12 === 0) { years.push([mm, bal]); mm *= (1 + s); }
    }
    return {mr: mr, fv: bal, paid: paid, years: years};
  }
  C.sip = sip;

  C.RUN.sip = function () {
    var m = C.money("m", true, true), y = C.whole(C.val("y")), r = C.rate(C.val("r")), s = C.rate(C.val("s")), dl = C.whole(C.val("d"));
    var ok = m !== null;
    ok = !C.bad("y", y === null || y < 1 || y > 50 ? "Whole years, 1 to 50." : "") && ok;
    ok = !C.bad("r", r === null || r > 0.3 ? "A rate from 0 to 30, like 10." : "") && ok;
    ok = !C.bad("s", s === null || s > 0.5 ? "A rate from 0 to 50, like 10; 0 for a flat SIP." : "") && ok;
    ok = !C.bad("d", dl === null || dl < 1 || (y && dl > y * 12) ? "Whole months, 1 to " + (y ? y * 12 : 600) + "." : "") && ok;
    if (!ok) return null;
    m /= 100;
    var n = y * 12, a = sip(m, n, r, s), b = sip(m, n - dl, r, s);
    var fv = pr(a.fv, 0), paid = pr(a.paid, 0), dfv = pr(b.fv, 0), lost = pr(100 * (a.fv - b.fv) / a.fv, 1);
    C.o("fv", rs(fv)); C.o("yrs", pl(y, "year"));
    var say = rs(m) + " a month for " + pl(y, "year") + ", at an assumed " + pc(r) + " a year" + (s ? " and rising " + pc(s) + " a year" : "") +
      ", comes to " + rs(fv) + ", of which " + rs(paid) + " is what was paid in.";
    C.o("say", say);
    C.o("rows", C.rows([
      ["Monthly rate", "(1 + " + pc(r) + ")<sup>1/12</sup> − 1, so twelve months come to " + pc(r), (a.mr * 100).toFixed(4) + "%"],
      ["Instalments", "each paid at the start of its month", String(n)],
      ["Paid in", s ? rs(m) + " a month in year 1, rising " + pc(s) + " a year to " + rs(pr(a.years[y - 1][0], 0)) + " in year " + y
        : n + " × " + rs(m), rs(paid)],
      ["Growth", "each instalment compounding from the month it is paid", rs(fv - paid)],
      ["Future value", "", rs(fv), "tot"]]));
    C.o("years", a.years.map(function (v, i) {
      return "<tr><td>" + (i + 1) + '</td><td class="n">' + rs(pr(v[0], 0)) + '</td><td class="n">' + rs(pr(12 * v[0], 0)) +
        '</td><td class="n">' + rs(pr(v[1], 0)) + "</td></tr>";
    }).join(""));
    C.o("delay-rows", C.rows([
      ["Starting now", pl(n, "instalment"), rs(fv)],
      ["Starting " + pl(dl, "month") + " later", pl(n - dl, "instalment") + ", ending on the same day", rs(dfv)],
      ["What the delay costs", lost + "% of " + rs(fv), rs(fv - dfv), "tot"]]));
    return say;
  };
  C.start();
})();
