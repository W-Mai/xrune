# The Runes

A reference for the parsed shapes the `decipher` walk hands a rune. Each
type below is exactly what your `inscribe_*` method receives — read this
chapter when writing the body of an inscribe handler and you're not sure
what fields are available.

## The shape of `DsTree`

Everything the parser builds is one type:

```rust,ignore
pub struct DsTree {
    parent: Option<DsTreeRef>,
    node: DsNode,
    children: Vec<DsTreeRef>,
}
```

- `parent` — set by the parser as it links the tree; backends rarely
  read it directly. The push/pop idiom in [Binding the Rune](binding.md)
  threads parent identity *through the rune*, not through this field.
- `node` — what kind of casting node this is, see `DsNode` below.
- `children` — sub-trees. Empty for leaf forms; non-empty for widget
  bodies, control bodies, niche bodies. Match arm children live on the
  arm, not here.

`DsTreeRef` is what `DsRef` mints around `DsTree`: an
`Rc<RefCell<DsTree>>` newtype. Borrow it with `.borrow()` /
`.borrow_mut()` like any `RefCell`. The reference-counted shape is what
lets the parser link parents and children without lifetimes; it's not
something the inscribe path generally needs to clone or mutate.

Read access on a borrowed `DsTree`:

| Method | Returns | Use |
| --- | --- | --- |
| `get_node()` | `&DsNode` | Pattern-match to figure out which kind of node you have. |
| `get_children()` | `&[DsTreeRef]` | Iterate when you recurse via `decipher(child, self)`. |
| `set_parent(parent)` | `()` | Parser-only. Backends don't call this. |

## `DsNode` — six variants

```rust,ignore
pub enum DsNode {
    Root(syn::Expr),
    Widget(DsWidget),
    If(DsIf),
    Iter(DsIter),
    Niche(DsNiche),
    Match(DsMatch),
}
```

You almost never match on `DsNode` directly — `decipher` already
dispatches each variant to the right `inscribe_*` method. The variant
names map one-to-one to the trait:

| `DsNode` variant | Dispatched to | Reaches the rune as |
| --- | --- | --- |
| `Root(expr)` | `inscribe_root` | `parent_expr: &syn::Expr` |
| `Widget(w)` | `inscribe_widget` | full widget unpacked into 5 args |
| `If(node)` | `inscribe_if` | `condition: &syn::Expr` + `children` |
| `Iter(node)` | `inscribe_iter` | `iterable` + `variable` + `children` |
| `Niche(node)` | `inscribe_niche` | `name: &syn::Ident` + `children` |
| `Match(node)` | `inscribe_match` | `scrutinee: &syn::Expr` + `arms: &[DsMatchArm]` |

There is **no** `On` variant — `on EventKind { … }` clauses fold into
the widget they attach to. They reach the rune as the
`on_handlers: &[DsOn]` slice on `inscribe_widget`, never as a top-level
node.

The peek-side enum `DsNodeType` is a parser-only thing
(`Widget` / `If` / `Iter` / `Niche` / `Match`) — same names minus
`Root`. Backends never see it.

## `DsRoot` — the cast envelope

```rust,ignore
pub struct DsRoot { /* private */ }

impl DsRoot {
    pub fn get_parent(&self) -> syn::Expr;
    pub fn get_content(&self) -> DsTreeRef;
    pub fn get_context_attrs(&self) -> &[DsAttr];
}
```

You hit `DsRoot` exactly once per cast — at the host's macro entry,
right before calling `inscribe_root` and `decipher`:

```rust,ignore
let root: xrune::ds_node::DsRoot = syn::parse2(tokens)?;
rune.inscribe_root(&root.get_parent());
decipher(&root.get_content(), &mut rune);
```

- `get_parent()` returns a clone of the `parent:` value from the
  `:( … :)` header, suitable for splicing into emitted code.
- `get_content()` returns the body of the cast — the actual
  `DsTreeRef` `decipher` walks.
- `get_context_attrs()` returns **every** attr in the header, including
  `parent` itself. Use it when your rune defines extra context keys
  (`world`, `theme`, …) and wants to read them before the walk.

`DsRoot` also implements `Deref<Target = DsTreeRef>`, but that's a
parser-side convenience; backends use the explicit getters.

## Per-node types

### `DsWidget`

```rust,ignore
pub struct DsWidget { /* private */ }

impl DsWidget {
    pub fn get_name(&self) -> &syn::Ident;
    pub fn get_attrs(&self) -> &DsAttrs;
    pub fn get_enchants(&self) -> &[syn::Expr];
    pub fn get_on_handlers(&self) -> &[DsOn];
}
```

