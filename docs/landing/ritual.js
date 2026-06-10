(function () {
  var root = document.getElementById('ritual');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var slotL = document.getElementById('rSlotL');
  var slotR = document.getElementById('rSlotR');
  var seal = document.getElementById('rSeal');
  var stages = Array.prototype.slice.call(root.querySelectorAll('.r-stage'));
  var arrows = Array.prototype.slice.call(root.querySelectorAll('.r-arrow'));

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function spans(toks, parent) { toks.forEach(function (tk) { var s = el('span', tk[0] || null); s.textContent = tk[1]; parent.appendChild(s); }); }

  // context header :( :) stays multi-line; text/button widget bodies are optional.
  var source = [
    { e: null, toks: [['k', 'ui!'], ['', ' '], ['p', '{']] },
    { e: null, toks: [['', '    '], ['p', ':(']] },
    { e: 'parent', toks: [['', '        '], ['', 'parent: parent']] },
    { e: null, toks: [['', '    '], ['p', ':)']] },
    { e: null, toks: [] },
    { e: 'div', toks: [['', '    '], ['n', 'div'], ['', ' '], ['p', '('], ['', 'width: '], ['num', '100'], ['', ', height: '], ['num', '100+A'], ['', ', color: '], ['s', '"red"'], ['p', ')'], ['', ' '], ['p', '{']] },
    { e: 'text', toks: [['', '        '], ['n', 'text'], ['', ' '], ['p', '('], ['', 'content: '], ['s', '"hello world"'], ['p', ')']] },
    { e: 'button', toks: [['', '        '], ['n', 'button'], ['', ' '], ['p', '('], ['', 'text: '], ['s', '"Save"'], ['p', ')'], ['', ' '], ['ench', '[Velocity{..}, Tracked]'], ['', ' '], ['k', 'on'], ['', ' Tap '], ['p', '{'], ['', ' save() '], ['p', '} {}']] },
    { e: 'walk', toks: [['', '        '], ['k', 'walk'], ['', ' range('], ['num', '20'], ['', ') '], ['k', 'with'], ['', ' i '], ['p', '{']] },
    { e: 'walkbtn', toks: [['', '            '], ['n', 'button'], ['', ' '], ['p', '('], ['', 'text: '], ['num', '6'], ['p', ')'], ['', ' '], ['p', '{}']] },
    { e: null, toks: [['', '        '], ['p', '}']] },
    { e: 'if', toks: [['', '        '], ['k', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' '], ['p', '{']] },
    { e: 'input', toks: [['', '            '], ['n', 'input'], ['', ' '], ['p', '{}']] },
    { e: null, toks: [['', '        '], ['p', '}']] },
    { e: null, toks: [['', '    '], ['p', '}']] },
    { e: null, toks: [['p', '}']] }
  ];

  // enchants/on ride as field badges on the Widget node, not as child nodes.
  var tree = {
    e: 'parent', badge: 'Root', cls: 'v-root', lbl: 'parent', fields: [], kids: [
      { e: 'div', badge: 'Widget', cls: 'v-widget', lbl: 'div', fields: [], kids: [
        { e: 'text', badge: 'Widget', cls: 'v-widget', lbl: 'text', fields: [], kids: [] },
        { e: 'button', badge: 'Widget', cls: 'v-widget', lbl: 'button', fields: ['enchants', 'on Tap'], kids: [] },
        { e: 'walk', badge: 'Iter', cls: 'v-iter', lbl: 'walk i', fields: [], kids: [
          { e: 'walkbtn', badge: 'Widget', cls: 'v-widget', lbl: 'button', fields: [], kids: [] }
        ] },
        { e: 'if', badge: 'If', cls: 'v-if', lbl: 'a == "1"', fields: [], kids: [
          { e: 'input', badge: 'Widget', cls: 'v-widget', lbl: 'input', fields: [], kids: [] }
        ] }
      ] }
    ]
  };

  var calls = [
    { e: 'parent', sig: 'inscribe_root(parent)' },
    { e: 'div', sig: 'inscribe_widget(div)' },
    { e: 'text', sig: 'inscribe_widget(text)' },
    { e: 'button', sig: 'inscribe_widget(button)' },
    { e: 'walk', sig: 'inscribe_iter(i in range(20))' },
    { e: 'walkbtn', sig: 'inscribe_widget(button)' },
    { e: 'if', sig: 'inscribe_if(a == "1")' },
    { e: 'input', sig: 'inscribe_widget(input)' }
  ];

  function T(e, indent, toks) { return { e: e, indent: indent, toks: toks }; }
  var trace = [
    T('parent', 0, [['kw', 'let'], ['', ' parent = '], ['num', '10']]),
    T('div', 0, [['kw', 'let'], ['', ' div = '], ['fn', 'obj::new'], ['p', '('], ['', 'parent'], ['p', ')']]),
    T('div', 0, [['', 'div.'], ['fn', 'set_width'], ['p', '('], ['num', '100'], ['p', ')']]),
    T('div', 0, [['', 'div.'], ['fn', 'set_height'], ['p', '('], ['num', '120'], ['p', ')']]),
    T('div', 0, [['', 'div.'], ['fn', 'set_color'], ['p', '('], ['s', '"red"'], ['p', ')']]),
    T('text', 0, [['kw', 'let'], ['', ' text = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    T('text', 0, [['', 'text.'], ['fn', 'set_content'], ['p', '('], ['s', '"hello world"'], ['p', ')']]),
    T('button', 0, [['kw', 'let'], ['', ' button = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    T('button', 0, [['', 'button.'], ['fn', 'set_text'], ['p', '('], ['s', '"Save"'], ['p', ')']]),
    T('button', 0, [['', 'button.'], ['fn', 'on'], ['p', '('], ['n', 'Tap'], ['', ', '], ['p', '||'], ['', ' { '], ['fn', 'save'], ['p', '()'], ['', ' }'], ['p', ')']]),
    T('walk', 0, [['kw', 'for'], ['', ' i '], ['kw', 'in'], ['', ' range '], ['p', '('], ['num', '20'], ['p', ') {']]),
    T('walkbtn', 1, [['kw', 'let'], ['', ' button = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    T('walkbtn', 1, [['', 'button.'], ['fn', 'set_text'], ['p', '('], ['num', '6'], ['p', ')']]),
    T('walk', 0, [['p', '}']]),
    T('if', 0, [['kw', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' {']]),
    T('input', 1, [['kw', 'let'], ['', ' input = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    T('if', 0, [['p', '}']])
  ];

  var order = ['parent', 'div', 'text', 'button', 'walk', 'walkbtn', 'if', 'input'];

  function view(title, body) {
    var v = el('div', 'r-panel');
    v.appendChild(el('p', 'r-view-title', title));
    v.appendChild(body);
    return v;
  }

  function buildSource() {
    var pre = el('pre'); var code = el('code'); var by = {};
    source.forEach(function (ln) {
      var line = el('span', 'r-line'); spans(ln.toks, line);
      if (ln.e) (by[ln.e] = by[ln.e] || []).push(line);
      code.appendChild(line); code.appendChild(document.createTextNode('\n'));
    });
    pre.appendChild(code);
    var b = el('div', 'r-view-body r-cast'); b.appendChild(pre);
    return { root: view('The Casting \u00b7 DSL', b), by: by, mark: 'reading' };
  }
  function buildTree() {
    var host = el('div', 'r-tree'); var by = {};
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
    return { root: view('DsTree \u00b7 node graph', b), by: by, mark: 'visiting' };
  }
  function buildCalls() {
    var host = el('div', 'r-calls'); var by = {};
    calls.forEach(function (c) {
      var row = el('div', 'r-call');
      row.appendChild(el('span', 'arrow', '\u2192'));
      row.appendChild(el('span', 'sig', c.sig));
      by[c.e] = [row]; host.appendChild(row);
    });
    var b = el('div', 'r-view-body'); b.appendChild(host);
    return { root: view('decipher fires DsRune', b), by: by, mark: 'firing' };
  }
  function buildTrace() {
    var pre = el('pre'); var code = el('code'); var by = {};
    trace.forEach(function (ln) {
      var line = el('span', 'r-line'); line.setAttribute('data-indent', String(ln.indent)); line.classList.add('indented');
      spans(ln.toks, line);
      (by[ln.e] = by[ln.e] || []).push(line);
      code.appendChild(line); code.appendChild(document.createTextNode('\n'));
    });
    pre.appendChild(code);
    var b = el('div', 'r-view-body r-trace'); b.appendChild(pre);
    return { root: view('a rune emits \u00b7 code', b), by: by, mark: 'emit' };
  }

  var P = { source: buildSource(), tree: buildTree(), calls: buildCalls(), trace: buildTrace() };
  var MARKS = ['reading', 'visiting', 'firing', 'emit'];
  function clearPanel(p) {
    Object.keys(p.by).forEach(function (k) { p.by[k].forEach(function (n) { MARKS.forEach(function (m) { n.classList.remove(m); }); }); });
    var s = p.root.querySelector('.r-sink'); if (s) s.remove();
  }
  function hiPanel(p, id) { (p.by[id] || []).forEach(function (n) { n.classList.add(p.mark); }); }
  function sinkPanel(p, label) { p.root.appendChild(el('div', 'r-sink', label)); }
  function revealPanel(p, upto) {
    order.forEach(function (e, ei) {
      (p.by[e] || []).forEach(function (n) { n.classList.toggle('r-pending', ei > upto); });
    });
  }
  function showAllPanel(p) { order.forEach(function (e) { (p.by[e] || []).forEach(function (n) { n.classList.remove('r-pending'); }); }); }

  var dropsAtB = { button: 'enchants \u2192 \u2205  the rune may ignore them' };
  var STAGE = { A: { left: 'source', right: 'tree', rail: 0 }, B: { left: 'tree', right: 'calls', rail: 1 }, C: { left: 'calls', right: 'trace', rail: 2 } };

  var steps = [];
  ['A', 'B', 'C'].forEach(function (st) { order.forEach(function (e, ei) { steps.push({ stage: st, entity: e, eidx: ei }); }); });
  steps.push({ stage: 'seal' });

  var mounted = { left: null, right: null };
  function mount(slot, name) {
    var slotEl = slot === 'left' ? slotL : slotR;
    if (mounted[slot] === name) return;
    slotEl.innerHTML = ''; slotEl.appendChild(P[name].root);
    slotEl.classList.add('swap-in');
    mounted[slot] = name;
    requestAnimationFrame(function () { requestAnimationFrame(function () { slotEl.classList.remove('swap-in'); }); });
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

  function applyStep(i) {
    var step = steps[i];
    clearAll();
    if (step.stage === 'seal') {
      mount('left', 'calls'); mount('right', 'trace');
      showAllPanel(P.calls); showAllPanel(P.trace);
      setRail(stages.length - 1, true); seal.classList.add('sealed');
      return;
    }
    seal.classList.remove('sealed');
    var cfg = STAGE[step.stage];
    mount('left', cfg.left); mount('right', cfg.right);
    setRail(cfg.rail, false);
    showAllPanel(P[cfg.left]);
    revealPanel(P[cfg.right], step.eidx);
    hiPanel(P[cfg.left], step.entity);
    hiPanel(P[cfg.right], step.entity);
    if (step.stage === 'B' && dropsAtB[step.entity]) sinkPanel(P[cfg.right], dropsAtB[step.entity]);
  }

  var layer = root.querySelector('.r-motes');
  if (layer && !reduce) {
    for (var mi = 0; mi < 12; mi++) {
      var d = el('span', 'mote');
      d.style.left = (Math.random() * 100) + '%'; d.style.bottom = (Math.random() * 40) + '%';
      d.style.animationDelay = (Math.random() * 7) + 's'; d.style.animationDuration = (5 + Math.random() * 4) + 's';
      layer.appendChild(d);
    }
  }

  if (reduce) {
    mount('left', 'calls'); mount('right', 'trace');
    showAllPanel(P.calls); showAllPanel(P.trace);
    order.forEach(function (e) { hiPanel(P.calls, e); hiPanel(P.trace, e); });
    setRail(stages.length - 1, true); seal.classList.add('sealed');
    return;
  }

  var idx = 0, clock = null;
  function tick() { applyStep(idx); idx = (idx + 1) % steps.length; }
  function start() { if (clock) return; applyStep(0); idx = 1; clock = setInterval(tick, 900); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(); io.disconnect(); } }); }, { threshold: .2 });
    io.observe(root);
  } else { start(); }
})();
