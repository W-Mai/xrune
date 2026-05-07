# xwrapup_rs_macro

A declarative UI DSL proc macro framework with pluggable code generation backends.

## Features

- Declarative widget tree syntax with nested children
- Attribute expressions (any valid Rust expression as value)
- Conditional rendering (`if`)
- Iteration (`walk ... with ...`)
- Pluggable codegen via `DsRune` trait — bring your own backend

## Syntax

```rust
use xwrapup_rs_macro::ui;

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
    B["proc_macros"]:6
    C["ds_rune"]:6
    D["XwrapupRune"]:2 E["MiruiRune"]:2 F["CustomRune"]:2
    G["ds_parser"]:6
    H["DsRoot"]:2 I["DsWidget"]:2 J["DsIf / DsIter"]:2

    style A fill:#1c3a5e,stroke:#58a6ff,color:#79c0ff
    style B fill:#1c3a5e,stroke:#58a6ff,color:#79c0ff
    style C fill:#1f3d2b,stroke:#3fb950,color:#3fb950
    style D fill:#3d2b1f,stroke:#d29922,color:#e3b341
    style E fill:#3d2b1f,stroke:#d29922,color:#e3b341
    style F fill:#3d2b1f,stroke:#d29922,color:#e3b341
    style G fill:#2d1f4e,stroke:#d2a8ff,color:#d2a8ff
    style H fill:#2d1f4e,stroke:#d2a8ff,color:#d2a8ff
    style I fill:#2d1f4e,stroke:#d2a8ff,color:#d2a8ff
    style J fill:#2d1f4e,stroke:#d2a8ff,color:#d2a8ff
```

## Custom Backend

Implement `DsRune` to generate your own code:

```rust
use ds_parser::ds_rune::DsRune;

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
