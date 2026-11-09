/* Page plumbing: nav state, scroll reveals, copy buttons, the live crate
 * version, beams in the prism and the nexus, the mirui Card, the wax seal. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = function (k, v) { return XR.t(k, v); };
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---- glyphs and static code
  $$('[data-glyph]').forEach(function (el) { el.innerHTML = XRUNE.svg(el.getAttribute('data-glyph')); });
  $$('code.hl-dsl').forEach(function (c) { c.innerHTML = XRUNE.hl.dsl(c.textContent); });
  $$('code.hl-rust').forEach(function (c) { c.innerHTML = XRUNE.hl.rust(c.textContent); });

  // ---- language
  var langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.addEventListener('click', function () { XR.setLang(XR.lang() === 'zh' ? 'en' : 'zh'); });

  // ---- nav: glass once scrolled, and which chapter is on screen
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var links = {};
  $$('.nav-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('.nav-links a').forEach(function (a) { a.classList.remove('on'); });
        if (links[e.target.id]) links[e.target.id].classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(function (s) { spy.observe(s); });

    var rev = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { rev.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ---- copy
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var done = function () {
        b.textContent = T('copy.done'); b.classList.add('ok');
        setTimeout(function () { b.textContent = T('cta.copy'); b.classList.remove('ok'); }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
    });
  });

  // ---- the live version from crates.io, cached for an hour
  (function () {
    var KEY = 'xrune-crate', data = null;
    try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    function paint(d) {
      if (!d || !d.v) return;
      $$('[data-crate-version]').forEach(function (el) { el.textContent = 'v' + d.v; });
      if (d.dl) $$('[data-crate-downloads]').forEach(function (el) { el.textContent = ' · ' + Number(d.dl).toLocaleString() + ' ↓'; });
    }
    paint(data);
    if (data && Date.now() - data.t < 3600e3) return;
    fetch('https://crates.io/api/v1/crates/xrune', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.crate) return;
        var d = { v: j.crate.max_stable_version || j.crate.max_version, dl: j.crate.downloads, t: Date.now() };
        try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) {}
        paint(d);
      })
      .catch(function () {});
  })();

  // ---- gilt cards: a light that follows the pointer
  $$('.gilt').forEach(function (card) {
    var g = document.createElement('span'); g.className = 'glow'; card.insertBefore(g, card.firstChild);
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ---- beams: curves between element edges, redrawn on resize
  function rel(el, host) {
    var a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
    return { l: a.left - b.left, r: a.right - b.left, t: a.top - b.top, b: a.bottom - b.top, cx: (a.left + a.right) / 2 - b.left, cy: (a.top + a.bottom) / 2 - b.top };
  }
  function curve(x1, y1, x2, y2) {
    var dx = (x2 - x1) * 0.5;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }
  function grad(svg, id, w) {
    return '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + w + '" y2="0">' +
      '<stop offset="0" stop-color="#f0d48a" stop-opacity=".2"/><stop offset=".5" stop-color="#f0d48a"/><stop offset="1" stop-color="#e0694e" stop-opacity=".6"/></linearGradient></defs>';
  }

  var prism = document.getElementById('prism'), beams = document.getElementById('prismBeams');
  function drawPrism() {
    if (!prism || !beams || window.innerWidth <= 960) return;
    var W = prism.clientWidth, src = rel(prism.querySelector('.prism-src'), prism), core = rel(prism.querySelector('.prism-sigil'), prism);
    var html = grad(beams, 'beamGrad', W);
    var a = curve(src.r, src.cy, core.l - 6, core.cy);
    html += '<path d="' + a + '"/><path class="flow" d="' + a + '"/>';
    $$('.prism-out li', prism).forEach(function (li) {
      var o = rel(li, prism), d = curve(core.r + 6, core.cy, o.l, o.cy);
      html += '<path d="' + d + '"/><path class="flow" d="' + d + '"/>';
    });
    beams.innerHTML = html;
  }

  var cn = document.getElementById('constellation'), cnLines = document.getElementById('cnLines');
  var EDGES = [['sigil', 'nexus'], ['nexus', 'incant'], ['nexus', 'xrune'], ['incant', 'xrune'], ['nexus', 'fmt'], ['xrune', 'mirui', 'ghost']];
  function drawNexus() {
    if (!cn || !cnLines || window.innerWidth <= 960) return;
    var nodes = {};
    $$('.cn-node', cn).forEach(function (n) { nodes[n.getAttribute('data-node')] = rel(n, cn); });
    var html = grad(cnLines, 'cnGrad', cn.clientWidth);
    EDGES.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      if (!a || !b) return;
      var d = 'M' + a.cx.toFixed(1) + ' ' + a.cy.toFixed(1) + 'Q' + ((a.cx + b.cx) / 2).toFixed(1) + ' ' + (Math.min(a.cy, b.cy) - 40).toFixed(1) + ' ' + b.cx.toFixed(1) + ' ' + b.cy.toFixed(1);
      html += '<path data-e="' + e[0] + ' ' + e[1] + '" class="' + (e[2] || '') + '" d="' + d + '"/>';
      html += '<path data-e="' + e[0] + ' ' + e[1] + '" class="pulse" d="' + d + '"/>';
    });
    cnLines.innerHTML = html;
  }
  if (cn) {
    $$('.cn-node', cn).forEach(function (n) {
      var id = n.getAttribute('data-node');
      n.addEventListener('mouseenter', function () {
        cn.classList.add('focus');
        n.classList.add('on');
        $$('path[data-e]', cnLines).forEach(function (p) {
          var ends = p.getAttribute('data-e').split(' ');
          var hit = ends.indexOf(id) >= 0;
          p.classList.toggle('on', hit);
          if (hit) ends.forEach(function (x) { var other = cn.querySelector('[data-node="' + x + '"]'); if (other) other.classList.add('on'); });
        });
      });
      n.addEventListener('mouseleave', function () {
        cn.classList.remove('focus');
        $$('.cn-node', cn).forEach(function (x) { x.classList.remove('on'); });
        $$('path', cnLines).forEach(function (p) { p.classList.remove('on'); });
      });
    });
  }
  function redraw() { drawPrism(); drawNexus(); }
  window.addEventListener('resize', function () { clearTimeout(redraw.t); redraw.t = setTimeout(redraw, 100); });
  window.addEventListener('xrune:lang', function () { setTimeout(redraw, 30); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  window.addEventListener('load', redraw);
  redraw();

  // ---- mirui: the template and the call site, and the Card they compose
  var stage = document.getElementById('wildStage'), card = document.getElementById('wildCard');
  var wcode = document.querySelector('.wild-code'), touched = false;
  // tag every code line with the slot it declares or fills
  $$('[data-wc-pane] code').forEach(function (code) {
    var text = code.textContent.split('\n'), html = code.innerHTML.split('\n');
    if (text.length !== html.length) return;
    var slot = null, depth = 0;
    code.innerHTML = html.map(function (h, i) {
      var t = text[i], m;
      if (!slot && (m = /^\s*@@?(\w+)/.exec(t))) { slot = m[1]; depth = 0; }
      var own = slot;
      if (slot) {
        depth += (t.match(/\{/g) || []).length - (t.match(/\}/g) || []).length;
        if (depth <= 0) slot = null;
      }
      return '<span class="ln"' + (own ? ' data-slot="' + own + '"' : '') + '>' + h + '</span>';
    }).join('\n');
  });
  function setMode(mode) {
    if (!stage) return;
    stage.setAttribute('data-mode', mode);
    $$('.wc-tabs button').forEach(function (x) {
      var on = x.getAttribute('data-wc') === mode;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $$('[data-wc-pane]').forEach(function (p) { p.classList.toggle('off', p.getAttribute('data-wc-pane') !== mode); });
    stage.classList.remove('sweep');
    void stage.offsetWidth;
    stage.classList.add('sweep');
  }
  $$('.wc-tabs button').forEach(function (b) {
    b.addEventListener('click', function () { touched = true; setMode(b.getAttribute('data-wc')); });
  });
  if (card) {
    var flip = function () { touched = true; setMode(stage.getAttribute('data-mode') === 'fill' ? 'decl' : 'fill'); };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  }
  function linkSlot(name) {
    if (wcode) wcode.classList.toggle('linking', !!name);
    $$('.wild-code .ln').forEach(function (l) { l.classList.toggle('hot', !!name && l.getAttribute('data-slot') === name); });
    if (stage) $$('.ws-slot', stage).forEach(function (s) { s.classList.toggle('hot', !!name && s.getAttribute('data-slot') === name); });
  }
  if (stage) $$('.ws-slot', stage).forEach(function (s) {
    s.addEventListener('mouseenter', function () { linkSlot(s.getAttribute('data-slot')); });
    s.addEventListener('mouseleave', function () { linkSlot(null); });
  });
  if (wcode) {
    wcode.addEventListener('mouseover', function (e) {
      var l = e.target.closest && e.target.closest('.ln[data-slot]');
      linkSlot(l ? l.getAttribute('data-slot') : null);
    });
    wcode.addEventListener('mouseleave', function () { linkSlot(null); });
  }
  // the first time the Card comes into view, the call site fills it once
  if (stage && !reduce && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      seen.disconnect();
      setTimeout(function () { if (!touched) setMode('fill'); }, 1600);
    }, { threshold: 0.6 });
    seen.observe(stage);
  }

  // ---- the wax seal in the colophon
  var wax = document.getElementById('waxSeal');
  if (wax) {
    var d = '', n = 220;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      var r = 36 + Math.sin(a * 9) * 1.4 + Math.sin(a * 23 + 1.3) * 0.9 + Math.sin(a * 4 + .6) * 1.1;
      d += (i ? 'L' : 'M') + (40 + Math.cos(a) * r).toFixed(2) + ' ' + (40 + Math.sin(a) * r).toFixed(2);
    }
    wax.innerHTML = '<svg viewBox="0 0 80 80"><defs><radialGradient id="waxG" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#d9644a"/><stop offset=".55" stop-color="#9a2e1d"/><stop offset="1" stop-color="#5a170d"/></radialGradient></defs>' +
      '<path d="' + d + 'Z" fill="url(#waxG)"/>' +
      '<circle cx="40" cy="40" r="25" fill="none" stroke="#5a170d" stroke-width="2" opacity=".7"/>' +
      '<circle cx="40" cy="40" r="25" fill="none" stroke="#f08a6c" stroke-width=".8" opacity=".35" transform="translate(-.6 -.8)"/>' +
      '<path d="' + XRUNE.path('gebo', 40, 40, 24) + '" fill="none" stroke="#4d130a" stroke-width="4.2" stroke-linecap="square"/>' +
      '<path d="' + XRUNE.path('gebo', 39.4, 39.2, 24) + '" fill="none" stroke="#f3967a" stroke-width="1" stroke-linecap="square" opacity=".55"/></svg>';
  }

  if (reduce) $$('.reveal').forEach(function (el) { el.classList.add('in'); });
})();
