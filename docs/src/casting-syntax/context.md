# Context Area

Every `ui! { … }` block opens with a context header:

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

`:(` and `:)` are literal token pairs. Inside live one or more attributes
in the same `name: value` shape used elsewhere in the DSL. Each attribute
sits on its own line.

## What `parent` means

`parent` is the **only required** context key. The parser rejects a header
without it:

```text
Root node must have a parent
```

The rune retrieves the parent expression via `DsRoot::get_parent()`. For
`DefaultRune` this is the value passed to `inscribe_root`; a real backend
typically threads it as the spawn-under / mount-on entity for the rest of
the cast.

## Other keys are rune-defined

`get_context_attrs()` returns every attribute the header carried. xrune
itself only consumes `parent`; everything else is yours to interpret:

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

A rune that doesn't understand `world` simply doesn't read it. There is
no compile-time validation that `theme` is a real symbol — that's the
rune's job, in `inscribe_root` or in a sealing pass.

## Multi-line layout

The header always spans multiple lines, with each attribute on its own line:

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

Putting two or more attributes on the same line raises a parse error:

```text
root header must be multi-line — put each context attr on its own line
```

Commas between attributes are optional — the shape below is equally valid:

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

## Source-of-truth

`DsRoot::parse` in
[`crates/xrune_nexus/src/ds_node/ds_root.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_root.rs).
The behaviour above is exercised by `root_header_*` tests in
`crates/xrune_nexus/src/tests.rs`.
