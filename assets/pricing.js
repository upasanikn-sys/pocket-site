/* POCKET — the pricing page's behaviour: Founder Pro billed monthly or yearly.
   Split from vestora.js on 12 Oct 2026 (SITE_TO_9.md L0). Prices themselves are tiers.py's, written into the page by
   tools/site_company.py; nothing here knows a figure. The switch's pill moves in CSS (company-pages.css, --t-ui),
   so reduced motion is the stylesheet's blanket rule. The questions' answers are always open (13 Oct 2026).
   Row 10 (19 Oct 2026): a pressed cycle rolls each digit that changes, the two figures right-aligned as on an odometer,
   in from below going up and from above going down, over --t-ui on --ease-ui read from the page; then the plain text
   is put back. Reduced motion (prefers-reduced-motion): the figure, at once. */
(function () {
  "use strict";
  var bill = document.querySelector(".bill");
  if (!bill) return;
  var buttons = bill.querySelectorAll("[data-cycle]"), still = matchMedia("(prefers-reduced-motion: reduce)"),
      cs = getComputedStyle(document.documentElement), MID = parseFloat(cs.getPropertyValue("--t-ui")),
      UI = cs.getPropertyValue("--ease-ui").trim();
  function rollTo(el, text) {
    var was = el.textContent;
    el._roll = text;
    if (was === text || still.matches || !el.animate || !MID) { el.textContent = text; return; }
    var up = +text.replace(/\D/g, "") > +was.replace(/\D/g, ""), off = Math.max(0, was.length - text.length),
        a = Array(Math.max(0, text.length - was.length) + 1).join(" ") + was, last;
    el.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "dg";
      s.textContent = ch;
      el.appendChild(s);
      if (ch !== a[i + off]) last = s.animate([{ opacity: 0, transform: "translateY(" + (up ? .4 : -.4) + "em)" },
        { opacity: 1, transform: "none" }], { duration: MID, delay: Math.min(i, 7) * 40, easing: UI, fill: "backwards" });
    });
    if (last) last.onfinish = function () { if (el._roll === text) el.textContent = text; };
    else el.textContent = text;
  }
  function apply(cycle) {
    bill.setAttribute("data-now", cycle);
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cycle") === cycle ? "true" : "false"); });
    document.querySelectorAll("[data-price]").forEach(function (el) {
      rollTo(el, el.getAttribute("data-inr-" + cycle) || el.textContent);
    });
    document.querySelectorAll("[data-showif]").forEach(function (el) {
      el.hidden = el.getAttribute("data-showif") !== cycle;
    });
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () { apply(b.getAttribute("data-cycle")); });
  });
})();
