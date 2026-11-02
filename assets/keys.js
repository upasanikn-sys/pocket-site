/* The Accessibility page's one control (R16n, WCAG 2.1.4): the "/" key that opens search can be turned off. The choice
   lives in this browser as "pocket.slash" = "off" and is read by vestora.js and search.js; nothing is sent anywhere.
   Without script there is no shortcut either, so the control stays hidden. */
(function () {
  "use strict";
  var box = document.getElementById("slash-key"), say = document.getElementById("slash-say"), wrap = document.querySelector("[data-slash]");
  if (!box || !say || !wrap) return;
  try { box.checked = localStorage.getItem("pocket.slash") !== "off"; } catch (x) {}
  wrap.hidden = false;
  box.addEventListener("change", function () {
    try { if (box.checked) localStorage.removeItem("pocket.slash"); else localStorage.setItem("pocket.slash", "off"); } catch (x) {}
    say.textContent = box.checked ? "The / key opens search." : "The / key does nothing now. Search is still in the header.";
  });
})();
