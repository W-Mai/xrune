# 符文图谱

本卷胪列 `decipher` 遍历器交给符文师的诸般解析形态。下面每个类型都恰好是你 `inscribe_*` 方法收下的东西。写 inscribe 处理器时，对哪个字段拿不准，就翻这一章。

## `DsTree` 的形态

parser 建出来的一切都是同一个类型：

```rust,ignore
pub struct DsTree {
    parent: Option<DsTreeRef>,
    node: DsNode,
    children: Vec<DsTreeRef>,
}
```

- `parent`：parser 链树时设的，符文师极少直接读它。[绑定符文](binding.md) 那一章里，用 push/pop 形态牵引 parent 身份的是**符文师内部状态**，不是这个字段。
- `node`：当前是哪种咏唱节点，见下文 `DsNode`。
- `children`：子树。叶子形态为空；部件 body、控制 body、壁龛 body 非空。match arm 的子节点挂在 arm 上，不在这里。

`DsTreeRef` 是 `DsRef` 为 `DsTree` 锻造的产物：一个对 `Rc<RefCell<DsTree>>` 的 newtype。用 `.borrow()` / `.borrow_mut()` 跟普通 `RefCell` 一样借。引用计数的形态是给 parser 链 parent / children 用的，不用纠结 lifetime；inscribe 路径上一般不需要克隆或修改它。

借出 `DsTree` 后能读的东西：

| 方法 | 返回 | 用途 |
| --- | --- | --- |
| `get_node()` | `&DsNode` | pattern-match 出当前是哪种节点 |
| `get_children()` | `&[DsTreeRef]` | 递归调 `decipher(child, self)` 时遍历 |
| `set_parent(parent)` | `()` | parser 用，符文师不调 |

## `DsNode`，六种变体

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

你几乎不会直接 match `DsNode`，因为 `decipher` 已经把每种变体派给对应的 `inscribe_*` 方法。变体名跟 trait 一一对应：

| `DsNode` 变体 | 派给 | 到达符文师时长这样 |
| --- | --- | --- |
| `Root(expr)` | `inscribe_root` | `parent_expr: &syn::Expr` |
| `Widget(w)` | `inscribe_widget` | widget 完整拆开成 5 个参数 |
| `If(node)` | `inscribe_if` | `condition: &syn::Expr` + `children` |
| `Iter(node)` | `inscribe_iter` | `iterable` + `variable` + `children` |
| `Niche(node)` | `inscribe_niche` | `name: &syn::Ident` + `children` |
| `Match(node)` | `inscribe_match` | `scrutinee: &syn::Expr` + `arms: &[DsMatchArm]` |

**没有** `On` 变体。`on EventKind { … }` 子句折进它附着的部件里，作为 `on_handlers: &[DsOn]` slice 落到 `inscribe_widget`，永不以独立节点出现。

peek 用的 `DsNodeType` 是 parser 内部的辅助 enum（`Widget` / `If` / `Iter` / `Niche` / `Match`，没有 `Root`）。后端见不到。

## `DsRoot`，咏唱信封

```rust,ignore
pub struct DsRoot { /* private */ }

impl DsRoot {
    pub fn get_parent(&self) -> syn::Expr;
    pub fn get_content(&self) -> DsTreeRef;
    pub fn get_context_attrs(&self) -> &[DsAttr];
}
```

每段咏唱只碰一次 `DsRoot`，就在宿主宏入口处，调 `inscribe_root` 与 `decipher` 之前：

```rust,ignore
let root: xrune::ds_node::DsRoot = syn::parse2(tokens)?;
rune.inscribe_root(&root.get_parent());
decipher(&root.get_content(), &mut rune);
```

- `get_parent()`：返回 `:( … :)` 头里 `parent:` 那个表达式的克隆，可直接 splice 进发出的代码。
- `get_content()`：返回咏唱的 body，那棵 `decipher` 真正会走的 `DsTreeRef`。
- `get_context_attrs()`：返回头里携带的**全部**属性，包括 `parent` 自己。当你的符文师定义了额外的上下文键（`world`、`theme`…）、想在遍历前先读它们，用这个方法。

