# 第一次咏唱

从 `cargo new` 到看见 `decipher` 真的跑出来：五分钟。

例子**不**渲染 UI：这本书没有部件运行时。它产出的是过程宏展开后的
内置 `DefaultRune` 输出：一串 `println!`，把 parser 喂给符文师的每个
节点都打一遍。本章要学的就这些。真正干活的后端要到
[绑定符文](binding.md) 一章才登场。

## 起步

```bash
cargo new hello-xrune
cd hello-xrune
```

`Cargo.toml`：

```toml
[package]
name = "hello-xrune"
version = "0.1.0"
edition = "2024"

[dependencies]
xrune = "1.5"
```

## 最小一咒

`src/main.rs`：

```rust
# use xrune::ui;
#
# fn app(parent: i32) {
ui! {
    :(
        parent: parent
    :)

    container (width: 100, height: 100) {}
}
# }
#
# fn main() {
#     app(0);
# }
```

> ⚠ ▶ 按钮把代码发到 play.rust-lang.org，但**那里没有 `xrune` 这个 crate**，
> 在线运行会失败。点眼睛（👁）图标切换显示完整代码，复制到本地 `cargo new`
> 项目里、`Cargo.toml` 加 `xrune = "1.5"`，再 `cargo run` 才能跑通。

本地 `cargo run` 后，会看到 `DefaultRune` 的 trace：

```text
inscribe_root: 0
inscribe_widget: container, attrs: [width: 100, height: 100], children: []
```

（具体字符串依版本略有差异，结构不会变。）

到此为止。parser 接受了 `ui!` 块，`decipher` 遍历器走遍了每个节点，内置
rune 把它看到的东西打了出来。除此之外什么都没发生。没有部件，也没有窗口
弹出。

## 稍大一点的咒

仓库里 [`examples/example0`](https://github.com/W-Mai/xrune/tree/main/examples/example0)
是一个把第一阶段语法形态都用一遍的范例：

```rust
# use xrune::ui;
#
# static A: i32 = 20;
#
# fn app(parent: i32) {
ui! {
    :(
        parent: parent
    :)

    div (
        width: 100,
        height: 100 + A,
        color: "red"
    ) {
        text (content: "hello world") {
            picker (values: vec!["1", "2", "3"]) {

            }
        }

        walk range(20) with i {
            button (text: 6) {}
        }

        if a == "1" {
            input {

            }
        }
    }
}
# }
#
# fn main() {}
```

从这一段读出来的事：

- `:( ... :)` 块（`parent: parent` 单独占一行）是**上下文区**。`parent`
  是唯一必填键；符文师通过 `DsRoot::get_parent()` 取到它。
- `width: 100, height: 100 + A, color: "red"`：属性值是任意
  `syn::Expr`。`100 + A` 是一个 Rust 表达式，不是字符串。
- `text (content: "hello world") { picker (…) {} }`：子节点嵌套。
  parser 建一棵 `DsTree` 单元格树；rune 决定嵌套**意味着什么**。
- `walk range(20) with i { … }`：迭代。**`range(20)` 不是标准库
  函数。**这个例子只能跑到过程宏展开那一步；展开后引用了 plain Rust
  里不存在的符号。学语法这没问题，要跑到端到端的真实例子需要一个
  真实的 rune（第二卷）。
- `if a == "1" { … }`：条件。同理，`a` 在这里是个自由变量。

## 一段话讲清刚才发生了什么

`ui! { … }` 是 [`xrune-incant`](https://crates.io/crates/xrune-incant)
crate 出的一个过程宏。展开时它把 token 流解析成 `DsRoot`（AST 根），
构造内置 `DefaultRune`，用上下文里的 `parent` 表达式调用 `inscribe_root`，
然后对子树跑 `decipher`。每个被访问的节点，widget / `if` / `walk` /
`@niche` / `match`，触发 rune 的某一个 `inscribe_*` 方法。最后 rune
被 `seal`，它累积的 `TokenStream` 就成了宏的输出。对 `DefaultRune` 而言
这个输出是一串 `println!`，此例之所以不挂 UI 运行时也能
「跑」，正是此故。

## 接下来

- [咏唱语法](casting-syntax/index.md)：完整的 DSL 形态目录。
- [绑定符文](binding.md)：用一个真正发代码的 rune 替换 `DefaultRune`。
