/* EN / 中文. English lives in the HTML; this file holds the Chinese for every
 * [data-i18n] / [data-i18n-html] key, plus both languages for strings the
 * scripts build at runtime. Terms follow the zh-CN Grimoire: 符文师 rune,
 * 刻录 inscribe, 译咒 decipher, 封印 seal, 附魔 enchant, 壁龛 niche, 誊章 scribe.
 * The Chinese is written in a light classical register, on purpose. */
(function () {
  var ZH = {
    'nav.ritual': '仪轨', 'nav.forge': '熔炉', 'nav.runes': '符文', 'nav.nexus': '中枢', 'nav.wild': '行世', 'nav.book': '魔典',
    'hero.subtitle': '魔典',
    'hero.tagline': '咒成于文，文译于师。一咒既立，万法可镌。',
    'hero.gloss': 'One casting, many inscriptions. You speak the rite; the runesmith cuts it into code.',
    'hero.scroll': '展卷',
    'cta.read': '展读魔典', 'cta.forge': '入炉一试', 'cta.copy': '誊录',

    'what.kicker': '何谓', 'what.title': '一咒多镌',
    'what.p1': '以 xrune 之声明式 DSL，书咒一段。所缚之<em>符文师</em>，凡契合八法 <code>DsRune</code> 之类型皆可当之，将其镌为宿主所需之码：或为 ECS spawn 之调用，或为渲染树之构建，或为调试之回响，或为誊章之往返。',
    'what.p2': 'DSL 但司解析，不问其义。部件之名，任取标识；属性之值，任书 Rust 表达式。万般语义，尽归所缚之符文师。',
    'what.o1': '逐节点以 println! 回响', 'what.o2': '单片机、桌面、手机、网页之上，化为真部件',
    'what.o3': '同一咒文，重誊一过', 'what.o4t': '汝之符文师', 'what.o4': '宿主何求，即镌何物',

    'ritual.kicker': '仪轨', 'ritual.title': '观一咒成码',
    'ritual.lede': '一咒在手，逐层追其形变：源文、语法之树、契约之召、所成之码。',

    'forge.kicker': '熔炉', 'forge.title': '咒法之书',
    'forge.lede': '落笔成咒。真 xrune 解析器已炼为 WebAssembly：每落一键，即译咒一遍，复交三位符文师镌录。',
    'forge.casting': '咒文', 'forge.copy': '誊为 ui! { … }',

    'runes.kicker': '师契', 'runes.title': '八道符文',
    'runes.lede': '凡类型契合 <code>DsRune</code> 者，即为符文师：八法俱全，无一缺省。<code>decipher</code> 每遇一节点，便召其一法；节点化作何物，悉由符文师定夺。',
    'runes.host.t': '自立宏坛，奉之为主',
    'runes.host.p': '<code>ui!</code> 坛中所奉，唯 <code>DefaultRune</code>，不可更易。真后端当自刊过程宏 crate，易以己之符文师；下游所书，仍是同一 DSL。',
    'runes.trap.t': '唯此一阱',
    'runes.trap.p': '<code>decipher</code> 所交之 children，从不代为巡行。凡 inscribe 受之，须亲自递归；稍有疏忽，整株子树无声而没。',

    'nexus.kicker': '中枢', 'nexus.title': '五卷与一枢',
    'nexus.sigil.lore': '印玺', 'nexus.sigil.desc': '<code>#[derive(DsRef)]</code> 铸 <code>Rc&lt;RefCell&gt;</code> 之柄，语法树赖以成形。',
    'nexus.nexus.lore': '中枢', 'nexus.nexus.desc': 'AST、<code>DsRune</code> 之契、<code>decipher</code> 之巡，皆汇于此。',
    'nexus.incant.lore': '咒坛', 'nexus.incant.desc': '<code>ui! { … }</code> 过程宏之本体，所奉者 <code>DefaultRune</code>。',
    'nexus.xrune.lore': '启卷', 'nexus.xrune.desc': '唯此一依赖须添。中枢与 <code>ui!</code>，皆由此转出。',
    'nexus.fmt.lore': '誊章', 'nexus.fmt.desc': '凡 <code>ui! { … }</code>，皆经真解析器重誊一过。熔炉所用，即其格式之器。',
    'nexus.mirui.lore': '行世之宿主', 'nexus.mirui.desc': '依 <code>xrune = "1.10"</code> 而立；其 <code>ui!</code> 即一位符文师。',

    'wild.kicker': '行世', 'wild.title': 'mirui 以 xrune 为言',
    'wild.lede': 'mirui 者，Rust 之 UI 框架也，一码通行单片机、桌面、手机与网页。其界面以 xrune 咒文书就，其 ui! 宏即一位符文师。',
    'wild.decl': '模板 · @@ 立槽', 'wild.fill': '调用处 · @ 填槽', 'wild.src': '节录 · 原典 ↗',
    'wild.hint': '触卡面，或填或空',
    'wild.void': '虚位以待',
    'wild.cap': '此咒所成之 Card，就地绘之。',
    'wild.live': '观其行于 mirui ↗',

    'reach.kicker': '抉择', 'reach.title': '何时当召 xrune',
    'reach.c1.t': '生码之术，可插可拔', 'reach.c1.p': '一 DSL，众符文师。同一咒文，可化 spawn 之调用、渲染之构建、静态之剖析。',
    'reach.c2.t': '解析之时，不定其型', 'reach.c2.p': '名可任取，值可任书（<code>syn::Expr</code>）。是何语义，尽付所缚之符文师。',
    'reach.c3.t': '为宿主而生', 'reach.c3.p': '自刊过程宏 crate，自缚符文师；下游书同一 DSL，所得者乃汝所生之码。',
    'reach.else': '若欲于编译之期，验部件之名与属性之键，则宜取 typed-builder 一派之 DSL，如 <code>leptos::view!</code>、<code>dioxus::rsx!</code>、<code>yew::html!</code>。<a href="book/comparisons.html" data-book="comparisons.html">观其比较 →</a>',

    'rite.title': '开坛施咒',
    'foot.explicit': '魔典首叶，于此告终。', 'foot.licence': 'MIT 许可', 'foot.codex': '流变志'
  };

  /* strings built by scripts at runtime */
  var JS = {
    en: {
      'copy.done': 'copied', 'cta.copy': 'copy', 'forge.copy': 'Copy as ui! { … }',
      'ritual.p.source': 'The Casting · DSL', 'ritual.p.tree': 'DsTree · node graph',
      'ritual.p.calls': 'decipher fires DsRune', 'ritual.p.trace': 'a rune emits · code',
      'ritual.sink': 'enchants → ∅   the rune may ignore them',
      'forge.status.ok': '✦ sealed · {n} inscriptions · {ms} ms',
      'forge.status.bad': '✗ rejected at {at}',
      'forge.status.bad0': '✗ rejected',
      'forge.status.kindle': 'kindling the forge…',
      'forge.status.cold': 'the forge is cold',
      'forge.cold': 'Kindling the forge. The real parser is on its way.',
      'forge.failed': 'The forge would not light here. Serve the page over http(s) to run the parser.',
      'forge.engine': '<b>xrune-nexus {v}</b> · compiled to WebAssembly · {kb} KB · runs in your browser',
      'forge.note.calls': 'Every inscribe call decipher makes, in walk order. Hover a row to find its source.',
      'forge.note.tree': 'The DsTree the parser built, in the order the rune walks it.',
      'forge.note.default': 'What ui! actually expands to: the bundled DefaultRune seals a println! trace.',
      'forge.note.scribe': 'xrune-fmt’s formatter, run on your casting.',
      'forge.scribe.apply': 'Apply the scribe', 'forge.scribe.same': 'already in the scribe’s hand ✓',
      'forge.copied': 'copied', 'forge.shatter': 'The rune shattered: {msg}',
      'forge.lexerr': 'unbalanced delimiter: every ( [ { needs its partner',
      'forge.else': 'decipher walks its children itself',
      'forge.ch': '{n} children', 'forge.ch1': '1 child',
      'forge.g.grimoire': 'A taste of everything: a context header, a reactive walk with a key, enchants, an on handler and an if / else. Edit anything; the parser answers on every keystroke.',
      'forge.g.widget': 'A widget is any identifier. Attributes are named or positional, and every value is a real Rust expression. Parens and body are both optional.',
      'forge.g.enchant': 'Enchants ride on a widget between its attrs and its body: any expressions the rune attaches as it likes, such as ECS components, middleware or tags.',
      'forge.g.on': '<code>on</code> folds into the widget it follows. Body form or callback form, bare or qualified: every handler reaches the rune through <code>inscribe_widget</code>’s <code>on_handlers</code>.',
      'forge.g.if': '<code>if</code> / <code>elif</code> / <code>else</code>. A leading <code>$</code> marks the condition reactive; the rune is told, and may wrap the branch in a reactive scope.',
      'forge.g.walk': '<code>walk … with …</code> iterates. <code>$</code> makes the iterable reactive; <code>by todo.id</code> gives each row an identity to reconcile by, instead of its position.',
      'forge.g.match': '<code>match</code> branches across sub-trees. Each arm carries its own children, so <code>inscribe_match</code> receives arms, not a children slice.',
      'forge.g.niche': 'Niches are named slots. <code>@@name</code> declares one in a template, optionally with fallback children; <code>@name</code> fills it at the call site. mirui’s composed widgets work exactly so.',
      'forge.g.code': '<code>${ … }</code> is the escape hatch: raw Rust, captured verbatim. The parser never reads it; <code>inscribe_code_block</code> hands the tokens to the rune to splice.',
      'forge.g.context': 'The <code>:( … :)</code> header passes context to the rune, one key per line. It is optional: without it, <code>parent</code> is <code>()</code>. Every other key is the rune’s to define.',
      'forge.g.reject': 'The parser rejects ambiguous castings rather than guess. Here <code>on</code> has no widget to attach to. Move it below the button and the seal holds.',
      'cov.lbl.sig': 'Signature', 'cov.lbl.dsl': 'Summoned by',
      'cov.root.n': 'Called once, by the host, before the walk. With no header, the parent is ().',
      'cov.widget.n': 'Name, attrs, enchants and handlers arrive unpacked. The children arrive too: recurse into them yourself.',
      'cov.if.n': 'An elif arrives as a nested If in else_branch; an else arrives as an Else tree whose children decipher walks.',
      'cov.iter.n': 'reactive is the $. key is the by clause, so rows can be matched by identity across updates.',
      'cov.niche.n': 'is_declaration tells a template’s @@ slot from a call site’s @ fill.',
      'cov.match.n': 'Children live on each arm, so the rune loops over the arms, then over each arm’s get_children().',
      'cov.code.n': 'Raw Rust, captured verbatim. Splice it where it belongs; xrune never reads it.',
      'cov.seal.n': 'Takes self by value, so it runs once. Return the TokenStream your host absorbs as if written by hand.',
      'cov.seal.dsl': '// the walk ends; nothing more to read'
    },
    zh: {
      'copy.done': '已誊',
      'ritual.p.source': '咒文 · DSL', 'ritual.p.tree': 'DsTree · 节点之图',
      'ritual.p.calls': 'decipher 召请 DsRune', 'ritual.p.trace': '符文师镌出 · 代码',
      'ritual.sink': '附魔 → ∅   符文师可置之不顾',
      'forge.status.ok': '✦ 封印既成 · 镌录 {n} 道 · {ms} ms',
      'forge.status.bad': '✗ 见拒于 {at}',
      'forge.status.bad0': '✗ 见拒',
      'forge.status.kindle': '熔炉方燃…',
      'forge.status.cold': '熔炉未燃',
      'forge.cold': '熔炉方燃，真解析器正自远而至。',
      'forge.failed': '此地炉火难燃。请以 http(s) 开启此页，解析器方可运行。',
      'forge.engine': '<b>xrune-nexus {v}</b> · 炼为 WebAssembly · {kb} KB · 行于汝之浏览器',
      'forge.note.calls': 'decipher 所发之镌录，依巡行之序列之。悬指一行，左页即标其源。',
      'forge.note.tree': '解析器所建之 DsTree，依符文师巡行之序展之。',
      'forge.note.default': 'ui! 实际所展之码：内置之 DefaultRune 封印而出，一串 println! 回响。',
      'forge.note.scribe': 'xrune-fmt 之格式器，誊汝咒文。',
      'forge.scribe.apply': '依誊章改写', 'forge.scribe.same': '已合誊章笔法 ✓',
      'forge.copied': '已誊', 'forge.shatter': '符文碎裂：{msg}',
      'forge.lexerr': '括号失偶：凡 ( [ {，必有其合',
      'forge.else': 'decipher 自巡其子节点',
      'forge.ch': '{n} 个子节点', 'forge.ch1': '1 个子节点',
      'forge.g.grimoire': '诸般形态，一卷尽览：上下文头、带键之响应巡历、附魔、事件咒符、if / else。任意改之，每落一键，解析器即有回响。',
      'forge.g.widget': '部件之名，任取标识。属性或具名，或依位；其值皆真 Rust 表达式。括号与花括号之体，皆可省去。',
      'forge.g.enchant': '附魔居属性与 body 之间：任意表达式，听凭符文师挂载，或为 ECS 组件，或为中间件，或为标记。',
      'forge.g.on': '<code>on</code> 依附其前之部件。带体或回调，裸名或限定，诸事件咒符皆经 <code>inscribe_widget</code> 之 <code>on_handlers</code>，送至符文师手中。',
      'forge.g.if': '<code>if</code> / <code>elif</code> / <code>else</code>。条件之前冠以 <code>$</code>，即标为响应式；符文师知之，可将此支纳入响应之域。',
      'forge.g.walk': '<code>walk … with …</code> 司巡历。冠以 <code>$</code>，迭代之源即为响应；<code>by todo.id</code> 予每行以身份，依身份而非位次相认。',
      'forge.g.match': '<code>match</code> 分途于诸子树之间。诸支各携子节点，故 <code>inscribe_match</code> 所受者乃诸支，非 children 切片。',
      'forge.g.niche': '壁龛者，具名之槽也。<code>@@name</code> 于模板立之，可附后备之子；<code>@name</code> 于调用处填之。mirui 之组合部件，正循此道。',
      'forge.g.code': '<code>${ … }</code> 乃遁出之门：Rust 原文，一字不易。解析器从不过目；<code>inscribe_code_block</code> 将其记号交付符文师，自行拼合。',
      'forge.g.context': '<code>:( … :)</code> 之头，为符文师传上下文，一行一键。此头可省：省则 <code>parent</code> 为 <code>()</code>。余键之义，悉由符文师自定。',
      'forge.g.reject': '咒文含糊，解析器宁拒不猜。此处 <code>on</code> 前无部件可依；移至 button 之后，封印乃成。',
      'cov.lbl.sig': '签名', 'cov.lbl.dsl': '召之以',
      'cov.root.n': '巡行之前，宿主召之一次。头既省，parent 即为 ()。',
      'cov.widget.n': '名、属性、附魔、事件咒符，逐一拆好奉上。children 亦一并送达：须亲自递归。',
      'cov.if.n': 'elif 化作嵌套之 If，栖于 else_branch；else 乃一株 Else 之树，decipher 自巡其子。',
      'cov.iter.n': 'reactive 即彼 $；key 即 by 之句，令诸行历次更新，依身份相认。',
      'cov.niche.n': 'is_declaration 以别模板之 @@ 立槽，与调用处之 @ 填槽。',
      'cov.match.n': '子节点各系于其支，故符文师先巡诸支，再巡各支之 get_children()。',
      'cov.code.n': 'Rust 原文，一字不易。拼之于所当在；xrune 从不过目。',
      'cov.seal.n': '以值取 self，故仅行一次。所返之 TokenStream，宿主纳之，如亲笔所书。',
      'cov.seal.dsl': '// 巡行已毕，无复可读'
    }
  };

  var root = document.documentElement;
  var lang = root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
  var orig = new WeakMap();

  function fill(s, vars) {
    return vars ? String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; }) : s;
  }
  function t(key, vars) {
    var s = JS[lang][key];
    if (s == null && lang === 'zh') s = ZH[key];
    if (s == null) s = JS.en[key];
    return fill(s == null ? key : s, vars);
  }

  function apply(next, persist) {
    lang = next === 'zh' ? 'zh' : 'en';
    root.setAttribute('data-lang', lang);
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(function (el) {
      var html = el.hasAttribute('data-i18n-html');
      var key = el.getAttribute(html ? 'data-i18n-html' : 'data-i18n');
      if (!orig.has(el)) orig.set(el, html ? el.innerHTML : el.textContent);
      var v = lang === 'zh' && ZH[key] != null ? ZH[key] : orig.get(el);
      if (html) el.innerHTML = v; else el.textContent = v;
    });
    document.querySelectorAll('[data-book]').forEach(function (a) {
      a.setAttribute('href', (lang === 'zh' ? 'book/zh-CN/' : 'book/') + a.getAttribute('data-book'));
    });
    if (persist) { try { localStorage.setItem('xrune-lang', lang); } catch (_) {} }
    window.dispatchEvent(new CustomEvent('xrune:lang', { detail: lang }));
  }

  window.XR = { t: t, lang: function () { return lang; }, setLang: function (l) { apply(l, true); } };
  if (lang === 'zh') apply('zh', false);
})();
