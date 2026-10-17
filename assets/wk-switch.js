/* POCKET - the "Show working" switch on the inner pages (STRIPE_LEVEL R6-A4, Stream A). A button with data-wk and
   aria-controls names the element whose working it hides: pressed = the working is shown, as on the homepage's plate.
   Without script every working shows and the button is hidden (html:not(.js) [data-wk]). data-default="off" starts it
   hidden, except with reduced motion, which always starts it shown. The CSS does the hiding (.bare). */
(function () {
  "use strict";
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.forEach.call(document.querySelectorAll("[data-wk]"), function (b) {
    var scope = document.getElementById(b.getAttribute("aria-controls"));
    if (!scope) return;
    function set(on) {
      b.setAttribute("aria-pressed", on ? "true" : "false");
      scope.classList.toggle("bare", !on);
    }
    b.addEventListener("click", function () { set(b.getAttribute("aria-pressed") !== "true"); });
    set(!(b.getAttribute("data-default") === "off" && !still));
  });
})();
