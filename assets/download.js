/* POCKET — the Download page's one large button, for the visitor's platform (SITE_TO_9.md, Stream 2, 13 Oct 2026).
   vestora.js sets html[data-os]; this copies that platform's link and size from its row in the list beneath, which
   tools/site_download.py writes from packaging/published.json, so nothing here knows a file, a size or a version.
   With no script, or a platform Pocket has no row for, the button goes to the list. */
(function () {
  "use strict";
  var NAMES = { windows: "Windows", mac: "macOS", linux: "Linux", android: "Android", ios: "iOS" };
  var SAY = { windows: "Windows", mac: "Mac", linux: "Linux", android: "Android", ios: "iPhone" };
  var KIND = { exe: "Installer", dmg: "Disk image", deb: "Debian package", AppImage: "AppImage", apk: "APK", zip: "Zip" };
  var os = document.documentElement.getAttribute("data-os");
  var go = document.querySelector(".dl-go"), file = document.querySelector(".dl-file");
  var row = NAMES[os] && document.querySelector('.platforms .plat[data-os="' + NAMES[os] + '"]');
  if (!go || !file || !row) return;
  row.classList.add("is-yours");
  if (row.tagName !== "A") {                       // listed, not published yet (the App Store)
    // R15-4: say what to do, and make the button do it: mail the link to open on a computer
    file.textContent = "Not on " + SAY[os] + " yet: it runs on a Windows or Mac computer, Linux and Android";
    go.textContent = "Email me the link";
    go.setAttribute("href", "mailto:?subject=Pocket%20for%20my%20computer&body=Download%20Pocket%3A%20https%3A%2F%2Fmypocketfi.com%2Fdownload.html");
    return;
  }
  // CV3 (STRIPE_LEVEL, 14 Oct 2026): the visitor's platform first in the list, its checksum beside the button
  var slot = row.parentNode, list = slot && slot.parentNode;
  if (slot && list && list.classList.contains("platforms") && list.firstElementChild !== slot) list.insertBefore(slot, list.firstElementChild);
  var sha = slot && slot.querySelector(".plat-sha code"), line = document.querySelector(".dl-sha");
  if (sha && line) { line.querySelector("code").textContent = sha.textContent; line.removeAttribute("data-wait"); }
  var href = row.getAttribute("href"), ext = href.split(".").pop();
  var size = (row.textContent.match(/\d+ MB/) || [""])[0];
  go.setAttribute("href", href);
  go.textContent = "Download free for " + SAY[os];
  file.textContent = [KIND[ext] || "File", size].filter(Boolean).join(", ") + ", for " + NAMES[os];
})();

// MI3 (STRIPE_LEVEL, 16 Oct 2026): a Copy button after every SHA-256, which says "Copied" in place and to a screen reader.
// Added here, so with no script the hash is simply text; the button reads the hash when pressed (the one beside the
// download button is filled in above).
(function () {
  "use strict";
  var hashes = document.querySelectorAll("code.hash");
  if (!hashes.length) return;
  var live = document.createElement("span");
  live.className = "sr"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () {}); return; }
    var t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { if (document.execCommand("copy")) done(); } catch (e) {}
    document.body.removeChild(t);
  }
  Array.prototype.forEach.call(hashes, function (code) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "ghost"; b.setAttribute("data-copy", ""); b.textContent = "Copy";
    b.setAttribute("aria-label", "Copy the SHA-256");
    var timer;
    b.addEventListener("click", function () {
      copy(code.textContent.trim(), function () {
        b.textContent = "Copied"; live.textContent = "SHA-256 copied";
        clearTimeout(timer);
        timer = setTimeout(function () { b.textContent = "Copy"; live.textContent = ""; }, 2000);
      });
    });
    code.parentNode.insertBefore(b, code.nextSibling);
  });
})();

/* "keep me posted" forms (moved from vestora.js, 17 Oct 2026: only this page has one): never POST anywhere; they open
   the visitor's own email app */
(function () {
  "use strict";
  document.querySelectorAll("[data-notify-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = f.querySelector("input"), val = input ? input.value.trim() : "";
      window.location.href = "mailto:support@mypocketfi.com?subject=" + encodeURIComponent("Keep me posted on Pocket") +
        "&body=" + encodeURIComponent("Please add me to the update list." + (val ? " My email: " + val : ""));
      if (input) input.value = "";
    });
  });
})();
