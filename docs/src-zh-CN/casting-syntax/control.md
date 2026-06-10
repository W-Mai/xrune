# 控制流

四种形态：`if`、`walk … with …`、`@niche`、`match`。四者层级与部件节点相同，部件能嵌的地方它们也能嵌。

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

符文师从 `inscribe_if(condition, children)` 看到它。DSL 层没有 `else` 分支；要分两路，写两道条件相反的 `if`，或借 `match` 分作两途。

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

`walk` 与 `with` 是保留关键字：都不能拿来当部件名。

符文师从 `inscribe_iter(iterable, variable, children)` 看到它。

## `@niche` — 具名锚位

```rust
# use xrune::ui;
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
@settings_panel {
    toggle (label: "Dark mode")
    slider (label: "Volume", min: 0, max: 1)
}
# }
# }
# fn main() {}
```

壁龛是 `@` 起头的 ident 加一个 body。语义全归符文师：可以是 portal 插槽、具名区域、路由目标、模板空缺位。parser 只担保形态是 `@name { children }`。

符文师从 `inscribe_niche(name, children)` 看到它。

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

符文师从 `inscribe_match(scrutinee, arms)` 看到它，**自己负责**走每个 arm 的 `get_children()`。

## body 一律必填

四种控制节点都要带花括号 body。没 body 的 `if`、`walk`、`@niche`、`match` 都是 parse 错：它们若没 body，就是空操作，parser 直接拒收。

## 源码出处

- `if` → [`ds_if.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_if.rs)
- `walk … with …` → [`ds_iter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_iter.rs)
- `@niche` → [`ds_niche.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_niche.rs)
- `match` → [`ds_match.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_match.rs)
