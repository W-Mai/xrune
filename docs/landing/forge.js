/* III · The Forge. The real xrune parser (docs/forge, compiled to
 * WebAssembly) deciphers the casting on every keystroke; three runes inscribe
 * it: TraceRune (the decipher walk), the bundled DefaultRune, and the scribe.
 * Also hosts the syntax highlighter every code block on the page uses. */
(function () {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---- highlighting: manuscript pigments for DSL and Rust
  var DSL = {
    re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(@@?[A-Za-z_]\w*|\$[A-Za-z_]\w*)|(\$\{|\$|:\(|:\))|(\b(?:walk|with|by|if|elif|else|match|on)\b)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Z]\w*\b)|(\b[a-z_]\w*!)|(\b[a-z_]\w*(?=\s*[({[]))|(\b[a-z_]\w*(?=\s*:(?!:)))|(=>|[{}()[\],;:.|&=+\-*/<>!?])/g,
    cls: ['c', 's', 'g', 'g', 'k', 'n', 't', 'm', 'w', 'a', 'p']
  };
  var RUST = {
    re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(#\[[^\]]*\])|(\b(?:fn|let|mut|pub|use|for|in|if|else|match|impl|struct|enum|return|self|Self|crate|mod|where|as|ref|move|true|false|while|loop|break|continue|type|const|static|unsafe|dyn|trait)\b)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Z]\w*\b)|(\b[a-z_]\w*!)|(\b[a-z_]\w*(?=\s*\())|(->|=>|[{}()[\],;:.|&=+\-*/<>!?])/g,
    cls: ['c', 's', 'l', 'k', 'n', 't', 'm', 'w', 'p']
  };
  function paint(lang, src) {
    var re = lang.re, out = '', last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      for (var g = 1; g < m.length; g++) if (m[g] !== undefined) break;
      out += '<span class="t-' + lang.cls[g - 1] + '">' + esc(m[0]) + '</span>';
      last = re.lastIndex;
      if (!m[0].length) re.lastIndex++;
    }
    return out + esc(src.slice(last));
  }
  XRUNE.hl = { dsl: function (s) { return paint(DSL, s); }, rust: function (s) { return paint(RUST, s); } };

  var root = document.getElementById('forge');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var input = $('edInput'), hl = $('edHl'), gutter = $('edGutter'), body = $('edBody'), marks = $('edMarks');
  var errBox = $('edError'), statusEl = $('forgeStatus'), gloss = $('gloss'), view = $('forgeView');
  var tabs = $('viewTabs'), ribbons = $('ribbons'), engineEl = $('forgeEngine'), copyBtn = $('forgeCopy');
  var T = function (k, v) { return XR.t(k, v); };

  function L() { return Array.prototype.slice.call(arguments).join('\n'); }
  var PRESETS = [
    { id: 'grimoire', tab: '✦', c: 'gold', src: L(
      ':(', '    parent: root', ':)', '',
      'grimoire (title: "xrune") {',
      '    header (text: "One casting, many inscriptions")',
      '    walk $chapters with ch by ch.id {',
      '        chapter (title: ch.name) [Bookmark(ch.page)]',
      '            on Tap { open(ch); }',
      '    }',
      '    if $reading {',
      '        progress (value: $page)',
      '    } else {',
      '        cover ()',
      '    }',
      '}') },
    { id: 'widget', tab: 'widget', c: 'verdigris', src: L(
      'container (width: 480, height: 320, color: "dark") {',
      '    header (height: 40, text: "Hello")',
      '    row (direction: "horizontal") {',
      '        button ("OK", grow: 1.0)',
      '        button (text: "Cancel", grow: 1.0)',
      '    }',
      '    footer',
      '}') },
    { id: 'enchant', tab: '[ ]', c: 'violet', src: L(
      'sprite (texture: "hero.png") [',
      '    Position { x: 0.0, y: 0.0 },',
      '    Velocity { vx: 1, vy: 0 },',
      '    Collider::circle(10),',
      '    PlayerControlled,',
      '] {',
      '    shadow (blur: 8)',
      '}') },
    { id: 'on', tab: 'on', c: 'rubric', src: L(
      'column {',
      '    button (text: "Save") on Tap { save(); }',
      '    slider (min: 0, max: 100)',
      '        on ValueChanged(2) { commit(); }',
      '        on DragStart(lock)',
      '    toggle (label: "Dark") {} on Toggle::Changed(apply)',
      '}') },
    { id: 'if', tab: 'if', c: 'rubric', src: L(
      'panel {',
      '    if $signed_in {',
      '        avatar (user: session.user())',
      '    } elif guest_mode {',
      '        banner (text: "Browsing as guest")',
      '    } else {',
      '        sign_in_button ()',
      '    }',
      '}') },
    { id: 'walk', tab: 'walk', c: 'verdigris', src: L(
      'list {',
      '    walk $todos with todo by todo.id {',
      '        row (text: todo.title, done: $todo.done) on Tap { toggle(todo.id); }',
      '    }',
      '}') },
    { id: 'match', tab: 'match', c: 'lapis', src: L(
      'screen {',
      '    match $state {',
      '        State::Loading => { spinner () }',
      '        State::Ready(items) => {',
      '            walk items.iter() with item {',
      '                card (title: item.name)',
      '            }',
      '        }',
      '        State::Failed(err) | State::Offline(err) => {',
      '            notice (text: err.to_string())',
      '        }',
      '    }',
      '}') },
    { id: 'niche', tab: '@@', c: 'violet', src: L(
      'card (width: 420) {',
      '    // a template declares its slots with @@ …',
      '    header_bar {',
      '        @@title {',
      '            text ("(untitled)")',
      '        }',
      '    }',
      '    @@body',
      '    // … and a call site fills one with @',
      '    @footer {',
      '        button (text: "OK")',
      '    }',
      '}') },
    { id: 'code', tab: '${ }', c: 'lapis', src: L(
      'stats {',
      '    ${ let total = items.len(); }',
      '    label (text: format!("{} items", total))',
      '    ${',
      '        log::debug!("stats rendered");',
      '    }',
      '}') },
    { id: 'context', tab: ':( )', c: 'gold', src: L(
      ':(',
      '    parent: root_entity',
      '    world: &mut app.world',
      '    theme: Theme::Dark',
      ':)', '',
      'window (title: "Grimoire") {',
      '    text ("The header is optional since 1.10")',
      '}') },
    { id: 'reject', tab: '✗', c: 'rubric', src: L(
      'toolbar {',
      '    on Tap { fire(); }',
      '    button (text: "Fire")',
      '}') }
  ];
  XRUNE.PRESETS = PRESETS;

  var current = PRESETS[0], last = null, lastGood = null, viewName = 'calls', hotCall = -1, hoverCall = -1;
  var enc = new TextEncoder(), dec = new TextDecoder();

  // ---- ribbons
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ribbon'; b.setAttribute('role', 'tab');
    b.setAttribute('data-c', p.c); b.setAttribute('data-id', p.id);
    b.textContent = p.tab;
    b.title = p.id;
    b.addEventListener('click', function () { choose(p); });
    ribbons.appendChild(b);
  });
  function choose(p) {
    current = p;
    ribbons.querySelectorAll('.ribbon').forEach(function (b) {
      var on = b.getAttribute('data-id') === p.id;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    input.value = p.src;
    gloss.innerHTML = T('forge.g.' + p.id);
    render(); castSoon(0);
  }

  // ---- editor
  function lineStarts(src) { var a = [0]; for (var i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) a.push(i + 1); return a; }
  function offsetOf(src, starts, line, col) {
    var i = starts[line - 1];
    if (i == null) return src.length;
    for (var c = 0; c < col && i < src.length && src.charCodeAt(i) !== 10; c++) {
      var code = src.charCodeAt(i); i += code >= 0xD800 && code <= 0xDBFF ? 2 : 1;
    }
    return i;
  }
  var errLine = 0;
  function render() {
    var src = input.value;
    hl.innerHTML = XRUNE.hl.dsl(src) + '\n ';
    var n = src.split('\n').length, caretLine = src.slice(0, input.selectionStart).split('\n').length, g = '';
    for (var i = 1; i <= n; i++) g += '<span' + (i === errLine ? ' class="err"' : i === caretLine && document.activeElement === input ? ' class="cur"' : '') + '>' + i + '</span>\n';
    gutter.innerHTML = g;
    drawMarks();
  }

  function locate(off) {
    var w = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT), n, acc = 0, lastN = null;
    while ((n = w.nextNode())) {
      var len = n.nodeValue.length;
      if (off <= acc + len) return [n, off - acc];
      acc += len; lastN = n;
    }
    return lastN ? [lastN, lastN.nodeValue.length] : null;
  }
  function mark(a, b, cls) {
    if (b <= a) b = a + 1;
    var s = locate(a), e = locate(Math.min(b, input.value.length + 1));
    if (!s || !e) return;
    var range = document.createRange();
    try { range.setStart(s[0], s[1]); range.setEnd(e[0], e[1]); } catch (_) { return; }
    var base = body.getBoundingClientRect();
    Array.prototype.forEach.call(range.getClientRects(), function (r) {
      var d = document.createElement('div');
      d.className = 'mk' + (cls ? ' ' + cls : '');
      d.style.left = (r.left - base.left) + 'px';
      d.style.top = (r.top - base.top) + 'px';
      d.style.width = Math.max(r.width, 8) + 'px';
      d.style.height = r.height + 'px';
      marks.appendChild(d);
    });
  }
  function rangeOf(c, src, starts) {
    if (!c || !c.span) return null;
    var a = offsetOf(src, starts, c.span[0], c.span[1]), b = offsetOf(src, starts, c.span[2], c.span[3]);
    var kw = { if: /(?:elif|if)\s*\$?\s*$/, iter: /walk\s*\$?\s*$/, match: /match\s*\$?\s*$/, niche: /@@?$/, code: /\$\{\s*$/ }[c.m];
    if (kw) { var m = src.slice(Math.max(0, a - 24), a).match(kw); if (m) a -= m[0].length; }
    if (c.m === 'code') { var t = src.slice(b).match(/^\s*\}/); if (t) b += t[0].length; }
    if (c.m === 'widget') { var w = src.slice(b).match(/^[\s,]*[)\]]/); if (w) b += w[0].length; }
    return [a, b];
  }
  function drawMarks() {
    marks.innerHTML = '';
    var src = input.value, starts = lineStarts(src);
    if (last && !last.ok && last.span) {
      var a = offsetOf(src, starts, last.span[0], last.span[1]), b = offsetOf(src, starts, last.span[2], last.span[3]);
      mark(a, b, 'err');
    }
    var show = hoverCall >= 0 ? hoverCall : -1;
    if (show >= 0 && lastGood && lastGood.calls[show]) {
      var r = rangeOf(lastGood.calls[show], src, starts);
      if (r) mark(r[0], r[1], '');
    }
  }

  function insert(text) {
    input.focus();
    if (!document.execCommand || !document.execCommand('insertText', false, text)) {
      input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
      input.dispatchEvent(new Event('input'));
    }
  }
  var lastKey = '';
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && !e.shiftKey && lastKey !== 'Escape' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); insert('    '); }
    else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var v = input.value, i = input.selectionStart;
      var lineStart = v.lastIndexOf('\n', i - 1) + 1, indent = v.slice(lineStart, i).match(/^\s*/)[0];
      if (/[{([]\s*$/.test(v.slice(lineStart, i))) indent += '    ';
      e.preventDefault(); insert('\n' + indent);
    }
    lastKey = e.key;
  });
  input.addEventListener('input', function () { kindle(); render(); castSoon(110); });
  // the textarea is sized to its text; the editor box scrolls, never the textarea
  input.addEventListener('scroll', function () { input.scrollTop = 0; input.scrollLeft = 0; });
  ['keyup', 'click', 'focus', 'blur'].forEach(function (ev) { input.addEventListener(ev, function () { render(); caret(); }); });
  input.addEventListener('focus', kindle);

  // ---- the parser, compiled to wasm, loaded once the forge is near
  var forge = null, wasmModule = null, loading = null, failed = false, wasmKB = 0, timer = 0;
  function setStatus(cls, text) { statusEl.className = 'forge-status ' + cls; statusEl.textContent = text; }
  function instantiate() {
    return WebAssembly.instantiate(wasmModule, {}).then(function (inst) { forge = inst.exports; forge.forge_init(); });
  }
  function kindle() {
    if (loading || typeof WebAssembly !== 'object') return loading;
    setStatus('cold', T('forge.status.kindle'));
    loading = fetch('forge/xrune_forge.wasm')
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.arrayBuffer(); })
      .then(function (buf) { wasmKB = Math.round(buf.byteLength / 1024); return WebAssembly.compile(buf); })
      .then(function (mod) { wasmModule = mod; return instantiate(); })
      .then(function () { castNow(); })
      .catch(function () {
        failed = true;
        setStatus('cold', T('forge.status.cold'));
        view.innerHTML = '<div class="cold"><div>' + esc(T('forge.failed')) + '</div></div>';
      });
    return loading;
  }
  function castSoon(ms) { clearTimeout(timer); timer = setTimeout(castNow, ms); }
  function castNow() {
    if (!forge) return;
    var src = input.value, bytes = enc.encode(src);
    var ptr = forge.forge_alloc(bytes.length);
    new Uint8Array(forge.memory.buffer, ptr, bytes.length).set(bytes);
    var t0 = performance.now(), len;
    try { len = forge.forge_cast(ptr, bytes.length); }
    catch (e) {
      var msg = '';
      try { var pl = forge.forge_panic(); msg = dec.decode(new Uint8Array(forge.memory.buffer, forge.forge_out_ptr(), pl)); } catch (_) {}
      forge = null;
      instantiate().catch(function () {});
      show({ ok: false, error: T('forge.shatter', { msg: msg || String(e) }), span: null }, 0);
      return;
    }
    var ms = performance.now() - t0;
    var json = dec.decode(new Uint8Array(forge.memory.buffer, forge.forge_out_ptr(), len));
    forge.forge_free(ptr, bytes.length);
    var r;
    try { r = JSON.parse(json); } catch (e) { r = { ok: false, error: String(e), span: null }; }
    show(r, ms);
  }

  function show(r, ms) {
    last = r;
    if (r.ok) {
      lastGood = r;
      errLine = 0;
      errBox.hidden = true;
      var n = r.calls.filter(function (c) { return c.m !== 'else' && c.m !== 'arm'; }).length;
      setStatus('ok', T('forge.status.ok', { n: n, ms: ms < 1 ? ms.toFixed(2) : ms.toFixed(1) }));
      engineEl.innerHTML = T('forge.engine', { v: r.version, kb: wasmKB });
      view.classList.remove('stale');
      paintView();
      if (ms > 0) {
        var b = input.getBoundingClientRect();
        if (b.bottom > 0 && b.top < innerHeight && current && current.id !== 'reject') {
          window.dispatchEvent(new CustomEvent('xrune:flare', { detail: { x: b.left + b.width * 0.5, y: b.top + 40, r: 180 } }));
        }
      }
    } else {
      var at = r.span ? r.span[0] + ':' + (r.span[1] + 1) : '';
      errLine = r.span ? r.span[0] : 0;
      setStatus('bad', at ? T('forge.status.bad', { at: at }) : T('forge.status.bad0'));
      var msg = r.error === 'cannot parse string into token stream' ? T('forge.lexerr') : r.error;
      errBox.hidden = false;
      errBox.innerHTML = '<b>✗' + (at ? ' ' + at : '') + '</b> · ' + esc(msg);
      if (lastGood) view.classList.add('stale');
      else view.innerHTML = '';
    }
    render();
  }

  // ---- the right page
  var NAME = { root: 'inscribe_root', widget: 'inscribe_widget', if: 'inscribe_if', iter: 'inscribe_iter', niche: 'inscribe_niche', match: 'inscribe_match', code: 'inscribe_code_block', seal: 'seal', else: 'else', arm: 'arm' };
  var KIND = { root: 'Root', widget: 'Widget', if: 'If', iter: 'Iter', niche: 'Niche', match: 'Match', code: 'CodeBlock', else: 'Else', arm: 'Arm' };
  function flag(cls, text) { return '<span class="flag ' + cls + '">' + esc(text) + '</span>'; }
  function cut(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function children(n) { return n === 1 ? T('forge.ch1') : T('forge.ch', { n: n }); }
  function describe(c, r) {
    var label = c.label, f = '', meta = '';
    switch (c.m) {
      case 'widget':
        if (c.attrs.length) meta = c.attrs.map(function (a) { return (a.k ? a.k + ': ' : '') + (a.r ? '$' : '') + cut(a.v, 22); }).join(', ');
        if (c.enchants.length) f += flag('e', '[' + c.enchants.length + ']');
        c.on.forEach(function (o) { f += flag('o', 'on ' + o.n + (o.form === 'callback' ? '(cb)' : '')); });
        if (c.attrs.some(function (a) { return a.r; })) f += flag('r', '$');
        break;
      case 'if': label = (c.elif ? 'elif ' : 'if ') + c.label; if (c.reactive) f += flag('r', '$'); if (c['else']) f += flag('d', 'else →'); break;
      case 'iter': label = c['var'] + ' in ' + c.label; if (c.reactive) f += flag('r', '$'); if (c.key) f += flag('k', 'by ' + c.key); break;
      case 'niche': f += flag(c.decl ? 'd' : 'k', c.decl ? '@@ declares' : '@ fills'); break;
      case 'match': if (c.reactive) f += flag('r', '$'); meta = c.arms + ' arms'; break;
      case 'arm': label = c.label + ' =>'; break;
      case 'else': label = T('forge.else'); break;
      case 'code': label = '${ ' + cut(c.label, 40) + ' }'; break;
      case 'seal': label = '→ proc_macro2::TokenStream'; meta = r.tokens + ' tokens'; break;
    }
    return { label: cut(label, 64), flags: f, meta: meta };
  }
  function paintView() {
    var r = lastGood;
    if (!r) return;
    var html = '';
    if (viewName === 'calls') {
      html = '<p class="note-line">' + esc(T('forge.note.calls')) + '</p><div class="calls">';
      r.calls.forEach(function (c, i) {
        var d = describe(c, r), marker = c.m === 'else' || c.m === 'arm', rune = XRUNE.RUNE_OF[c.m];
        html += '<div class="row' + (marker ? ' marker' : '') + (c.m === 'seal' ? ' seal' : '') + '" data-i="' + i + '" style="--d:' + c.d + ';--n:' + i + '">' +
          (rune ? XRUNE.svg(rune) : '<span class="glyph"></span>') +
          '<span class="body"><span class="m">' + NAME[c.m] + '</span><span class="lbl">' + esc(d.label) + '</span>' + d.flags +
          (d.meta ? '<span class="meta">' + esc(cut(d.meta, 70)) + '</span>' : '') + '</span></div>';
      });
      html += '</div>';
    } else if (viewName === 'tree') {
      var top = [], stack = [];
      r.calls.forEach(function (c, i) {
        if (c.m === 'seal') return;
        var node = { c: c, i: i, kids: [] };
        while (stack.length && stack[stack.length - 1].c.d >= c.d) stack.pop();
        (stack.length ? stack[stack.length - 1].kids : top).push(node);
        stack.push(node);
      });
      var draw = function (nodes) {
        return nodes.map(function (n) {
          var d = describe(n.c, r);
          return '<div><span class="node" data-m="' + n.c.m + '" data-i="' + n.i + '"><span class="k">' + KIND[n.c.m] + '</span><span>' + esc(cut(d.label, 40)) + '</span>' + d.flags + '</span>' +
            (n.kids.length ? '<div class="kids">' + draw(n.kids) + '</div>' : '') + '</div>';
        }).join('');
      };
      html = '<p class="note-line">' + esc(T('forge.note.tree')) + '</p><div class="tree">' + draw(top) + '</div>';
    } else if (viewName === 'default') {
      html = '<p class="note-line">' + esc(T('forge.note.default')) + '</p><pre><code>' + XRUNE.hl.rust(r['default']) + '</code></pre>';
    } else {
      var inner = dedent(r.scribe || ''), same = inner.trim() === input.value.trim();
      html = '<p class="note-line">' + esc(T('forge.note.scribe')) + '</p><div class="scribe-bar">' +
        (same ? '<span class="flag k">' + esc(T('forge.scribe.same')) + '</span>' : '<button type="button" class="btn-mini" data-apply>' + esc(T('forge.scribe.apply')) + '</button>') +
        '</div><pre><code>' + XRUNE.hl.dsl(r.scribe || '') + '</code></pre>';
    }
    view.innerHTML = html;
    fadeEdges();
    if (hotCall >= 0) heat(hotCall);
  }
  // sideways scrollers (long lines, the ribbons on a phone) fade their far
  // edge while more is hidden there
  function fadeEdge(el) { el.classList.toggle('more', el.scrollWidth - el.clientWidth - el.scrollLeft > 2); }
  function fadeEdges() { view.querySelectorAll('pre').forEach(fadeEdge); fadeEdge(ribbons); }
  view.addEventListener('scroll', fadeEdges, true);
  ribbons.addEventListener('scroll', function () { fadeEdge(ribbons); }, { passive: true });
  function dedent(s) {
    var lines = s.replace(/\n$/, '').split('\n');
    if (/^ui! \{$/.test(lines[0])) lines = lines.slice(1, -1);
    return lines.map(function (l) { return l.slice(0, 4) === '    ' ? l.slice(4) : l; }).join('\n');
  }

  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-view]');
    if (!b) return;
    viewName = b.getAttribute('data-view');
    tabs.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    paintView();
  });
  view.addEventListener('click', function (e) {
    if (e.target.closest('[data-apply]') && lastGood && lastGood.scribe) {
      input.focus(); input.select(); insert(dedent(lastGood.scribe));
    }
  });
  view.addEventListener('mouseover', function (e) {
    var row = e.target.closest('[data-i]');
    hoverCall = row ? +row.getAttribute('data-i') : -1;
    drawMarks();
  });
  view.addEventListener('mouseleave', function () { hoverCall = -1; drawMarks(); });

  // caret → the innermost call whose source range holds it
  function heat(i) {
    view.querySelectorAll('.hot').forEach(function (n) { n.classList.remove('hot'); });
    var n = view.querySelector('[data-i="' + i + '"]');
    if (n) {
      n.classList.add('hot');
      var vb = view.getBoundingClientRect(), nb = n.getBoundingClientRect();
      if (nb.top < vb.top || nb.bottom > vb.bottom) view.scrollTop += nb.top - vb.top - vb.height / 3;
    }
  }
  function caret() {
    if (!lastGood || document.activeElement !== input) return;
    var src = input.value, starts = lineStarts(src), off = input.selectionStart, best = -1, depth = -1;
    lastGood.calls.forEach(function (c, i) {
      if (c.m === 'seal' || c.m === 'root') return;
      var r = rangeOf(c, src, starts);
      if (r && off >= r[0] && off <= r[1] && c.d > depth) { best = i; depth = c.d; }
    });
    if (best !== hotCall) { hotCall = best; heat(best); }
  }

  copyBtn.addEventListener('click', function () {
    var text = 'ui! {\n' + input.value.split('\n').map(function (l) { return l ? '    ' + l : l; }).join('\n') + '\n}\n';
    var done = function () { copyBtn.textContent = T('forge.copied'); copyBtn.classList.add('ok'); setTimeout(function () { copyBtn.textContent = T('forge.copy'); copyBtn.classList.remove('ok'); }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {}); else done();
  });

  window.addEventListener('xrune:lang', function () {
    gloss.innerHTML = T('forge.g.' + current.id);
    if (last) show(last, 0);
    else if (failed) setStatus('cold', T('forge.status.cold'));
    else if (loading) setStatus('cold', T('forge.status.kindle'));
  });
  window.addEventListener('resize', function () { drawMarks(); fadeEdges(); });

  choose(PRESETS[0]);
  fadeEdge(ribbons);
  view.innerHTML = '<div class="cold"><div><div class="ember"></div>' + esc(T('forge.cold')) + '</div></div>';
  setStatus('cold', '');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { kindle(); io.disconnect(); }
    }, { rootMargin: '700px 0px' });
    io.observe(root);
  } else kindle();
})();
