/* Homepage motion (DESIGN.md). The page is complete without it. */
(function () {
  "use strict";
  var d = document, rm = matchMedia("(prefers-reduced-motion: reduce)").matches,
      TRACE = "cubic-bezier(.65,0,.35,1)", UI = "cubic-bezier(.2,.8,.2,1)";
  function all(sel, root) { return [].slice.call((root || d).querySelectorAll(sel)); }
  function anim(el, frames, o) { if (!rm && el.animate) return el.animate(frames, o); }

  /* Show working: trace 480ms, 40ms stagger (cap 8), notes at half-line, lines staggered, close 120ms */
  var plate = d.getElementById("plate"), sw = plate && plate.querySelector(".sw");
  function trace() {
    all(".lead", plate).forEach(function (l, i) {
      var t = Math.min(i, 7) * 40;
      anim(l, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 480, delay: t, easing: TRACE, fill: "backwards" });
    });
    all(".tnote", plate).forEach(function (n, i) {
      anim(n, [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }],
        { duration: 200, delay: Math.min(i, 7) * 40 + 240, easing: UI, fill: "backwards" });
    });
    /* the lines the first total is made of open one after another, 40ms apart (the ninth with the eighth) */
    all("#lines .ln", plate).filter(function (l) { return l.offsetParent; }).forEach(function (l, i) {
      anim(l, [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }],
        { duration: 200, delay: Math.min(i, 7) * 40, easing: UI, fill: "backwards" });
    });
  }
  /* totals: with the working open each carries its paise; closed, its rupee form (data-r). They roll only when the
     switch is pressed, never on load: the paise rise in over --t-roll, or the figure settles to the rupee */
  var totals = all("[data-r]", plate).map(function (el) { return { el: el, open: el.innerHTML }; });
  function roll(on) {
    totals.forEach(function (t) {
      t.el.innerHTML = on ? t.open : t.el.getAttribute("data-r");
      var p = on && t.el.querySelector(".p");
      anim(p || t.el, [{ opacity: 0, transform: "translateY(" + (on ? 4 : -4) + "px)" }, { opacity: 1, transform: "none" }],
        { duration: 320, easing: UI });
    });
  }
  if (sw) {
    var fades = []; // reopening cancels a closing fade
    sw.addEventListener("click", function () {
      var on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      fades.forEach(function (a) { a.cancel(); }); fades = [];
      roll(on);
      if (on) { plate.classList.remove("bare"); trace(); return; }
      all(".lead,.tnote,.lines", plate).forEach(function (p) {
        var a = anim(p, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "cubic-bezier(.23,1,.32,1)" });
        if (a) fades.push(a);
      });
      if (fades[0]) fades[0].onfinish = function () { plate.classList.add("bare"); }; else plate.classList.add("bare");
    });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(trace); else trace();
  }

  /* a phone shows three lines, then "Show all N lines"; focus moves to the fourth */
  var ol = d.getElementById("lines");
  if (ol && ol.children.length > 3) {
    var all7 = d.createElement("button");
    all7.type = "button"; all7.className = "more lines-all"; all7.setAttribute("aria-expanded", "false");
    all7.setAttribute("aria-controls", "lines"); all7.textContent = "Show all " + ol.children.length + " lines";
    ol.parentNode.insertBefore(all7, ol.nextSibling);
    all7.addEventListener("click", function () {
      plate.classList.add("all"); all7.setAttribute("aria-expanded", "true"); all7.hidden = true;
      var li = ol.children[3]; li.tabIndex = -1; li.focus();
    });
  }

  /* product tour: tabs (arrow keys, Home, End); the underline moves to the tab, the capture cross-fades */
  var tl = d.querySelector(".tour-tabs");
  if (tl) {
    var tabs = all("[role=tab]", tl), ul = tl.querySelector(".tour-ul");
    var mark = function (t) { ul.style.transform = "translateX(" + t.offsetLeft + "px) scaleX(" + t.offsetWidth / 100 + ")"; };
    var pick = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t, panel = d.getElementById(x.getAttribute("aria-controls"));
        x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; panel.classList.toggle("on", on);
      });
      mark(t); if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(t); });
      t.addEventListener("keydown", function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault(); pick(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
    // on a phone a desktop capture is too small to read, so the tour opens on the phone's own screens
    var first = matchMedia("(max-width:560px)").matches ? tabs[tabs.length - 1] : tabs[0];
    ul.style.transition = "none"; pick(first); ul.offsetWidth; ul.style.transition = "";
    addEventListener("resize", function () { mark(tabs.filter(function (t) { return t.tabIndex === 0; })[0]); });
  }

  /* what would leave: each connection's payload, and its switch closed in the drawing while it is open */
  all(".conn .lv-b").forEach(function (b) {
    var k = b.parentNode.getAttribute("data-conn"), box = d.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(on)); box.classList.toggle("open", on);
      all('.schem g[data-conn="' + k + '"]').forEach(function (g) { g.classList.toggle("on", on); });
    });
  });

  /* ledger: five rows, then "… N more"; focus moves to the new rows */
  all("table.ledger").forEach(function (t) {
    var rest = all("tr[data-more]", t);
    if (!rest.length) return;
    var row = d.createElement("tr");
    row.innerHTML = '<td colspan="4"><button type="button" class="more" aria-expanded="false">… ' + rest.length + " more</button></td>";
    rest[0].parentNode.insertBefore(row, rest[0]);
    rest.forEach(function (r) { r.hidden = true; });
    row.querySelector("button").addEventListener("click", function () {
      rest.forEach(function (r) { r.hidden = false; });
      row.remove();
      var h = rest[0].querySelector("th"); h.tabIndex = -1; h.focus();
    });
  });

  /* scene: pinned if wide, tall, motion allowed; frames change at thirds */
  var flow = d.querySelector(".scene"), mq = matchMedia("(min-width:1000px) and (min-height:720px) and (prefers-reduced-motion: no-preference)");
  if (flow) {
    var steps = all(".steps li", flow), frames = all(".steps .fr", flow), stage = d.createElement("div"), cur = 0;
    stage.className = "stage";
    flow.querySelector(".scene-in").appendChild(stage);
    var show = function (n) {
      if (n === cur) return; cur = n;
      steps.forEach(function (s, i) { s.classList.toggle("on", i === n - 1); });
      frames.forEach(function (f, i) { f.classList.toggle("on", i === n - 1); });
    };
    var onScroll = function () {
      var span = flow.offsetHeight - innerHeight, p = Math.min(1, Math.max(0, (scrollY - flow.offsetTop) / span));
      show(p < 1 / 3 ? 1 : p < 2 / 3 ? 2 : 3);
    };
    var mode = function () {
      var pin = mq.matches; cur = 0;
      flow.classList.toggle("pinned", pin);
      frames.forEach(function (f, i) { (pin ? stage : steps[i]).appendChild(f); f.classList.remove("on"); });
      steps.forEach(function (s) { s.classList.remove("on"); });
      removeEventListener("scroll", onScroll);
      if (pin) { addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
    };
    mode();
    if (mq.addEventListener) mq.addEventListener("change", mode);
  }

  /* wires draw once: 700ms, 140ms apart */
  if (!rm && "IntersectionObserver" in window) {
    all(".schem").forEach(function (s) {
      var wires = all(".w", s);
      wires.forEach(function (w) { w.style.strokeDasharray = "1"; w.style.strokeDashoffset = "1"; });
      new IntersectionObserver(function (es, o) {
        if (!es[0].isIntersecting) return; o.disconnect();
        wires.forEach(function (w, i) {
          var a = w.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 700, delay: i * 140, easing: TRACE, fill: "forwards" });
          a.onfinish = function () { w.style.strokeDasharray = ""; w.style.strokeDashoffset = ""; };
        });
      }, { threshold: .4 }).observe(s);
    });
  }

  /* third-party requests this page made */
  addEventListener("load", function () {
    if (!performance.getEntriesByType) return;
    var n = performance.getEntriesByType("resource").filter(function (e) {
      try { return new URL(e.name).origin !== location.origin; } catch (x) { return false; }
    }).length;
    all("[data-tp]").forEach(function (el) { el.textContent = n; });
  });
})();
