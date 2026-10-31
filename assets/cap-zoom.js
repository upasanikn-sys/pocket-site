/* POCKET - a capture opens larger (R16k, DESIGN.md "Capture viewer"; REVIEW_29OCT_R16G Product imagery: "one
   full-width, enlargeable capture"). Each capture's picture (.crop, .frame, .gpic, a tour's picture) gets a real
   button laid over it: a press, Enter or Space opens a modal <dialog> holding the same picture at up to twice its
   size, so the app's own type reads at 14px and more; Esc, Close or a press outside closes it and focus goes back to
   that button. Its styles load with it (cap-zoom.css), so a page without captures carries none. No script: the
   picture is simply shown. */
(function () {
  "use strict";
  var pics = document.querySelectorAll(".crop, .frame, .gpic, .tour-panel > picture");
  if (!pics.length || typeof HTMLDialogElement !== "function") return;
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "assets/cap-zoom.css?v=1";
  document.head.appendChild(css);

  var dlg = document.createElement("dialog"), back = null;
  dlg.className = "zoom";
  dlg.innerHTML = '<button type="button" class="zoom-x">Close</button><div class="zoom-pic"></div>';
  document.body.appendChild(dlg);
  var box = dlg.querySelector(".zoom-pic");

  function open(el, btn) {
    var img = el.querySelector("img");
    var w = parseFloat(getComputedStyle(el).getPropertyValue("--w")) || +img.getAttribute("width") || img.naturalWidth;
    // as drawn, so the right file is asked for: up to twice its size in a wide window; on a phone its true size, in a
    // box that pans (smaller than the screen would be no larger than the page already draws it)
    var narrow = matchMedia("(max-width: 700px)").matches;
    var size = Math.round(narrow ? w : Math.min(2 * w, innerWidth - 48)) + "px";
    if (narrow) box.setAttribute("tabindex", "0"); else box.removeAttribute("tabindex");
    var copy = (img.closest("picture") || img).cloneNode(true);
    var ci = copy.tagName === "IMG" ? copy : copy.querySelector("img");
    Array.prototype.forEach.call(copy.querySelectorAll("source"), function (s) { s.setAttribute("sizes", size); });
    ci.setAttribute("sizes", size);
    ci.loading = "eager";
    ci.classList.remove("fade-img", "in");
    ci.style.setProperty("--zw", 2 * w + "px");
    ci.style.setProperty("--zt", w + "px");
    ci.style.setProperty("--zr", (+ci.getAttribute("width") || w) / (+ci.getAttribute("height") || w));
    box.textContent = "";
    box.appendChild(copy);
    dlg.setAttribute("aria-label", "Enlarged: " + (img.alt || "capture"));
    back = btn;
    dlg.showModal();
    // on a phone the box opens where note 1 points, if the capture has notes; a whole desktop screen without notes
    // opens past the app's side menu (248px of 1280, ui_theme.py .app) on the page itself
    var mark = narrow && (el.querySelector(".tp-marks li") || el.parentElement.querySelector(":scope > .tp-marks li"));
    if (mark) {
      box.scrollLeft = parseFloat(mark.style.left) / 100 * box.scrollWidth - 32;
      box.scrollTop = parseFloat(mark.style.top) / 100 * box.scrollHeight - 32;
    } else if (narrow && w === 1280 && !el.classList.contains("crop")) {
      box.scrollLeft = 248;
    }
  }

  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.classList.contains("zoom-x")) dlg.close();   // outside the picture, or Close
  });
  dlg.addEventListener("close", function () { box.textContent = ""; if (back) back.focus(); });

  Array.prototype.forEach.call(pics, function (el) {
    var img = el.querySelector("img");
    if (!img || el.closest("a, button") || el.querySelector(".zoom-b")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zoom-b";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-label", "Enlarge: " + (img.alt || "capture"));
    btn.addEventListener("click", function () { open(el, btn); });
    el.classList.add("zoomable");
    el.appendChild(btn);
  });
})();
