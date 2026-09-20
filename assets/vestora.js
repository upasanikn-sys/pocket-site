/* ============================================================================
   VESTORA — shared site behaviour. Loaded by every page (defer).

   >>> GO LIVE: set DOWNLOAD_URL to your Gumroad product page (recommended — it
   handles the free tier + paid license keys), or a public direct link to
   Vestora_windows.zip. While it is empty, the Windows buttons show a friendly
   "launching soon" message instead of a broken link.
   ============================================================================ */
var DOWNLOAD_URL = "";   // e.g. "https://vestora.gumroad.com/l/vestora"

(function () {
  "use strict";

  var EMAIL = "hello@vestora.app";

  /* --- early-access dialog: mailto alone dead-ends when there's no default mail
         app (Windows shows an app-chooser; picking a browser does nothing). This
         always works — the address is shown, copyable, with mailto as a bonus. --- */
  /* created on first use: an always-present empty role="dialog" element was noise for assistive tech */
  var back = null, lastFocus = null;
  function ensureBack() {
    if (back) return back;
    back = document.createElement("div");
    back.className = "vmodal-back"; back.setAttribute("role", "dialog");
    back.setAttribute("aria-modal", "true"); back.setAttribute("aria-labelledby", "vmodal-title");
    document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) closeModal(); });
    return back;
  }

  function closeModal() {
    if (!back) return;
    back.classList.remove("on");
    back.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openModal(opts) {
    ensureBack();
    lastFocus = document.activeElement;
    var subject = encodeURIComponent(opts.subject);
    var body = encodeURIComponent(opts.body || "");
    back.innerHTML =
      '<div class="vmodal">' +
        '<button class="vmodal-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<h3 id="vmodal-title">' + opts.title + '</h3>' +
        '<p>' + opts.desc + '</p>' +
        '<div class="em"><span class="addr">' + EMAIL + '</span>' +
          '<button class="copybtn" type="button">Copy</button></div>' +
        '<div class="acts">' +
          '<a class="btn btn-gold" href="mailto:' + EMAIL + '?subject=' + subject + '&body=' + body + '">Open email app</a>' +
        '</div>' +
        '<p class="hint">No email app? Copy the address and write to us from anywhere — Gmail, your phone, whatever you use. A human replies within 48 hours (please check spam).</p>' +
      '</div>';
    back.classList.add("on");
    var card = back.querySelector(".vmodal");
    var closeBtn = back.querySelector(".vmodal-close");
    var copyBtn = back.querySelector(".copybtn");
    closeBtn.addEventListener("click", closeModal);
    copyBtn.addEventListener("click", function () {
      var done = function () { copyBtn.textContent = "Copied"; copyBtn.classList.add("ok"); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(done, function () { fallbackCopy(); done(); });
      } else { fallbackCopy(); done(); }
    });
    function fallbackCopy() {
      var t = document.createElement("textarea"); t.value = EMAIL; t.style.position = "fixed";
      t.style.left = "-9999px"; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t);
    }
    setTimeout(function () { closeBtn.focus(); }, 30);
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && back && back.classList.contains("on")) closeModal();
  });

  /* --- Windows early-access buttons (.js-dl) --- */
  document.querySelectorAll(".js-dl").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (DOWNLOAD_URL) { window.location.href = DOWNLOAD_URL; return; }
      e.preventDefault();
      openModal({
        title: "Request Windows early access",
        desc: "Email us and we'll send the current Windows build (v2.0.0). No account, no payment.",
        subject: "Vestora for Windows — early access request",
        body: "Hi — I'd like early access to Vestora for Windows."
      });
    });
  });

  /* --- coming-soon platforms ([data-notify]) --- */
  document.querySelectorAll("[data-notify]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var p = el.getAttribute("data-notify");
      openModal({
        title: "Get notified — Vestora for " + p,
        desc: p + " isn't ready yet. Email us and we'll let you know the moment it is.",
        subject: "Notify me — Vestora for " + p,
        body: "Hi — please notify me when Vestora for " + p + " is available."
      });
    });
  });

  /* --- mobile menu (aria-expanded tracked) --- */
  var mb = document.querySelector(".menu-btn");
  var mm = document.querySelector(".mobile-menu");
  if (mb && mm) {
    mb.setAttribute("aria-expanded", "false");
    mb.addEventListener("click", function () {
      var open = mm.classList.toggle("open");
      mb.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mm.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mm.classList.remove("open"); mb.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- Resources dropdown: keyboard + touch accessible (hover still works via CSS) --- */
  document.querySelectorAll(".dropdown").forEach(function (dd) {
    var trigger = dd.querySelector(":scope > a");
    var menu = dd.querySelector(".dropdown-menu");
    if (!trigger || !menu) return;
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    function setOpen(open) {
      dd.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    trigger.addEventListener("click", function (e) {
      e.preventDefault();                        // first activation opens the menu instead of navigating
      setOpen(!dd.classList.contains("open"));
    });
    dd.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setOpen(false); trigger.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) setOpen(false);
    });
  });

  /* --- decorative inline SVGs: hide from screen readers --- */
  document.querySelectorAll("svg:not([role])").forEach(function (s) {
    s.setAttribute("aria-hidden", "true");
  });

  /* --- header state once the page has moved: a class, styled as a hairline + lit shadow (not grey smoke) --- */
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

  /* --- FAQ accordion (pricing) — keyboard accessible --- */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.setAttribute("role", "button");
    q.setAttribute("tabindex", "0");
    q.setAttribute("aria-expanded", "false");
    function toggle() {
      var item = q.closest(".faq-item");
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (i) {
        i.classList.remove("open");
        var qq = i.querySelector(".faq-q"); if (qq) qq.setAttribute("aria-expanded", "false");
      });
      if (!open) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    }
    q.addEventListener("click", toggle);
    q.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* --- pricing toggles (currency + billing) --- */
  var pricing = document.querySelector("[data-pricing]");
  if (pricing) {
    var state = { cur: "inr", cycle: "monthly" };
    function apply() {
      document.querySelectorAll("[data-price]").forEach(function (el) {
        var key = state.cur + "-" + state.cycle;      // e.g. inr-yearly
        el.textContent = el.getAttribute("data-" + key) || el.getAttribute("data-price");
      });
      document.querySelectorAll("[data-cur-sym]").forEach(function (el) {
        el.textContent = state.cur === "inr" ? "₹" : "$";
      });
      document.querySelectorAll("[data-showif]").forEach(function (el) {
        el.style.display = el.getAttribute("data-showif") === state.cycle ? "" : "none";
      });
    }
    document.querySelectorAll("[data-cur]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cur = b.getAttribute("data-cur");
        document.querySelectorAll("[data-cur]").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        apply();
      });
    });
    document.querySelectorAll("[data-cycle]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cycle = b.getAttribute("data-cycle");
        document.querySelectorAll("[data-cycle]").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        apply();
      });
    });
    apply();
  }

  /* --- newsletter / notify forms: never actually POST anywhere --- */
  document.querySelectorAll("[data-notify-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = f.querySelector("input");
      var val = input ? input.value.trim() : "";
      window.location.href = "mailto:hello@vestora.app?subject=" +
        encodeURIComponent("Keep me posted on Vestora") +
        "&body=" + encodeURIComponent("Please add me to the update list." + (val ? " My email: " + val : ""));
      if (input) input.value = "";
      if (typeof mailtoDone === "function") mailtoDone();
    });
  });
})();
