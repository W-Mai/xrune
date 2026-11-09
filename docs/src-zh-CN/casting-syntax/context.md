# 上下文契约

一段 `ui! { … }` 咒文可以用一道**上下文头**起手：

```rust
# use xrune::ui;
# fn app(parent_expr: i32) {
ui! {
    :(
        parent: parent_expr
    :)

    placeholder {}
}
# }
# fn main() {}
```

`:(` 与 `:)` 是字面意义上的成对 token。内里写一项或多项属性，形态与 DSL 别处的 `name: value` 一致。

## 上下文头可省

从 1.10.0 起，咒文可以直接从内容树开始：

```rust
# use xrune::ui;
# fn app() {
ui! {
    placeholder {}
}
# }
# fn main() {}
```

没有上下文头时，`DsRoot::get_context_attrs()` 为空，`DsRoot::get_parent()` 返回单元表达式 `()`。自己构造 parent 的符文师，比如在本地 spawn 根实体的模板 body，可以整个省掉上下文头。

## `parent` 的含义

`parent` 是 xrune 自身唯一会读的键。符文师通过 `DsRoot::get_parent()` 取出它的表达式。对 `DefaultRune` 来说，它就是 `inscribe_root` 收到的那个值；真实后端通常把它作为余下整段咒文的 spawn-under / mount-on 实体一路串下去。

上下文头里不写 `parent` 也合法：`get_parent()` 回落为 `()`，与没有上下文头时一样。

## 其余键由符文师自行约定

`get_context_attrs()` 返回头里携带的全部属性。xrune 自身只消费 `parent`；其余键留给你解读：

```rust
# use xrune::ui;
# struct App { world: u32 }
# enum Theme { Dark }
# fn run(root_entity: i32, app: &mut App) {
ui! {
    :(
        parent: root_entity,
        world: &mut app.world,
        theme: Theme::Dark
    :)
    placeholder {}
}
# }
# fn main() {}
```

不认 `world` 的符文师就不读它。没有谁在编译期验过 `theme` 是不是真符号：那是符文师自己的事，要么在 `inscribe_root` 里查，要么在封印（seal）一道里查。

## 多行布局

属性多于一项时，上下文头要跨多行，每项属性独占一行：

```rust
# use xrune::ui;
# struct App { world: u32 }
# enum Theme { Dark }
# fn run(root_entity: i32, app: &mut App) {
# ui! {
:(
    parent: root_entity
    world: &mut app.world
    theme: Theme::Dark
:)
# placeholder {}
# }
# }
# fn main() {}
```

把两条以上属性塞在同一行，parser 会抛错：

```text
root header must be multi-line — put each context attr on its own line
```

只有一项属性时可以和括号同处一行（`:(parent: root:)`）；誊章照样把它排成独占一行。

属性之间的逗号可省，下面这一形态同样合法：

```rust
# use xrune::ui;
# fn run(parent: i32, world: &mut u32) {
# ui! {
:(
    parent: parent,
    world: &mut world,
:)
# placeholder {}
# }
# }
# fn main() {}
```

## 源码出处

`DsRoot::parse` 见 [`crates/xrune_nexus/src/ds_node/ds_root.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_root.rs)。上述行为由 `crates/xrune_nexus/src/tests.rs` 里的 `root_header_*`、`header_optional_no_prefix` 与 `root_no_header_produces_unit_parent` 用例验证。
