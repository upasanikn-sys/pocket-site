/* The net worth calculator: investments + accounts − liabilities (finos/CLAUDE.md), in whole paise as working.py adds
   them. The groups and their fields are the form's data-groups (tools/site_calculators.py). */
(function () {
  "use strict";
  var C = window.PocketCalc;
  if (!C) return;
  var groups = JSON.parse(C.form.getAttribute("data-groups"));

  C.RUN.nw = function () {
    var rows = [], tot = {}, sum = 0, ok = true;
    groups.forEach(function (g) {
      var sub = 0, lines = [];
      g.fields.forEach(function (f) {
        var p = C.money(f[0]);
        if (p === null) { ok = false; return; }
        if (p) lines.push([f[1], f[2], g.sign * p]);
        sub += p;
      });
      tot[g.key] = sub; sum += g.sign * sub;
      rows.push([g.label, lines.length ? "" : "nothing typed", g.sign * sub, "sub"]);
      rows = rows.concat(lines);
    });
    if (!ok) return null;
    rows.push(["Net worth", "", sum, "tot"]);
    C.o("nw", C.rs(C.rp(sum)));
    C.o("eq", '<span class="op">=</span> ' + C.ps(tot.inv) + ' investments <span class="op">+</span> ' + C.ps(tot.acc) +
      ' accounts <span class="op">−</span> ' + C.ps(tot.owe) + " liabilities");
    C.o("rows", C.rows(rows));
    var say = "Net worth is " + C.rs(C.rp(sum)) + ": " + C.rs(C.rp(tot.inv + tot.acc)) + " owned, " + C.rs(C.rp(tot.owe)) + " owed.";
    C.o("say", say);
    return say;
  };
  C.start();
})();
