/* POCKET - captures fade in as they load (STRIPE_LEVEL P2, Stream A). Space is already reserved by width/height
   and the .crop aspect-ratio, so nothing moves. An image already in the cache is never hidden; with no script, or
   an image that fails, it simply shows. */
(function () {
  "use strict";
  var imgs = document.querySelectorAll(".crop img, .frame img, .capture img");
  Array.prototype.forEach.call(imgs, function (img) {
    if (img.complete || img.loading !== "lazy") return;   // an eager image is above the fold: it shows as it loads (PF3)
    img.classList.add("fade-img");
    var show = function () { img.classList.add("in"); };
    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", show, { once: true });
  });
})();
