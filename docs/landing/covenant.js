/* IV · The Covenant. Eight runes on a wheel, one per DsRune method; the
 * plate shows the method's real signature (crates/xrune_nexus/src/ds_rune),
 * the casting that summons it, and what a rune should know about it. */
(function () {
  var wheel = document.getElementById('covWheel'), plate = document.getElementById('covPlate');
  if (!wheel || !plate || !XRUNE.sigil) return;
  var T = function (k) { return XR.t(k); };
  function L() { return Array.prototype.slice.call(arguments).join('\n'); }

  var SIG = {
    root: 'fn inscribe_root(&mut self, parent_expr: &syn::Expr);',
    widget: L('fn inscribe_widget(', '    &mut self,', '    name: &syn::Ident,', '    attrs: &[DsAttr],', '    enchants: &[syn::Expr],', '    on_handlers: &[DsOn],', '    children: &[DsTreeRef],', ');'),
    if: L('fn inscribe_if(', '    &mut self,', '    condition: &syn::Expr,', '    reactive: bool,', '    children: &[DsTreeRef],', '    else_branch: Option<&DsTreeRef>,', ');'),
    iter: L('fn inscribe_iter(', '    &mut self,', '    iterable: &syn::Expr,', '    variable: &syn::Ident,', '    reactive: bool,', '    key: Option<&syn::Expr>,', '    children: &[DsTreeRef],', ');'),
    niche: L('fn inscribe_niche(', '    &mut self,', '    name: &syn::Ident,', '    is_declaration: bool,', '    children: &[DsTreeRef],', ');'),
    match: L('fn inscribe_match(', '    &mut self,', '    scrutinee: &syn::Expr,', '    reactive: bool,', '    arms: &[DsMatchArm],', ');'),
    code: 'fn inscribe_code_block(&mut self, tokens: &proc_macro2::TokenStream);',
    seal: 'fn seal(self) -> proc_macro2::TokenStream;'
  };
  var DSL = {
    root: L(':(', '    parent: root_entity', ':)'),
    widget: L('button (text: "Save") [Tracked] on Tap { save(); } {', '    icon ("disk")', '}'),
    if: L('if $online { live () } elif cached { stale () } else { offline () }'),
    iter: L('walk $rows with row by row.id { line (text: row.name) }'),
    niche: L('@@header { title ("(untitled)") }   // template declares', '@header { title ("Inbox") }          // call site fills'),
    match: L('match $state {', '    State::Ready(d) => { list (items: d) }', '    _ => { spinner () }', '}'),
    code: '${ let total = items.len(); }',
    seal: null
  };

  var M = XRUNE.METHODS, sel = 0, auto = true, timer = 0, visible = false;
  var sg = XRUNE.sigil('covenant');
  wheel.appendChild(sg.svg);

  function choose(i, byUser) {
    sel = (i + M.length) % M.length;
    if (byUser) { auto = false; clearInterval(timer); }
    var m = M[sel];
    sg.meds.forEach(function (g, k) { g.classList.toggle('sel', k === sel); g.setAttribute('aria-pressed', k === sel); });
    sg.labels.forEach(function (t, k) { t.classList.toggle('sel', k === sel); });
    sg.extra.pointer.style.transform = 'rotate(' + (sel * 45) + 'deg)';
    sg.extra.core.setAttribute('d', XRUNE.path(m.rune, 0, -8, 120));
    sg.extra.name.textContent = m.name;
    var dsl = m.key === 'seal' ? T('cov.seal.dsl') : DSL[m.key];
    plate.innerHTML = '<div class="swap">' +
      '<div class="plate-head">' + XRUNE.svg(m.rune) + '<div><h3>' + m.name + '</h3><small>' + m.rune + '</small></div></div>' +
      '<p class="lbl">' + T('cov.lbl.sig') + '</p><pre><code>' + XRUNE.hl.rust(SIG[m.key]) + '</code></pre>' +
      '<p class="lbl">' + T('cov.lbl.dsl') + '</p><pre><code>' + XRUNE.hl.dsl(dsl) + '</code></pre>' +
      '<p>' + T('cov.' + m.key + '.n') + '</p></div>';
  }

  sg.meds.forEach(function (g, i) {
    g.addEventListener('click', function () { choose(i, true); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i, true); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); choose(sel + 1, true); sg.meds[sel].focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); choose(sel - 1, true); sg.meds[sel].focus(); }
    });
  });
  wheel.addEventListener('mouseenter', function () { clearInterval(timer); });
  wheel.addEventListener('mouseleave', function () { start(); });

  function start() {
    clearInterval(timer);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!auto || reduce || !visible) return;
    timer = setInterval(function () { choose(sel + 1, false); }, 5200);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else clearInterval(timer); }, { threshold: .3 }).observe(wheel);
  }
  window.addEventListener('xrune:lang', function () { choose(sel, false); });
  choose(0, false);
})();
