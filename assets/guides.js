/* Guides: a term's definition on hover, focus and a first tap (MI2, Stripe level, 15 Oct 2026). Each first use of 80C, SIP, CAS and
   the rest is a link to its glossary entry, <a class="term" href="glossary.html#80c" title="Name: definition">, which works
   as a link and a tooltip without this script (CP2, 17 Oct 2026). Here the title moves into a small tip that stays while the
   pointer is over it, closes on Escape, and is read out as the term's description. A mouse or the keyboard follows the link
   as it would any other; a first tap shows the definition and a second follows the link. Nothing is fetched and nothing is
   stored. */
(function () {
  var terms = document.querySelectorAll("a.term");
  if (!terms.length) return;
  var tip = document.createElement("div"), cur = null, timer = 0, how = "";
  tip.className = "tip"; tip.id = "term-tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.appendChild(tip);
  function hide() { clearTimeout(timer); if (cur) cur.removeAttribute("aria-describedby"); cur = null; tip.hidden = true; }
  function later() { clearTimeout(timer); timer = setTimeout(hide, 200); }
  function show(t) {
    clearTimeout(timer);
    if (cur && cur !== t) cur.removeAttribute("aria-describedby");
    cur = t;
    var d = t.getAttribute("data-def"), i = d.indexOf(": ");
    tip.innerHTML = "";
    var b = document.createElement("b"); b.textContent = d.slice(0, i); tip.appendChild(b);
    tip.appendChild(document.createTextNode(d.slice(i + 2)));
    if (how === "touch") { var h = document.createElement("i"); h.textContent = "Tap again for the glossary."; tip.appendChild(h); }
    tip.hidden = false;
    var r = t.getBoundingClientRect(), room = document.documentElement.clientWidth - tip.offsetWidth - 16;
    tip.style.left = Math.max(16, Math.min(r.left, room)) + window.pageXOffset + "px";
    tip.style.top = r.bottom + window.pageYOffset + 8 + "px";
    t.setAttribute("aria-describedby", tip.id);
  }
  Array.prototype.forEach.call(terms, function (t) {
    t.setAttribute("data-def", t.title); t.removeAttribute("title");
    t.addEventListener("pointerdown", function (e) { how = e.pointerType; });
    t.addEventListener("keydown", function () { how = "key"; });
    t.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") show(t); });
    t.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") later(); });
    t.addEventListener("focus", function () { if (how !== "touch") show(t); });
    t.addEventListener("blur", function () { later(); });
    t.addEventListener("click", function (e) {
      if (how === "touch" && !(cur === t && !tip.hidden)) { e.preventDefault(); show(t); }
    });
  });
  tip.addEventListener("pointerenter", function () { clearTimeout(timer); });
  tip.addEventListener("pointerleave", later);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  document.addEventListener("click", function (e) { if (cur && e.target !== cur && !tip.contains(e.target)) hide(); });
  window.addEventListener("orientationchange", hide);
})();
