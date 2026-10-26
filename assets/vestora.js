/* Pocket: shared site behaviour, on every page (defer). DOWNLOAD_URL: the Windows file, tools/site_download.py. */
var DOWNLOAD_URL = "https://github.com/upasanikn-sys/pocket-site/releases/download/v3.2.11/Pocket_3.2.11_windows_setup.exe";

(function () {
  "use strict";

  var root = document.documentElement;

  /* --- the visitor's platform: its <span data-for> variant replaces the group's generic data-for="any" --- */
  var ua = navigator.userAgent || "", os = "";
  if (/Android/i.test(ua)) os = "android";
  else if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = "ios";
  else if (/Windows/i.test(ua)) os = "windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "mac";
  else if (/Linux|X11|CrOS/i.test(ua)) os = "linux";
  if (os) {
    root.setAttribute("data-os", os);
    document.querySelectorAll('[data-for="' + os + '"]').forEach(function (v) {
      var any = v.parentNode && v.parentNode.querySelector('[data-for="any"]');
      if (any) any.hidden = true;
      v.hidden = false;
    });
  }

  /* --- Show working is one choice, remembered on every page (R1, 17 Oct 2026). A switch the visitor turns
     stores it; each page's own switch takes it on load. The Security board's connection switches are not it --- */
  var K = "pocket.working", S = ".sw[role=switch],[data-wk]";
  var on = function (b) { return (b.getAttribute("aria-checked") || b.getAttribute("aria-pressed")) === "true"; };
  document.addEventListener("click", function (e) {
    var b = e.isTrusted && e.target.closest && e.target.closest(S);
    if (b) try { localStorage.setItem(K, on(b) ? "on" : "off"); } catch (x) {}
  });
  addEventListener("DOMContentLoaded", function () {
    var v; try { v = localStorage.getItem(K); } catch (x) {}
    if (v) document.querySelectorAll(S).forEach(function (b) { if (on(b) !== (v === "on")) b.click(); });
  });

  /* --- decorative inline SVGs: hide from screen readers --- */
  document.querySelectorAll("svg:not([role])").forEach(function (s) {
    s.setAttribute("aria-hidden", "true");
  });

  /* --- the header's hairline once the page has moved: watched, never read (scrollY forces a layout) --- */
  var hdr = document.querySelector("header");
  if (hdr && window.IntersectionObserver) {
    var top = document.createElement("i");
    top.style.cssText = "position:absolute;top:0;left:0;width:1px;height:10px";
    top.setAttribute("aria-hidden", "true");
    document.body.prepend(top);
    new IntersectionObserver(function (e) { hdr.classList.toggle("scrolled", !e[0].isIntersecting); }).observe(top);
  }

  /* --- site shell phone menu (.sh-menu-btn controls #site-menu) --- */
  var sb = document.querySelector(".sh-menu-btn"), sm = document.getElementById("site-menu");
  if (sb && sm) {
    var setMenu = function (open) {
      sm.classList.toggle("open", open);
      sb.setAttribute("aria-expanded", open ? "true" : "false");
      sb.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    sb.addEventListener("click", function () { setMenu(!sm.classList.contains("open")); });
    sm.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sm.classList.contains("open")) { setMenu(false); sb.focus(); }
    });
    var wide = matchMedia("(min-width: 901px)");
    var shut = function () { if (wide.matches && sm.classList.contains("open")) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", shut); else wide.addListener(shut);
  }
})();
