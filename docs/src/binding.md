# Binding the Rune

A *rune* is a backend — an implementation of the `DsRune` trait. The
parser hands you a tree; the rune turns that tree into emitted code.

This chapter walks the trait method by method, then reads the bundled
`DefaultRune` as a worked example.

## The trait

`DsRune` declares **seven** methods. None has a default implementation —
every concrete rune must provide all seven.

```rust,ignore
pub trait DsRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr);

    fn inscribe_widget(
        &mut self,
        name: &syn::Ident,
        attrs: &[DsAttr],
        enchants: &[syn::Expr],
        on_handlers: &[DsOn],
        children: &[DsTreeRef],
    );

    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]);

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[DsTreeRef],
    );

    fn inscribe_niche(&mut self, name: &syn::Ident, children: &[DsTreeRef]);

    fn inscribe_match(&mut self, scrutinee: &syn::Expr, arms: &[DsMatchArm]);

    fn seal(self) -> proc_macro2::TokenStream;
}
```

## How `decipher` calls them

`decipher(tree, &mut rune)` walks the AST and dispatches inscribe methods.
The crucial detail:

> **`decipher` only auto-recurses into the root.** Every other inscribe
> method receives a `children: &[DsTreeRef]` slice and is responsible for
> recursing itself.

That means `inscribe_widget` typically looks like:

```rust,ignore
fn inscribe_widget(
    &mut self,
    name: &syn::Ident,
    attrs: &[DsAttr],
    enchants: &[syn::Expr],
    on_handlers: &[DsOn],
    children: &[DsTreeRef],
) {
    /* … emit widget construction code for `name`, `attrs`, etc. … */

    for child in children {
        decipher(child, self);
    }

    /* … emit any post-children fixup … */
}
```

The same pattern applies to `inscribe_if`, `inscribe_iter`, `inscribe_niche`,
and each arm of `inscribe_match`. The rune drives depth; `decipher`
dispatches one level at a time.

This is intentional: it gives the rune full control over *order* (emit
parent before children, both interleaved, or only after the whole subtree
is known) and *scope* (push a parent symbol onto a stack before recursing,
pop it after).

## The sealing pattern

`seal(self) -> TokenStream` consumes the rune by value at the very end.
Everything inscribed during the walk gets accumulated into the rune's
internal state — typically a `proc_macro2::TokenStream` field — and `seal`
returns it.

```rust,ignore
struct MyRune {
    out: proc_macro2::TokenStream,
}

impl DsRune for MyRune {
    /* … inscribe_* methods append to self.out via quote! { … } … */

    fn seal(self) -> proc_macro2::TokenStream {
        self.out
    }
}
```

`seal` taking `self` by value is deliberate — it makes the finalisation
single-shot. A rune that wants to inspect or post-process its accumulated
state runs that logic *inside* `seal`.

> The name "seal" is the trait method, not Rust's [sealed-trait
> pattern](https://rust-lang.github.io/api-guidelines/future-proofing.html).
> Same word, unrelated meaning.

## The parent-context idiom

Backends commonly need to know which widget the current child is being
spawned under. The convention `DefaultRune` uses — and the convention
real ECS-shaped runes lean on — is push/pop:

```rust,ignore
fn inscribe_widget(&mut self, name: &syn::Ident, /* … */ children: &[DsTreeRef]) {
    let prev_parent = self.parent_name.clone();
    self.parent_name = name.to_string();

    /* … emit code referring to `self.parent_name` … */

    for child in children {
        decipher(child, self);
    }

    self.parent_name = prev_parent;
}
```

The "save → set → recurse → restore" shape threads parent identity
through arbitrary nesting without globals.

## Worked example: `DefaultRune`

The bundled reference rune lives in
[`crates/xrune/src/default_rune.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune/src/default_rune.rs)
and is the cleanest existing implementation of the seven methods. Read
it end-to-end — every inscribe handler is a few lines, the parent
push/pop idiom is in plain sight, and `seal` returns the accumulated
`println!`-shaped `TokenStream`.

Two implementation copies of `DefaultRune` exist:

- `xrune::default_rune::DefaultRune` — public, documented, what you copy
  when you start your own rune.
- A private copy inside `xrune-incant` — what `ui! { … }` actually
  invokes. Identical in shape; separate so the macro doesn't depend on
  the public re-export tree.

A custom backend never goes through `ui!`. Hosts call `decipher` directly
with their own rune:

```rust,ignore
let root: xrune::ds_node::DsRoot = syn::parse2(tokens)?;
let mut rune = MyRune::new();
rune.inscribe_root(&root.get_parent());
xrune::ds_rune::decipher::decipher(&root.get_content(), &mut rune);
let out: proc_macro2::TokenStream = rune.seal();
```

That's it — that's the whole hosting contract.

## Where to go next

- Compare `DefaultRune` with the formatter in
  [The Scribe](scribe.md) — both walk the same tree shape, but only
  one implements `DsRune`. The contrast is informative.
- Read [The Codex of Changes](codex.md) for which trait methods landed in
  which release — the trait grew across 1.1.0 → 1.5.1.