`DsRoot` 还实现了 `Deref<Target = DsTreeRef>`，但那是 parser 侧的便利；后端用显式 getter。

## 各节点类型

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

`inscribe_widget` 已经把这四个字段加上 children 拆好喂给你。`DsWidget` 自身是 parser 抓在手上的东西，只有当你**手动**遍历 `DsNode`（比如写 `xrune-fmt` 这种离线工具）时才需要它。

### `DsAttr` 与 `DsAttrs`

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

- `name: Option<syn::Ident>`，`name: value` 形态时为 `Some`，位置属性时为 `None`。`name_str()` 是匹配友好的版本。
- `value: syn::Expr`，用户写的原样。像匹配任何 `syn::Expr` 一样匹配它，或用 `quote!` splice 进发出的代码。

### `DsOn`（事件处理器）

```rust,ignore
pub struct DsOn { /* private */ }

impl DsOn {
    pub fn get_qualifier(&self) -> Option<&syn::Ident>;
    pub fn get_name(&self) -> &syn::Ident;
    pub fn get_args(&self) -> &[syn::Expr];
    pub fn get_body(&self) -> Option<&syn::Block>;
}
```

- `get_qualifier()`：`on Slider::ValueChanged` 时是 `Some(Slider)`；裸 `on Tap` 时是 `None`。
- `get_name()`：永远在场，`Tap` / `ValueChanged` 之类。
- `get_args()`：`(…)` 里的逗号分隔表达式列表。
- `get_body()`：带体形态 `{ … }` 时是 `Some`；回调形态 `on Tap(cb)` 时是 `None`，这种情况下符文师通常把 `get_args()` 末尾的元素当作可调用对象。

### `DsIf`

```rust,ignore
impl DsIf {
    pub fn get_condition(&self) -> &syn::Expr;
}
```

子节点来自外围 `DsTree` 的 `get_children()`。

### `DsIter`（`walk … with …`）

```rust,ignore
impl DsIter {
    pub fn get_iterable(&self) -> &syn::Expr;
    pub fn get_variable(&self) -> &syn::Ident;
}
```

`iterable` 是 `walk` 之后那段；`variable` 是 `with` 之后的绑定。body 同样在外围 `DsTree`。

### `DsNiche`（`@name { … }`）

```rust,ignore
impl DsNiche {
    pub fn get_name(&self) -> &syn::Ident;
}
```

只允许单段 ident，`@foo::bar` 是 parse 错。

### `DsMatch` 与 `DsMatchArm`

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

`DsMatch` 是唯一一种**子节点不在外围 `DsTree` 上**的节点。它们按 arm 切分，每个 arm 自带 `get_children()`。正因如此，`inscribe_match` 收的是 `arms: &[DsMatchArm]`，符文师写双层循环。例子见 [绑定符文 § 在你自己 crate 里安奉 xrune](binding.md)。

## 自定义关键字

`walk`、`with`、`on` 由 `syn::custom_keyword!` 注册，不能拿来当部件名、属性名或任何其他 ident。parser 在 widget peek 之前先派发它们，所以 `on Foo` 不会被误认成名为 `on` 的部件。

## 不需要操心的几个

下面这些虽然 public，但只跟 parser 或 xrune 自身有关：

- **`DsContext` / `DsContextRef`**，标了 `#[allow(dead_code)]`，是辅助结构，不在 inscribe 路径上。
- **`DsNodeIsMe`**，每个节点 parser 都要实现的 peek 协议；只有 `DsNode::what_type()` 调用它。
- **`DsTreeRef` 内里的 `Rc<RefCell<DsTree>>`**，给 `decipher` 在多次借用之间共享子节点用。在符文师里通常不需要克隆或操纵这个 `Rc`。

## 源码出处

上述类型全在 `crates/xrune_nexus/src/ds_node/`，每个类型一个文件：`ds_root.rs`、`ds_widget.rs`、`ds_attr.rs`、`ds_on.rs`、`ds_if.rs`、`ds_iter.rs`、`ds_niche.rs`、`ds_match.rs`、`node_enum.rs`。消费它们的 DsRune trait 在 `crates/xrune_nexus/src/ds_rune/mod.rs`；`decipher` 遍历器紧挨着它。
