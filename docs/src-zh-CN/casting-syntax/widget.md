# 部件节点

最常用的形态。parser 产出 `DsWidget` 节点，携带：

- 一个名字（`syn::Ident`），
- 属性表（`Vec<DsAttr>`），
- 附魔（`Vec<syn::Expr>`），
- 事件咒符（`Vec<DsOn>`），
- 子节点（`Vec<DsTreeRef>`）。

后端通过 `inscribe_widget(name, attrs, enchants, on_handlers, children)` 一次取走全部。

## 全部形态

```rust
# use xrune::ui;
# fn Text(s: &'static str) -> &'static str { s }
# #[derive(Debug)]
# struct DisabledMarker;
# fn app(parent: i32) {
# let Disabled = DisabledMarker;
# ui! {
#     :(
#         parent: parent
#     :)
root_widget {
    /* 全形：名 + 具名属性 + body。 */
    container (width: 480, height: 320, color: "dark") {
        placeholder {}
    }

    /* 不带括号：零属性。 */
    container {}

    /* 不带 body：零子节点。 */
    header (height: 40, text: "Hello")

    /* 空 body 等同于不带 body。 */
    header (height: 40, text: "Hello") {}

    /* 位置属性（DsAttr.name = None）。 */
    text ("hello world")
    button (Text("Save"), Disabled)
}
# }
# }
# fn main() {}
```

## 具名属性 vs 位置属性

`DsAttr` 带 `name: Option<syn::Ident>`。parser 先尝试 `name: value` 形态，匹配不上则退化为裸表达式的位置属性。同一个部件里两种形态可混用，顺序保留：

```rust
# use xrune::ui;
# fn Text(s: &'static str) -> &'static str { s }
# #[derive(Debug)]
# struct DisabledMarker;
# fn app(parent: i32) {
# let Disabled = DisabledMarker;
# ui! {
#     :(
#         parent: parent
#     :)
button (Text("Save"), priority: 1, Disabled)
# }
# }
# fn main() {}
```

`name_str()` 把属性名作为 `Option<&str>` 交给符文师匹配；位置属性返回 `None`。

## 属性值是真实的 Rust

属性值是 `syn::Expr`。凡能解析为 Rust 表达式的都行：

```rust
# use xrune::ui;
# use std::fmt;
# struct State;
# impl State { fn set(&self, _: u32) {} }
# struct DebugClosure<F>(F);
# impl<F> fmt::Debug for DebugClosure<F> {
#     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.write_str("<closure>") }
# }
# fn app(parent: i32, items: Vec<u32>, state: State) {
# let on_change = DebugClosure(move |v| state.set(v));
# ui! {
#     :(
#         parent: parent
#     :)
slider (
    min: 0,
    max: items.len() as u32,
    step: 1.0 / 60.0,
    on_change: on_change
)
# }
# }
# fn main() {}
```

每个值怎么用，由符文师决定。**没有**任何编译期约束规定属性名必须对应某个类型。

## 子节点本身就是完整的树

```rust
# use xrune::ui;
# #[derive(Debug)]
# struct Item { name: String }
# fn app(parent: i32, items: Vec<Item>, item: &Item) {
# ui! {
#     :(
#         parent: parent
#     :)
window (title: "Cast") {
    column (gap: 8) {
        header (text: "xrune")
        list (items: items.iter()) {
            row (text: item.name)
        }
    }
}
# }
# }
# fn main() {}
```

每个子节点本身就是一棵 `DsTree`，所以部件、`if`、`walk`、`@niche`、`match` 都能嵌进另一个部件的 body 里。组合**没有任何语法限制**：哪些组合**确有意义**，由符文师把关。

## 源码出处

[`crates/xrune_nexus/src/ds_node/ds_widget.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_widget.rs)。由 `tests.rs` 的 `parse_widget_*` 用例验证。
