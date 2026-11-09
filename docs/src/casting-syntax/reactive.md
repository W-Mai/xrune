# The `$` Sigil

`$` does two jobs in a casting, and its position decides which:

- **Before a value** — an attribute value, or the head of an `if`,
  `elif`, `walk` or `match` — it marks that value **reactive**.
- **Standing alone where a node could go**, as `${ … }`, it is a
  **code block**: raw Rust handed to the rune verbatim.

xrune attaches no runtime meaning to either. It strips the `$`, records
what it saw, and the rune decides what reactive means — a signal
subscription, an effect scope, a re-render boundary — or ignores it, as
`DefaultRune` does.

## Reactive values

Two spellings, the same flag:

- `$expr` — `$` followed by the expression: `$signal`, `$count > 0`,
  `$items`.
- `${ … }` — `$` followed by a block, for anything you'd rather fence
  off: `${ rows.iter() }`, `${ pick(width.get()) }`.

```rust
# use xrune::ui;
# #[derive(Debug)]
# struct Row { id: u32, name: String }
# fn pick(w: u32) -> u32 { w }
# fn app(parent: i32, open: bool, rows: Vec<Row>, row: &Row, title: &str, width: u32) {
# ui! {
#     :(
#         parent: parent
#     :)
panel (title: $title, width: ${ pick(width) }) {
    if $open {
        walk ${ rows.iter() } with row by row.id {
            label (text: row.name)
        }
    }
}
# }
# }
# fn main() {}
```

Where the sigil can go, and how the rune finds out:

| Position | Example | The rune sees |
| --- | --- | --- |
| `if` / `elif` condition | `if $open { … }` | `reactive: true` on `inscribe_if` |
| `walk` iterable | `walk $rows with r { … }` | `reactive: true` on `inscribe_iter` |
| `match` scrutinee | `match ${ state.get() } { … }` | `reactive: true` on `inscribe_match` |
| attribute value | `text: $label` | `DsAttr { reactive: true, .. }` |

In a head, everything from `$` up to the body brace is the reactive
expression, so `if $count > 0 { … }` marks the whole condition. In an
attribute, `$` covers the full expression up to the next `,` or `)`.
Without a `$` every one of these parses exactly as before and stays
non-reactive.

## Code blocks: `${ … }` as a node

At statement position — anywhere a widget, `if` or `walk` could
stand — `${ … }` is a node of its own:

```rust
# use xrune::ui;
# fn app(parent: i32, gap: i32) {
# let pad = gap;
# ui! {
#     :(
#         parent: parent
#     :)
column {
    ${ let pad = gap * 2; }
    row (padding: pad)
    row (padding: pad)
}
# }
# }
# fn main() {}
```

The parser keeps the tokens between the braces as they are and never
looks inside. The rune receives them through
`inscribe_code_block(tokens)` and typically splices them into the
generated code, so a `let` in the block is in scope for the siblings
emitted after it. `DefaultRune` only prints the block.

A code block is a leaf: the rune gets its tokens and nothing else, and
it can't carry `on` handlers.

## Telling the two apart

The parser looks at position, never at content:

```rust
# use xrune::ui;
# struct Flag;
# impl Flag { fn get(&self) -> bool { true } }
# fn app(parent: i32, visible: Flag, pad: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
column {
    ${ let pad = 12; }
    if ${ visible.get() } {
        child (padding: pad)
    }
}
# }
# }
# fn main() {}
```

The first `${ … }` stands where a node would, so it is a code block.
The second follows `if`, so it is the reactive condition.

## The scribe

`xrune-fmt` keeps the sigil glued to what it marks (`$signal`,
`${ … }`, never `$ {`). A code block's body is formatted as Rust with
prettyplease and re-indented to the DSL column; a short single-statement
block stays on one line.

## Source-of-truth

- Reactive heads and attribute values → [`reactive.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/reactive.rs)
- Code blocks → [`ds_code_block.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_code_block.rs)

Tested by `parse_reactive_*`, `parse_code_block_*` and
`code_block_and_reactive_dollar_coexist` in `tests.rs`.
