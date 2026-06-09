# 附录 · 术语对照

这是 xrune 的中世纪词系与寻常编译器/计算机术语之间的契约。后续诸章一旦有「比喻像是飘离工程含义」之险，便回此处校核。

## 命名契约

| 原词 | 译名 | 工程含义 |
| --- | --- | --- |
| **sigil** | 印玺 | 一个 derive 宏 crate（`xrune-sigil`）。`DsRef` derive 为目标 struct 锻造 `{Name}Ref` newtype，内里是 `Rc<RefCell<Name>>`。 |
| **nexus** | 中枢 | 核心 crate（`xrune-nexus`）。AST 节点类型、`DsRune` trait、`decipher` 译咒走脚，皆在此。其余 crate 都向这里收束。 |
| **incant** | 咒坛 | 过程宏 crate（`xrune-incant`），导出 `ui! { … }`。咏唱即调起 DSL 的动作。 |
| **rune** | 符文师 | `DsRune` trait 的一个后端实现。把解析出的树翻成最终代码。咒文只一道；符文师可有许多种译法。 |
| **decipher** | 译咒 | 自由函数 `xrune::ds_rune::decipher::decipher(tree, &mut rune)`。遍历 `DsTree`，对每个节点调一次符文师的 inscribe 方法。 |
| **inscribe** | 刻录 | `DsRune` 上的方法之一：`inscribe_root` / `inscribe_widget` / `inscribe_if` / `inscribe_iter` / `inscribe_niche` / `inscribe_match`。每个收下一个节点，将产出累积进符文师内部。 |
| **seal** | 封印 | trait 方法 `seal(self) -> TokenStream`。译咒走完，封印一道，把符文师内累积之物收束为最终发出的代码。**注意**：不是 Rust 的「sealed trait」习语，同名不同义。 |
| **enchant** | 附魔 | 部件后附的方括号表达式串 `[expr, expr, …]`。任意数据，由符文师挂到节点上 —— 典型用法是 ECS 组件或附着状态。 |
| **niche** | 壁龛 | `@name { … }` 节点。一处具名锚位 / 插槽 / 命名区域，由宿主符文师路由（如 portal、命名端口）。 |
| **walk … with …** | 巡历 … 取 … | 迭代。`walk iterable with var { … }` 是 xrune 的 `for` 循环。 |
| **on** | 事件咒符 | 部件后附的事件处理子句 —— `on EventKind { … }`（带体形态）或 `on EventKind(cb)`（回调形态）。 |
| **scribe** | 誊章 | 格式化器二进制 `xrune-fmt`。把 `ui! { … }` 块经真实 parser 来回誊写一次。 |
| **grimoire** | 魔典 | 你正在读的这本文档站。 |
| **codex** | 流变志 | 版本流变史（CHANGELOG）。 |

## DSL 咏唱形态摘要

| 形态 | 名号 | 解读 |
| --- | --- | --- |
| `:( ... :)`（每个属性独占一行） | 上下文区 | `parent` 必填；其余键由符文师定义（`world`、`theme`…）。 |
| `Widget (k: v) { … }` | 部件・带属性带体 | 带具名属性与子节点的部件。 |
| `Widget (Text("hi"))` | 部件・位置属性 | 带位置属性的部件。可不带 body。 |
| `Widget (k: v) [Comp{…}, Tag] { … }` | 部件・附魔 | 同上，附魔写在属性与 body 之间。 |
| `if expr { … }` | 条件 | 条件渲染。 |
| `walk it with x { … }` | 巡历 | 迭代。 |
| `@slot { … }` | 壁龛 | 具名锚位。 |
| `match e { Pat => { … } … }` | 模式匹配 | 跨子树的模式匹配。 |
| `Widget () {} on Tap { fire() }` | 事件咒符・形态 B | `on` 在 body 之后，附着到前一个兄弟部件。 |
| `Widget () on Tap { … } { … }` | 事件咒符・形态 C | `on` 在属性与 body 之间，附着到本部件。 |
| `on Tap(cb)` | 事件咒符・回调 | 回调形态。`cb` 是末尾参数，由符文师决定语义。 |

## 公开 API 索引

每位读者只需扫一次的最小面：

| Crate | 名号 | 公开面 |
| --- | --- | --- |
| `xrune-sigil` | 印玺 | `#[derive(DsRef)]` |
| `xrune-nexus` | 中枢 | `ds_node::*`（`Ds*` AST 类型族）· `ds_rune::DsRune` trait · `ds_rune::decipher::decipher` · `pub use xrune_sigil::DsRef` |
| `xrune-incant` | 咒坛 | `#[proc_macro] pub fn ui` |
| `xrune` | — | `pub mod default_rune;` · `pub use xrune_incant::ui;` · `pub use xrune_nexus::*;` |
| `xrune-fmt` | 誊章 | `xrune-fmt <file.rs> [--check]`（二进制） |
