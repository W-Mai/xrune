/* Elder Futhark, drawn as strokes on a 6 x 10 grid.
 * Every glyph on the page comes from here, so the runes look the same on
 * every system and need no runic font. Shared by the hero sigil, the eight
 * runes of the covenant, the forge's call list and the ember field. */
(function (g) {
  var RUNES = {
    fehu: [[0, 0, 0, 10], [0, 4, 5, 1], [0, 7, 5, 4]],
    uruz: [[0, 10, 0, 0, 5, 3, 5, 10]],
    thurisaz: [[0, 0, 0, 10], [0, 2.5, 5, 5, 0, 7.5]],
    ansuz: [[0, 0, 0, 10], [0, 0, 5, 3], [0, 3, 5, 6]],
    raido: [[0, 10, 0, 0, 5, 2.5, 0, 5, 5, 10]],
    kenaz: [[5, 1, 0, 5, 5, 9]],
    gebo: [[0, 0, 6, 10], [6, 0, 0, 10]],
    wunjo: [[0, 10, 0, 0, 4.5, 2.5, 0, 5]],
    hagalaz: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 3.5, 6, 6.5]],
    naudiz: [[3, 0, 3, 10], [0.5, 3.5, 5.5, 6.5]],
    isa: [[3, 0, 3, 10]],
    jera: [[2.8, 0, 0, 2.8, 2.8, 5.6], [3.2, 4.4, 6, 7.2, 3.2, 10]],
    eihwaz: [[3, 0, 3, 10], [3, 0, 6, 2.5], [3, 10, 0, 7.5]],
    perthro: [[0, 0, 0, 10], [0, 0, 3, 3, 5.5, 0.6], [0, 10, 3, 7, 5.5, 9.4]],
    algiz: [[3, 0, 3, 10], [3, 4, 0, 0.5], [3, 4, 6, 0.5]],
    sowilo: [[5, 0, 1, 4, 5, 6, 1, 10]],
    tiwaz: [[3, 0, 3, 10], [0, 3, 3, 0, 6, 3]],
    berkano: [[0, 0, 0, 10], [0, 0, 5, 2.5, 0, 5, 5, 7.5, 0, 10]],
    ehwaz: [[0, 10, 0, 0, 3, 3.5, 6, 0, 6, 10]],
    mannaz: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 0, 6, 5], [6, 0, 0, 5]],
    laguz: [[0, 0, 0, 10], [0, 0, 4.5, 3]],
    ingwaz: [[3, 2, 6, 5, 3, 8, 0, 5, 3, 2]],
    dagaz: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 0, 6, 10], [6, 0, 0, 10]],
    othala: [[0, 10, 6, 3.5, 3, 0, 0, 3.5, 6, 10]]
  };

  /* The eight DsRune methods, each bound to one rune. */
  var METHODS = [
    { key: 'root', rune: 'othala', name: 'inscribe_root' },
    { key: 'widget', rune: 'berkano', name: 'inscribe_widget' },
    { key: 'if', rune: 'thurisaz', name: 'inscribe_if' },
    { key: 'iter', rune: 'jera', name: 'inscribe_iter' },
    { key: 'niche', rune: 'perthro', name: 'inscribe_niche' },
    { key: 'match', rune: 'algiz', name: 'inscribe_match' },
    { key: 'code', rune: 'kenaz', name: 'inscribe_code_block' },
    { key: 'seal', rune: 'ingwaz', name: 'seal' }
  ];
  var RUNE_OF = {};
  METHODS.forEach(function (m) { RUNE_OF[m.key] = m.rune; });

  /* SVG path data for a rune centred on (cx, cy), `h` units tall. */
  function path(name, cx, cy, h) {
    var s = h / 10, ox = cx - 3 * s, oy = cy - 5 * s, d = '';
    (RUNES[name] || RUNES.isa).forEach(function (line) {
      for (var i = 0; i < line.length; i += 2) {
        d += (i ? 'L' : 'M') + (ox + line[i] * s).toFixed(2) + ' ' + (oy + line[i + 1] * s).toFixed(2);
      }
    });
    return d;
  }

  /* Trace a rune into a 2D canvas context (caller strokes). */
  function trace(ctx, name, cx, cy, h) {
    var s = h / 10, ox = cx - 3 * s, oy = cy - 5 * s;
    ctx.beginPath();
    (RUNES[name] || RUNES.isa).forEach(function (line) {
      for (var i = 0; i < line.length; i += 2) {
        var x = ox + line[i] * s, y = oy + line[i + 1] * s;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
    });
  }

  /* Inline <svg> for a rune; used for small glyph icons. */
  function svg(name, cls) {
    return '<svg class="' + (cls || 'glyph') + '" viewBox="-1 -1 8 12" aria-hidden="true"><path d="' +
      path(name, 3, 5, 10) + '"/></svg>';
  }

  g.XRUNE = { RUNES: RUNES, METHODS: METHODS, RUNE_OF: RUNE_OF, path: path, trace: trace, svg: svg };
})(window);
