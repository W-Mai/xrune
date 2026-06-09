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
- **Attribute values, `walk` iterables, `if`/`match` scrutinees, and
  `on` bodies** all run through `prettyplease` so embedded Rust
  expressions render in canonical form.
- **`on EventKind` clauses** stack between attrs and body; their bodies
  are indented one step beyond the surrounding widget.
- **Enchants** sit between attrs and body in `[ … ]`, comma-separated.

The scribe round-trips the same forms `xrune-nexus::tests` exercises —
positional attrs, named attrs, headerless widgets, niches, match arms,
the three `on` shapes (Form B, Form C, callback). The `xrune-fmt`
test suite walks every fixture in `examples/example0/src/ui` to
confirm idempotence.

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
