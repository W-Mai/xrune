# Binding the Rune

A *rune* is a backend — an implementation of the `DsRune` trait. The
parser hands you a tree; the rune turns that tree into emitted code.

This chapter walks the trait method by method, then reads the bundled
`DefaultRune` as a worked example.

## The trait

`DsRune` declares **eight** methods. None has a default implementation —
every concrete rune must provide all eight.

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

    fn inscribe_if(
        &mut self,
        condition: &syn::Expr,
        reactive: bool,
        children: &[DsTreeRef],
        else_branch: Option<&DsTreeRef>,
    );

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        reactive: bool,
        key: Option<&syn::Expr>,
        children: &[DsTreeRef],
    );

    fn inscribe_niche(&mut self, name: &syn::Ident, is_declaration: bool, children: &[DsTreeRef]);

    fn inscribe_match(&mut self, scrutinee: &syn::Expr, reactive: bool, arms: &[DsMatchArm]);

    fn inscribe_code_block(&mut self, tokens: &proc_macro2::TokenStream);

    fn seal(self) -> proc_macro2::TokenStream;
}
```

The extra parameters carry what the casting said beyond the bare shape:

- `reactive` is `true` when the head was written with the `$` sigil
  (`if $open`, `walk $rows`, `match ${ state.get() }`); see
  [The `$` Sigil](casting-syntax/reactive.md).
- `else_branch` holds the `elif` / `else` chain of an `if`.
- `key` is the `by <expr>` of a keyed `walk`.
- `is_declaration` tells `@@name` (a slot declaration) from `@name` (a
  fill).
- `inscribe_code_block` receives the verbatim tokens of a `${ … }` node.

## How `decipher` calls them

`decipher(tree, &mut rune)` walks the AST and dispatches inscribe methods.
The crucial detail:

> **`decipher` only auto-recurses into the root and into an `else`
> body.** Every other inscribe method receives a `children` slice (or,
> for `inscribe_match`, an `arms` slice where each arm carries its own
> children) and is responsible for recursing itself.

> ⚠ **This is xrune's most common foot-gun.** If your `inscribe_widget`
> takes `children` and forgets to call `decipher(child, self)`, the
> subtree is **silently dropped** — no error, no warning, the output just
> stops mid-tree. Every non-root inscribe method needs that recursion.

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
        decipher(child, self);   // omit this and the subtree disappears
    }

    /* … emit any post-children fixup … */
}
```

`inscribe_iter` and `inscribe_niche` follow the same single-loop shape.
`inscribe_code_block` has nothing to recurse into: it is a leaf.

`inscribe_if` adds one step. After its own children it hands the
`else_branch`, if any, back to `decipher`. An `elif` arrives as another
`If` node, so `decipher` calls `inscribe_if` again with that branch's
condition and its own `else_branch`; a terminal `else` arrives as an
`Else` node, whose children `decipher` walks for you.

```rust,ignore
fn inscribe_if(
    &mut self,
    condition: &syn::Expr,
    reactive: bool,
    children: &[DsTreeRef],
    else_branch: Option<&DsTreeRef>,
) {
    /* … emit `if #condition {` … */
    for child in children {
        decipher(child, self);
    }
    /* … emit `}` … */

    if let Some(branch) = else_branch {
        decipher(branch, self);   // elif → inscribe_if again; else → its children
    }
}
```

`inscribe_match` is the exception. Its signature takes `arms: &[DsMatchArm]`
**only** — there is no separate `children` slice. Each arm carries its
own `get_children()`, so the rune writes a **two-level loop**: outer over
arms, inner over each arm's subtree.

```rust,ignore
fn inscribe_match(&mut self, scrutinee: &syn::Expr, reactive: bool, arms: &[DsMatchArm]) {
    /* … emit match header … */

    for arm in arms {
        /* … emit this arm's pattern header … */
        for child in arm.get_children() {
            decipher(child, self);
        }
        /* … emit this arm's footer … */
    }
}
```

The rune drives depth; `decipher` dispatches one level at a time. This
is intentional: it gives the rune full control over *order* (emit parent
before children, both interleaved, or only after the whole subtree is
known) and *scope* (push a parent symbol onto a stack before recursing,
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
real ECS-shaped runes lean on — is save → set → recurse → restore:

```rust,ignore
fn inscribe_widget(&mut self, name: &syn::Ident, /* … */ children: &[DsTreeRef]) {
    let name_string = name.to_string();           // 1. syn::Ident → String
    let prev_parent = self.parent_name.clone();   // 2. save the current parent
    self.parent_name = name_string;               // 3. become the parent for this subtree

    /* … emit code referring to `self.parent_name` … */

    for child in children {                       // 4. children see *me* as parent
        decipher(child, self);
    }

    self.parent_name = prev_parent;               // 5. restore so my next sibling sees the right parent
}
```

The shape threads parent identity through arbitrary nesting without
touching globals.

## Worked example: `DefaultRune`

The bundled reference rune lives in
[`crates/xrune/src/default_rune.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune/src/default_rune.rs)
and is the cleanest existing implementation of the eight methods. Read
it end-to-end — every inscribe handler is a few lines, the parent
push/pop idiom is in plain sight, and `seal` returns the accumulated
`println!`-shaped `TokenStream`.

