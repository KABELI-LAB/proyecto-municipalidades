/* Helpers for static (non-React) Hualañé pieces: Lucide icons, Cauce bands, fit-to-viewport artboards. */
(function () {
  var L = 'https://unpkg.com/lucide-static@0.469.0/icons/';
  function icons(root) {
    (root || document).querySelectorAll('[data-i]').forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = 1;
      fetch(L + el.dataset.i + '.svg').then(function (r) { return r.text(); }).then(function (t) {
        el.innerHTML = t.replace(/<!--[\s\S]*?-->/g, '').replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"');
        if (el.dataset.sw) el.querySelector('svg').setAttribute('stroke-width', el.dataset.sw);
      });
    });
  }
  function cauce(root) {
    (root || document).querySelectorAll('[data-cauce]').forEach(function (el) {
      var cols = el.dataset.cauce.split(','), th = el.dataset.th || 18, gap = +(el.dataset.gap || 70), shape = el.dataset.shape || 'rise', n = +(el.dataset.n || cols.length);
      var P = { rise: function (y) { return 'M-40 ' + (y + 150) + ' C 260 ' + (y + 150) + ', 470 ' + (y + 20) + ', 760 ' + y + ' S 1120 ' + (y - 14) + ', 1240 ' + (y - 14); }, flat: function (y) { return 'M-40 ' + (y + 40) + ' C 200 ' + (y + 40) + ', 360 ' + (y - 30) + ', 600 ' + (y - 30) + ' S 1000 ' + (y + 40) + ', 1240 ' + (y + 20); } };
      var st = shape === 'rise' ? 120 : 160, s = '<svg viewBox="0 0 1200 400" preserveAspectRatio="none" style="display:block;width:100%;height:100%" aria-hidden="true">';
      for (var i = 0; i < n; i++) s += '<path d="' + P[shape](st + i * gap) + '" fill="none" stroke="' + cols[i % cols.length] + '" stroke-width="' + th + '" vector-effect="non-scaling-stroke"/>';
      el.innerHTML = s + '</svg>';
    });
  }
  function fit() {
    document.querySelectorAll('.fit').forEach(function (a) {
      var w = +a.dataset.w, h = +a.dataset.h, s = Math.min(innerWidth / w, innerHeight / h);
      a.style.width = w + 'px'; a.style.height = h + 'px';
      a.style.transform = 'translate(' + (innerWidth - w * s) / 2 + 'px,' + (innerHeight - h * s) / 2 + 'px) scale(' + s + ')';
    });
  }
  function run() { icons(); cauce(); fit(); }
  addEventListener('resize', fit);
  if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run);
  window.hds = { icons: icons, cauce: cauce, fit: fit, run: run };
})();
