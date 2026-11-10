# Control Flow

Four shapes: `if` (with optional `elif` / `else` branches),
`walk … with …`, `@niche`, `match`. All four sit at the same level as
widget nodes — they can be nested anywhere a widget can be.

Any `if` / `elif` condition, `walk` iterable or `match` scrutinee can be
marked reactive with a leading `$` — see [The `$` Sigil](reactive.md).

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

### `elif` and `else`

An `if` can carry a chain of `elif` branches and one terminal `else`:

```rust
# use xrune::ui;
# fn app(parent: i32, loading: bool, failed: bool) {
# ui! {
#     :(
#         parent: parent
#     :)
if loading {
    spinner ()
} elif failed {
    banner (text: "Could not load")
} else {
    content ()
}
# }
# }
# fn main() {}
```

`elif` is a single keyword. `else if` is rejected: after `else` the
parser expects the `{` of the final branch.

The rune sees the whole chain through
`inscribe_if(condition, reactive, children, else_branch)`.
`else_branch` is `None` when the `if` stands alone. Otherwise it is a
sub-tree: an `elif` arrives as another `If` node carrying its own
`else_branch`, and the terminal `else` arrives as an `Else` node whose
children are the else body. Handing the branch back to
`decipher(branch, self)` covers both cases — an `elif` re-enters
`inscribe_if`, an `else` walks its children.

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

### Keyed rows: `by`

An optional `by <expr>` after the binding gives every row a key:

```rust
# use xrune::ui;
# struct Todo { id: u32, title: String }
# fn app(parent: i32, todos: Vec<Todo>, todo: &Todo) {
# ui! {
#     :(
#         parent: parent
#     :)
walk todos.iter() with todo by todo.id {
    row (text: todo.title)
}
# }
# }
# fn main() {}
```

The key is any expression up to the body brace. A backend that updates
rows in place can use it to match rows by identity instead of by
position; xrune only carries it.

`walk`, `with` and `by` are reserved keywords — none of them can be
used as a widget name.

The rune sees this through
`inscribe_iter(iterable, variable, reactive, key, children)`, where
`key` is `None` without a `by` clause.

## `@niche` — named slot

A niche is an `@`-prefixed identifier. Two sigils keep the two sides of
a slot apart:

- `@@name` **declares** a slot. A template body uses it to say "callers
  may put something here". Its optional body holds the fallback
  children.
- `@name` **fills** a slot at the call site. Its body holds the
  children to put there; without a body it is a bare reference.

```rust
# use xrune::ui;
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
card {
    @@header
    @@body {
        text ("Nothing here yet")
    }
}
# }
# }
# fn main() {}
```

```rust
# use xrune::ui;
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
card {
    @header {
        title (text: "Inbox")
    }
    @body {
        toggle (label: "Dark mode")
        slider (label: "Volume", min: 0, max: 1)
    }
}
# }
# }
# fn main() {}
```

Because the sigils differ lexically, a template that nests another
template can tell its own declarations from the fills it passes on
without inspecting anything at runtime.

What a slot *means* is entirely the rune's: a template hole, a portal
target, a named region, a router outlet. mirui's `mold!` templates are
one real consumer. The parser only guarantees the shape — a single
identifier (`@foo::bar` is rejected), an optional body.

The rune sees `inscribe_niche(name, is_declaration, children)`.

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

The rune sees `inscribe_match(scrutinee, reactive, arms)` and is
responsible for walking each arm's `get_children()` itself.

## Which nodes need a body

`if`, every `elif` and `else` branch, `walk`, and `match` require a
brace body; without one they would be no-ops, so the parser refuses
them. Niches don't: `@name` and `@@name` stand alone as a bare
reference and a slot declared without fallback.

## Source-of-truth

- `if` → [`ds_if.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_if.rs); the `elif` / `else` chain → `parse_else_chain` in [`ds_node/mod.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/mod.rs)
- `walk … with … by …` → [`ds_iter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_iter.rs)
- `@niche` / `@@niche` → [`ds_niche.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_niche.rs)
- `match` → [`ds_match.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_match.rs)

Tested by `parse_if_else`, `parse_if_elif_else_chain`,
`parse_walk_by_key`, `parse_niche_declaration_*` and
`niche_without_body_is_a_bare_reference` in `tests.rs`.
