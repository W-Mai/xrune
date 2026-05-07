# Changelog

## [Unreleased]

### Added

- `DsRune` trait — pluggable codegen interface with `inscribe_*` + `seal` methods
- `decipher` function — walks DsTree AST and invokes DsRune methods
- `XwrapupRune` — default backend (println-based debug output)
- Parser unit tests (12 test cases including error reporting)
- Getter methods on AST nodes (`get_children`, `get_condition`, `get_iterable`, `get_variable`)
- xtask: ci/build/test/lint/bump/publish/release
- GitHub CI workflow

### Changed

- Parser fully decoupled from codegen (removed `DsTreeToTokens` from AST nodes)
- `proc_macros::ui!` now uses `DsRune`-based decipher internally
- Crate reorganization: `xwrapup_derive` / `xwrapup_parser` / `xwrapup_macros` / `xwrapup`
- Lint uses `+stable` to match CI environment

### Removed

- `DsTreeToTokens` trait
- `ui_code_gen` module (replaced by `DsRune` backends)
- `ds_traverse` module (replaced by `ds_rune::decipher`)
