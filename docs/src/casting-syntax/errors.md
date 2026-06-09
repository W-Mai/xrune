# Rejected Forms

Not every shape that *looks* sensible parses. The cases below all raise
deliberate parse errors — the parser favours rejecting ambiguous casts
over guessing.

## Context area

| What you wrote | Why it fails |
| --- | --- |
| `:( :)` (no `parent`) | `Root node must have a parent` |
| `:( foo: 1 :)` | Same — missing `parent` key |
| `:( parent: r world: w :)` (multi-attr, single line) | Multi-line required when >1 attr |

## `if` / `walk` / `@niche` / `match` without bodies

```text
if cond                /* parse error: body required */
walk it with x         /* parse error */
@slot                  /* parse error */
match e                /* parse error */
```

Bodyless control nodes would be no-ops, so the parser refuses them
outright rather than silently accept dead syntax.

## `on` shapes

| Rejected | Reason |
| --- | --- |
| `on Tap { … }` at the root, no preceding widget | `on` requires a sibling to attach to |
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
`container {}` carries zero attrs and zero children. Those shapes are
valid; readers sometimes assume otherwise.

## Where rejections live

Every error case has a unit test in
[`crates/xrune_nexus/src/tests.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/tests.rs).
The test names start with `error_*` — they're a useful catalogue when a
real `ui!` block fails to parse and the message isn't immediately clear.
