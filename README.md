# xrune

[![CI](https://github.com/W-Mai/xrune/actions/workflows/ci.yml/badge.svg)](https://github.com/W-Mai/xrune/actions)
[![crates.io](https://img.shields.io/crates/v/xrune.svg)](https://crates.io/crates/xrune)
[![docs.rs](https://docs.rs/xrune/badge.svg)](https://docs.rs/xrune)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A declarative UI DSL proc macro framework with pluggable code generation backends.

## Features

- Declarative widget tree syntax with nested children
- Attribute expressions (any valid Rust expression as value)
- Conditional rendering (`if`)
- Iteration (`walk ... with ...`)
- Pluggable codegen via `DsRune` trait — bring your own backend

## Syntax

```rust
use xrune::ui;

fn app(parent: i32) {
    ui! {
        :(parent: parent:)

        container (width: 480, height: 320, color: "dark") {
            header (height: 40, text: "Hello") {}

            row (direction: "horizontal") {
                button (text: "OK", grow: 1.0) {}
                button (text: "Cancel", grow: 1.0) {}
            }

            walk items with item {
                label (text: item.name) {}
            }

            if show_footer {
                footer (height: 20) {}
            }
        }
    }
}
```

## Architecture

```mermaid
block-beta
    columns 6

    A["ui! { ... }"]:6
    B["xrune-incant"]:6
    C["xrune-nexus"]:6
    D["DefaultRune"]:2 E["MiruiRune"]:2 F["CustomRune"]:2
    G["xrune-sigil"]:6
    H["DsRoot"]:2 I["DsWidget"]:2 J["DsIf / DsIter"]:2

    style A fill:#dbeafe,stroke:#2563eb,color:#1e3a5f
    style B fill:#dbeafe,stroke:#2563eb,color:#1e3a5f
    style C fill:#dcfce7,stroke:#16a34a,color:#14532d
    style D fill:#fef3c7,stroke:#d97706,color:#78350f
    style E fill:#fef3c7,stroke:#d97706,color:#78350f
    style F fill:#fef3c7,stroke:#d97706,color:#78350f
    style G fill:#ede9fe,stroke:#7c3aed,color:#3b0764
    style H fill:#ede9fe,stroke:#7c3aed,color:#3b0764
    style I fill:#ede9fe,stroke:#7c3aed,color:#3b0764
    style J fill:#ede9fe,stroke:#7c3aed,color:#3b0764
```

## Crates

| Crate | Description |
|-------|-------------|
| [`xrune`](https://crates.io/crates/xrune) | Main entry — re-exports everything |
| [`xrune-nexus`](https://crates.io/crates/xrune-nexus) | Core: AST + DsRune trait + decipher |
| [`xrune-incant`](https://crates.io/crates/xrune-incant) | Proc macro: `ui!` invocation |
| [`xrune-sigil`](https://crates.io/crates/xrune-sigil) | Derive macro: `DsRef` |

## Custom Backend

Implement `DsRune` to generate your own code:

```rust
use xrune::DsRune;

struct MyRune { /* ... */ }

impl DsRune for MyRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr) { /* ... */ }
    fn inscribe_widget(&mut self, name: &syn::Ident, attrs: &[DsAttr], children: &[DsTreeRef]) { /* ... */ }
    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]) { /* ... */ }
    fn inscribe_iter(&mut self, iterable: &syn::Expr, variable: &syn::Ident, children: &[DsTreeRef]) { /* ... */ }
    fn seal(self) -> TokenStream { /* ... */ }
}
```

## License

MIT
