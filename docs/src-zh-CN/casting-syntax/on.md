# `on` 事件咒符

`on EventKind` 子句把事件处理器附着到部件上。

`on` 是保留关键字：已注册为 custom token，所以 `on Foo` 永不会被误认成名为 `on` 的部件。

## 形态 B — body 之后的修饰链

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

嵌进某个 body 时，形态 B 附着到**紧靠前的兄弟部件**，**不**附着到父：

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
    on Tap { save(); }            /* 附到上面那个 button */

    button (text: "Cancel") {}
    on Tap { cancel(); }          /* 附到 cancel 那个 button */
}
# }
# }
# fn main() {}
```

同一部件可以串多条形态 B：

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

## 形态 C — 属性与 body 之间

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

同一部件可叠多条形态 C。末尾的 `{}` 可省，不写时部件就是没有子节点：

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

形态 B 与形态 C 的处理器都汇入同一个 `Vec<DsOn>`，由 `DsWidget::get_on_handlers()` 一次取出。同一个部件上两种形态混用合法。

## 带体形态 vs 回调形态

事件处理器可以带 body 块：

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

也可以仅带末尾一个回调表达式、不带 body：

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

带体形态下 `DsOn::get_body()` 返回 `Some(&syn::Block)`；回调形态下返回 `None`，由符文师自行决定 `get_args()` 末尾那个元素的语义：通常的约定是「事件触发时被调起的可调用表达式」。

子句既无 body 又无 args，是 parse 错。

## 限定的事件名

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

`get_qualifier()` 返回 `Some(Slider)`，`get_name()` 返回 `ValueChanged`。限定段**只允许一段**：`Foo::Bar::Baz` 直接拒收。

## 参数

`on EventKind(…)` 圆括号里是逗号分隔的 `syn::Expr` 列表。符文师由 `get_args()` 取出。常见形态：

```text
on Tap { … }                        /* args: [], body 在 */
on Tap(2) { … }                     /* args: [2], body 在 */
on Tap(cb)                          /* 回调形态，无 body */
on Tap(2, cb)                       /* count + 回调 */
```

子句**两者皆无**（既无 body 又无 args），是 parse 错：每个 `on` 至少要带其中一种。

## 源码出处

[`ds_on.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/ds_node/ds_on.rs) 与 `tests.rs` 里的 `form_b_*` / `form_c_*` 用例。这套形态由 `xrune-fmt` 的 formatter 来回誊写一遍验过：每次此处形态有改，同一 commit 必带 fmt 更新。
