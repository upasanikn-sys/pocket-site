/* POCKET - the "Show working" switch on the inner pages (STRIPE_LEVEL R6-A4, Stream A; one switch, R16 L6, 28 Oct
   2026). The home plate's switch (.sw, role=switch): with data-wk and aria-controls it names the element whose working
   it hides; checked = the working is shown. It starts on everywhere; a visitor's choice is remembered across pages
   (vestora.js). Without script every working shows and the switch is hidden (working.css). The CSS does the hiding (.bare). */
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-wk]"), function (b) {
    var scope = document.getElementById(b.getAttribute("aria-controls"));
    if (!scope) return;
    function set(on) {
      b.setAttribute("aria-checked", on ? "true" : "false");
      scope.classList.toggle("bare", !on);
    }
    b.addEventListener("click", function () { set(b.getAttribute("aria-checked") !== "true"); });
    set(true);
  });
})();