There are **two identical** copies of `DefaultRune` in the repo:

- `xrune::default_rune::DefaultRune` — public, documented, what you read
  when starting your own rune.
- A private copy inside `xrune-incant` — what `ui! { … }` actually
  expands against.

**Why two?** Because `xrune-incant` is a proc-macro crate, and Rust
forbids any non-macro item it exposes from being imported by a
downstream crate. Even if its `DefaultRune` were marked `pub`,
`xrune::default_rune::DefaultRune = xrune_incant::DefaultRune` is
rejected by the compiler:

```text
error[E0432]: unresolved import `xrune_incant::DefaultRune`
  no `DefaultRune` in the root
```

So `xrune-incant` keeps a private copy for its own `ui!` expansion, and
`xrune` writes a separate, public, copy-able-from copy in its
`default_rune` module for readers. Both copies are byte-for-byte the
same logic; only their visibility differs.

(A theoretical fix would be to sink `default_rune` into `xrune-nexus`
and have both crates import it, but that drags backend code — and the
`quote` dependency it brings — into a core that is deliberately kept to
just AST + `DsRune` trait + `decipher`.)

## What `ui! { … }` actually does

The proc-macro is **not** an extension point. Its body, in full:

```rust,ignore
#[proc_macro]
pub fn ui(input: TokenStream) -> TokenStream {
    let root = parse_macro_input!(input as DsRoot);
    let mut rune = DefaultRune::new();        // ← hard-coded
    rune.inscribe_root(&root.get_parent());
    decipher(&root.get_content(), &mut rune);
    TokenStream::from(rune.seal())
}
```

That `DefaultRune::new()` is **literally hard-wired**. There is no
way for the caller of `ui!` to swap it for something else. So when
you write `ui! { … }` in your application, what gets pasted back into
your source is the private println-shaped `TokenStream` `DefaultRune`
emits. Nothing more.

Concretely: `ui!` is a *demonstration that the parser → `decipher` →
`seal` pipeline works end-to-end*. It is not the entry point for a
real backend.

## Hosting xrune in your own crate

For a real backend you don't call `ui!`. You build **your own
proc-macro crate**, paste the same five-line hosting boilerplate, and
swap in your own rune. The shape:

**`my-host-incant/Cargo.toml`**

```toml
[package]
name = "my-host-incant"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
xrune = "1.10"
syn = "2"
proc-macro2 = "1"
quote = "1"
```

`xrune` is the umbrella crate that re-exports `xrune-nexus` (the parser,
the `DsRune` trait, the `decipher` walker) and exposes
`xrune::default_rune::DefaultRune` as a copy-able reference rune. You
could depend on `xrune-nexus` directly to avoid the umbrella, but
`xrune` gives you shorter paths and lets you reach the public
`DefaultRune` while you're prototyping.

**`my-host-incant/src/lib.rs`**

```rust,ignore
use proc_macro::TokenStream;
use syn::parse_macro_input;
use xrune::ds_node::DsRoot;
use xrune::ds_rune::DsRune;
use xrune::ds_rune::decipher::decipher;

mod my_rune;
use my_rune::MyRune;

#[proc_macro]
pub fn my_ui(input: TokenStream) -> TokenStream {
    let root = parse_macro_input!(input as DsRoot);
    let mut rune = MyRune::new();
    rune.inscribe_root(&root.get_parent());
    decipher(&root.get_content(), &mut rune);
    TokenStream::from(rune.seal())
}
```

Pick your own macro name (`my_ui`, `bevy_ui`, whatever). Inside
`my_rune.rs` you implement the eight `DsRune` methods, emitting the
real spawn / render / whatever code your host actually needs. While
prototyping you can swap `MyRune::new()` for
`xrune::default_rune::DefaultRune::new()` to get the println trace
through your own macro and verify the wiring.

Downstream users then write:

```rust,ignore
use my_host_incant::my_ui;

my_ui! {
    :(
        parent: world
    :)
    /* … exact same casting syntax xrune accepts … */
}
```

Same DSL, your code-gen.

The `xrune-fmt` formatter is a sibling consumer that goes through the
same parser but **doesn't** implement `DsRune` — it walks `DsTree`
directly to re-print. That's the third shape of consumer (offline
tool), if your goal is analysis or reformatting rather than emitting
runtime code.

## Where to go next

- Compare `DefaultRune` with the formatter in
  [The Scribe](scribe.md) — both walk the same tree shape, but only
  one implements `DsRune`. The contrast is informative.
- Read [The Codex of Changes](codex.md) for the cross-version drift of
  the trait surface.
