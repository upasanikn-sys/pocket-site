/* The home page's salary tool, for a salary typed in "Your exact salary" (R16m, 31 Oct 2026). home.js loads this, after
   calc.js and calc-tax.js, the first time someone types in that field; the page is complete without it. Every figure
   is calc-tax.js's own regime(): the tax calculator's rules (#calc-rules, written by tools/site_calculators.py) with the
   slider's example deductions (try-data "ded"). The salary becomes one row, shaped as try-data's "p" rows are, and the
   slider's handler in home.js shows it, so a typed salary that is a step reads exactly as that step does. The tax for
   the year is rounded to the paisa once, after the cess, as the calculator does; the two figures are that tax to the
   nearest rupee, a half going up; the working keeps the paisa. Nothing typed leaves the page. */
(function () {
  "use strict";
  var C = window.PocketCalc, tx = document.getElementById("try-x"), rng = document.getElementById("try-g");
  if (!C || !C.taxRows || !tx || !rng) return;
  var D = JSON.parse(document.getElementById("try-data").textContent).ded, form = tx.form, MAX = 99999999, wk, err, wait,
      css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "assets/try-exact.css?v=1"; document.head.appendChild(css);

  /* the message under the field, or none: true when there is none */
  function ok(msg) {
    if (!err) {
      err = document.createElement("p"); err.className = "tx-e"; err.id = "try-x-e"; err.setAttribute("role", "alert");
      tx.setAttribute("aria-describedby", err.id); form.appendChild(err);
    }
    err.textContent = msg; err.hidden = !msg; tx.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  /* the field is empty again, or the slider moved: its step's figures, no working */
  function back() {
    if (wk) { wk.remove(); wk = null; }
    ok("");
  }
  function sum() {
    clearTimeout(wait);
    if (!tx.value.trim()) return back();
    var p = C.paise(tx.value);
    if (!ok(p === null ? "Type an amount in rupees, like 18,00,000." : !p ? "Type an amount above zero."
        : p % 100 ? "Whole rupees, like 18,00,000." : p > MAX * 100 ? "Up to " + C.rs(MAX) + " here; the tax calculator takes more." : "")) return;
    var g = p / 100, n = C.regime("new", g, D), o = C.regime("old", g, D), a = C.half(n.total, 0), b = C.half(o.total, 0),
        be = C.breakEven(g);
    rng.x = [C.rs(g), C.rs(a), C.rs(b), a === b ? "" : a < b ? "new" : "old", a === b ? "" : C.rs(Math.abs(a - b)),
             be === null ? 0 : be === 0 ? 1 : C.rs(be)];
    rng.value = g;                                  // the thumb goes to its nearest step; home.js shows rng.x
    rng.dispatchEvent(new Event("input"));
    rng.x = null;
    if (!wk) {
      wk = document.createElement("details"); wk.className = "tx";
      wk.innerHTML = '<summary></summary><p class="tx-h">New regime</p><ol class="txw"></ol>' +
        '<p class="tx-h">Old regime <small>with ' + C.rs(D.c80) + ' of 80C and ' + C.rs(D.d80s) + ' of 80D</small></p>' +
        '<ol class="txw"></ol><p class="tx-n">Every line is worked to the paisa. The two figures above are the tax for ' +
        'the year to the nearest rupee, a half going up.</p>';
      try { wk.open = localStorage.getItem("pocket.working") === "on"; } catch (e) {}   // vestora.js: one choice, every page
      form.after(wk);
    }
    wk.firstChild.textContent = "The working for " + C.rs(g);
    var ls = wk.querySelectorAll("ol");
    ls[0].innerHTML = C.rows(C.taxRows(n, D)); ls[1].innerHTML = C.rows(C.taxRows(o, D));
  }
  /* once the person pauses (a salary is typed a digit at a time); Enter and leaving the field do not wait, nor
     leave the page: "Every step of the sum" is the way to the calculator */
  tx.addEventListener("input", function () { clearTimeout(wait); wait = setTimeout(sum, 250); });
  tx.addEventListener("change", sum);
  tx.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); sum(); } });
  /* the slider moves: its step's figures, and the typed salary goes */
  rng.addEventListener("input", function () { if (!rng.x) { back(); tx.value = ""; } });
  sum();
})();
