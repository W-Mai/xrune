/* The sigil builder (hero circle, the small prism seal, the covenant wheel)
 * and the hero's opening rite: the circle is drawn, the eight runes of the
 * covenant ignite one by one, the letters are carved, molten gold fills the
 * grooves from below, cools into gold leaf, and a glint runs across. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var M = XRUNE.METHODS;
  var FUTHARK = Object.keys(XRUNE.RUNES);

  function E(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function polar(r, deg) { var a = deg * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  function circle(parent, r, cls, draw) { return E('circle', { r: r, cx: 0, cy: 0, class: 'sg-line ' + (cls || '') + (draw ? ' sg-draw' : ''), pathLength: 1 }, parent); }
  function ticks(parent, r0, r1, r2, n, every, cls) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var deg = i * 360 / n - 90, rr = i % every ? r1 : r2;
      var a = polar(r0, deg), b = polar(rr, deg);
      d += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return E('path', { d: d, class: 'sg-line sg-draw ' + (cls || ''), pathLength: 1 }, parent);
  }
  function octagram(parent, r, cls) {
    var d = '';
    [0, 45].forEach(function (off) {
      for (var i = 0; i <= 4; i++) { var p = polar(r, off + i * 90 - 90); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    });
    return E('path', { d: d, class: 'sg-line sg-draw ' + (cls || ''), pathLength: 1 }, parent);
  }
  function medallion(parent, rune, x, y, r) {
    var g = E('g', { class: 'sg-med', transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' }, parent);
    E('circle', { r: r, cx: 0, cy: 0 }, g);
    E('circle', { r: r - 6, cx: 0, cy: 0, style: 'fill:none;stroke-opacity:.25' }, g);
    var d = XRUNE.path(rune, 0, 0, r * 0.95);
    E('path', { d: d, class: 'rune-glow' }, g);
    E('path', { d: d, class: 'rune' }, g);
    return g;
  }

  /* kind: 'hero' | 'mini' | 'covenant' */
  function sigil(kind) {
    var svg, meds = [], labels = [], extra = {};
    if (kind === 'hero') {
      // Stacked layers: the rings that turn are separate elements, so the
      // compositor rotates them without repainting the whole circle.
      svg = document.createElement('div');
      svg.className = 'sg-stack';
      var layer = function (cls) {
        var d = document.createElement('div');
        d.className = 'sg-layer' + (cls ? ' ' + cls : '');
        var s = E('svg', { viewBox: '-500 -500 1000 1000' });
        d.appendChild(s);
        svg.appendChild(d);
        return s;
      };
      var base = layer('');
      circle(base, 488, 'sg-dim', true);
      circle(base, 472, 'sg-faint', true);
      ticks(base, 472, 478, 488, 120, 10, 'sg-faint');
      circle(base, 420, 'sg-faint', true);
      circle(base, 372, 'sg-faint', true);
      octagram(base, 330, 'sg-faint');
      circle(base, 300, 'sg-dim', true);
      circle(base, 228, 'sg-faint', true);

      var turn = layer('spin');
      var ringId = 'sgRing' + Math.random().toString(36).slice(2, 7);
      E('path', { id: ringId, d: 'M0 -446A446 446 0 1 1 0 446A446 446 0 1 1 0 -446', fill: 'none' }, E('defs', null, turn));
      var text = E('text', { class: 'sg-text' }, turn);
      var tp = E('textPath', { href: '#' + ringId, textLength: (2 * Math.PI * 446 - 30).toFixed(0), lengthAdjust: 'spacing' }, text);
      tp.textContent = M.map(function (m) { return m.name.toUpperCase(); }).join('  ✦  ') + '  ✦';
      var fd = '';
      FUTHARK.forEach(function (name, i) { var p = polar(262, i * 15 - 90); fd += XRUNE.path(name, p[0], p[1], 18); });
      E('path', { d: fd, class: 'sg-line sg-faint sg-draw', pathLength: 1, style: 'stroke-width:1.6' }, turn);

      var back = layer('spin-rev');
      M.forEach(function (m, i) { var p = polar(372, i * 45 - 90); meds.push(medallion(back, m.rune, p[0], p[1], 36)); });
    } else if (kind === 'mini') {
      svg = E('svg', { viewBox: '-60 -60 120 120' });
      var spin = E('g', { class: 'sg-spin', style: 'animation-duration:60s' }, svg);
      E('circle', { r: 56, class: 'sg-line sg-dim', style: 'stroke-width:1.4' }, spin);
      ticks(spin, 50, 53, 56, 48, 6, 'sg-dim');
      E('circle', { r: 44, class: 'sg-line sg-faint' }, spin);
      var rd = '';
      M.forEach(function (m, i) { var p = polar(37, i * 45 - 90); rd += XRUNE.path(m.rune, p[0], p[1], 9); });
      E('path', { d: rd, class: 'sg-line', style: 'stroke:#f0d48a;stroke-width:1.2' }, spin);
      E('circle', { r: 27, class: 'sg-line sg-dim' }, svg);
      E('path', { d: XRUNE.path('gebo', 0, 0, 26), class: 'sg-line', style: 'stroke:#f0d48a;stroke-width:3;stroke-linecap:square' }, svg);
    } else {
      svg = E('svg', { viewBox: '-300 -300 600 600', role: 'group', 'aria-label': 'The eight runes of DsRune' });
      circle(svg, 292, 'sg-dim');
      circle(svg, 280, 'sg-faint');
      ticks(svg, 280, 284, 292, 120, 5, 'sg-faint');
      circle(svg, 226, 'sg-faint');
      circle(svg, 140, 'sg-faint');
      var dots = '';
      for (var i = 0; i < 24; i++) { var p = polar(150, i * 15); dots += 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'h.01'; }
      E('path', { d: dots, class: 'sg-line', style: 'stroke-width:3;stroke-linecap:round;stroke-opacity:.5' }, svg);
      var pointer = E('g', { class: 'pointer' }, svg);
      var a = polar(286, -104), b = polar(286, -76);
      E('path', { d: 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'A286 286 0 0 1 ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) }, pointer);
      M.forEach(function (m, i) {
        var p = polar(226, i * 45 - 90);
        var g = medallion(svg, m.rune, p[0], p[1], 32);
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', m.name);
        g.classList.add('lit');
        meds.push(g);
        var c = Math.cos((i * 45 - 90) * Math.PI / 180);
        var q = polar(Math.abs(c) > 0.5 ? 186 : 174, i * 45 - 90);
        var t = E('text', { x: q[0].toFixed(1), y: (q[1] + 4).toFixed(1), class: 'med-label', style: 'text-anchor:' + (c > 0.5 ? 'end' : c < -0.5 ? 'start' : 'middle') }, svg);
        t.textContent = m.key === 'code' ? 'code_block' : m.key;
        labels.push(t);
      });
      extra.core = E('path', { d: '', class: 'core-glyph' }, svg);
      extra.name = E('text', { x: 0, y: 92, class: 'core-name' }, svg);
      extra.pointer = pointer;
    }
    return { svg: svg, meds: meds, labels: labels, extra: extra };
  }
  XRUNE.sigil = sigil;

  var mini = document.getElementById('prismSigil');
  if (mini) mini.appendChild(sigil('mini').svg);

  // ---- hero
  var hero = document.querySelector('.hero');
  var host = document.getElementById('heroSigil');
  if (!hero || !host) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sg = sigil('hero');
  host.appendChild(sg.svg);

  var level = document.getElementById('xrLevel');
  var hot = document.getElementById('xr-hot');
  var sheen = document.getElementById('xrSheenAnim');
  var brand = hero.querySelector('.brand-svg');

  function flare() {
    var r = brand.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('xrune:flare', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(320, r.width * 0.7) } }));
  }
  function glint() { if (sheen && sheen.beginElement && !document.hidden) { try { sheen.beginElement(); } catch (_) {} } }

  var finished = false;
  function fillAll() { level.setAttribute('y', '290'); level.setAttribute('height', '1210'); }
  function finish() {
    if (finished) return;
    finished = true;
    fillAll();
    sg.meds.forEach(function (m) { m.classList.add('lit'); });
    hero.classList.add('s-draw', 's-cool', 's-text', 'done');
  }

  if (reduce) { finish(); return; }

  // a click, key or wheel during the rite skips straight to its end
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!hero.classList.contains('done')) finish(); }, { once: true, passive: true });
  });

  function at(ms, fn) { setTimeout(function () { if (!finished) fn(); }, ms); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function pour(dur, done) {
    var top = 290, bottom = 1490, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), y = bottom - (bottom - top) * ease(k);
      level.setAttribute('y', y.toFixed(1));
      level.setAttribute('height', (bottom - y + 4).toFixed(1));
      hot.setAttribute('y1', (y - 10).toFixed(1));
      hot.setAttribute('y2', (y + 620).toFixed(1));
      if (k < 1) requestAnimationFrame(step); else done();
    })(t0);
  }

  at(80, function () { hero.classList.add('s-draw'); });
  sg.meds.forEach(function (m, i) {
    at(420 + i * 140, function () {
      m.classList.add('lit', 'flash');
      at(240, function () { m.classList.remove('flash'); });
    });
  });
  at(1300, function () {
    pour(950, function () {
      if (finished) return;
      hero.classList.add('s-cool');
      at(200, function () { hero.classList.add('s-text'); });
      at(800, function () { glint(); flare(); });
      at(1800, function () { finish(); });
    });
  });
  setInterval(function () {
    var r = hero.getBoundingClientRect();
    if (finished && r.bottom > 0 && r.top < window.innerHeight) glint();
  }, 9000);

  // ---- parallax: the circle and the letters drift against each other
  var tx = 0, ty = 0, px = 0, py = 0, raf = 0, inView = true;
  function tick() {
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    hero.style.setProperty('--px', px.toFixed(4));
    hero.style.setProperty('--py', py.toFixed(4));
    raf = (Math.abs(tx - px) + Math.abs(ty - py) > 0.0008) ? requestAnimationFrame(tick) : 0;
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || !inView) return;
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(hero);
  }
})();
