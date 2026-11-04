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
    // R16n: a phone with no mail app opens nothing, so the link is there to copy as well; with no clipboard it is written out
    var cp = document.createElement("button"), say = document.createElement("span"), page = location.origin + location.pathname;
    cp.type = "button"; cp.className = "ghost"; cp.setAttribute("data-copy", ""); cp.textContent = "Or copy the link";
    say.className = "sr"; say.setAttribute("role", "status"); say.setAttribute("aria-live", "polite");
    cp.addEventListener("click", function () {
      (navigator.clipboard ? navigator.clipboard.writeText(page) : Promise.reject()).then(function () {
        cp.textContent = "Link copied"; say.textContent = "Link copied";
      }, function () { cp.textContent = page.replace(/^https?:\/\//, ""); say.textContent = "Copy this address: " + cp.textContent; });
    });
    go.parentNode.insertBefore(cp, go.nextSibling);
    go.parentNode.insertBefore(say, cp.nextSibling);
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

/* After a download link is pressed, say what comes next beside it (R16n). The box takes no focus and does not claim the file began. */
(function () {
  "use strict";
  var box = document.getElementById("dl-started"), said = document.getElementById("dl-said"), timer;
  if (!box) return;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="/releases/download/"]');
    if (!a) return;
    (a.closest(".dl-main, .slot") || a.parentNode).appendChild(box);
    box.innerHTML = "<b>Your download is on its way.</b> If nothing arrived, press the link again. Windows and macOS " +
      'ask you to confirm the first open, because the builds are not signed yet. <a href="#first-minutes">Your first 5 minutes</a> · ' +
      '<a href="#check">Check the file\'s SHA-256</a>';
    if (said) {                                     // a live region moved or shown with its words in it is not read (NVDA, 3 Nov 2026)
      said.textContent = "";
      clearTimeout(timer);
      timer = setTimeout(function () { said.textContent = box.textContent; }, 120);
    }
  });
})();

/* The "0 third-party requests" promise above the downloads is counted by the visitor's own browser as the page loads, as
   Security's is (R16n, REVIEW_29OCT_R16G Detail: the number next to its definition). With no script the promise stands as
   written; with one it shows the count and says who counted. */
(function () {
  "use strict";
  var line = Array.prototype.filter.call(document.querySelectorAll(".hnote span"), function (s) { return /third-party/.test(s.textContent); })[0];
  if (!line || !window.PerformanceObserver) return;
  var n = 0;
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { if (new URL(e.name, location.href).origin !== location.origin) n += 1; });
      line.lastChild.textContent = " This page made " + n + " third-party request" + (n === 1 ? "" : "s") + ", counted by your browser as it loaded";
    }).observe({ type: "resource", buffered: true });
  } catch (x) {}
})();
