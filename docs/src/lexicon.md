# Appendix · The Lexicon

This is the contract between xrune's medieval vocabulary and ordinary
compiler/CS terms. Every chapter reaches back here when the metaphor risks
drifting from the engineering meaning.

## Naming compact

| xrune term | Plain meaning |
| --- | --- |
| **sigil** | A derive macro (`xrune-sigil`). The `DsRef` derive mints `{Name}Ref` newtypes around `Rc<RefCell<Name>>`. |
| **nexus** | The core crate (`xrune-nexus`) — AST node types, the `DsRune` trait, and the `decipher` walker. The hub everything else binds to. |
| **incant** | The proc-macro crate (`xrune-incant`) that exposes `ui! { … }`. The act of invoking the DSL. |
| **rune** | A backend implementation of the `DsRune` trait — turns the parsed tree into emitted code. The DSL is one casting; runes are many translations. |
| **decipher** | The free function `xrune::ds_rune::decipher::decipher(tree, &mut rune)` that walks a `DsTree` and dispatches one inscribe call per node. |
| **inscribe** | One method on `DsRune` — `inscribe_root` / `inscribe_widget` / `inscribe_if` / `inscribe_iter` / `inscribe_niche` / `inscribe_match`. Each receives a node and accumulates output into the rune. |
| **seal** | The trait method `seal(self) -> TokenStream`. Consumes the rune at the end of decipher to produce the final emitted code. **Not** Rust's "sealed trait" pattern — same name, unrelated meaning. |
| **enchant** | A bracketed expression list `[expr, expr, …]` attached to a widget. Arbitrary data the rune can attach to a node — typically ECS components or attached state. |
| **niche** | A `@name { … }` node. An anchor / slot / named region routed by the host rune (e.g. portals, named ports). |
| **walk … with …** | Iteration. `walk iterable with var { … }` is xrune's `for` loop. |
| **on** | An event handler clause attached to a widget — `on EventKind { … }` (body form) or `on EventKind(cb)` (callback form). |
| **scribe** | The formatter binary `xrune-fmt` — re-renders DSL inside `ui! { … }` blocks. |
| **grimoire** | This documentation site. |
| **codex** | The version history (CHANGELOG). |

## DSL casting compact

| Form | Reads as |
| --- | --- |
| `:( ... :)` (each attr on its own line) | Context area. `parent` is required; other keys are rune-defined (`world`, `theme`, …). |
| `Widget (k: v) { … }` | A widget node with named attrs and children. |
| `Widget (Text("hi"))` | A widget with a positional attr. No body required. |
| `Widget (k: v) [Comp{…}, Tag] { … }` | Same, with enchants between attrs and body. |
| `if expr { … }` | Conditional render. |
| `walk it with x { … }` | Iteration. |
| `@slot { … }` | Niche (named anchor). |
| `match e { Pat => { … } … }` | Pattern match across sub-trees. |
| `Widget () {} on Tap { fire() }` | Form B: `on` after the body, attaches to the preceding sibling. |
| `Widget () on Tap { … } { … }` | Form C: `on` between attrs and body, attaches to this widget. |
| `on Tap(cb)` | Callback form. `cb` is the trailing arg; rune decides what it means. |

## Public API index

The shape every reader needs once:

| Crate | Public surface |
| --- | --- |
| `xrune-sigil` | `#[derive(DsRef)]` |
| `xrune-nexus` | `ds_node::*` (the `Ds*` AST types) · `ds_rune::DsRune` trait · `ds_rune::decipher::decipher` · `pub use xrune_sigil::DsRef` |
| `xrune-incant` | `#[proc_macro] pub fn ui` |
| `xrune` | `pub mod default_rune;` · `pub use xrune_incant::ui;` · `pub use xrune_nexus::*;` |
| `xrune-fmt` | `xrune-fmt <file.rs> [--check]` (binary) |
