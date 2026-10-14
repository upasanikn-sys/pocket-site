/* POCKET — the product pages' two controls (SITE_TO_9.md, Stream 1, 12 Oct 2026): tabs that switch a capture or an
   answer (Features' tour, Ask Pocket's questions), and Security's switchboard. Loaded by those pages only (defer).
   Without it, every panel shows in turn and the switchboard's list says nothing leaves. Movement is CSS's: the
   tour's underline slides and a panel cross-fades over --t-ui; reduced motion collapses both (vestora-tokens.css). */
(function () {
  "use strict";

  /* --- tabs (DESIGN.md, Navigation: role="tab", arrow keys, only the selected tab in the Tab order) --- */
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    var bar = box.querySelector(".tour-bar");
    function place() {
      if (!bar) return;
      var t = tabs.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
      if (t) bar.style.transform = "translateX(" + t.offsetLeft + "px) scaleX(" + t.offsetWidth + ")";
    }
    function pick(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j, panel = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (panel) panel.classList.toggle("on", on);
      });
      if (focus) tabs[i].focus();
      place();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(i, false); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, k = e.key, j = -1;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % n;
        else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + n) % n;
        else if (k === "Home") j = 0;
        else if (k === "End") j = n - 1;
        if (j < 0) return;
        e.preventDefault();
        pick(j, true);
      });
    });
    pick(0, false);
    window.addEventListener("resize", place, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  });

  /* --- Security's switchboard: each switch shows what would leave the computer once it is on --- */
  document.querySelectorAll("[data-board]").forEach(function (board) {
    var none = board.querySelector("[data-none]");
    board.querySelectorAll(".sw").forEach(function (sw) {
      sw.addEventListener("click", function () {
        var on = sw.getAttribute("aria-pressed") !== "true";
        sw.setAttribute("aria-pressed", on ? "true" : "false");
        board.querySelectorAll('[data-conn="' + sw.getAttribute("data-c") + '"]').forEach(function (li) { li.hidden = !on; });
        if (none) none.hidden = !!board.querySelector('.sw[aria-pressed="true"]');
      });
    });
  });
})();
