(function () {
  var root = document.getElementById('ritual');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  // context header :( :) must stay multi-line, one attr per line, or the parser rejects it.
  // text has no {} on purpose: a Widget body is optional and parses to identical empty children.
  var casting = [
    [['k', 'ui!'], ['', ' '], ['p', '{']],
    [['', '    '], ['p', ':(']],
    [['', '        '], ['', 'parent: parent']],
    [['', '    '], ['p', ':)']],
    [],
    [['', '    '], ['n', 'div'], ['', ' '], ['p', '('], ['', 'width: '], ['num', '100'], ['', ', height: '], ['num', '100 + A'], ['', ', color: '], ['s', '"red"'], ['p', ')'], ['', ' '], ['p', '{']],
    [['', '        '], ['n', 'text'], ['', ' '], ['p', '('], ['', 'content: '], ['s', '"hello world"'], ['p', ')']],
    [['', '        '], ['k', 'walk'], ['', ' range('], ['num', '20'], ['', ') '], ['k', 'with'], ['', ' i '], ['p', '{']],
    [['', '            '], ['n', 'button'], ['', ' '], ['p', '('], ['', 'text: '], ['num', '6'], ['p', ')'], ['', ' '], ['p', '{}']],
    [['', '        '], ['p', '}']],
    [['', '        '], ['k', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' '], ['p', '{']],
    [['', '            '], ['n', 'input'], ['', ' '], ['p', '{}']],
    [['', '        '], ['p', '}']],
    [['', '    '], ['p', '}']],
    [['p', '}']]
  ];

  // the DsTree the parser builds: Root(parent) is parent-of div; div carries text/Iter/If.
  var tree = {
    badge: 'Root', cls: 'v-root', lbl: 'parent', children: [
      {
        badge: 'Widget', cls: 'v-widget', lbl: 'div', children: [
          { badge: 'Widget', cls: 'v-widget', lbl: 'text', children: [] },
          { badge: 'Iter', cls: 'v-iter', lbl: 'walk i', children: [
            { badge: 'Widget', cls: 'v-widget', lbl: 'button', children: [] }
          ] },
          { badge: 'If', cls: 'v-if', lbl: 'a == "1"', children: [
            { badge: 'Widget', cls: 'v-widget', lbl: 'input', children: [] }
          ] }
        ]
      }
    ]
  };

  // each trace line: [tokens, indentLevel]. tokens carry syntax classes; indent animates in later.
  function L(indent, toks) { return { toks: toks, indent: indent }; }
  var trace = [
    L(0, [['kw', 'let'], ['', ' parent = '], ['num', '10']]),
    L(0, [['kw', 'let'], ['', ' div = '], ['fn', 'obj::new'], ['p', '('], ['', 'parent'], ['p', ')']]),
    L(0, [['', 'div.'], ['fn', 'set_width'], ['p', '('], ['num', '100'], ['p', ')']]),
    L(0, [['', 'div.'], ['fn', 'set_height'], ['p', '('], ['num', '120'], ['p', ')']]),
    L(0, [['', 'div.'], ['fn', 'set_color'], ['p', '('], ['s', '"red"'], ['p', ')']]),
    L(0, [['kw', 'let'], ['', ' text = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L(0, [['', 'text.'], ['fn', 'set_content'], ['p', '('], ['s', '"hello world"'], ['p', ')']]),
    L(0, [['kw', 'for'], ['', ' i '], ['kw', 'in'], ['', ' range '], ['p', '('], ['num', '20'], ['p', ') {']]),
    L(1, [['kw', 'let'], ['', ' button = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L(1, [['', 'button.'], ['fn', 'set_text'], ['p', '('], ['num', '6'], ['p', ')']]),
    L(0, [['p', '}']]),
    L(0, [['kw', 'if'], ['', ' a == '], ['s', '"1"'], ['', ' {']]),
    L(1, [['kw', 'let'], ['', ' input = '], ['fn', 'obj::new'], ['p', '('], ['', 'div'], ['p', ')']]),
    L(0, [['p', '}']])
  ];

  // node visit order (decipher) -> which trace line indices each produces
  var visitToTrace = {
    'parent': [0], 'div': [1, 2, 3, 4], 'text': [5, 6],
    'walk i': [7], 'button': [8, 9], 'a == "1"': [11, 12]
  };
  // closing braces appear after their block's children
  var afterWalk = [10];
  var afterIf = [13];

  function spans(toks, parent) {
    toks.forEach(function (tk) {
      var s = document.createElement('span');
      if (tk[0]) s.className = tk[0];
      s.textContent = tk[1];
      parent.appendChild(s);
    });
  }

  // ----- render casting -----
  var castCode = root.querySelector('#rCastCode');
  casting.forEach(function (toks) {
    var line = document.createElement('span');
    line.className = 'r-line';
    spans(toks, line);
    castCode.appendChild(line);
    castCode.appendChild(document.createTextNode('\n'));
  });
  var castLines = Array.prototype.slice.call(castCode.querySelectorAll('.r-line'));

  // ----- render DsTree node graph -----
  var treeHost = root.querySelector('#rTreeView .r-tree');
  var nodeEls = {};
  (function renderTree(node, container) {
    var el = document.createElement('div');
    el.className = 'r-node ' + node.cls;
    var b = document.createElement('span'); b.className = 'badge'; b.textContent = node.badge;
    var l = document.createElement('span'); l.className = 'lbl'; l.textContent = node.lbl;
    el.appendChild(b); el.appendChild(l);
    var wrap = document.createElement('div');
    wrap.appendChild(el);
    nodeEls[node.lbl] = el;
    if (node.children && node.children.length) {
      var kids = document.createElement('div');
      kids.className = 'r-children';
      node.children.forEach(function (c) { renderTree(c, kids); });
      wrap.appendChild(kids);
    }
    container.appendChild(wrap);
  })(tree, treeHost);
  var allNodes = Array.prototype.slice.call(treeHost.querySelectorAll('.r-node'));

  // ----- render trace -----
  var traceCode = root.querySelector('#rTraceCode');
  trace.forEach(function (ln) {
    var line = document.createElement('span');
    line.className = 'r-line';
    line.setAttribute('data-indent', String(ln.indent));
    spans(ln.toks, line);
    traceCode.appendChild(line);
    traceCode.appendChild(document.createTextNode('\n'));
  });
  var traceLines = Array.prototype.slice.call(traceCode.querySelectorAll('.r-line'));

  var stages = Array.prototype.slice.call(root.querySelectorAll('.r-stage'));
  var arrows = Array.prototype.slice.call(root.querySelectorAll('.r-arrow'));
  var views = {
    root: root.querySelector('#rRootView'),
    tree: root.querySelector('#rTreeView'),
    trace: root.querySelector('#rTraceView')
  };
  var cast = root.querySelector('#rCast');
  var rightPanel = root.querySelector('#rRight');
  var walker = root.querySelector('.r-walker');
  var seal = root.querySelector('#rSeal');

  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].classList.toggle('show', k === name); });
  }
  function litStage(i) { if (stages[i]) stages[i].classList.add('lit'); if (arrows[i - 1]) arrows[i - 1].classList.add('lit'); }
  function doneStage(i) { if (stages[i]) { stages[i].classList.remove('lit'); stages[i].classList.add('done'); } }

  // ambient motes
  var layer = root.querySelector('.r-motes');
  if (layer && !reduce) {
    for (var i = 0; i < 14; i++) {
      var m = document.createElement('span'); m.className = 'mote';
      m.style.left = (Math.random() * 100) + '%'; m.style.bottom = (Math.random() * 40) + '%';
      m.style.animationDelay = (Math.random() * 7) + 's'; m.style.animationDuration = (5 + Math.random() * 4) + 's';
      layer.appendChild(m);
    }
  }

  function clearAll() {
    stages.forEach(function (s) { s.classList.remove('lit', 'done'); });
    arrows.forEach(function (a) { a.classList.remove('lit'); });
    castLines.forEach(function (l) { l.classList.remove('reading'); });
    traceLines.forEach(function (l) { l.classList.remove('shown', 'flash', 'indented'); });
    allNodes.forEach(function (n) { n.classList.remove('grown', 'visiting'); });
    cast.classList.remove('active'); rightPanel.classList.remove('active');
    seal.classList.remove('sealed');
    showView('root');
  }

  if (reduce) {
    stages.forEach(function (s, i) { i === stages.length - 1 ? s.classList.add('lit') : s.classList.add('done'); });
    arrows.forEach(function (a) { a.classList.add('lit'); });
    castLines.forEach(function (l) {});
    allNodes.forEach(function (n) { n.classList.add('grown'); });
    traceLines.forEach(function (l) { l.classList.add('shown', 'indented'); });
    showView('trace');
    seal.classList.add('sealed');
    return;
  }

  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function spark(fromEl, toEl) {
    if (!fromEl || !toEl) return;
    var rb = root.getBoundingClientRect();
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var sp = document.createElement('span');
    sp.className = 'r-spark';
    sp.style.left = (a.left - rb.left + a.width / 2) + 'px';
    sp.style.top = (a.top - rb.top + a.height / 2) + 'px';
    sp.style.setProperty('--spark-to', 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)');
    root.appendChild(sp);
    requestAnimationFrame(function () { sp.classList.add('fly'); });
    setTimeout(function () { sp.remove(); }, 950);
  }

  function revealTrace(idxs, flash) {
    idxs.forEach(function (i) {
      var l = traceLines[i]; if (!l) return;
      l.classList.add('shown');
      if (flash) { l.classList.add('flash'); setTimeout(function () { l.classList.remove('flash'); }, 600); }
    });
  }

  function run() {
    timers.forEach(clearTimeout); timers = [];
    clearAll();
    var t = 400;

    // S1: casting appears, lex into tokens
    at(t, function () { litStage(0); cast.classList.add('active'); }); t += 700;
    at(t, function () { doneStage(0); litStage(1); }); t += 700;

    // S2 -> S3: parse into DsRoot, right panel shows the struct
    at(t, function () { doneStage(1); litStage(2); rightPanel.classList.add('active'); showView('root'); }); t += 1100;

    // S4: DsTree — swap right panel to the node graph, grow nodes top-down
    at(t, function () { doneStage(2); litStage(3); showView('tree'); }); t += 350;
    var growOrder = ['parent', 'div', 'text', 'walk i', 'button', 'a == "1"', 'input'];
    growOrder.forEach(function (lbl) {
      at(t, function () { if (nodeEls[lbl]) nodeEls[lbl].classList.add('grown'); }); t += 220;
    });
    t += 250;

    // S5+S6: decipher walks the tree; each visited node fires inscribe_* -> trace lines.
    at(t, function () { doneStage(3); litStage(4); litStage(5); showView('trace'); }); t += 450;

    var walk = [
      { node: 'parent', lines: [0] },
      { node: 'div', lines: [1, 2, 3, 4] },
      { node: 'text', lines: [5, 6] },
      { node: 'walk i', lines: [7] },
      { node: 'button', lines: [8, 9] },
      { node: null, lines: afterWalk },
      { node: 'a == "1"', lines: [11] },
      { node: 'input', lines: [12] },
      { node: null, lines: afterIf }
    ];
    walk.forEach(function (step, idx) {
      at(t, function () {
        allNodes.forEach(function (n) { n.classList.remove('visiting'); });
        if (step.node && nodeEls[step.node]) {
          nodeEls[step.node].classList.add('visiting');
          walker.classList.add(idx % 2 ? 'bounce-l' : 'bounce-r');
          setTimeout(function () { walker.classList.remove('bounce-l', 'bounce-r'); }, 380);
        }
        revealTrace(step.lines, true);
      });
      t += 720;
    });

    // S6b: animate indentation into place
    at(t, function () {
      allNodes.forEach(function (n) { n.classList.remove('visiting'); });
      traceLines.forEach(function (l) { l.classList.add('indented'); });
    }); t += 1100;

    // S7: seal
    at(t, function () { doneStage(4); doneStage(5); litStage(6); seal.classList.add('sealed'); }); t += 2800;

    at(t, run);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
    }, { threshold: .2 });
    io.observe(root);
  } else { run(); }
})();
