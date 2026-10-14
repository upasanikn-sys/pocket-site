/* POCKET — the pricing page's behaviour: Founder Pro billed monthly or yearly.
   Split from vestora.js on 12 Oct 2026 (SITE_TO_9.md L0). Prices themselves are tiers.py's, written into the page by
   tools/site_company.py; nothing here knows a figure. The switch's pill moves in CSS (company-pages.css, --t-ui),
   so reduced motion is the stylesheet's blanket rule. The questions' answers are always open (13 Oct 2026). */
(function () {
  "use strict";
  var bill = document.querySelector(".bill");
  if (!bill) return;
  var buttons = bill.querySelectorAll("[data-cycle]");
  function apply(cycle) {
    bill.setAttribute("data-now", cycle);
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cycle") === cycle ? "true" : "false"); });
    document.querySelectorAll("[data-price]").forEach(function (el) {
      el.textContent = el.getAttribute("data-inr-" + cycle) || el.textContent;
    });
    document.querySelectorAll("[data-showif]").forEach(function (el) {
      el.hidden = el.getAttribute("data-showif") !== cycle;
    });
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () { apply(b.getAttribute("data-cycle")); });
  });
})();
