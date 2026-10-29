/* Homepage motion (DESIGN.md). The page is complete without it. */
(function () {
  "use strict";
  var d = document, rm = matchMedia("(prefers-reduced-motion: reduce)").matches,
      cs = getComputedStyle(d.documentElement), tok = function (n) { return cs.getPropertyValue("--" + n).trim(); },
      TRACE = tok("ease-trace"), UI = tok("ease-ui"), FAST = parseFloat(tok("t-fast")), MID = parseFloat(tok("t-ui")),
      SLOW = parseFloat(tok("t-trace")), IO = "IntersectionObserver" in window;
  function all(sel, root) { return [].slice.call((root || d).querySelectorAll(sel)); }
  function anim(el, frames, o) { if (!rm && el.animate) return el.animate(frames, o); }
  /* Show working: the tree draws itself; the figure lands last */
  var plate = d.getElementById("plate"), sw = plate && plate.querySelector(".sw");
  function trace(first) {
    plate.classList.remove("trace", "first"); void plate.offsetWidth;
    plate.classList.add("trace"); if (first) plate.classList.add("first");
  }
  /* totals roll (paise in or out) only when the switch is pressed */
  var totals = all("[data-r]", plate).map(function (el) { return { el: el, open: el.innerHTML }; });
  function roll(on) {
    totals.forEach(function (t) {
      t.el.innerHTML = on ? t.open : t.el.getAttribute("data-r");
      var p = on && t.el.querySelector(".p");
      anim(p || t.el, [{ opacity: 0, transform: "translateY(" + (on ? 4 : -4) + "px)" }, { opacity: 1, transform: "none" }],
        { duration: MID, easing: UI });
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
      all(".tr,.tnote,.lines", plate).forEach(function (p) {
        var a = anim(p, [{ opacity: 1 }, { opacity: 0 }], { duration: FAST, easing: UI });
        if (a) fades.push(a);
      });
      if (fades[0]) fades[0].onfinish = function () { plate.classList.add("bare"); }; else plate.classList.add("bare");
    });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { trace(1); }); else trace(1);
  }

  /* the investments show four lines, then "Show all N lines" */
  var all7 = d.querySelector(".lines-all");
  if (all7) all7.addEventListener("click", function () {
    var li = all(".ln", plate).filter(function (l) { return !l.offsetParent; })[0];
    plate.classList.add("all"); all7.setAttribute("aria-expanded", "true");
    if (li) { li.tabIndex = -1; li.focus(); }
  });

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
      swing(k, "on", on);
    });
  });
  /* a switch shown shut; its far wire draws when it first shuts */
  function swing(k, c, on) {
    all('.schem g[data-conn="' + k + '"]').forEach(function (g) {
      var was = g.classList.contains("on") || g.classList.contains("try");
      g.classList.toggle(c, on);
      if (on && !was) all("path.far", g).forEach(function (f) {
        var L = f.getTotalLength(), a = L + " " + L;
        anim(f, [{ strokeDasharray: a, strokeDashoffset: L }, { strokeDasharray: a, strokeDashoffset: 0 }], { duration: SLOW, easing: TRACE });
      });
    });
  }

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

  /* scene: pins from 1000x560; rows count in */
  var flow = d.querySelector(".scene"), mq = matchMedia("(min-width:1000px) and (min-height:560px)");
  if (flow) {
    var steps = all(".steps > li", flow), frames = all(".steps .fr", flow), stage = d.createElement("div"), cur = 0,
        parts = frames.map(function (f, i) {
          return all(["tr:not([hidden]):not(.grp)", "tbody tr,tfoot tr", ".eqn tr"][i], f)
            .filter(function (r) { return !r.querySelector("button"); });
        });
    stage.className = "stage";
    flow.querySelector(".scene-in").appendChild(stage);
    /* MO2: rows travel to what they become and back; pinned only */
    var travel = function (a, b, f) {
      var s = f ? "data-to" : "data-k", t = f ? "data-k" : "data-to", c = a.getBoundingClientRect(), at = {};
      all("[" + s + "]", a).forEach(function (r) {
        var q = r.getBoundingClientRect(), k = r.getAttribute(s);
        if (q.height) (at[k] = at[k] || []).push([r, Math.min(Math.max(q.top + q.height / 2, c.top), c.bottom)]);
      });
      return function () {
        all("[" + t + "]", b).forEach(function (r) {
          var m = at[r.getAttribute(t)], q = r.getBoundingClientRect(), y = q.top + q.height / 2;
          if (!m || !q.height) return; // clear while rows cross
          anim(r, [{ transform: "translateY(" + ((m[0][1] + m[m.length - 1][1]) / 2 - y) + "px)", opacity: 0 }, { opacity: .15, offset: .5 }, { transform: "none", opacity: 1 }], { duration: MID, easing: UI });
          m.forEach(function (o) { anim(o[0], [{ transform: "none" }, { transform: "translateY(" + (y - o[1]) + "px)" }], { duration: MID, easing: UI }); });
        });
      };
    };
    var show = function (n) {
      if (n === cur) return;
      var go = cur && flow.classList.contains("pinned") ? travel(frames[cur - 1], frames[n - 1], n > cur) : null;
      cur = n;
      steps.forEach(function (s, i) { s.classList.toggle("on", i === n - 1); });
      frames.forEach(function (f, i) { f.classList.toggle("on", i === n - 1); });
      if (go) go();
    };
    var light = function (rows, k) { rows.forEach(function (r, j) { r.classList.toggle("lit", j < k); r.classList.toggle("now", j === k - 1); }); };
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

  /* wires draw once (home.css .drawn) */
  if (!rm && IO) all(".schem").forEach(function (s) {
    all(".w", s).forEach(function (w, i) { w.style.animationDelay = i * FAST + "ms"; });
    s.classList.add("wd");
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); s.classList.add("drawn"); } }, { threshold: .4 }).observe(s);
  });

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

  /* S2: the privacy section pins on wide windows, a turn per connection, ending on its 0 */
  var ws = d.getElementById("wires"), wq = matchMedia("(min-width:1000px)");
  if (ws && cnt) {
    var win = ws.querySelector(".wires-in"), wr = all(".conn li[data-conn]", ws), turn = -1;
    var take = function (n) {
      if (n === turn) return; turn = n;
      wr.forEach(function (r, i) { r.classList.toggle("now", i === n); swing(r.getAttribute("data-conn"), "try", i === n); });
      cnt.classList.toggle("now", n >= wr.length);
    };
    var wscroll = function () {
      var p = (scrollY - ws.offsetTop) / (ws.offsetHeight - innerHeight);
      take(p < 0 ? -1 : Math.min(wr.length, Math.floor(p * (wr.length + 2)) - 1));
    };
    var wmode = function () {
      removeEventListener("scroll", wscroll); take(-1);
      ws.classList.toggle("pinned", wq.matches);
      var h = Math.max.apply(0, [].map.call(win.children, function (c) { return c.offsetHeight; }));
      if (h > innerHeight - 97) ws.classList.remove("pinned");
      if (ws.classList.contains("pinned")) { addEventListener("scroll", wscroll, { passive: true }); wscroll(); }
    };
    wmode(); addEventListener("resize", wmode);
  }

  /* salary tool: words and figures are the engine's (site_home.py) */
  var rng = d.getElementById("try-g");
  if (rng) {
    var T = JSON.parse(d.getElementById("try-data").textContent), box = rng.closest(".try"),
        put = function (k, v) { box.querySelector('[data-t="' + k + '"]').textContent = v; };
    /* MO3: a figure rolls to the new salary's over --t-ui; reduced motion sets it */
    var num = function (s) { return +String(s).replace(/[^\d]/g, ""); }, rolls = {},
        inr = function (n) { var s = String(n), h = s.slice(0, -3); return "₹" + (h ? h.replace(/\B(?=(\d{2})+$)/g, ",") + "," + s.slice(-3) : s); },
        rollFig = function (k, v) {   // not "roll": that name is the switch's totals (16 Oct 2026 bug)
          var el = box.querySelector('[data-t="' + k + '"]'), a = num(el.textContent), b = num(v), t0 = 0;
          cancelAnimationFrame(rolls[k]);
          if (rm || a === b || !/^₹[\d,]+$/.test(v)) return put(k, v);
          var step = function (t) {
            t0 = t0 || t; var p = Math.min(1, (t - t0) / MID), e = 1 - Math.pow(1 - p, 3);
            el.textContent = p < 1 ? inr(Math.round(a + (b - a) * e)) : v;
            if (p < 1) rolls[k] = requestAnimationFrame(step);
          };
          rolls[k] = requestAnimationFrame(step);
        };
    /* MI1: PageUp/PageDown move a tick (Rs 5 lakh); the track fills to the thumb */
    rng.addEventListener("keydown", function (e) {
      var k = { PageUp: 1, PageDown: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      rng.value = Math.min(+rng.max, Math.max(+rng.min, +rng.value + k * T.tick));
      rng.dispatchEvent(new Event("input"));
    });
    /* D1: an exact salary goes to the calculator in the fragment */
    var tx = d.getElementById("try-x");
    if (tx) tx.form.addEventListener("submit", function (e) {
      e.preventDefault(); var v = tx.value.replace(/\D/g, ""); location.href = tx.form.action + (v ? "#salary=" + v : "");
    });
    /* R16: a typed salary moves the slider to its nearest step */
    if (tx) tx.addEventListener("input", function () {
      var v = +tx.value.replace(/\D/g, "");
      if (v < +rng.min || v > +rng.max) return;
      rng.value = T.from + Math.round((v - T.from) / T.step) * T.step;
      rng.dispatchEvent(new Event("input"));
    });
    rng.addEventListener("input", function () {
      rng.style.setProperty("--f", (rng.value - rng.min) / (rng.max - rng.min));
      var r = T.p[Math.round((rng.value - T.from) / T.step)];
      box.querySelector(".try-g").textContent = r[0]; rollFig("new", r[1]); rollFig("old", r[2]);
      put("say", r[3] ? T.lower.replace("%w", r[3]).replace("%d", r[4]) : T.same);
      put("be", T.be[r[5]] || T.be[2].replace("%s", r[5]));
      rng.setAttribute("aria-valuetext", r[0] + " a year: new regime " + r[1] + ", old regime " + r[2]);
    });
  }

  /* MO1: headings rise 8px once as a section comes in (home.css .rv) */
  if (!rm && IO) all("main .sec").forEach(function (s) {
    var rv = all("h2, h2 + p, .sec-head > p", s).slice(0, 3);
    rv.forEach(function (e, i) { e.classList.add("rv"); e.style.setProperty("--i", i); });
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      rv.forEach(function (e) { e.classList.add("in"); });
    }, { threshold: .15 }).observe(s);
  });

  /* phone download bar: past the hero's button, down at the last */
  var dock = d.querySelector(".dock"), hero = d.querySelector(".home .cta"), ends = [d.querySelector(".close .cta"), d.querySelector(".sf")], seen = {};
  if (dock && hero && IO) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target === hero ? "h" : ends.indexOf(e.target)] = e.isIntersecting || (e.target === hero && e.boundingClientRect.top > 0); });
      var on = seen.h === false && !seen[0] && !seen[1]; dock.classList.toggle("up", on); dock.inert = !on;
    });
    [hero].concat(ends).forEach(function (t) { if (t) io.observe(t); });
  }
  /* R16d: two holdings editable, in paise; nothing sent */
  (function () {
    var inv = plate && plate.querySelector("[data-br=assets] .t"), nw = d.getElementById("nw"), eds = [], reset;
    if (!inv || !nw) return;
    var W = /^([\d.,]+) × ([₹$])([\d,]+\.\d\d)( × ₹([\d,]+\.\d\d))?/;
    function n(s) { s = parseFloat(String(s).replace(/,/g, "")); return isFinite(s) && s >= 0 ? s : null; }
    function grp(r) { var s = String(r), t = s.slice(-3), h = s.slice(0, -3); return (h ? h.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + t; }
    function html(p) { return "₹" + grp(Math.floor(p / 100)) + '<span class="p">.' + ("0" + p % 100).slice(-2) + "</span>"; }
    function cached(el) { return totals.filter(function (t) { return t.el === el; })[0]; }
    function paise(el) { var t = cached(el), s = d.createElement("span"); s.innerHTML = t ? t.open : el.innerHTML; return +s.textContent.replace(/\D/g, ""); }
    var base = [[inv, paise(inv)], [nw, paise(nw)]];
    all("#lines > li", plate).slice(0, 2).forEach(function (li) {
      var wk = li.querySelector(".wk"), m = wk && wk.textContent.match(W), nm = li.querySelector(".nm");
      if (!m || !nm) return;
      var e = { v: li.querySelector(".v"), fx: m[5] ? Math.round(n(m[5]) * 100) : 100 };
      e.base = +e.v.textContent.replace(/\D/g, "");
      function field(val, what) {
        var f = d.createElement("input");
        f.className = "ed"; f.value = f.defaultValue = val; f.setAttribute("inputmode", "decimal");
        f.setAttribute("aria-label", nm.textContent + ", " + what); f.style.setProperty("--n", val.length);
        f.addEventListener("click", function (ev) { ev.preventDefault(); });       // inside <summary>: no toggle
        f.addEventListener("keydown", function (ev) { if (ev.key === " " || ev.key === "Enter") ev.stopPropagation(); if (ev.key === "Enter") ev.preventDefault(); });
        f.addEventListener("keyup", function (ev) { if (ev.key === " ") { ev.stopPropagation(); ev.preventDefault(); } });
        f.addEventListener("input", function () { f.style.setProperty("--n", Math.max(2, f.value.length)); sum(); });
        return f;
      }
      e.q = field(m[1], "quantity"); e.p = field(m[3], m[2] === "$" ? "price in dollars" : "price in rupees");
      var rest = (m[4] || "") + wk.textContent.slice(m[0].length);
      wk.textContent = "";
      wk.append(e.q, " × " + m[2], e.p, rest);
      var det = li.querySelector("details");
      if (det) { det.after(wk); wk.classList.add("wk-ed"); }   // no input inside <summary> (axe: nested-interactive)
      eds.push(e);
    });
    if (!eds.length) return;
    reset = d.createElement("button");
    reset.type = "button"; reset.className = "reset"; reset.hidden = true; reset.textContent = "Reset the sample";
    reset.addEventListener("click", function () { eds.forEach(function (e) { e.q.value = e.q.defaultValue; e.p.value = e.p.defaultValue; }); sum(); });
    d.getElementById("lines").after(reset);
    function sum() {
      var dv = 0, edited = false;
      eds.forEach(function (e) {
        var q = n(e.q.value), p = n(e.p.value), v;
        edited = edited || e.q.value !== e.q.defaultValue || e.p.value !== e.p.defaultValue;
        if (q === null || p === null) return;
        v = Math.round(q * Math.round(p * 100) * e.fx / 100);
        dv += v - e.base; e.v.innerHTML = html(v);
      });
      base.forEach(function (x) {
        var t = cached(x[0]), open = html(x[1] + dv), on = !sw || sw.getAttribute("aria-checked") === "true";
        x[0].setAttribute("data-r", "₹" + grp(Math.floor((x[1] + dv) / 100)));
        if (t) t.open = open;
        if (x[0].innerHTML !== (on ? open : x[0].getAttribute("data-r"))) {
          x[0].innerHTML = on ? open : x[0].getAttribute("data-r");
          anim(x[0], [{ opacity: 0.4, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: MID, easing: UI });
        }
      });
      reset.hidden = !edited;
    }
  })();
})();
