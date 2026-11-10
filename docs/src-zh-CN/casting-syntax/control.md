# 控制流

四种形态：`if`（可带 `elif` / `else` 分支）、`walk … with …`、`@niche`、`match`。四者层级与部件节点相同，部件能嵌的地方它们也能嵌。

`if` / `elif` 的条件、`walk` 的可迭代、`match` 的被匹配值，前面都可以加一个 `$` 标成响应式，详见 [`$` 印记](reactive.md)。

## `if` — 条件渲染

```rust
# use xrune::ui;
# fn app(parent: i32, show_footer: bool) {
# ui! {
#     :(
#         parent: parent
#     :)
if show_footer {
    footer (height: 20) {}
}
# }
# }
# fn main() {}
```

条件是一个完整的 `syn::Expr`，解析时**不**吞花括号（body 块是单独一对 `{ … }`）。body **必填**：没 body 的 `if` 直接 parse 错。

### `elif` 与 `else`

`if` 后面可以接一串 `elif` 分支，最后再接一个 `else`：

```rust
# use xrune::ui;
# fn app(parent: i32, loading: bool, failed: bool) {
# ui! {
#     :(
#         parent: parent
#     :)
if loading {
    spinner ()
} elif failed {
    banner (text: "Could not load")
} else {
    content ()
}
# }
# }
# fn main() {}
```

`elif` 是一个独立关键字。写 `else if` 会被拒收：`else` 之后 parser 只等最后一个分支的 `{`。

符文师从 `inscribe_if(condition, reactive, children, else_branch)` 看到整条链。单独一个 `if` 时 `else_branch` 为 `None`；否则它是一棵子树：`elif` 是另一个 `If` 节点，带着自己的 `else_branch`；末尾的 `else` 是一个 `Else` 节点，else 的 body 就是它的 children。把分支交回 `decipher(branch, self)` 两种情况都能处理：`elif` 会再进一次 `inscribe_if`，`else` 会走它的 children。

## `walk … with …` — 巡历

```rust
# use xrune::ui;
# #[derive(Debug)]
# struct Item { name: String }
# fn app(parent: i32, items: Vec<Item>, item: &Item) {
# ui! {
#     :(
#         parent: parent
#     :)
walk items.iter() with item {
    label (text: item.name)
}
# }
# }
# fn main() {}
```

读作：巡历 `items.iter()`；每个值绑到子节点里的 `item`。可迭代是 `syn::Expr`，绑名是 `syn::Ident`，body 必填。

### 带键的行：`by`

绑名之后可以接 `by <expr>`，给每一行一个键：

```rust
# use xrune::ui;
# struct Todo { id: u32, title: String }
# fn app(parent: i32, todos: Vec<Todo>, todo: &Todo) {
# ui! {
#     :(
#         parent: parent
#     :)
walk todos.iter() with todo by todo.id {
    row (text: todo.title)
}
# }
# }
# fn main() {}
```

键是 body 花括号之前的任意表达式。原地更新行的后端可以靠它按身份对齐行，而不是按位置；xrune 只负责把它带到。

`walk`、`with`、`by` 都是保留关键字，都不能拿来当部件名。

符文师从 `inscribe_iter(iterable, variable, reactive, key, children)` 看到它；没写 `by` 时 `key` 为 `None`。

## `@niche` — 具名插槽

壁龛是 `@` 起头的 ident。两种印记把插槽的两端分开：

- `@@name` **声明**插槽。模板 body 用它表示「调用方可以往这里放东西」；它可选的 body 是兜底子节点。
- `@name` 在调用处**填充**插槽。它的 body 是要放进去的子节点；不带 body 时就是一个裸引用。

```rust
# use xrune::ui;
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
card {
    @@header
    @@body {
        text ("Nothing here yet")
    }
}
# }
# }
# fn main() {}
```

```rust
# use xrune::ui;
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
card {
    @header {
        title (text: "Inbox")
    }
    @body {
        toggle (label: "Dark mode")
        slider (label: "Volume", min: 0, max: 1)
    }
}
# }
# }
# fn main() {}
```

两种印记在词法上就不同，所以一个模板嵌套另一个模板时，不必在运行时检查任何东西，就能分清哪些是自己的声明、哪些是往下传的填充。

插槽**意味着什么**全归符文师：模板空位、portal 目标、具名区域、路由出口。mirui 的 `mold!` 模板就是一个真实用户。parser 只担保形态：单个 ident（`@foo::bar` 被拒），body 可选。

符文师从 `inscribe_niche(name, is_declaration, children)` 看到它。

## `match` — 模式匹配

```rust
# use xrune::ui;
# #[derive(Debug)]
# enum State { Loading, Ready(Vec<i32>) }
# fn app(parent: i32, state: State, data: &Vec<i32>) {
# ui! {
#     :(
#         parent: parent
#     :)
match state {
    State::Loading => {
        spinner {}
    }
    State::Ready(data) => {
        list (items: data.iter()) {}
    }
    _ => {
        empty {}
    }
}
# }
# }
# fn main() {}
```

每个 arm 携带自己的 `syn::Pat` 与一棵子节点树。模式支持 `Pat::parse_multi_with_leading_vert` 接受的全部：绑定、通配、`|` 备选、struct 解构。每个 arm 末尾的逗号可省。

符文师从 `inscribe_match(scrutinee, reactive, arms)` 看到它，**自己负责**走每个 arm 的 `get_children()`。

## 哪些节点必须带 body

`if`、每个 `elif` 与 `else` 分支、`walk`、`match` 都要带花括号 body：没 body 就是空操作，parser 直接拒收。壁龛不必：`@name` 与 `@@name` 可以单独出现，分别是裸引用和不带兜底的插槽声明。

## 源码出处

- `if` → [`ds_if.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_if.rs)；`elif` / `else` 链 → [`ds_node/mod.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/mod.rs) 的 `parse_else_chain`
- `walk … with … by …` → [`ds_iter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_iter.rs)
- `@niche` / `@@niche` → [`ds_niche.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_niche.rs)
- `match` → [`ds_match.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_match.rs)

由 `tests.rs` 的 `parse_if_else`、`parse_if_elif_else_chain`、`parse_walk_by_key`、`parse_niche_declaration_*` 与 `niche_without_body_is_a_bare_reference` 验证。