`inscribe_widget` already unpacks all four fields plus the children for
you. The `DsWidget` value itself is what the parser holds; you only
reach for it when walking `DsNode` manually (e.g. in an offline tool
like `xrune-fmt`).

### `DsAttr` and `DsAttrs`

```rust,ignore
pub struct DsAttr {
    pub name: Option<syn::Ident>,
    pub value: syn::Expr,
}

impl DsAttr {
    pub fn name_str(&self) -> Option<String>;
}

pub struct DsAttrs {
    pub attrs: Vec<DsAttr>,
}
```

- `name: Option<syn::Ident>` is `Some` for `name: value` form, `None`
  for positional attrs. `name_str()` is the matching-friendly version.
- `value: syn::Expr` is whatever the user wrote — match on it as you
  would any `syn::Expr`, or splice it via `quote!` into emitted code.

### `DsOn` (event handlers)

```rust,ignore
pub struct DsOn { /* private */ }

impl DsOn {
    pub fn get_qualifier(&self) -> Option<&syn::Ident>;
    pub fn get_name(&self) -> &syn::Ident;
    pub fn get_args(&self) -> &[syn::Expr];
    pub fn get_body(&self) -> Option<&syn::Block>;
}
```

- `get_qualifier()` is `Some(Slider)` for `on Slider::ValueChanged`,
  `None` for bare `on Tap`.
- `get_name()` is always present — `Tap`, `ValueChanged`, …
- `get_args()` is the comma-separated expr list inside `(…)`.
- `get_body()` is `Some` for the `{ … }` body form, `None` for the
  callback form (`on Tap(cb)`); in the callback case the rune typically
  reads the last element of `get_args()` as the callable.

### `DsIf`

```rust,ignore
impl DsIf {
    pub fn get_condition(&self) -> &syn::Expr;
}
```

Children come from the surrounding `DsTree`'s `get_children()`.

### `DsIter` (`walk … with …`)

```rust,ignore
impl DsIter {
    pub fn get_iterable(&self) -> &syn::Expr;
    pub fn get_variable(&self) -> &syn::Ident;
}
```

`iterable` is what comes after `walk`; `variable` is the binding after
`with`. The body is again on the surrounding `DsTree`.

### `DsNiche` (`@name { … }`)

```rust,ignore
impl DsNiche {
    pub fn get_name(&self) -> &syn::Ident;
}
```

Single-segment ident only — `@foo::bar` is a parse error.

### `DsMatch` and `DsMatchArm`

```rust,ignore
impl DsMatch {
    pub fn get_scrutinee(&self) -> &syn::Expr;
    pub fn get_arms(&self) -> &[DsMatchArm];
}

impl DsMatchArm {
    pub fn get_pat(&self) -> &syn::Pat;
    pub fn get_children(&self) -> &[DsTreeRef];
}
```

`DsMatch` is the only node where children **don't** sit on the
surrounding `DsTree`. They're partitioned across arms — each arm
carries its own `get_children()`. That's why `inscribe_match` takes
`arms: &[DsMatchArm]` and the rune writes a two-level loop. See the
example in [Binding the Rune § Hosting xrune](binding.md).

## Custom keywords

`walk`, `with`, and `on` are registered as `syn::custom_keyword!` —
they cannot be used as widget names, attr names, or any other
identifier. The parser dispatches them before the widget peek, so
`on Foo` is not a widget called `on`.

## What you don't need to know

A few items are public but only matter to the parser or to xrune
itself:

- **`DsContext` / `DsContextRef`** — `#[allow(dead_code)]`, an
  auxiliary structure not on the inscribe path.
- **`DsNodeIsMe`** — peek protocol each node parser implements; only
  `DsNode::what_type()` calls into it.
- **`DsTreeRef`'s inner `Rc<RefCell<DsTree>>` shape** — for `decipher`
  to share children across borrows. You won't normally clone or
  manipulate the `Rc` directly from a rune.

## Source-of-truth

Everything above is in `crates/xrune_nexus/src/ds_node/`. One file per
type: `ds_root.rs`, `ds_widget.rs`, `ds_attr.rs`, `ds_on.rs`,
`ds_if.rs`, `ds_iter.rs`, `ds_niche.rs`, `ds_match.rs`,
`node_enum.rs`. The DsRune trait that consumes them is in
`crates/xrune_nexus/src/ds_rune/mod.rs`; the `decipher` walker beside
it.
