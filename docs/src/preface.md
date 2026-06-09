# The Grimoire's Preface

xrune is an **engine of inscription**.

You hand it a casting — a declarative cast written inside `ui! { … }` —
and at compile time it reads the *shape* of that cast, transcribes the
shape into runes, and lets the **inscriber** you have bound (a `DsRune`
implementation) inscribe those runes into actual code. A final **seal**
closes the rite, and the whole casting condenses into a `TokenStream`
your host crate absorbs as if it had written it by hand.

That separation is the entire design. The same casting can be inscribed
into ECS spawn calls, into a render-tree builder, into a debug echo, or
round-tripped by the scribe. What it *becomes* is decided not by the
casting, but by which inscriber you bind.

The casting does not know what a "widget" is. The casting knows only
shape.

## When to summon xrune

- Your host already owns its components, its state, its render-loop, and
  you want a casting layer above them — without wedding the casting to
  any one type system.
- Several inscribers must share one casting: an ECS-runtime inscriber,
  a pretty-printing inscriber, a static-analysis inscriber — all reading
  the same rite.
- The rendering target is not yet decided, but the surface casting is.

If your DSL needs compile-time type-checking on widget names and
attribute keys, look elsewhere — toward a typed-builder DSL. xrune
hands every shred of semantics to the inscriber.

## Five volumes and a hub

| Volume | Office |
| --- | --- |
| [`xrune`](https://crates.io/crates/xrune) | The opening scroll. The reader summons only this; it draws `xrune-nexus` and the `ui!` rite from beneath. |
| [`xrune-nexus`](https://crates.io/crates/xrune-nexus) | The **hub**. AST nodes (`Ds*`), the `DsRune` covenant, the `decipher` walk — all kept here. |
| [`xrune-incant`](https://crates.io/crates/xrune-incant) | The **speaking-stone**. The proc-macro that *is* `ui! { … }`. |
| [`xrune-sigil`](https://crates.io/crates/xrune-sigil) | The **sigil-forge**. The `DsRef` derive macro that mints `Rc<RefCell<>>` reference-sigils for the AST. |
| [`xrune-fmt`](https://crates.io/crates/xrune-fmt) | The **scribe**. A CLI that puts every `ui! { … }` block through the real parser and writes it back, faithful in shape. |

All five volumes share one cargo workspace and one moving version: every
release advances all five together to the same `X.Y.Z`.

## The naming compact

xrune leans on a medieval-magical vocabulary because the architecture is
shaped that way: one casting, many translations. A reader who meets an
unfamiliar term should look it up once in the
[Lexicon](lexicon.md) and never need to look it up again. The
shortest summary:

- **rune** / **inscriber**: a backend; an implementation of the `DsRune`
  trait.
- **decipher**: the walk function. It traverses the AST and feeds every
  node to the inscriber's **inscribe** methods.
- **inscribe**: what the inscriber does at every node — laying each rune
  into the emitted code.
- **seal**: when the walk ends, the inscriber closes its work into a
  final `TokenStream`.

That is the whole conceptual surface. Every other word — sigil, niche,
enchant, walk, on — is a particular *shape* of casting; the chapters
ahead take them in turn.

## How the grimoire is laid out

- *Part I — First Casting* takes you from `cargo new` to seeing
  `decipher` actually walk, then catalogues every casting shape.
- *Part II — The Inner Mechanism* explains the AST nodes and teaches
  you to forge an inscriber of your own.
- *Part III — The Outer Tools* covers the scribe and the workshop
  (the cargo workspace itself).
- *Part IV — Time & Lore* records the cross-version drift of forms, and
  sets xrune beside neighbouring DSL approaches.

The *Appendix* is the term-by-term lexicon and the public-API index.

## House style

- Code blocks are real, copy-paste-runnable Rust unless marked
  otherwise. The few that demonstrate `ui!` *parser* output without
  arranging a host environment are flagged in place.
- Type names, error messages, and CLI strings are quoted from the
  source. They are never paraphrased.
