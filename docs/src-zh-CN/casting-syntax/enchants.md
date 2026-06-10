# 附魔

**附魔**是部件后附的一段方括号表达式串，坐落于属性与 body 之间：

```rust
# use xrune::ui;
# struct Velocity { vx: i32, vy: i32 }
# struct Collider;
# impl Collider { fn circle(_: i32) -> Self { Self } }
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
physic_obj (x: 100, y: 200) [
    Velocity { vx: 1, vy: 0 },
    Collider::circle(10),
] {}
# }
# }
# fn main() {}
```

附魔的值是任意 `syn::Expr`：通常是组件字面量、struct 构造、标记 tag。符文师通过 `DsWidget::get_enchants()` 取出，再决定怎么用（作为 ECS 组件 spawn、作为中间件挂上去、记到实体上）。

## 位置

顺序固定：`name (attrs) [enchants] { children }`。`name` 之后的四部分各自可省：

```rust
# use xrune::ui;
# #[derive(Debug)] struct TagMarker;
# #[derive(Debug)] struct Tag1Marker;
# #[derive(Debug)] struct Tag2Marker;
# fn app(parent: i32) {
# let Tag = TagMarker;
# let Tag1 = Tag1Marker;
# let Tag2 = Tag2Marker;
# ui! {
#     :(
#         parent: parent
#     :)
root_widget {
    foo                                     /* 无括号、无附魔、无 body */
    foo (a: 1)                              /* 仅属性 */
    foo (a: 1) [Tag] {}                     /* 属性 + 附魔 + 空 body */
    foo [Tag1, Tag2] {}                     /* 无属性，仅附魔 */
    foo () [Tag] {}                         /* 等价：空属性表 + 附魔 */
}
# }
# }
# fn main() {}
```

无论哪一槽省略与否，符文师收到的都是一个 `Vec`：省了就是空 vec。

## 用法形态

附魔故意不带类型，这正是它的用处：让用户把**任何东西**挂到节点上，而不必在语法里为它专门预留位置。一个典型的 ECS 风符文师会把每个附魔表达式转成一个组件，插到 spawn 出来的实体上：

```rust
# use xrune::ui;
# struct Position { x: f32, y: f32 }
# struct Health(i32);
# const PlayerControlled: () = ();
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
sprite (texture: "hero.png") [
    Position { x: 0.0, y: 0.0 },
    Health(100),
    PlayerControlled,
] {}
# }
# }
# fn main() {}
```

调试符文师 `DefaultRune` 直接 print 出来。`xrune-fmt`（誊章）则原样回吐。

## 源码出处

解析分支在 `DsWidget::parse`（[`ds_widget.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_widget.rs)）。`inscribe_widget` 带一道 `enchants: &[syn::Expr]` 形参，由符文师消费。
