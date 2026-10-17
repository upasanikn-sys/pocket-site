/* Pocket: shared site behaviour, on every page (defer). DOWNLOAD_URL: tools/site_download.py; empty = Support. */
var DOWNLOAD_URL = "https://github.com/upasanikn-sys/pocket-site/releases/download/v3.2.10/Pocket_3.2.10_windows_setup.exe";

(function () {
  "use strict";

  var EMAIL = "support@mypocketfi.com";   // Keyur's support mailbox (6 Oct 2026)
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

  /* --- the Windows download buttons (.js-dl) --- */
  document.querySelectorAll(".js-dl").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = DOWNLOAD_URL || "contact.html";
    });
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

  /* --- "keep me posted" forms: never POST anywhere; they open the visitor's own email app --- */
  document.querySelectorAll("[data-notify-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = f.querySelector("input");
      var val = input ? input.value.trim() : "";
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Keep me posted on Pocket") +
        "&body=" + encodeURIComponent("Please add me to the update list." + (val ? " My email: " + val : ""));
      if (input) input.value = "";
    });
  });
})();
