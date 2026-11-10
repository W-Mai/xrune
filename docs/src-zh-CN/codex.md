# 流变志

对版本史的指引，而不是把它复读一遍。完整 changelog 见 [`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md)；本章只挑那些会牵动**已经写好的符文师**的改动。

## 现行的形态

其他章节描述的那些形态，就是现在 crates.io 上发布的形态（1.10）：`DsRune` trait 的八道方法、八个 `DsNode` 变体、可省的 `:( … :)` 上下文头、`if` / `elif` / `else`、`$` 印记、带键的 `walk … by …`、`@` / `@@` 壁龛、`${ … }` 代码块、三种 `on` 形态（B、C、回调）、附魔、match arm、`name: Option<syn::Ident>` 这样的属性形态。照本文档写的代码，如今即可编过。

## 按接口面拆分的迁移笔记

下面每条都假定你手上是上一种形态、需要迁到现行形态。下列改动都是新增参数或新增方法，编译器会逐处指给你看。

### `inscribe_if`（1.7）

新增 `reactive: bool` 与 `else_branch: Option<&DsTreeRef>`。发完 `if` 的 body 后，若为 `Some`，把分支交回 `decipher(branch, self)`：`elif` 会再进 `inscribe_if`，`else` 会走它自己的 children。不理会 `else_branch` 的符文师会悄无声息地丢掉所有 `elif` / `else` 的 body。

### `inscribe_iter` 与 `inscribe_match`（1.7、1.9）

两者在 1.7 都新增了 `reactive: bool`。`inscribe_iter` 在 1.9 又新增 `key: Option<&syn::Expr>`，即带键 walk 的 `by <expr>`。不理会它们，行为与从前一致。

### `DsAttr::reactive`（1.8）

`DsAttr` 多了公开字段 `reactive: bool`。读属性不受影响；用 struct 字面量构造 `DsAttr` 的代码要补上这个字段。

### `inscribe_niche`（1.10）

新增 `is_declaration: bool`：`@@name` 为 `true`，`@name` 为 `false`。壁龛的 body 现在可省，所以 `children` 可能为空。

### `inscribe_code_block`（1.10）

新方法，没有默认实现：每位符文师都得提供。它收到 `${ … }` 节点原样的 token；拼进输出即可，用不上原样 Rust 的符文师什么都不做也行。

### 可省的上下文头（1.10）

`:( … :)` 可以不写，上下文头里也可以不写 `parent`。这两种情况下 `get_parent()` 都返回 `()`，parser 不再拒收。依赖那条拒收的符文师，现在要处理单元 parent。

### `on EventKind` 处理器

更早的 parser 里有一种树级 `DsOn` 节点，跟 widget / if / iter / niche / match 同位。trait 里有对应的 `inscribe_on` 方法。

现在两者都没有。`on` 子句**折进它附着的部件**，作为 `on_handlers: &[DsOn]` 落到 `inscribe_widget`。没有 `DsNode::On` 变体，也没有 `inscribe_on` 方法。

如果你之前实现过 `inscribe_on`：删掉，把读 on-handlers 的逻辑搬到 `inscribe_widget` 内的 `on_handlers` slice。

### `DsOn::get_body()`

之前直接返回 `&syn::Block`。现在返回 `Option<&syn::Block>`，因为 `on EventKind(cb)`（回调形态）不携带 body。

如果你之前无条件读 body，改成处理 `None` 分支，通常是把 `get_args()` 末尾的元素当作回调表达式来读。

### `DsAttr::name`

之前是非可选 `syn::Ident`。现在是 `Option<syn::Ident>`，因为位置属性（`text("hello")`）不带名字。

如果你直接读 `attr.name`，改成 match `Option`。匹配友好的版本是 `name_str() -> Option<String>`。

### 壁龛与 match 节点

`@name { … }` 与 `match expr { … }` 现已是 trait 的一部分。如果你的 `DsRune` 实现写得早于它们，编译器会要求 `inscribe_niche` 与 `inscribe_match`，trait 没有默认实现。

## 已删除

下面这些不再属于这门语言。在范例代码里看到，说明那段代码出自更早的版本。

| 已删除 | 替代 |
| --- | --- |
| `DsRune::inscribe_on` 方法 | `inscribe_widget` 上的 `on_handlers: &[DsOn]` |
| `Root node must have a parent` 报错 | 上下文头可省；`get_parent()` 回落为 `()` |
| `DsNode::On` 变体 | 折进部件 |
| `DsTreeToTokens` trait | `DsRune` codegen 接口 |
| `ds_traverse` 模块 | `xrune::ds_rune::decipher::decipher` |
| crate 名 `xwrapup` / `xrune_derive` / `xrune_parser` / `xrune_macros` | `xrune-sigil` / `xrune-nexus` / `xrune-incant` / `xrune` |

## 源码出处

- 完整版本流变 changelog：[`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md)
- 现行的 trait 接口面：[`crates/xrune_nexus/src/ds_rune/mod.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_rune/mod.rs)
- 现行的 AST 接口面：见 [符文图谱](runes.md)
