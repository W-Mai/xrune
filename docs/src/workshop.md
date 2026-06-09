# The Workshop

How the workspace is laid out, and what `cargo xtask` gives a maintainer.
This chapter is for contributors. End users only need [The First
Incantation](first-incantation.md) and [Binding the Rune](binding.md).

## The five crates and one xtask

```
xrune/
├─ crates/
│  ├─ xrune-sigil      ← derive macro: `#[derive(DsRef)]`
│  ├─ xrune-nexus      ← AST + DsRune trait + decipher
│  ├─ xrune-incant     ← proc-macro: `ui! { … }`
│  ├─ xrune            ← umbrella: re-exports nexus + ui!, plus default_rune
│  └─ xrune-fmt        ← CLI binary: the scribe
├─ examples/
│  └─ example0         ← canonical hello-world fixture
└─ xtask/              ← CI/build/test/lint/doctest/bump/publish/release
```

All five published crates live on one workspace and ship one moving
version. `cargo install xrune` and you also get `xrune-incant` and
`xrune-nexus` linked in transitively.

`xtask` is `publish = false` — it never reaches crates.io. It exists
only to drive the workspace itself.

## `cargo xtask` commands

```text
cargo xtask <ci|build|test|lint|doctest|bump <level>|publish [--dry-run]|release>
```

- **`ci`** — `build` + `test` + `lint` + `doctest`, in that order.
  This is what `.github/workflows/ci.yml` runs. Locally green = CI green.
- **`build`** — `cargo build --workspace`.
- **`test`** — `cargo test --workspace`.
- **`lint`** — `cargo +stable clippy --workspace -- -D warnings`,
  followed by `cargo +stable fmt --all --check`. The `+stable`
  toolchain pin matches CI.
- **`doctest`** — extract every ` ```rust ` block from `docs/src/` and
  `docs/src-zh-CN/` into a throwaway test crate at `docs/test/` and
  `cargo build --tests`. Catches drift between docs and reality.
- **`bump <major|minor|patch>`** — rewrite the version in every
  `Cargo.toml` (workspace + the five `version = "=X.Y.Z"` pins under
  `[workspace.dependencies]`). Hand-editing the version is forbidden.
- **`publish [--dry-run]`** — push to crates.io in fixed order:
  `xrune-sigil → xrune-nexus → xrune-incant → xrune → xrune-fmt`,
  with a 30-second sleep between to let the index settle. Already-
  uploaded crates are skipped. Don't run this directly; use `release`.
- **`release`** — the only path to a real release. Requires a clean
  tree, then internally: push `main` → wait for CI green via
  `gh run list` (10-minute timeout) → tag `vX.Y.Z` → push the tag →
  `gh release create --generate-notes` → run `publish`.

## Workspace conventions

- `[workspace.package].version` is the single source of truth.
  `[workspace.dependencies]` pins each internal crate with
  `version = "=X.Y.Z"` so all five always march in lock-step.
- `Cargo.lock` is gitignored — this is a deliberate choice for the
  workspace, not an oversight.
- `default-members = ["crates/*"]` — `cargo build` from the root
  builds the published crates, not `xtask` or `examples/`.
- `edition = "2024"` workspace-wide.
- `resolver = "2"` for cargo's modern feature unification.

## Source-of-truth

- Workspace manifest: [`Cargo.toml`](https://github.com/W-Mai/xrune/blob/main/Cargo.toml)
- xtask: [`xtask/src/main.rs`](https://github.com/W-Mai/xrune/blob/main/xtask/src/main.rs)
- CI: [`.github/workflows/ci.yml`](https://github.com/W-Mai/xrune/blob/main/.github/workflows/ci.yml)
