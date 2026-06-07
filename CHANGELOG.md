# Changelog

## [1.5.0] - 2026-06-07

DSL gains an `on EventKind(args) { body }` node that hosts can lower into
event handlers. `body` is parsed as a `syn::Block` so consumers receive a
Rust-shaped block they can splice into generated handler fns directly.

### Added

- **`on EventKind { body }` nodes** (`DsOn`) — sit alongside widget /
  niche / match / if / iter as DsTree-level nodes. Body is `syn::Block`;
  args is `Vec<syn::Expr>`; an optional single-segment `qualifier` carries
  the `Path::` prefix.
- **`on Path::EventKind { body }` qualified form** — `qualifier` is
  `Some(ident)` for the prefix; multi-segment paths (`Foo::Bar::Baz`)
  raise a parse error.
- **`on EventKind(p1, p2, ...) { body }` parameter list** — comma-separated
  expressions in the parens, exposed via `DsOn::get_args()`.
- **`DsRune::inscribe_on(qualifier, name, args, body)`** — new trait method
  every Rune impl must provide.
- **`on` joins `walk` / `with` as a custom keyword** — `is_custom_keyword`
  routes `on …` to `DsOn::parse` before the widget peek, so `on Foo` is
  not mistaken for a widget named `on`.

### Breaking

- `DsRune` adds `inscribe_on` (no default impl); existing impls must add it.

## [1.4.0] - 2026-06-07

DSL gains three new node types — niche, match, and headerless widgets — plus optional commas in the root header and unnamed positional attrs. Host runes (mirui-incant style codegen, xrune-fmt style printing) need to handle two new `DsRune` methods and an `Option`-shaped attr name.

### Added

- **`@name { ... }` niche nodes** (`DsNiche`) — anchor-routed children, parsed as `@`-prefix + ident + brace block. Expose `DsNiche::get_name()` + children.
- **`match expr { Pat => { ... } ... }` match nodes** (`DsMatch`, `DsMatchArm`) — Rust-style pattern matching inside the DSL. `DsMatch::get_scrutinee()`, `get_arms()`; each `DsMatchArm` carries its own `syn::Pat` + children sub-tree.
- **Optional empty children block on widget nodes** — `Foo (attrs)` (no `{}`) parses as a Widget with no children. `if` / `walk` / `@niche` / `match` still require their bodies — they'd be no-ops otherwise.
- **Optional commas in the root header** — `:( parent: r, world: w, :)` and the existing comma-less form both parse.
- **Multi-line root header is enforced** — `:(parent: r world: w:)` on a single line errors at parse time when there's more than one context attr; single-attr headers stay relaxed.
- **`DsRune::inscribe_niche` and `inscribe_match`** — new trait methods every Rune impl must provide.

### Changed

- **`DsAttr::name` is now `Option<syn::Ident>`** to support positional args (e.g. `Text("hi")`). The parser tries the `name: value` shape first and falls back to bare `value` with `name = None`. Existing `name: value` callers parse identically; downstream code that read `attr.name` directly needs to match on the Option.
- **`DsTree::parse` no longer demands an outer brace block on Widget and Match nodes** — they consume their own bodies. If / Iter / Niche still go through `syn::braced!`.

### Breaking

- `DsAttr.name: Option<Ident>` (was `Ident`) — every consumer that read `.name` needs a match.
- `DsRune` adds two methods (no default impls); existing impls must add `inscribe_niche` and `inscribe_match`.
- `xrune-nexus` now needs `syn` with the `full` feature (`syn::Pat` is gated behind it).

## [1.2.0] - 2026-05-08

### Added

- Enchants: optional `[expr, expr, ...]` block on widget nodes
- `DsWidget::get_enchants()` — access enchant expressions

### Breaking

- `DsRune::inscribe_widget` signature changed (added `enchants: &[syn::Expr]` parameter)

## [1.1.3] - 2026-05-07

### Added

- `xrune` crate re-exports all `xrune-nexus` public API via `pub use xrune_nexus::*`

## [1.1.2] - 2026-05-07

### Added

- `DsRoot::get_context_attrs()` — expose all context attributes to Rune implementors
- `parent` remains required, other context attrs are optional extensions

## [1.1.1] - 2026-05-07

### Added

- Renamed crates: xwrapup → xrune (xrune-sigil, xrune-nexus, xrune-incant, xrune)
- GitHub repo renamed to W-Mai/xrune

## [1.1.0] - 2026-05-07

### Added

- `DsRune` trait — pluggable codegen interface with `inscribe_*` + `seal` methods
- `decipher` function — walks DsTree AST and invokes DsRune methods
- `DefaultRune` — default backend (println-based debug output)
- Parser unit tests (12 test cases including error reporting)
- Getter methods on AST nodes (`get_children`, `get_condition`, `get_iterable`, `get_variable`)
- xtask: ci/build/test/lint/bump/publish/release
- GitHub CI workflow

### Changed

- Parser fully decoupled from codegen (removed `DsTreeToTokens` from AST nodes)
- `proc_macros::ui!` now uses `DsRune`-based decipher internally
- Crate reorganization: `xrune_derive` / `xrune_parser` / `xrune_macros` / `xrune`
- Lint uses `+stable` to match CI environment

### Removed

- `DsTreeToTokens` trait
- `ui_code_gen` module (replaced by `DsRune` backends)
- `ds_traverse` module (replaced by `ds_rune::decipher`)
