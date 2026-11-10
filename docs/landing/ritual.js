/* II · The Ritual. One casting traced through DSL → DsTree → DsRune calls
 * → emitted code. Each stage shows its input on the left and what it becomes
 * on the right; a gold thread ties the node being read to the node being
 * written. The data below mirrors examples/example0 and DefaultRune. */
(function () {
  var root = document.getElementById('ritual');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var belt = document.getElementById('rBelt');
  var seal = document.getElementById('rSeal');
  var thread = document.getElementById('rThread');
  var playBtn = document.getElementById('rPlay');
  var restartBtn = document.getElementById('rRestart');
  var stages = Array.prototype.slice.call(root.querySelectorAll('.r-stage'));
  var arrows = Array.prototype.slice.call(root.querySelectorAll('.r-arrow'));
  var T = function (k) { return window.XR ? XR.t(k) : k; };
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function spans(toks, parent) {
    toks.forEach(function (tk) {
      var cls = tk[0] || '';
      if (/^\s+$/.test(tk[1])) cls = (cls ? cls + ' ' : '') + 'ws';
      var s = el('span', cls || null); s.textContent = tk[1]; parent.appendChild(s);
    });
  }
  function glyph(rune) { var w = el('span'); w.innerHTML = XRUNE.svg(rune); return w.firstChild; }

  var source = [
    { e: null, toks: [['k', 'ui!'], ['', ' '], ['p', '{']] },
    { e: null, toks: [['', '    '], ['p', ':(']] },
    { e: 'parent', toks: [['', '        '], ['', 'parent: parent']] },
    { e: null, toks: [['', '    '], ['p', ':)']] },
    { e: 'div', toks: [['', '    '], ['n', 'div'], ['', ' '], ['p', '('], ['', 'width: '], ['num', '100'], ['', ', height: '], ['num', '100+A'], ['', ', color: '], ['s', '"red"'], ['p', ')'], ['', ' '], ['p', '{']] },
    { e: 'text', toks: [['', '        '], ['n', 'text'], ['', ' '], ['p', '('], ['', 'content: '], ['s', '"hello world"'], ['p', ')']] },
    { e: 'button', toks: [['', '        '], ['n', 'button'], ['', ' '], ['p', '('], ['', 'text: '], ['s', '"Save"'], ['p', ')']] },
    { e: 'button', toks: [['', '            '], ['ench', '[Velocity{..}, Tracked]']] },
    { e: 'button', toks: [['', '            '], ['k', 'on'], ['', ' Tap '], ['p', '{'], ['', ' save() '], ['p', '} {}']] },
    { e: 'walk', toks: [['', '        '], ['k', 'walk'], ['', ' range('], ['num', '20'], ['', ') '], ['k', 'with'], ['', ' i '], ['p', '{']] },
    { e: 'walkbtn', toks: [['', '            '], ['n', 'button'], ['', ' '], ['p', '('], ['', 'text: '], ['num', '6'], ['p', ')'], ['', ' '], ['p', '{}']] },
    { e: null, toks: [['', '        '], ['p', '}']] },
    { e: 'if', toks: [['', '        '], ['k', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' '], ['p', '{']] },
    { e: 'input', toks: [['', '            '], ['n', 'input'], ['', ' '], ['p', '{}']] },
    { e: null, toks: [['', '        '], ['p', '}']] },
    { e: null, toks: [['', '    '], ['p', '}']] },
    { e: null, toks: [['p', '}']] }
  ];

  // enchants and on ride as field badges on the Widget node, not as children.
  var tree = {
    e: 'parent', badge: 'Root', cls: 'v-root', lbl: 'parent', kids: [
      { e: 'div', badge: 'Widget', cls: 'v-widget', lbl: 'div', kids: [
        { e: 'text', badge: 'Widget', cls: 'v-widget', lbl: 'text', kids: [] },
        { e: 'button', badge: 'Widget', cls: 'v-widget', lbl: 'button', fields: ['enchants', 'on Tap'], kids: [] },
        { e: 'walk', badge: 'Iter', cls: 'v-iter', lbl: 'walk i', kids: [
          { e: 'walkbtn', badge: 'Widget', cls: 'v-widget', lbl: 'button', kids: [] }
        ] },
        { e: 'if', badge: 'If', cls: 'v-if', lbl: 'a == "1"', kids: [
          { e: 'input', badge: 'Widget', cls: 'v-widget', lbl: 'input', kids: [] }
        ] }
      ] }
    ]
  };

  var calls = [
    { e: 'parent', m: 'root', sig: 'inscribe_root(parent)' },
    { e: 'div', m: 'widget', sig: 'inscribe_widget(div)' },
    { e: 'text', m: 'widget', sig: 'inscribe_widget(text)' },
    { e: 'button', m: 'widget', sig: 'inscribe_widget(button)' },
    { e: 'walk', m: 'iter', sig: 'inscribe_iter(i in range(20))' },
    { e: 'walkbtn', m: 'widget', sig: 'inscribe_widget(button)' },
    { e: 'if', m: 'if', sig: 'inscribe_if(a == "1")' },
    { e: 'input', m: 'widget', sig: 'inscribe_widget(input)' }
  ];

  function L(e, indent, toks) { return { e: e, indent: indent, toks: toks }; }
  var trace = [
    L('parent', 0, [['kw', 'let'], ['', ' parent = '], ['num', '10']]),
    L('div', 0, [['kw', 'let'], ['', ' div = '], ['fn', 'obj::new'], ['p', '('], ['', 'parent'], ['p', ')']]),
    L('div', 0, [['', 'div.'], ['fn', 'set_width'], ['p', '('], ['num', '100'], ['p', ')']]),
    L('div', 0, [['', 'div.'], ['fn', 'set_height'], ['p', '('], ['num', '120'], ['p', ')']]),
    L('div', 0, [['', 'div.'], ['fn', 'set_color'], ['p', '('], ['s', '"red"'], ['p', ')']]),
    L('text', 0, [['kw', 'let'], ['', ' text = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L('text', 0, [['', 'text.'], ['fn', 'set_content'], ['p', '('], ['s', '"hello world"'], ['p', ')']]),
    L('button', 0, [['kw', 'let'], ['', ' button = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L('button', 0, [['', 'button.'], ['fn', 'set_text'], ['p', '('], ['s', '"Save"'], ['p', ')']]),
    L('button', 0, [['', 'button.'], ['fn', 'on'], ['p', '('], ['n', 'Tap'], ['', ', '], ['p', '||'], ['', ' { '], ['fn', 'save'], ['p', '()'], ['', ' }'], ['p', ')']]),
    L('walk', 0, [['kw', 'for'], ['', ' i '], ['kw', 'in'], ['', ' range'], ['p', '('], ['num', '20'], ['p', ') {']]),
    L('walkbtn', 1, [['kw', 'let'], ['', ' button = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L('walkbtn', 1, [['', 'button.'], ['fn', 'set_text'], ['p', '('], ['num', '6'], ['p', ')']]),
    L('walk', 0, [['p', '}']]),
    L('if', 0, [['kw', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' {']]),
    L('input', 1, [['kw', 'let'], ['', ' input = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L('if', 0, [['p', '}']])
  ];

  var order = ['parent', 'div', 'text', 'button', 'walk', 'walkbtn', 'if', 'input'];

  function view(titleKey, rune, body) {
    var v = el('div', 'r-panel');
    var t = el('p', 'r-view-title');
    t.appendChild(glyph(rune));
    var label = el('span', null, T(titleKey));
    label.setAttribute('data-rk', titleKey);
    t.appendChild(label);
    v.appendChild(t);
    v.appendChild(body);
    return v;
  }

  function buildSource() {
    var pre = el('pre'), code = el('code'), by = {};
    source.forEach(function (ln) {
      var line = el('span', 'r-line'); spans(ln.toks, line);
      if (ln.e) (by[ln.e] = by[ln.e] || []).push(line);
      code.appendChild(line);
    });
    pre.appendChild(code);
    var b = el('div', 'r-view-body r-cast'); b.appendChild(pre);
    return { root: view('ritual.p.source', 'ansuz', b), by: by, mark: 'reading' };
  }
  function buildTree() {
    var host = el('div', 'r-tree'), by = {};
    (function render(node, container) {
      var nodeEl = el('div', 'r-node ' + node.cls);
      nodeEl.appendChild(el('span', 'badge', node.badge));
      nodeEl.appendChild(el('span', 'lbl', node.lbl));
      (node.fields || []).forEach(function (f) { nodeEl.appendChild(el('span', 'field-badge', f)); });
      by[node.e] = [nodeEl];
      var box = el('div'); box.appendChild(nodeEl);
      if (node.kids && node.kids.length) {
        var kids = el('div', 'r-children');
        node.kids.forEach(function (k) { render(k, kids); });
        box.appendChild(kids);
      }
      container.appendChild(box);
    })(tree, host);
    var b = el('div', 'r-view-body'); b.appendChild(host);
    return { root: view('ritual.p.tree', 'eihwaz', b), by: by, mark: 'visiting' };
  }
  function buildCalls() {
    var host = el('div', 'r-calls'), by = {};
    calls.forEach(function (c) {
      var row = el('div', 'r-call');
      row.appendChild(glyph(XRUNE.RUNE_OF[c.m]));
      row.appendChild(el('span', 'sig', c.sig));
      by[c.e] = [row]; host.appendChild(row);
    });
    var b = el('div', 'r-view-body'); b.appendChild(host);
    return { root: view('ritual.p.calls', 'gebo', b), by: by, mark: 'firing' };
  }
  function buildTrace() {
    var pre = el('pre'), code = el('code'), by = {};
    trace.forEach(function (ln) {
      var line = el('span', 'r-line'); line.setAttribute('data-indent', String(ln.indent));
      spans(ln.toks, line);
      (by[ln.e] = by[ln.e] || []).push(line);
      code.appendChild(line);
    });
    pre.appendChild(code);
    var b = el('div', 'r-view-body r-trace'); b.appendChild(pre);
    return { root: view('ritual.p.trace', 'ingwaz', b), by: by, mark: 'emit' };
  }

  var P = { source: buildSource(), tree: buildTree(), calls: buildCalls(), trace: buildTrace() };
  var REP = ['source', 'tree', 'calls', 'trace'];
  REP.forEach(function (name) { P[name].root.classList.add('r-belt-panel', 'pos-wait'); belt.appendChild(P[name].root); });
  var MARKS = ['reading', 'visiting', 'firing', 'emit'];
  function clearPanel(p) {
    Object.keys(p.by).forEach(function (k) { p.by[k].forEach(function (n) { MARKS.forEach(function (m) { n.classList.remove(m); }); }); });
    var s = p.root.querySelector('.r-sink'); if (s) s.remove();
  }
  function hiPanel(p, id) { (p.by[id] || []).forEach(function (n) { n.classList.add(p.mark); }); }
  function sinkPanel(p) { var s = el('div', 'r-sink', T('ritual.sink')); s.setAttribute('data-rk', 'ritual.sink'); p.root.appendChild(s); }
  function revealPanel(p, upto) {
    order.forEach(function (e, ei) { (p.by[e] || []).forEach(function (n) { n.classList.toggle('r-pending', ei > upto); }); });
  }
  function showAllPanel(p) { order.forEach(function (e) { (p.by[e] || []).forEach(function (n) { n.classList.remove('r-pending'); }); }); }

  var dropsAtB = { button: true };
  var STAGE = { A: { left: 'source', right: 'tree', rail: 0 }, B: { left: 'tree', right: 'calls', rail: 1 }, C: { left: 'calls', right: 'trace', rail: 2 } };

  var steps = [];
  ['A', 'B', 'C'].forEach(function (st) { order.forEach(function (e, ei) { steps.push({ stage: st, entity: e, eidx: ei }); }); });
  steps.push({ stage: 'seal' });

  var POS = ['pos-out', 'pos-big', 'pos-small', 'pos-wait', 'pos-center'];
  function place(name, pos) { var pe = P[name].root; POS.forEach(function (c) { pe.classList.toggle(c, c === pos); }); }
  function placeBelt(bigName) {
    var bi = REP.indexOf(bigName);
    REP.forEach(function (name, i) { place(name, i < bi ? 'pos-out' : i === bi ? 'pos-big' : i === bi + 1 ? 'pos-small' : 'pos-wait'); });
  }

  function setRail(idx, sealed) {
    stages.forEach(function (s, i) {
      if (sealed) { s.classList.add('done'); s.classList.remove('lit'); }
      else { s.classList.toggle('lit', i === idx); s.classList.toggle('done', i < idx); }
    });
    if (sealed) stages[stages.length - 1].classList.add('lit');
    arrows.forEach(function (a, i) { a.classList.toggle('lit', sealed || i < idx); });
  }

  function clearAll() { Object.keys(P).forEach(function (k) { clearPanel(P[k]); }); }

  var narrow = function () { return window.innerWidth <= 760; };
  function syncBeltHeight() {
    requestAnimationFrame(function () {
      var big = belt.querySelector('.pos-big'), small = belt.querySelector('.pos-small'), center = belt.querySelector('.pos-center');
      var h = 0;
      if (center) h = center.offsetHeight;
      if (big && small) {
        if (narrow()) { small.style.setProperty('--below', (big.offsetHeight + 18) + 'px'); h = big.offsetHeight + 18 + small.offsetHeight; }
        else h = Math.max(big.offsetHeight, small.offsetHeight);
      }
      if (h) belt.style.minHeight = (h + 8) + 'px';
    });
  }

  // ---- the gold thread between what is read and what is written
  var threadPath = document.createElementNS(NS, 'path');
  var dotA = document.createElementNS(NS, 'circle'), dotB = document.createElementNS(NS, 'circle');
  dotA.setAttribute('r', '3'); dotB.setAttribute('r', '3');
  thread.innerHTML = '<defs><linearGradient id="rThreadGrad" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f0d48a"/><stop offset="1" stop-color="#e0694e"/></linearGradient></defs>';
  thread.appendChild(threadPath); thread.appendChild(dotA); thread.appendChild(dotB);
  var grad = thread.querySelector('linearGradient');
  var link = null;
  function union(nodes) {
    var r = null;
    nodes.forEach(function (n) {
      var b = n.getBoundingClientRect();
      if (!b.width && !b.height) return;
      r = r ? { l: Math.min(r.l, b.left), t: Math.min(r.t, b.top), r: Math.max(r.r, b.right), b: Math.max(r.b, b.bottom) } : { l: b.left, t: b.top, r: b.right, b: b.bottom };
    });
    return r;
  }
  function drawThread() {
    if (!link || narrow()) { thread.style.opacity = '0'; return; }
    var a = union(link.from), b = union(link.to);
    if (!a || !b) { thread.style.opacity = '0'; return; }
    var o = belt.getBoundingClientRect();
    var sx = a.r - o.left + 4, sy = (a.t + a.b) / 2 - o.top;
    var ex = b.l - o.left - 4, ey = (b.t + b.b) / 2 - o.top;
    var dx = Math.max(26, Math.abs(ex - sx) * 0.5);
    threadPath.setAttribute('d', 'M' + sx + ' ' + sy + 'C' + (sx + dx) + ' ' + sy + ' ' + (ex - dx) + ' ' + ey + ' ' + ex + ' ' + ey);
    grad.setAttribute('x1', sx); grad.setAttribute('x2', ex);
    dotA.setAttribute('cx', sx); dotA.setAttribute('cy', sy);
    dotB.setAttribute('cx', ex); dotB.setAttribute('cy', ey);
    thread.style.opacity = '1';
  }

  function applyStep(i) {
    var step = steps[i];
    clearAll();
    if (step.stage === 'seal') {
      REP.forEach(function (name) { place(name, name === 'trace' ? 'pos-center' : 'pos-out'); });
      showAllPanel(P.trace);
      setRail(stages.length - 1, true);
      seal.classList.add('sealed');
      link = null;
      syncBeltHeight();
      var r = seal.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('xrune:flare', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
      return;
    }
    seal.classList.remove('sealed');
    var cfg = STAGE[step.stage];
    placeBelt(cfg.left);
    setRail(cfg.rail, false);
    showAllPanel(P[cfg.left]);
    revealPanel(P[cfg.right], step.eidx);
    hiPanel(P[cfg.left], step.entity);
    hiPanel(P[cfg.right], step.entity);
    if (step.stage === 'B' && dropsAtB[step.entity]) sinkPanel(P[cfg.right]);
    link = { from: P[cfg.left].by[step.entity] || [], to: P[cfg.right].by[step.entity] || [] };
    syncBeltHeight();
  }

  window.addEventListener('xrune:lang', function () {
    root.querySelectorAll('[data-rk]').forEach(function (n) { n.textContent = T(n.getAttribute('data-rk')); });
    syncBeltHeight();
  });
  window.addEventListener('resize', syncBeltHeight);

  if (reduce) {
    placeBelt('trace');
    REP.forEach(function (name) { place(name, name === 'trace' ? 'pos-center' : 'pos-out'); });
    showAllPanel(P.trace);
    setRail(stages.length - 1, true);
    seal.classList.add('sealed');
    syncBeltHeight();
    return;
  }

  // ---- clock: auto-advance, pause on hover, on the button, and off-screen
  var idx = 0, clock = null, started = false, userPaused = false, hover = false, visible = false, raf = 0;
  function dwellOf(i) {
    var s = steps[i];
    if (!s) return 700;
    if (s.stage === 'seal') return 3400;
    return s.eidx === 0 ? 1100 : 680;
  }
  function running() { return started && !userPaused && !hover && visible; }
  function schedule() {
    if (clock) { clearTimeout(clock); clock = null; }
    if (!running()) return;
    clock = setTimeout(function () { idx = (idx + 1) % steps.length; applyStep(idx); schedule(); }, dwellOf(idx));
  }
  function loop() { drawThread(); raf = visible ? requestAnimationFrame(loop) : 0; }
  function jumpTo(i) { idx = i; applyStep(idx); schedule(); }

  var firstOf = {};
  steps.forEach(function (s, i) { if (firstOf[s.stage] === undefined) firstOf[s.stage] = i; });
  stages.forEach(function (s) {
    s.addEventListener('click', function () { started = true; jumpTo(firstOf[s.getAttribute('data-stage')]); });
  });
  playBtn.addEventListener('click', function () {
    userPaused = !userPaused;
    playBtn.classList.toggle('paused', userPaused);
    playBtn.setAttribute('aria-label', userPaused ? 'Play' : 'Pause');
    schedule();
  });
  restartBtn.addEventListener('click', function () { started = true; jumpTo(0); });
  belt.addEventListener('mouseenter', function () { hover = true; schedule(); });
  belt.addEventListener('mouseleave', function () { hover = false; schedule(); });

  applyStep(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible) { started = true; if (!raf) raf = requestAnimationFrame(loop); }
        schedule();
      });
    }, { threshold: 0.15 }).observe(root);
  } else { visible = true; started = true; loop(); schedule(); }
})();
