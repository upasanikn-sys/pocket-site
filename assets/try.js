/* Try the sample: the Desktop view / Phone view switch. The frame's first view is chosen by the inline line after it
   (a wide screen opens the desktop view, a phone the phone view); this only changes it on a visitor's say. */
(function () {
  var frame = document.getElementById('try-frame'), stage = document.getElementById('try-stage');
  var bar = document.querySelector('.try-views');
  if (!frame || !stage || !bar) return;
  var buttons = bar.querySelectorAll('button[data-view]');
  function show(view) {
    stage.setAttribute('data-view', view);
    var to = frame.getAttribute(view === 'm' ? 'data-narrow' : 'data-wide');
    if (frame.getAttribute('src') !== to) frame.src = to;           // setting the same address would load the app again
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-view') === view));
  }
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () { show(this.getAttribute('data-view')); });
  }
  show(matchMedia('(min-width:901px)').matches ? 'app' : 'm');
  // a window that crosses the width where the desktop layout ends gets the view that fits, unless the visitor chose
  var chose = false;
  bar.addEventListener('click', function () { chose = true; });
  matchMedia('(min-width:901px)').addEventListener('change', function (e) { if (!chose) show(e.matches ? 'app' : 'm'); });
})();
