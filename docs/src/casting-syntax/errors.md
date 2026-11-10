# Rejected Forms

Not every shape that *looks* sensible parses. The cases below all raise
deliberate parse errors — the parser favours rejecting ambiguous casts
over guessing.

## One top-level node

A cast is a single tree. Two siblings at the top level are rejected:

```text
header ()
footer ()      /* parse error: unexpected token */
```

Wrap them in a container widget instead.

## Context area

| What you wrote | Why it fails |
| --- | --- |
| `:( parent: r, world: w :)` (multi-attr, single line) | Multi-line required when >1 attr |

A cast without a header, or a header without `parent`, is **not** an
error (since 1.10.0): `get_parent()` falls back to `()`.

## `if` / `walk` / `match` without bodies

```text
if cond                /* parse error: body required */
walk it with x         /* parse error */
match e                /* parse error */
```

Bodiless control nodes would be no-ops, so the parser refuses them
outright rather than silently accept dead syntax. The same goes for
every `elif` and `else` branch.

## Branches

| Rejected | Reason |
| --- | --- |
| `} else if b { … }` | The keyword is `elif`; after `else` the parser expects `{` |
| `else { … }` / `elif c { … }` with no preceding `if` | A branch only continues an `if` |

## Reserved words

`walk`, `with`, `by`, `on` and `elif` are keywords of the DSL, so none
of them can name a widget. They remain usable as attribute names
(`row (by: 1)`).

## `on` shapes

| Rejected | Reason |
| --- | --- |
| `on Tap { … }` at the root, no preceding widget | `on` requires a sibling to attach to |
| `@slot { … } on Tap { … }` | Only widgets carry handlers; not `if` / `walk` / `match` / niches / code blocks |
| `on Tap call_me() {}` | A handler must be either a body block or `(args)` form, not a bare call |
| `on Foo::Bar::Baz { … }` | Qualifier supports a single segment only |
| `on Tap` with no body and no args | A handler must carry at least one of the two |

## Niche names are single identifiers

`@foo::bar { }` is not parsed — niche names are a single `syn::Ident`.
Patterns inside `match` use `Pat::parse_multi_with_leading_vert`, so any
pattern `syn` accepts in a regular `match` arm works.

## What's *not* an error

A widget without children is fine — `header (text: "x")` and
`header (text: "x") {}` parse identically. So is a widget without parens —
`container {}` carries zero attrs and zero children. A bare `@slot` or
`@@slot` with no body is a valid reference or declaration, and a cast
may skip the `:( … :)` header. Those shapes are valid; readers sometimes
assume otherwise.

## Where rejections live

The body and `on` rejections have unit tests in
[`crates/xrune_nexus/src/tests.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/tests.rs).
Their names start with `error_*` — a useful catalogue when a real `ui!`
block fails to parse and the message isn't immediately clear. For
anything else, paste the casting into the
[Forge](https://xrune.to01.icu/#forge): it runs the same parser and
points at the offending token.
