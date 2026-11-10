/* Manuscript pigments: the syntax highlighter for castings (the xrune DSL)
 * and for Rust. The landing page and the Grimoire (/book/) both paint with it,
 * so a casting reads the same in the Forge as in the book.
 *
 *   XRUNE.hl.dsl(src)          → HTML, one <span class="t-…"> per token
 *   XRUNE.hl.rust(src)         → HTML
 *   XRUNE.hl.tokens(lang, src) → [[cls, text], …]; cls is '' for plain text
 *
 * Load it after runes.js: runes.js assigns window.XRUNE outright. */
(function (g) {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var DSL = {
    re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(@@?[A-Za-z_]\w*|\$[A-Za-z_]\w*)|(\$\{|\$|:\(|:\))|(\b(?:walk|with|by|if|elif|else|match|on)\b)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Z]\w*\b)|(\b[a-z_]\w*!)|(\b[a-z_]\w*(?=\s*[({[]))|(\b[a-z_]\w*(?=\s*:(?!:)))|(=>|[{}()[\],;:.|&=+\-*/<>!?])/g,
    cls: ['c', 's', 'g', 'g', 'k', 'n', 't', 'm', 'w', 'a', 'p']
  };
  var RUST = {
    re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(#\[[^\]]*\])|(\b(?:fn|let|mut|pub|use|for|in|if|else|match|impl|struct|enum|return|self|Self|crate|mod|where|as|ref|move|true|false|while|loop|break|continue|type|const|static|unsafe|dyn|trait)\b)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Z]\w*\b)|(\b[a-z_]\w*!)|(\b[a-z_]\w*(?=\s*\())|(->|=>|[{}()[\],;:.|&=+\-*/<>!?])/g,
    cls: ['c', 's', 'l', 'k', 'n', 't', 'm', 'w', 'p']
  };

  function tokens(lang, src) {
    var re = lang.re, out = [], last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      if (m.index > last) out.push(['', src.slice(last, m.index)]);
      for (var i = 1; i < m.length; i++) if (m[i] !== undefined) break;
      out.push([lang.cls[i - 1], m[0]]);
      last = re.lastIndex;
      if (!m[0].length) re.lastIndex++;
    }
    if (last < src.length) out.push(['', src.slice(last)]);
    return out;
  }
  function paint(lang, src) {
    return tokens(lang, src).map(function (t) {
      return t[0] ? '<span class="t-' + t[0] + '">' + esc(t[1]) + '</span>' : esc(t[1]);
    }).join('');
  }

  var X = g.XRUNE || (g.XRUNE = {});
  X.hl = {
    dsl: function (s) { return paint(DSL, s); },
    rust: function (s) { return paint(RUST, s); },
    tokens: function (lang, s) { return tokens(lang === 'dsl' ? DSL : RUST, s); },
    esc: esc
  };
})(window);
