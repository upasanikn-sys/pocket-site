/* Pocket's site search (R16 C2). On search.html it narrows the page's own list as you type. On any other page vestora.js
   loads this only when "/" or the header's Search is pressed, and it opens a dialog over assets/search-index.json: the
   same list, in the same order, one file from this origin. What you type never leaves the page and is kept nowhere. */
(function () {
  "use strict";
  var V = "1", list = document.getElementById("search-list"), rows = null, loading = null;

  /* the words you typed, each of which a result must contain; the title counts for more than what the entry says */
  function tokens(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }
  function rank(q) {
    var t = tokens(q), found = [];
    if (!t.length) return [];
    rows.forEach(function (r, i) {
      var title = r[1].toLowerCase(), said = r[3].toLowerCase(), s = 0;
      for (var k = 0; k < t.length; k++) {
        var at = title.indexOf(t[k]);
        if (at === 0) s += 4;
        else if (at > 0) s += /[^a-z0-9]/.test(title.charAt(at - 1)) ? 3 : 2;
        else if (said.indexOf(t[k]) >= 0) s += 1;
        else return;                                           // a word that is nowhere: not a result
      }
      found.push([s, i]);
    });
    return found.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }).map(function (x) { return rows[x[1]]; });
  }
  function typing(e) {
    var n = e.target.tagName;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(n) || e.target.isContentEditable;
  }
  function count(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }

  /* ---- search.html: the list is the page; typing hides what does not match ---- */
  if (list) {
    var box = document.getElementById("search-input"), say = document.getElementById("search-status");
    var items = [].slice.call(list.querySelectorAll(".hit")), groups = [].slice.call(list.querySelectorAll(".sg"));
    var hay = items.map(function (li) { return li.textContent.toLowerCase(); });
    var narrow = function () {
      var t = tokens(box.value), shown = 0;
      items.forEach(function (li, i) {
        var on = t.every(function (w) { return hay[i].indexOf(w) >= 0; });
        li.hidden = !on;
        shown += on;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector(".hit:not([hidden])"); });
      say.textContent = !t.length ? "" : shown ? count(shown, "result") + " for " + box.value.trim() : "Nothing matches " + box.value.trim() + ".";
    };
    box.addEventListener("input", narrow);
    box.form.addEventListener("submit", function (e) { e.preventDefault(); });
    box.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.value) { box.value = ""; narrow(); } });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e)) { e.preventDefault(); box.focus(); }
    });
    var q0 = new URLSearchParams(location.search).get("q");
    if (q0) { box.value = q0; narrow(); }
    return;
  }

  /* ---- any other page: a dialog, opened by "/" or the header's Search (vestora.js asks for this file then) ---- */
  var dlg, inp, out, say2, opener, active = -1, shown = [];
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function styled() {                                          // the dialog's sheet, once, and a wait for it: no unstyled flash
    if (document.querySelector('link[href*="assets/search.css"]')) return Promise.resolve();
    return new Promise(function (done) {
      var l = el("link");
      l.rel = "stylesheet"; l.href = "assets/search.css?v=" + V;
      l.onload = l.onerror = function () { done(); };
      document.head.appendChild(l);
    });
  }
  function index() {
    return loading || (loading = fetch("assets/search-index.json?v=" + V).then(function (r) {
      if (!r.ok) throw new Error("index");
      return r.json();
    }).then(function (j) { rows = j; }));
  }
  function mark(i) {
    var o = out.children;
    if (o[active]) o[active].setAttribute("aria-selected", "false");
    active = o.length ? (i + o.length) % o.length : -1;
    if (o[active]) {
      var a = o[active];
      a.setAttribute("aria-selected", "true");
      a.scrollIntoView({block: "nearest"});
      inp.setAttribute("aria-activedescendant", a.id);
    } else inp.removeAttribute("aria-activedescendant");
  }
  function show() {
    var all = rows ? rank(inp.value) : [];
    shown = all.slice(0, 8);
    out.textContent = "";
    shown.forEach(function (r, i) {
      var a = el("a");                                         // the options are the listbox's own children, not list items
      a.href = r[2]; a.id = "sq-o" + i; a.setAttribute("role", "option"); a.setAttribute("aria-selected", "false");
      a.appendChild(el("b", "", r[1]));
      a.appendChild(el("small", "", r[0] + " · " + (r[3].length > 96 ? r[3].slice(0, 95).replace(/\s+\S*$/, "") + "…" : r[3])));
      out.appendChild(a);
    });
    inp.setAttribute("aria-expanded", shown.length ? "true" : "false");
    active = -1;
    mark(0);
    var q = inp.value.trim();
    say2.textContent = !q ? "" : !rows ? "Loading the list…" : !all.length ? "Nothing matches " + q + "." :
      all.length > shown.length ? "The first " + shown.length + " of " + count(all.length, "result") : count(all.length, "result");
  }
  function build() {
    dlg = el("dialog", "sq-d");
    dlg.setAttribute("aria-label", "Search this site");
    var top = el("div", "sq-top"), form = el("form"), x = el("button", "sq-x");
    form.setAttribute("role", "search");
    inp = el("input");
    inp.type = "search"; inp.id = "sq-in"; inp.placeholder = "SIP, 80C, net worth"; inp.autocomplete = "off"; inp.spellcheck = false;
    inp.setAttribute("role", "combobox"); inp.setAttribute("aria-label", "Search this site"); inp.setAttribute("aria-expanded", "false");
    inp.setAttribute("aria-controls", "sq-out"); inp.setAttribute("aria-autocomplete", "list");
    x.type = "button"; x.setAttribute("aria-label", "Close search");
    x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    form.appendChild(inp); top.appendChild(form); top.appendChild(x);
    say2 = el("p", "sq-status"); say2.setAttribute("role", "status");
    out = el("div", "sq-out"); out.id = "sq-out"; out.setAttribute("role", "listbox"); out.setAttribute("aria-label", "Results");
    var more = el("p", "sq-more"), all = el("a", "", "Every page on one list");
    all.href = "search.html"; more.appendChild(all);
    [top, say2, out, more].forEach(function (n) { dlg.appendChild(n); });
    document.body.appendChild(dlg);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (shown[active]) { dlg.close(); location.href = shown[active][2]; }
    });
    inp.addEventListener("input", show);
    inp.addEventListener("keydown", function (e) {
      var d = {ArrowDown: 1, ArrowUp: -1}[e.key];
      if (d) { e.preventDefault(); mark(active + d); }
      else if (e.key === "Escape") { e.preventDefault(); dlg.close(); }    // not the field's own Escape, which only clears it
    });
    x.addEventListener("click", function () { dlg.close(); });
    out.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });  // a link to this very page must still close it
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });       // the backdrop
    dlg.addEventListener("close", function () { if (opener && opener.focus) opener.focus(); });
  }
  function open() {
    if (dlg && dlg.open) return;
    opener = document.activeElement;
    styled().then(function () {
      if (!dlg) build();
      inp.value = "";
      show();
      dlg.showModal();
      inp.focus();
      index().then(show, function () { say2.textContent = "The list did not load. Every page is on the search page."; });
    });
  }
  window.PocketSearch = {open: open};
  open();                                                      // vestora.js added this script because a person asked to search
})();
