# The `on` Handlers

The `on EventKind` clause attaches event handlers to a widget.

`on` is a reserved keyword — registered as a custom token so `on Foo` is
never mistaken for a widget named `on`.

## Form B — modifier chain after the body

```rust
# use xrune::ui;
# fn save() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
button (text: "Save") {} on Tap {
    save();
}
# }
# }
# fn main() {}
```

Inside a nested body, Form-B attaches to the **nearest preceding sibling
widget**, not to the parent:

```rust
# use xrune::ui;
# fn save() {}
# fn cancel() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
column {
    button (text: "Save") {}
    on Tap { save(); }            /* attaches to the button above */

    button (text: "Cancel") {}
    on Tap { cancel(); }          /* attaches to the cancel button */
}
# }
# }
# fn main() {}
```

Multiple Form-B clauses chain on the same widget:

```rust
# use xrune::ui;
# fn save() {}
# fn hint() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
button (text: "Save") {}
    on Tap { save(); }
    on Hover { hint(); }
# }
# }
# fn main() {}
```

## Form C — between attrs and body

```rust
# use xrune::ui;
# fn commit() {}
# fn lock() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
slider (min: 0, max: 100)
    on ValueChanged(2) { commit(); }
    on DragStart { lock(); }
    {}
# }
# }
# fn main() {}
```

Multiple Form-C clauses stack on the same widget. The trailing `{}` is
optional; without it, the widget simply has no children:

```rust
# use xrune::ui;
# fn fire() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
view ()
    on Tap { fire(); }
# }
# }
# fn main() {}
```

Form B and Form C accumulate into the same `Vec<DsOn>` retrieved via
`DsWidget::get_on_handlers()`. Mixing both on one widget is allowed.

## Body form vs callback form

A handler can carry either a body block:

```rust
# use xrune::ui;
# struct State; impl State { fn toggle(&self) {} }
# fn app(parent: i32, state: State) {
# ui! {
#     :(
#         parent: parent
#     :)
# button () {}
on Tap {
    state.toggle();
}
# }
# }
# fn main() {}
```

…or a trailing callback expression with no body (1.5.2):

```rust
# use xrune::ui;
# fn callback() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
# button () {}
on Tap(callback)
on Tap(2, callback)
# }
# }
# fn main() {}
```

For the body form, `DsOn::get_body()` returns `Some(&syn::Block)`. For the
callback form, it returns `None`, and the rune decides what the trailing
`get_args()` element means — the convention is "callable expression to
invoke when the event fires."

A clause with neither body nor args is a parse error.

## Qualified events

```rust
# use xrune::ui;
# struct Slider;
# fn commit() {}
# fn app(parent: i32) {
# ui! {
#     :(
#         parent: parent
#     :)
# slider () {}
on Slider::ValueChanged { commit(); }
# }
# }
# fn main() {}
```

`get_qualifier()` returns `Some(Slider)` and `get_name()` returns
`ValueChanged`. Only **one** segment of qualification is allowed —
`Foo::Bar::Baz` is rejected.

## Args

Arguments inside `on EventKind(…)` are a comma-separated list of
`syn::Expr`. The rune retrieves them via `get_args()`. Common shapes:

```text
on Tap { … }                        /* args: [], body present */
on Tap(2) { … }                     /* args: [2], body present */
on Tap(cb)                          /* callback form, body absent */
on Tap(2, cb)                       /* count + callback */
```

A clause with **neither** body nor args is a parse error: every `on`
must carry at least one of the two.

## Source-of-truth

[`ds_on.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_on.rs)
and the `form_b_*` / `form_c_*` test cases in `tests.rs`. The shape is
exhaustively round-tripped by `xrune-fmt`'s formatter — every change to
this surface lands a fmt update in the same commit.
