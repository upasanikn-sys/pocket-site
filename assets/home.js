/* Homepage motion (DESIGN.md). The page is complete without it. */
(function () {
  "use strict";
  var d = document, rm = matchMedia("(prefers-reduced-motion: reduce)").matches,
      TRACE = "cubic-bezier(.65,0,.35,1)", UI = "cubic-bezier(.2,.8,.2,1)", IO = "IntersectionObserver" in window;
  function all(sel, root) { return [].slice.call((root || d).querySelectorAll(sel)); }
  function anim(el, frames, o) { if (!rm && el.animate) return el.animate(frames, o); }
  var RISE = [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }];

  /* Show working: trace, notes, lines; close 120ms */
  var plate = d.getElementById("plate"), sw = plate && plate.querySelector(".sw");
  function trace() {
    all(".lead", plate).forEach(function (l, i) {
      anim(l, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 480, delay: Math.min(i, 7) * 40, easing: TRACE, fill: "backwards" });
    });
    all(".tnote", plate).forEach(function (n, i) {
      anim(n, RISE, { duration: 200, delay: Math.min(i, 7) * 40 + 240, easing: UI, fill: "backwards" });
    });
    all("#lines .ln", plate).filter(function (l) { return l.offsetParent; }).forEach(function (l, i) {
      anim(l, RISE, { duration: 200, delay: Math.min(i, 7) * 40, easing: UI, fill: "backwards" });
    });
  }
  /* totals roll (paise in or out) only when the switch is pressed */
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
    // on load the figure lands last, after its parts
    var land = function () {
      trace();
      anim(d.getElementById("nw"), [{ opacity: .35, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }],
        { duration: 320, delay: 240 + 320, easing: UI, fill: "backwards" });
    };
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(land); else land();
  }

  /* a phone shows three lines, then "Show all N lines" */
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

  /* tour tabs; the last is the film */
  var tl = d.querySelector(".tour-tabs"), film = d.querySelector(".film-box video"), play = d.querySelector(".film-play");
  if (film && play) {
    film.removeAttribute("controls"); play.hidden = false;
    play.addEventListener("click", function () { film.controls = true; play.hidden = true; film.play(); film.focus(); });
  }
  if (tl) {
    var tabs = all("[role=tab]", tl), ul = tl.querySelector(".tour-ul");
    var mark = function (t) { ul.style.transform = "translateX(" + t.offsetLeft + "px) scaleX(" + t.offsetWidth / 100 + ")"; };
    var pick = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
        d.getElementById(x.getAttribute("aria-controls")).classList.toggle("on", on);
      });
      if (film && t.id !== "tt-film") film.pause();
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
    // a phone opens on the phone's screens
    var start = matchMedia("(max-width:560px)").matches ? d.getElementById("tt-phone") || tabs[0] : tabs[0];
    ul.style.transition = "none"; pick(start); ul.offsetWidth; ul.style.transition = "";
    addEventListener("resize", function () { mark(tabs.filter(function (t) { return t.tabIndex === 0; })[0]); });
  }

  /* what would leave: open closes the drawing's switch */
  all(".conn .lv-b").forEach(function (b) {
    var k = b.parentNode.getAttribute("data-conn"), box = d.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(on)); box.classList.toggle("open", on);
      all('.schem g[data-conn="' + k + '"]').forEach(function (g) {
        g.classList.toggle("on", on);
        if (on) all("path.far", g).forEach(function (f) {
          var L = f.getTotalLength(), a = L + " " + L;
          anim(f, [{ strokeDasharray: a, strokeDashoffset: L }, { strokeDasharray: a, strokeDashoffset: 0 }], { duration: 480, easing: TRACE });
        });
      });
    });
  });

  /* ledger: five rows, then "… N more" */
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

  /* scene: pins from 1000x560, with or without motion (a layout; reduced motion swaps at once); rows count in */
  var flow = d.querySelector(".scene"), mq = matchMedia("(min-width:1000px) and (min-height:560px)");
  if (flow) {
    var steps = all(".steps li", flow), frames = all(".steps .fr", flow), stage = d.createElement("div"), cur = 0,
        parts = frames.map(function (f, i) {
          return all(["tr:not([hidden]):not(.grp)", "tbody tr,tfoot tr", ".eqn tr,.tblock"][i], f)
            .filter(function (r) { return !r.querySelector("button"); });
        });
    stage.className = "stage";
    flow.querySelector(".scene-in").appendChild(stage);
    var show = function (n) {
      if (n === cur) return; cur = n;
      steps.forEach(function (s, i) { s.classList.toggle("on", i === n - 1); });
      frames.forEach(function (f, i) { f.classList.toggle("on", i === n - 1); });
    };
    var light = function (rows, k) { rows.forEach(function (r, j) { r.classList.toggle("lit", j < k); }); };
    var onScroll = function () {
      if (!flow.classList.contains("pinned")) return frames.forEach(function (f, i) {
        var r = f.getBoundingClientRect();
        if (r.height) light(parts[i], Math.ceil((innerHeight * .9 - r.top) / r.height * parts[i].length * 1.25));
      });
      var span = flow.offsetHeight - innerHeight, p = Math.min(1, Math.max(0, (scrollY - flow.offsetTop) / span)),
          n = p < 1 / 3 ? 1 : p < 2 / 3 ? 2 : 3, q = p * 3 - n + 1;
      show(n);
      parts.forEach(function (rows, i) { light(rows, i < n - 1 ? rows.length : i > n - 1 ? 0 : Math.ceil(q * rows.length * 1.25) + 1); });
    };
    var mode = function () {
      var pin = mq.matches; cur = 0;
      flow.classList.toggle("pinned", pin);
      parts.forEach(function (rows) { rows.forEach(function (r) { r.setAttribute("data-q", ""); }); });
      frames.forEach(function (f, i) { (pin ? stage : steps[i]).appendChild(f); f.classList.remove("on"); });
      steps.forEach(function (s) { s.classList.remove("on"); });
      removeEventListener("scroll", onScroll);
      addEventListener("scroll", onScroll, { passive: true }); onScroll();
    };
    mode();
    if (mq.addEventListener) mq.addEventListener("change", mode);
  }

  /* wires draw once */
  if (!rm && IO) {
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

  /* requests, counted as the browser makes them */
  var cnt = d.querySelector(".count"), tot = d.querySelector("[data-all]"), n = 0, x = 0, shown = 0, live = false;
  var say = function () { all("[data-tp]").forEach(function (el) { el.textContent = x; }); if (tot) tot.textContent = shown; };
  var up = function () { if (shown < n) { shown += 1; say(); requestAnimationFrame(up); } };
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { n += 1; if (new URL(e.name, location.href).origin !== location.origin) x += 1; });
      if (live && !rm) up(); else { if (live) shown = n; say(); }
    }).observe({ type: "resource", buffered: true });
    if (tot && cnt && IO) {
      new IntersectionObserver(function (es, o) {
        if (!es[0].isIntersecting) return; o.disconnect(); live = true; tot.parentNode.hidden = false;
        if (rm) { shown = n; say(); } else up();
      }, { threshold: .6 }).observe(cnt);
    }
  } catch (_) {}

  /* salary tool: each step's words and figures are the engine's (tools/site_home.py) */
  var rng = d.getElementById("try-g");
  if (rng) {
    var T = JSON.parse(d.getElementById("try-data").textContent), box = rng.closest(".try"),
        put = function (k, v) { box.querySelector('[data-t="' + k + '"]').textContent = v; };
    rng.addEventListener("input", function () {
      var r = T.p[Math.round((rng.value - T.from) / T.step)];
      box.querySelector(".try-g").textContent = r[0]; put("new", r[1]); put("old", r[2]);
      put("say", r[3] ? T.lower.replace("%w", r[3]).replace("%d", r[4]) : T.same);
      put("be", T.be[r[5]] || T.be[2].replace("%s", r[5]));
      rng.setAttribute("aria-valuetext", r[0] + " a year: new regime " + r[1] + ", old regime " + r[2]);
    });
  }

  /* phone download bar: up past the hero's button, down at the last one or the footer */
  var dock = d.querySelector(".dock"), hero = d.querySelector(".home .cta"), ends = [d.querySelector(".close .cta"), d.querySelector(".sf")], seen = {};
  if (dock && hero && IO) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target === hero ? "h" : ends.indexOf(e.target)] = e.isIntersecting || (e.target === hero && e.boundingClientRect.top > 0); });
      var on = seen.h === false && !seen[0] && !seen[1]; dock.classList.toggle("up", on); dock.inert = !on;
    });
    [hero].concat(ends).forEach(function (t) { if (t) io.observe(t); });
  }
})();
