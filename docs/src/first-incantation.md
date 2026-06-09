# The First Incantation

A five-minute walk from `cargo new` to seeing `decipher` actually run.

The example does **not** render a UI — there is no widget runtime in this
book. What it produces is the proc-macro expansion of the bundled
`DefaultRune`: a stream of `println!` calls that traces every node the
parser hands to the rune. That is the entire learning surface for this
chapter. Real backends come later in [Binding the Rune](binding.md).

## Set up

```bash
cargo new hello-xrune
cd hello-xrune
```

`Cargo.toml`:

```toml
[package]
name = "hello-xrune"
version = "0.1.0"
edition = "2024"

[dependencies]
xrune = "1.5"
```

## The minimum cast

`src/main.rs`:

```rust
# use xrune::ui;
#
# fn app(parent: i32) {
ui! {
    :(
        parent: parent
    :)

    container (width: 100, height: 100) {}
}
# }
#
# fn main() {
#     app(0);
# }
```

> ⚠ The ▶ button posts to play.rust-lang.org, which **doesn't carry the
> `xrune` crate**, so the run will fail there. Use the eye ( 👁 ) toggle
> to reveal the full program, copy it into a local `cargo new` project
> with `xrune = "1.5"` in `Cargo.toml`, and `cargo run`.

Run `cargo run` locally. You will see the `DefaultRune` trace:

```text
inscribe_root: 0
inscribe_widget: container, attrs: [width: 100, height: 100], children: []
```

(Exact strings depend on the version; the structure does not.)

That's it — the parser accepted the `ui!` block, the `decipher` walker
visited every node, and the bundled rune printed what it saw. Nothing else
happened. No widgets exist; no window opened.

## A slightly larger cast

The canonical fixture in [`examples/example0`](https://github.com/W-Mai/xrune/tree/main/examples/example0)
exercises every Phase-1 syntax form:

```rust
# use xrune::ui;
#
# static A: i32 = 20;
#
# fn app(parent: i32) {
ui! {
    :(
        parent: parent
    :)

    div (
        width: 100,
        height: 100 + A,
        color: "red"
    ) {
        text (content: "hello world") {
            picker (values: vec!["1", "2", "3"]) {

            }
        }

        walk range(20) with i {
            button (text: 6) {}
        }

        if a == "1" {
            input {

            }
        }
    }
}
# }
#
# fn main() {}
```

Things to read out of this:

- The `:( ... :)` block (with `parent: parent` on its own line) is the
  **context area**. `parent` is the only required key; the rune sees it
  via `DsRoot::get_parent()`.
- `width: 100, height: 100 + A, color: "red"` — attribute values are
  arbitrary `syn::Expr`. `100 + A` is a Rust expression, not a string.
- `text (content: "hello world") { picker (…) {} }` — children nest. The
  parser builds a tree of `DsTree` cells; the rune decides what nesting
  *means*.
- `walk range(20) with i { … }` — iteration. **`range(20)` is not a
  standard-library function.** This example compiles only as far as the
  proc-macro expansion; the expanded code references symbols that don't
  exist in plain Rust. That's fine for learning the syntax; for a runnable
  end-to-end example you need a real rune (Part II).
- `if a == "1" { … }` — conditional. Likewise, `a` is a free identifier
  here.

## What just happened, in one paragraph

`ui! { … }` is a proc macro shipped by [`xrune-incant`](https://crates.io/crates/xrune-incant).
At expansion time it parses the token stream into a `DsRoot` (the AST root),
constructs the bundled `DefaultRune`, calls `inscribe_root` with the
context's `parent` expression, and then runs `decipher` over the children.
Each visited node — widget, `if`, `walk`, `@niche`, `match` — triggers one
`inscribe_*` method on the rune. At the end the rune is `seal`ed and its
accumulated `TokenStream` becomes the macro's output. For `DefaultRune`
that output is a sequence of `println!` calls, which is why this example
"runs" without a UI runtime.

## Next

- [The Casting Syntax](casting-syntax/index.md) — every DSL form, exhaustively.
- [Binding the Rune](binding.md) — replace `DefaultRune` with one that
  actually emits real code.
