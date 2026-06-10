# 誊章

`xrune-fmt`（誊章）是 `ui! { … }` 块的格式化器。一个 CLI 二进制，不是 lib 库，装一次，对准任何含咏唱宏的 `.rs` 文件。

```bash
cargo install xrune-fmt

xrune-fmt src/app.rs            # 原地重写
xrune-fmt src/app.rs --check    # 未格式化则退出码 1，文件不动
```

## 它做什么

对每段 `ui! { … }`，誊章会：

1. 用正则 `ui!\s*\{` 找到宏，配对的 `}` 靠 brace 深度计数。
2. 把里面的内容交给**真正的 parser**，`xrune-nexus` 的 `DsRoot::parse`，拿回一棵 `DsTree`。
3. 遍历这棵树，按统一缩进、换行、间距重发。
4. 如果 parser 拒收，整段保持原样。誊章**绝不**默默改写自己读不懂的块。

它只动 `ui! { … }` 体内的内容。宏外面的代码按字节保留。

## 格式化规则

- **上下文头**始终多行，每属性独占一行，缩进比 `ui!` 大括号多一级。
- **部件属性**：单行能装下且 ≤ `MAX_LINE_WIDTH = 100` 时单行；否则每属性独占一行。原文已经多行的，即便重排后单行也能装下，誊章仍保持多行，作者意图优先于列宽。
- **属性值、`walk` 可迭代、`if`/`match` scrutinee、`on` body** 一律走 `prettyplease`，让嵌入的 Rust 表达式按规范形态渲染。
- **`on EventKind` 子句**叠在属性与 body 之间，body 缩进比外层部件多一级。
- **附魔**坐落在属性与 body 之间，写在 `[ … ]`，逗号分隔。

誊章能 round-trip 的形态，跟 `xrune-nexus::tests` 验过的一样齐全：位置属性、具名属性、无 body 的部件、壁龛、match arm、三种 `on` 形态（B、C、回调）。`xrune-fmt` 自己的测试集走遍 `examples/example0/src/ui` 每个 fixture，确认幂等。

## 为什么单独养一个跟随 parser 形态的消费者

誊章是同一棵 `DsTree` 的**第二**位消费者。第一位是你的符文师（`DsRune` 实现 + `decipher`）。誊章**不**实现 `DsRune`，它手动遍历这棵树，因为它的目标是**重发语法**，不是把树翻成运行时代码。

这也是为什么誊章是语言改动的金丝雀：parser 多认一种新形态，誊章就得跟着把对应字段读出来；AST 长一个新节点，誊章就要加一个 arm。要往 `xrune-nexus` 加东西时，先看一眼誊章，掂量一下下游连带工作量。

## 源码出处

- CLI + ui! 块抽取：[`crates/xrune_fmt/src/main.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_fmt/src/main.rs)
- 树遍历 + 重发：[`crates/xrune_fmt/src/formatter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_fmt/src/formatter.rs)
