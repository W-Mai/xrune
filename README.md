# xrune

[![CI](https://github.com/W-Mai/xrune/actions/workflows/ci.yml/badge.svg)](https://github.com/W-Mai/xrune/actions)
[![crates.io](https://img.shields.io/crates/v/xrune.svg)](https://crates.io/crates/xrune)
[![docs.rs](https://docs.rs/xrune/badge.svg)](https://docs.rs/xrune)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A declarative UI DSL proc macro framework with pluggable code generation backends.

## Features

- Declarative widget tree syntax with nested children
- Attribute expressions (any valid Rust expression as value)
- Enchants — attach arbitrary data to nodes via `[expr, ...]` syntax
- Context area with arbitrary key-value pairs
- Conditional rendering (`if`)
- Iteration (`walk ... with ...`)
- Pluggable codegen via `DsRune` trait — bring your own backend

## Syntax

```rust
use xrune::ui;

fn app(parent: i32) {
    ui! {
        // Context area: arbitrary key-value pairs
        :(parent: parent  world: &mut world:)

        // Widget with attributes
        container (width: 480, height: 320, color: "dark") {
            header (height: 40, text: "Hello") {}

            row (direction: "horizontal") {
                button (text: "OK", grow: 1.0) {}
                button (text: "Cancel", grow: 1.0) {}
            }

            // Enchants: attach data to a node
            physics_obj (x: 100, y: 200) [
                Velocity { vx: 1, vy: 0 },
                Collider::circle(10),
            ] {}

            // Iteration
            walk items.iter() with item {
                label (text: item.name) {}
            }

            // Conditional
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
use xrune::ds_rune::DsRune;
use xrune::ds_node::ds_attr::DsAttr;
use xrune::ds_node::DsTreeRef;

struct MyRune { /* ... */ }

impl DsRune for MyRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr) { /* ... */ }

    fn inscribe_widget(
        &mut self,
        name: &syn::Ident,
        attrs: &[DsAttr],
        enchants: &[syn::Expr],  // attached data
        children: &[DsTreeRef],
    ) { /* ... */ }

    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]) { /* ... */ }

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[DsTreeRef],
    ) { /* ... */ }

    fn seal(self) -> TokenStream { /* ... */ }
}
```

## Context Area

The `:(key: value  key: value:)` block passes arbitrary context to the Rune implementation. The `parent` key is required; all others are optional and Rune-specific.

```rust
ui! {
    :(
        parent: root_entity
        world: &mut app.world
        theme: Theme::Dark
    :)
    // ...
}
```

## License

MIT
