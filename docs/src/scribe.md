# The Scribe

`xrune-fmt` is the formatter for `ui! { … }` blocks. It's a CLI binary,
not a library — install it once and point it at any `.rs` file that
contains casting macros.

```bash
cargo install xrune-fmt

xrune-fmt src/app.rs            # rewrite in place
xrune-fmt src/app.rs --check    # exit 1 if not formatted, leave file alone
```

## What it does

For every `ui! { … }` block it finds, the scribe:

1. Locates the macro by regex (`ui!\s*\{`) and the matching `}` via
   brace-depth counting.
2. Hands the inside to the **real parser** — `xrune-nexus`'s
   `DsRoot::parse` — and gets back a `DsTree`.
3. Walks the tree and re-emits it with consistent indentation, line
   breaks, and spacing.
4. If the parser rejects the input, the original block is left
   untouched. The scribe never silently rewrites a block it cannot
   understand.

It only touches the body of `ui! { … }`. Code around the macro is
preserved byte-for-byte.

## Formatting rules

- **Context header** always multi-line, one attr per line, indented one
  step beyond the `ui!` brace.
- **Widget attrs** ride on a single line if they fit within
  `MAX_LINE_WIDTH = 100`; otherwise each attr goes on its own line. If
  the original was multi-line, the scribe keeps it multi-line even when
  it would now fit on one — author intent wins over column count.
- **Attribute values, `walk` iterables, `if`/`match` scrutinees, and `on` bodies** use Rust formatting with nested indentation.
- **`on EventKind` clauses** follow the widget's children block in declaration order. When there are no children, they follow the attrs or enchants. Handler bodies retain their own braces, including empty bodies; callback-form handlers remain bodyless.
- **Enchants** sit between attrs and body in `[ … ]`, comma-separated.

```rust
# use xrune::ui;
# fn handler() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
Panel () {
    Text ("child")
} on Tap(handler)
# }
# }
# fn main() {}
```

The formatter places the children block before event clauses. Braces immediately after `on Tap(handler)` are the handler's event body, not widget children.

Formatting preserves widget attributes, enchants, event handlers, and child relationships. Formatting an already formatted block produces identical output.

## Why a separate parser-shaped consumer

The scribe is the **second** consumer of the same `DsTree`. The first
is your rune (`DsRune` impls + `decipher`). The scribe doesn't
implement `DsRune` — it walks the tree manually, because its goal is to
**re-emit syntax** rather than transform a tree into runtime code.

This is also why the scribe is the canary for the language: any time
the parser learns a new shape, the scribe needs the same field
exposed; any time the AST grows a new node, the scribe needs a new arm.
If you're considering adding to `xrune-nexus`, glance at the scribe to
see how much downstream work the addition implies.

## Source-of-truth

- CLI + ui!-block extraction: [`crates/xrune_fmt/src/main.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_fmt/src/main.rs)
- Tree walking + emission: [`crates/xrune_fmt/src/formatter.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_fmt/src/formatter.rs)
