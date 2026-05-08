# Changelog

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
