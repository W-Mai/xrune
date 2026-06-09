# The Casting Syntax

Every form the `ui! { … }` macro accepts. Six axes:

- [Context Area](context.md) — the `:( … :)` header that opens every cast.
- [Widget Nodes](widget.md) — the heart of the language: named or
  positional attrs, optional parens, optional body.
- [Enchants](enchants.md) — the `[expr, expr, …]` block that attaches
  arbitrary data to a widget.
- [Control Flow](control.md) — `if`, `walk … with …`, `@niche`, `match`.
- [The `on` Handlers](on.md) — event clauses in two forms (B and C),
  body or callback, qualified or bare, with or without args.
- [Rejected Forms](errors.md) — what the parser refuses, and why.

The DSL is **untyped at parse time**. Widget names are arbitrary
identifiers; attribute values are arbitrary `syn::Expr`. All semantics —
what counts as a widget, which attrs are valid, what an event kind means —
live in the rune you bind, never in xrune itself.
