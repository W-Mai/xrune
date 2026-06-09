# Control Flow

Four shapes: `if`, `walk … with …`, `@niche`, `match`. All four sit at the
same level as widget nodes — they can be nested anywhere a widget can be.

## `if` — conditional render

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

The condition is a full `syn::Expr` parsed without consuming braces (so
the body block is a separate `{ … }`). The body is **required** — a
bodiless `if` is a parse error.

The rune sees this through `inscribe_if(condition, children)`. There is
no `else` arm at the DSL level; render two `if` blocks with negated
conditions, or use `match` for binary cases.

## `walk … with …` — iteration

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

Reads as: iterate `items.iter()`; for each value, bind it to `item` in
the children. The iterable is a `syn::Expr`, the binding is a `syn::Ident`,
the body is required.

`walk` and `with` are reserved keywords — neither can be used as a widget
name.

The rune sees this through `inscribe_iter(iterable, variable, children)`.

## `@niche` — named anchor

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

A niche is a `@`-prefixed identifier carrying a body. The semantics are
entirely the rune's: a portal slot, a named region, a router target, a
template hole. The parser only guarantees the shape `@name { children }`.

The rune sees `inscribe_niche(name, children)`.

## `match` — pattern matching

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

Each arm carries its own `syn::Pat` and a sub-tree of children. Patterns
support all the things `Pat::parse_multi_with_leading_vert` accepts —
bindings, wildcards, `|` alternatives, struct destructuring. Optional
trailing comma per arm.

The rune sees `inscribe_match(scrutinee, arms)` and is responsible for
walking each arm's `get_children()` itself.

## Bodies are mandatory

All four control nodes require a brace body. Bodiless `if`, `walk`,
`@niche`, and `match` are parse errors — they would be no-ops.

## Source-of-truth

- `if` → [`ds_if.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_if.rs)
- `walk … with …` → [`ds_iter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_iter.rs)
- `@niche` → [`ds_niche.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_niche.rs)
- `match` → [`ds_match.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_match.rs)
