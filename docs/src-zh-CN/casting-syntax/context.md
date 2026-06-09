# 上下文契约

每段 `ui! { … }` 咒文皆以一道**上下文头**起手：

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

`:(` 与 `:)` 是字面意义上的成对 token。内里写一项或多项属性，形态与 DSL 别处的 `name: value` 一致。每项属性独占一行。

## `parent` 的含义

`parent` 是**唯一必填**的上下文键。缺它，parser 直接拒收：

```text
Root node must have a parent
```

符文师通过 `DsRoot::get_parent()` 取出 parent 表达式。对 `DefaultRune` 来说，它就是 `inscribe_root` 收到的那个值；真实后端通常把它作为余下整段咒文的 spawn-under / mount-on 实体一路串下去。

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

上下文头**永远跨多行**，每项属性独占一行：

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

`DsRoot::parse` 见 [`crates/xrune_nexus/src/ds_node/ds_root.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_root.rs)。上述行为由 `crates/xrune_nexus/src/tests.rs` 里的 `root_header_*` 用例验证。
