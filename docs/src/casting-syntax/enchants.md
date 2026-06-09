# Enchants

An **enchant** is a bracketed expression list attached to a widget,
sitting between the attrs and the body:

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

Enchants are arbitrary `syn::Expr` values — typically component literals,
struct constructors, or marker tags. The rune retrieves them via
`DsWidget::get_enchants()` and decides what to do (spawn them as ECS
components, attach them as middleware, store them on the entity).

## Position

The order is fixed: `name (attrs) [enchants] { children }`. All four
parts after `name` are independently optional:

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
    foo                                     /* no parens, no enchants, no body */
    foo (a: 1)                              /* attrs only */
    foo (a: 1) [Tag] {}                     /* attrs + enchants + empty body */
    foo [Tag1, Tag2] {}                     /* enchants without attrs */
    foo () [Tag] {}                         /* equivalent: empty attrs + enchants */
}
# }
# }
# fn main() {}
```

The rune always receives a `Vec` for each slot — empty vectors when the
shape was omitted.

## Use-case shape

Enchants are intentionally untyped — they're how a rune lets users
attach *anything* to a node without reserving a syntactic slot for it.
A typical ECS-shaped rune turns each enchant expression into a component
inserted onto the spawned entity:

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

A debug rune simply prints them. xrune-fmt re-emits them verbatim.

## Source-of-truth

The parsing branch lives in `DsWidget::parse` ([`ds_widget.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_widget.rs)).
Introduced in 1.2.0; `inscribe_widget` gained the `enchants: &[syn::Expr]`
slice in the same release.
