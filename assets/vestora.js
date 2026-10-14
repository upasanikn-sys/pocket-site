/* POCKET — shared site behaviour. Loaded by every page (defer). DOWNLOAD_URL is the public Windows build
   (tools/site_download.py sets it); while empty, the download buttons go to the Support page instead.
   Pricing's toggles and questions are in pricing.js (split 12 Oct 2026, SITE_TO_9.md L0); the early-access
   dialog, the old menu, the dropdown and the coming-soon buttons were removed then, as no page used them. */
var DOWNLOAD_URL = "https://github.com/upasanikn-sys/pocket-site/releases/download/v3.2.10/Pocket_3.2.10_windows_setup.exe";

(function () {
  "use strict";

  var EMAIL = "support@mypocketfi.com";   // Keyur's support mailbox (6 Oct 2026)
  var root = document.documentElement;

  /* --- the visitor's platform, for buttons that name it ("Download for Windows").
     A group holds a generic <span data-for="any"> and variants <span data-for="windows|mac|linux|android|ios" hidden>;
     the visitor's variant replaces the generic one. With no script, or an unknown platform, the generic stays. --- */
  var ua = navigator.userAgent || "", os = "";
  if (/Android/i.test(ua)) os = "android";
  else if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = "ios";
  else if (/Windows/i.test(ua)) os = "windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "mac";
  else if (/Linux|X11|CrOS/i.test(ua)) os = "linux";
  if (os) {
    root.setAttribute("data-os", os);
    // a variant is written with the hidden attribute; the visitor's replaces its group's generic [data-for=any]
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

  /* --- header state once the page has moved: a hairline, nothing floats on a shadow --- */
  var hdr = document.querySelector("header");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("scrolled", scrollY > 10); };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
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
    addEventListener("resize", function () { if (innerWidth > 900 && sm.classList.contains("open")) setMenu(false); });
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
