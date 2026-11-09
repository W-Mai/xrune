# Context Area

A `ui! { … }` block may open with a context header:

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
in the same `name: value` shape used elsewhere in the DSL.

## The header is optional

Since 1.10.0 a cast can start straight at its content tree:

```rust
# use xrune::ui;
# fn app() {
ui! {
    placeholder {}
}
# }
# fn main() {}
```

Without a header, `DsRoot::get_context_attrs()` is empty and
`DsRoot::get_parent()` returns the unit expression `()`. Runes that
build their own parent, such as a template body that spawns its root
entity locally, skip the header entirely.

## What `parent` means

`parent` is the one key xrune itself reads. The rune retrieves its
expression via `DsRoot::get_parent()`. For `DefaultRune` this is the
value passed to `inscribe_root`; a real backend typically threads it as
the spawn-under / mount-on entity for the rest of the cast.

A header that doesn't name `parent` is valid too: `get_parent()` falls
back to `()`, just as it does without a header.

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

With more than one attribute, the header spans multiple lines, one
attribute per line:

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

A single attribute may share one line with the brackets
(`:(parent: root:)`); the scribe still prints it on its own line.

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
The behaviour above is exercised by the `root_header_*`,
`header_optional_no_prefix` and `root_no_header_produces_unit_parent`
tests in `crates/xrune_nexus/src/tests.rs`.
