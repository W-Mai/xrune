# 流变志

对版本史的指引，而不是把它复读一遍。完整 changelog 见 [`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md)；本章只挑那些会牵动**已经写好的符文师**的改动。

## 现行的形态

其他章节描述的那些形态，就是现在 crates.io 上发布的形态：`DsRune` trait 的七道方法、六个 `DsNode` 变体、三种 `on` 形态（B、C、回调）、附魔、壁龛、match arm、`name: Option<syn::Ident>` 这样的属性形态。照本文档写的代码，如今即可编过。

## 按接口面拆分的迁移笔记

下面每条都假定你手上是上一种形态、需要迁到现行形态。

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
| `DsNode::On` 变体 | 折进部件 |
| `DsTreeToTokens` trait | `DsRune` codegen 接口 |
| `ds_traverse` 模块 | `xrune::ds_rune::decipher::decipher` |
| crate 名 `xwrapup` / `xrune_derive` / `xrune_parser` / `xrune_macros` | `xrune-sigil` / `xrune-nexus` / `xrune-incant` / `xrune` |

## 源码出处

- 完整版本流变 changelog：[`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md)
- 现行的 trait 接口面：[`crates/xrune_nexus/src/ds_rune/mod.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_rune/mod.rs)
- 现行的 AST 接口面：见 [符文图谱](runes.md)
