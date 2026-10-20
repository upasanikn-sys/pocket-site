/* Guides: find a guide (REVIEW_19OCT_R10 row 16, 20 Oct 2026). The index's cards (guides, calculators, the glossary)
   are filtered as the field is typed: a card shows when it holds every word typed, a category's heading hides with its
   last card, and the line under the field says how many show. The form is hidden in the page and shown here, so
   without this script the index is the full list. Nothing is fetched and nothing is stored. */
(function () {
  "use strict";
  var f = document.querySelector(".gfind");
  if (!f) return;
  var q = f.querySelector("input"), n = f.querySelector(".gfind-n"),
      cards = [].slice.call(document.querySelectorAll(".gcard")),
      lists = [].slice.call(document.querySelectorAll(".gcards"));
  f.hidden = false;
  f.addEventListener("submit", function (e) { e.preventDefault(); });
  q.addEventListener("input", function () {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    cards.forEach(function (c) {
      var text = c.textContent.toLowerCase(),
          hit = words.every(function (w) { return text.indexOf(w) >= 0; });
      c.hidden = !hit;
      if (hit) shown++;
    });
    lists.forEach(function (ul) {     // the list, then back to its heading (Calculators and Glossary have a line between)
      var any = !!ul.querySelector(".gcard:not([hidden])");
      ul.hidden = !any;
      for (var s = ul.previousElementSibling; s && !/^(UL|NAV|FORM)$/.test(s.tagName); s = s.previousElementSibling) {
        s.hidden = !any;
        if (s.tagName === "H2") break;
      }
    });
    n.textContent = words.length ? "Showing " + shown + " of " + cards.length : "";
  });
})();
