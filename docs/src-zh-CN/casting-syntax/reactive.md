# `$` 印记

`$` 在咒文里有两种用途，由它所在的位置决定：

- **写在值前面**：属性值，或 `if`、`elif`、`walk`、`match` 的头部。它把这个值标成**响应式**。
- **单独站在节点的位置上**，写成 `${ … }`：它是一个**代码块**，原样交给符文师的 Rust 代码。

xrune 不给两者附加任何运行时含义。它剥掉 `$`，记下看到了什么；响应式到底意味着什么，订阅信号、建立 effect 作用域、划定重渲染边界，由符文师决定，也可以像 `DefaultRune` 那样不理会。

## 响应式值

两种写法，同一个标记：

- `$expr`：`$` 后面直接跟表达式，如 `$signal`、`$count > 0`、`$items`。
- `${ … }`：`$` 后面跟一个块，适合想单独圈起来的表达式，如 `${ rows.iter() }`、`${ pick(width.get()) }`。

```rust
# use xrune::ui;
# #[derive(Debug)]
# struct Row { id: u32, name: String }
# fn pick(w: u32) -> u32 { w }
# fn app(parent: i32, open: bool, rows: Vec<Row>, row: &Row, title: &str, width: u32) {
# ui! {
#     :(
#         parent: parent
#     :)
panel (title: $title, width: ${ pick(width) }) {
    if $open {
        walk ${ rows.iter() } with row by row.id {
            label (text: row.name)
        }
    }
}
# }
# }
# fn main() {}
```

印记能写在哪里，符文师又从哪里得知：

| 位置 | 例子 | 符文师看到的 |
| --- | --- | --- |
| `if` / `elif` 条件 | `if $open { … }` | `inscribe_if` 的 `reactive: true` |
| `walk` 可迭代 | `walk $rows with r { … }` | `inscribe_iter` 的 `reactive: true` |
| `match` 被匹配值 | `match ${ state.get() } { … }` | `inscribe_match` 的 `reactive: true` |
| 属性值 | `text: $label` | `DsAttr { reactive: true, .. }` |

在头部，从 `$` 到 body 花括号之间的全部内容都是响应式表达式，所以 `if $count > 0 { … }` 标的是整个条件。在属性里，`$` 覆盖到下一个 `,` 或 `)` 为止的完整表达式。不写 `$` 时，这些位置的解析与从前完全一样，也不算响应式。

## 代码块：作为节点的 `${ … }`

在语句位置，也就是部件、`if`、`walk` 能站的地方，`${ … }` 自成一个节点：

```rust
# use xrune::ui;
# fn app(parent: i32, gap: i32) {
# let pad = gap;
# ui! {
#     :(
#         parent: parent
#     :)
column {
    ${ let pad = gap * 2; }
    row (padding: pad)
    row (padding: pad)
}
# }
# }
# fn main() {}
```

parser 原样保留花括号里的 token，从不往里看。符文师经 `inscribe_code_block(tokens)` 收到它们，通常原样拼进生成的代码，所以块里的 `let` 对之后发出的兄弟节点可见。`DefaultRune` 只把它打印出来。

代码块是叶子：符文师只拿到它的 token，它也不能挂 `on` 处理器。

## 两者怎么区分

parser 只看位置，不看内容：

```rust
# use xrune::ui;
# struct Flag;
# impl Flag { fn get(&self) -> bool { true } }
# fn app(parent: i32, visible: Flag, pad: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
column {
    ${ let pad = 12; }
    if ${ visible.get() } {
        child (padding: pad)
    }
}
# }
# }
# fn main() {}
```

第一个 `${ … }` 站在节点的位置上，所以是代码块；第二个跟在 `if` 后面，所以是响应式条件。

## 誊章

`xrune-fmt` 让印记紧贴它所标的东西（`$signal`、`${ … }`，绝不写成 `$ {`）。代码块的 body 交给 prettyplease 按 Rust 格式化，再缩进到 DSL 所在的列；只有一条语句的短块保持在一行。

## 源码出处

- 响应式头部与属性值 → [`reactive.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/reactive.rs)
- 代码块 → [`ds_code_block.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_code_block.rs)

由 `tests.rs` 的 `parse_reactive_*`、`parse_code_block_*` 与 `code_block_and_reactive_dollar_coexist` 验证。
