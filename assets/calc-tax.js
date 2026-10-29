/* The tax regime calculator: tax_india's two regimes, each step kept for the working. */
(function () {
  "use strict";
  var C = window.PocketCalc;
  if (!C) return;
  var T = C.R.tax, rs = C.rs, ps = C.ps, pc = C.pc, half = C.half, top = C.top;

  function slab(income, slabs) {
    var tax = 0, lo = 0;
    for (var i = 0; i < slabs.length; i++) {
      var u = top(slabs[i][0]);
      if (income > lo) { tax += (Math.min(income, u) - lo) * slabs[i][1]; lo = u; } else break;
    }
    return tax;
  }
  function surcharge(taxable, base, slabs, table) {  // _surcharge_with_relief
    for (var i = 0; i < table.length; i++) {
      var thr = table[i][0], r = table[i][1];
      if (taxable > thr) {
        var sur = base * (1 + r), at = slab(thr, slabs), prev = table.filter(function (t) { return thr > t[0]; });
        at *= prev.length ? 1 + prev[0][1] : 1.0;
        var cap = at + (taxable - thr);
        return {tax: Math.min(sur, cap), rate: r, thr: thr, relief: cap < sur};
      }
    }
    return {tax: base, rate: 0};
  }
  function cap80d(senior) { return senior ? T.d80s : T.d80; }
  function regime(k, g, d) {
    var P = T[k], x = {k: k, g: g, sd: P.sd, c80: 0, d80: 0, other: d.other || 0};
    if (k === "new") x.ded = P.sd;
    else {
      x.c80 = Math.min(d.c80, T.c80);
      x.d80 = Math.min(d.d80s, cap80d(d.ss)) + Math.min(d.d80p, cap80d(d.sp));
      x.ded = x.c80 + x.d80 + x.other + P.sd;
    }
    x.taxable = Math.max(0, g - x.ded);
    x.a = slab(x.taxable, P.slabs);
    x.b = x.taxable <= P.rebate ? 0 : k === "new" ? Math.min(x.a, x.taxable - P.rebate) : x.a;
    x.s = surcharge(x.taxable, x.b, P.slabs, P.sur);
    x.total = C.pyRound(x.s.tax * (1 + T.cess), 2);
    return x;
  }
  function breakEven(g) {
    var t = regime("new", g, {}).total, lo = 0, hi = g, z = function (o) { return {c80: 0, d80s: 0, d80p: 0, other: o}; };
    if (regime("old", g, z(hi)).total > t) return null;
    while (lo < hi) { var mid = Math.floor((lo + hi) / 2); if (regime("old", g, z(mid)).total <= t) hi = mid; else lo = mid + 1; }
    return lo;
  }
  C.regime = regime; C.breakEven = breakEven;

  function band(lo, u) { return lo === 0 ? "Up to " + rs(u) : u === Infinity ? "Above " + rs(lo) : rs(lo + 1) + " to " + rs(u); }
  function rows(x, d) {
    var P = T[x.k], out = [["Salary", "", half(x.g, 2)], ["Standard deduction", "", -half(x.sd, 2)]];
    if (x.k === "new") out.push(["80C, 80D and other deductions", "not allowed in the new regime", "none", "na"]);
    else {
      out.push(["80C", "EPF, PPF, ELSS and others, at most " + rs(T.c80) + (d.c80 > T.c80 ? "; " + rs(d.c80) + " typed" : ""), -half(x.c80, 2)]);
      out.push(["80D", "health insurance: yours " + rs(Math.min(d.d80s, cap80d(d.ss))) + " of at most " + rs(cap80d(d.ss)) +
                ", your parents' " + rs(Math.min(d.d80p, cap80d(d.sp))) + " of at most " + rs(cap80d(d.sp)), -half(x.d80, 2)]);
      out.push(["Other deductions", "as typed", -half(x.other, 2)]);
    }
    out.push(["Taxable income", x.g < x.ded ? "the deductions are more than the salary" : "", half(x.taxable, 2), "tot"]);
    for (var i = 0, lo = 0; i < P.slabs.length && x.taxable > lo; i++) {
      var u = top(P.slabs[i][0]), r = P.slabs[i][1], amt = Math.min(x.taxable, u) - lo;
      out.push([band(lo, u), r ? pc(r) + " of " + rs(half(amt, 0)) : "nil", half(amt * r, 2)]);
      lo = u;
    }
    var A = half(x.a, 2), B = half(x.b, 2), S = half(x.s.tax, 2), N = half(x.total, 2);
    out.push(["Tax on the slabs", "", A, "tot"]);
    if (B < A) out.push(x.taxable <= P.rebate ? ["Rebate, section 87A", "taxable income up to " + rs(P.rebate), B - A]
      : ["Marginal relief", "the tax is at most the income above " + rs(P.rebate), B - A]);
    if (x.s.rate) out.push(["Surcharge", pc(x.s.rate) + " of " + ps(B) + ", on income above " + rs(x.s.thr) +
                            (x.s.relief ? ", limited by marginal relief" : ""), S - B]);
    out.push(["Health and education cess", pc(T.cess) + " of " + ps(S), N - S]);
    out.push(["Tax for the year", "", N, "tot"]);
    return out;
  }

  var F = ["salary", "c80", "d80s", "d80p", "other"];
  C.RUN.tax = function () {
    var p = F.map(function (n, i) { return C.money(n, !i, true); });
    if (p.indexOf(null) >= 0) return null;
    var g = p[0] / 100, d = {c80: p[1] / 100, d80s: p[2] / 100, d80p: p[3] / 100, ss: C.val("ss"), sp: C.val("sp"), other: p[4] / 100};
    var n = regime("new", g, d), od = regime("old", g, d), nr = half(n.total, 0), orr = half(od.total, 0), be = breakEven(g);
    C.o("new", rs(nr)); C.o("old", rs(orr));
    C.out.querySelector('[data-o="new-box"]').classList.toggle("low", nr < orr);
    C.out.querySelector('[data-o="old-box"]').classList.toggle("low", orr < nr);
    var say = nr === orr ? "Both regimes come to the same tax on these figures."
      : "The " + (nr < orr ? "new" : "old") + " regime is " + rs(Math.abs(nr - orr)) + " lower on these figures.";
    C.o("say", say);
    C.o("be", be === null ? "On a salary of " + rs(g) + ", no amount of deductions brings the old regime down to the new regime's tax."
      : "On a salary of " + rs(g) + ", the old regime costs no more than the new once its deductions, beyond its standard deduction, reach " +
        rs(be) + ". Your deductions above come to " + rs(half(od.ded - od.sd, 0)) + ".");
    C.o("new-rows", C.rows(rows(n, d))); C.o("old-rows", C.rows(rows(od, d)));
    return say;
  };
  C.start();
})();
