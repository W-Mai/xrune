/* EN / 中文. English lives in the HTML; this file holds the Chinese for every
 * [data-i18n] / [data-i18n-html] key, plus both languages for strings the
 * scripts build at runtime. Terms follow the zh-CN Grimoire: 符文师 rune,
 * 刻录 inscribe, 译咒 decipher, 封印 seal, 附魔 enchant, 壁龛 niche, 誊章 scribe. */
(function () {
  var ZH = {
    'nav.ritual': '仪式', 'nav.forge': '熔炉', 'nav.runes': '符文', 'nav.nexus': '中枢', 'nav.wild': '实战', 'nav.book': '魔典',
    'hero.subtitle': '魔典',
    'hero.tagline': '咒成于文，文译于师。一咒既立，万法可镌。',
    'hero.gloss': 'One casting, many inscriptions. You speak the rite; the runesmith cuts it into code.',
    'hero.scroll': '下滑',
    'cta.read': '阅读魔典', 'cta.forge': '进入熔炉', 'cta.copy': '复制',

    'what.kicker': '是什么', 'what.title': '一咒多镌',
    'what.p1': '用 xrune 的声明式 DSL 写下一段咒文。你绑定的<em>符文师</em>，也就是任何实现了八法 <code>DsRune</code> 契约的类型，会把它刻录成宿主真正需要的代码：ECS spawn 调用、渲染树构建器、调试回响，或是誊章的格式化回环。',
    'what.p2': 'DSL 只管解析。部件名可以是任意标识符，属性值可以是任意 Rust 表达式；一切语义，都在你绑定的符文师手里。',
    'what.o1': '把每个节点打印成 println! 回响', 'what.o2': '单片机、电脑、手机、浏览器上的真实部件',
    'what.o3': '同一段咒文，重新誊写', 'what.o4t': '你的符文师', 'what.o4': '宿主需要什么，就刻成什么',

    'ritual.kicker': '仪式', 'ritual.title': '看一段咒文如何成码',
    'ritual.lede': '同一段咒文，逐层追踪它的每一种形态：源码、语法树、契约调用、生成代码。',

    'forge.kicker': '熔炉', 'forge.title': '咒法之书',
    'forge.lede': '写下一段咒文。真实的 xrune 解析器已编译为 WebAssembly，你每敲一键它便译咒一次，再交由三位符文师刻录。',
    'forge.casting': '咒文', 'forge.copy': '复制为 ui! { … }',

    'runes.kicker': '师契', 'runes.title': '八道符文',
    'runes.lede': '符文师即任何实现了 <code>DsRune</code> 的类型：八个方法，没有默认实现。<code>decipher</code> 每遇一个节点便调用其一；节点化作什么，由你的符文师决定。',
    'runes.host.t': '在你自己的过程宏里供奉它',
    'runes.host.p': '<code>ui!</code> 把 <code>DefaultRune</code> 写死在里面。真正的后端会发布自己的过程宏 crate，换上自己的符文师；下游用户写的仍是同一套 DSL。',
    'runes.trap.t': '唯一的陷阱',
    'runes.trap.p': '<code>decipher</code> 只替你遍历根节点。每个收到 children 的 inscribe 都得自己递归下去；忘了这一步，整棵子树会悄无声息地消失。',

    'nexus.kicker': '中枢', 'nexus.title': '五卷与一枢',
    'nexus.lede': '同一座 workspace，同一道版号。每次发版，五卷同步前进。',
    'nexus.sigil.lore': '印玺', 'nexus.sigil.desc': '<code>#[derive(DsRef)]</code> 铸出构建语法树所用的 <code>Rc&lt;RefCell&gt;</code> 句柄。',
    'nexus.nexus.lore': '中枢', 'nexus.nexus.desc': 'AST、<code>DsRune</code> 契约与 <code>decipher</code> 遍历，皆在此处汇聚。',
    'nexus.incant.lore': '咒坛', 'nexus.incant.desc': '<code>ui! { … }</code> 过程宏本体，绑定 <code>DefaultRune</code>。',
    'nexus.xrune.lore': '入口卷轴', 'nexus.xrune.desc': '你唯一需要添加的依赖。重新导出中枢与 <code>ui!</code>。',
    'nexus.fmt.lore': '誊章', 'nexus.fmt.desc': '把每段 <code>ui! { … }</code> 经真实解析器重新誊写。熔炉里跑的正是它的格式化器。',
    'nexus.mirui.lore': '实战中的宿主', 'nexus.mirui.desc': '依赖 <code>xrune = "1.10"</code>；它的 <code>ui!</code> 就是一位符文师。',
    'nexus.order': '发布顺序',

    'wild.kicker': '实战', 'wild.title': 'mirui 以 xrune 为言',
    'wild.lede': 'mirui 是一套 Rust UI 框架，一套代码跑遍单片机、电脑、手机与浏览器。它的界面用 xrune 咒文写成，它的 ui! 宏就是一位符文师。',
    'wild.decl': '模板 · @@ 声明', 'wild.fill': '调用处 · @ 填充', 'wild.src': '节选 · 源码 ↗',
    'wild.play': '运行实时演示',
    'wild.cap': '真实的 mirui，编译为 WebAssembly，渲染左侧的 Card。480 × 320。',

    'reach.kicker': '抉择', 'reach.title': '何时召请 xrune',
    'reach.c1.t': '可插拔的代码生成', 'reach.c1.p': '一套 DSL，多位符文师。同一段咒文可以化作 spawn 调用、渲染构建器、静态分析器。',
    'reach.c2.t': '解析时不定类型', 'reach.c2.p': '部件名是任意标识符，属性值是任意 <code>syn::Expr</code>。全部语义都交给你绑定的符文师。',
    'reach.c3.t': '为宿主而生', 'reach.c3.p': '发布你自己的过程宏 crate，绑定你自己的符文师；下游用户写同一套 DSL，得到的是你的代码生成。',
    'reach.else': '需要在编译期检查部件名和属性键的类型？请选用 typed-builder 风格的 DSL，比如 <code>leptos::view!</code>、<code>dioxus::rsx!</code> 或 <code>yew::html!</code>。<a href="book/comparisons.html" data-book="comparisons.html">阅读对比 →</a>',

    'rite.title': '开始施咒',
    'foot.explicit': '魔典扉页，至此而终。', 'foot.licence': 'MIT 许可', 'foot.codex': '流变志'
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
      'cov.seal.dsl': '// the walk ends; nothing more to read',
      'wild.loading': 'summoning mirui…'
    },
    zh: {
      'copy.done': '已复制',
      'ritual.p.source': '咒文 · DSL', 'ritual.p.tree': 'DsTree · 节点图',
      'ritual.p.calls': 'decipher 调起 DsRune', 'ritual.p.trace': '符文师刻出 · 代码',
      'ritual.sink': '附魔 → ∅   符文师可以不予理会',
      'forge.status.ok': '✦ 封印已成 · {n} 次刻录 · {ms} ms',
      'forge.status.bad': '✗ 于 {at} 处被拒',
      'forge.status.bad0': '✗ 被拒',
      'forge.status.kindle': '正在点燃熔炉…',
      'forge.status.cold': '熔炉未燃',
      'forge.cold': '正在点燃熔炉，真实的解析器正在载入。',
      'forge.failed': '熔炉在此无法点燃。请通过 http(s) 打开本页来运行解析器。',
      'forge.engine': '<b>xrune-nexus {v}</b> · 编译为 WebAssembly · {kb} KB · 在你的浏览器里运行',
      'forge.note.calls': 'decipher 发出的每一次刻录调用，按遍历顺序排列。悬停某行，左页会标出对应源码。',
      'forge.note.tree': '解析器构建出的 DsTree，按符文师遍历的顺序展开。',
      'forge.note.default': 'ui! 实际展开出的代码：内置的 DefaultRune 封印出一串 println! 回响。',
      'forge.note.scribe': 'xrune-fmt 的格式化器，作用于你的咒文。',
      'forge.scribe.apply': '按誊章改写', 'forge.scribe.same': '已是誊章笔迹 ✓',
      'forge.copied': '已复制', 'forge.shatter': '符文碎裂：{msg}',
      'forge.lexerr': '括号不配对：每个 ( [ { 都需要对应的闭合',
      'forge.else': 'decipher 直接遍历其子节点',
      'forge.ch': '{n} 个子节点', 'forge.ch1': '1 个子节点',
      'forge.g.grimoire': '各种形态尝个鲜：上下文头、带键的响应式巡历、附魔、事件咒符，以及 if / else。随意修改，解析器每敲一键都会回应。',
      'forge.g.widget': '部件名可以是任意标识符。属性可具名，也可按位置；每个值都是真实的 Rust 表达式。括号与花括号体都可省略。',
      'forge.g.enchant': '附魔挂在部件的属性与 body 之间：任意表达式，由符文师随意挂载，比如 ECS 组件、中间件或标记。',
      'forge.g.on': '<code>on</code> 并入它所跟随的部件。带体或回调、裸名或限定名，所有事件咒符都经由 <code>inscribe_widget</code> 的 <code>on_handlers</code> 交到符文师手中。',
      'forge.g.if': '<code>if</code> / <code>elif</code> / <code>else</code>。条件前的 <code>$</code> 把它标记为响应式；符文师会知晓，并可把分支包进响应式作用域。',
      'forge.g.walk': '<code>walk … with …</code> 用于巡历。<code>$</code> 让迭代源成为响应式；<code>by todo.id</code> 为每一行赋予身份，按身份而非位置来协调。',
      'forge.g.match': '<code>match</code> 在子树之间分支。每条分支自带子节点，所以 <code>inscribe_match</code> 收到的是分支，而非 children 切片。',
      'forge.g.niche': '壁龛即具名插槽。<code>@@name</code> 在模板中声明一处，可附带后备子节点；<code>@name</code> 在调用处填充它。mirui 的组合部件正是如此。',
      'forge.g.code': '<code>${ … }</code> 是逃生口：原样捕获的 Rust 代码。解析器从不解读它；<code>inscribe_code_block</code> 把这串记号交给符文师自行拼接。',
      'forge.g.context': '<code>:( … :)</code> 头部向符文师传递上下文，每行一个键。它可以省略：省略时 <code>parent</code> 为 <code>()</code>。其余的键都由符文师定义。',
      'forge.g.reject': '解析器宁可拒绝含糊的咒文，也不去猜。这里的 <code>on</code> 前面没有可以依附的部件；把它移到 button 之后，封印即成。',
      'cov.lbl.sig': '方法签名', 'cov.lbl.dsl': '由此召唤',
      'cov.root.n': '由宿主在遍历之前调用一次。省略头部时，parent 为 ()。',
      'cov.widget.n': '部件名、属性、附魔与事件咒符逐一拆好送达。children 也一并送来：要由你自己递归下去。',
      'cov.if.n': 'elif 以嵌套的 If 出现在 else_branch 里；else 则是一棵 Else 树，由 decipher 直接遍历其子节点。',
      'cov.iter.n': 'reactive 即那个 $；key 即 by 子句，让各行在更新之间按身份对应。',
      'cov.niche.n': 'is_declaration 区分模板里的 @@ 声明与调用处的 @ 填充。',
      'cov.match.n': '子节点挂在每条分支上，所以符文师先遍历分支，再遍历各分支的 get_children()。',
      'cov.code.n': '原样捕获的 Rust 代码。把它拼到该去的地方；xrune 从不解读它。',
      'cov.seal.n': '按值取走 self，因此只执行一次。返回的 TokenStream 会被宿主当作亲手写下的代码吸收。',
      'cov.seal.dsl': '// 遍历结束，再无可读',
      'wild.loading': '正在召请 mirui…'
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
