# Widget Nodes

The most-used form. The parser produces a `DsWidget` node carrying:

- a name (`syn::Ident`),
- attrs (`Vec<DsAttr>`),
- enchants (`Vec<syn::Expr>`),
- on-handlers (`Vec<DsOn>`),
- children (`Vec<DsTreeRef>`).

Backends consume the lot through `inscribe_widget(name, attrs, enchants,
on_handlers, children)`.

## All shapes

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
    /* Full: name + named attrs + body. */
    container (width: 480, height: 320, color: "dark") {
        placeholder {}
    }

    /* No parens: zero attrs. */
    container {}

    /* No body: zero children. */
    header (height: 40, text: "Hello")

    /* Empty body equals no body. */
    header (height: 40, text: "Hello") {}

    /* Positional attrs (DsAttr.name = None). */
    text ("hello world")
    button (Text("Save"), Disabled)
}
# }
# }
# fn main() {}
```

## Named vs positional attrs

`DsAttr` carries `name: Option<syn::Ident>`. The parser tries the
`name: value` shape first and falls back to bare-expression positional
attrs. Mixing both in the same widget is allowed — order is preserved.

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

`name_str()` gives the rune the attr name as `Option<&str>` for matching;
positional attrs come back as `None`.

## Attribute values are real Rust

Attribute values are `syn::Expr`. Anything that parses as a Rust
expression works:

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

The rune decides what to do with each value. There is no compile-time
schema mapping attr names to types.

## Children nest as full trees

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

Each child is itself a `DsTree`, so widgets, `if`, `walk`, `@niche`, and
`match` can all nest inside another widget's body. The combination is
unrestricted — *the rune* enforces what's actually meaningful.

## Source-of-truth

[`crates/xrune_nexus/src/ds_node/ds_widget.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_widget.rs).
Tested by `parse_widget_*` cases in `tests.rs`.
