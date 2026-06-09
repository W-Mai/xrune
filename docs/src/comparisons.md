# Comparisons

xrune sits in a crowded neighbourhood of Rust DSL and UI macros. The
quick way to find your bearings:

|  | xrune | typed-builder DSLs (e.g. `leptos::view!`, `dioxus::rsx!`, `yew::html!`) | Macro-by-example UI helpers (`maud`, `html!`) |
| --- | --- | --- | --- |
| Validation timing | At rune time. The DSL itself accepts any ident as widget, any `syn::Expr` as attr value. | At parse time. Widget names are concrete types; attrs map to typed setters. | Mostly compile-time, but tied to a fixed grammar (HTML). |
| Widget vocabulary | Open. Whatever your rune chooses to honour. | Closed. The host crate's component library defines what's valid. | Closed. Hardcoded to a single output (HTML). |
| Backends per syntax | Many. One DSL → many runes (renderer, ECS, formatter, analyzer, …). | One. The DSL and the framework are fused. | One. |
| Where you write your code-gen | A `DsRune` impl in your own crate. | Comes with the framework. | Inside the macro itself. |
| Type checking on attr values | None at parse time; the rune decides. | Strong — attrs become typed builder calls. | Limited to what the macro can pattern-match. |
| Iteration / conditional / match | First-class DSL nodes (`walk`, `if`, `match`). | Usually delegated to inline Rust expressions inside the macro. | Inline Rust. |

## When to reach for xrune

- Your host already owns its component / state / render model and you
  want a casting layer above it without committing the syntax to that
  model.
- The rendering target isn't decided yet, but the surface syntax is.
- Multiple consumers want to share one syntax — e.g. an ECS-runtime
  rune **and** a pretty-printer **and** a static analyzer.

## When to look elsewhere

- You want compile-time type-checking on widget names and attribute
  values — reach for a typed-builder DSL (`leptos`, `dioxus`, `yew`,
  `typed-builder` directly). xrune deliberately punts all type-level
  validation to the rune.
- Your output is plain HTML and you don't care about pluggable
  backends — `maud` or `html!` are tighter for that single goal.
- You want a ready-made widget library — xrune ships none. The runes
  in the wild bring their own.

## A loose mental model

> Typed-builder DSLs lock the surface to one back-end and give you
> safety in exchange. xrune does the opposite — it locks the *shape*
> of casting (one parser, one tree, one walk) and lets the back-end
> be anything you can fit through the seven-method `DsRune` trait.

Both are valid trade-offs. xrune is the right tool when "what does a
widget actually do?" is itself a moving question.
