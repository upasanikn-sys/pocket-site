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
    file.textContent = "Not on " + SAY[os] + " yet: Windows, macOS, Linux and Android are below";
    return;
  }
  var href = row.getAttribute("href"), ext = href.split(".").pop();
  var size = (row.textContent.match(/\d+ MB/) || [""])[0];
  go.setAttribute("href", href);
  go.textContent = "Download for " + SAY[os];
  file.textContent = [KIND[ext] || "File", size].filter(Boolean).join(", ") + ", for " + NAMES[os];
})();
