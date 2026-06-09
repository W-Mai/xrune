# The Codex of Changes

A pointer to the version history rather than a full retelling. The
authoritative changelog is [`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md);
this chapter highlights only the shifts that affect a rune you've
already written.

## What's currently alive

The shape every other chapter documents — the `DsRune` trait with its
seven methods, the six `DsNode` variants, the three `on` forms (Form B,
Form C, callback-form), enchants, niches, match arms, the
`name: Option<syn::Ident>` attr shape — is the shape that ships today
on crates.io. Code written against the current docs compiles against
the current crates.

## Migration notes by surface

If you have an existing rune from an earlier release, here's what's
changed underneath you. Each entry assumes you're on the previous
shape and need to move to the current one.

### `on EventKind` handlers

Earlier the parser had a top-level `DsOn` node that sat next to widget
/ if / iter / niche / match in `DsTree`. The trait had a matching
`inscribe_on` method.

The current shape has neither. `on` clauses **fold into the widget
they attach to**, reaching the rune as `on_handlers: &[DsOn]` on
`inscribe_widget`. There is no `DsNode::On` variant and no
`inscribe_on` method.

If you had an `inscribe_on` impl: delete it, and read on-handlers from
the `on_handlers` slice inside `inscribe_widget` instead.

### `DsOn::get_body()`

Previously returned `&syn::Block` directly. Now returns
`Option<&syn::Block>` because `on EventKind(cb)` (callback-form)
carries no body.

If you matched on the body unconditionally, switch to handling the
`None` case — typically by reading the trailing element of
`get_args()` as the callback expression.

### `DsAttr::name`

Previously a non-optional `syn::Ident`. Now `Option<syn::Ident>`
because positional attrs (`text("hello")`) carry no name.

If you read `attr.name` directly, match on the `Option`. The
convenience `name_str() -> Option<String>` is the matching-friendly
form.

### Niche and match nodes

`@name { … }` and `match expr { … }` are AST nodes the trait now
includes. If your `DsRune` impl predates them, the compiler will
demand `inscribe_niche` and `inscribe_match` — the trait has no
default impls.

## Removed

These items are not in the language any more. If you find them in
example code, it's pre-current.

| Removed | Replaced by |
| --- | --- |
| `DsRune::inscribe_on` method | `on_handlers: &[DsOn]` on `inscribe_widget` |
| `DsNode::On` variant | folded into the widget |
| `DsTreeToTokens` trait | the `DsRune` codegen interface |
| `ds_traverse` module | `xrune::ds_rune::decipher::decipher` |
| Crate names `xwrapup` / `xrune_derive` / `xrune_parser` / `xrune_macros` | `xrune-sigil` / `xrune-nexus` / `xrune-incant` / `xrune` |

## Source-of-truth

- Full version-by-version changelog: [`CHANGELOG.md`](https://github.com/W-Mai/xrune/blob/main/CHANGELOG.md)
- Trait surface today: [`crates/xrune_nexus/src/ds_rune/mod.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_rune/mod.rs)
- AST surface today: see [The Runes](runes.md)
