# 绑定符文

一位 *符文师* 即一个后端：`DsRune` trait 的一份实现。parser 把树交给你；符文师把树翻成最终发出的代码。

本章逐方法走完 trait，再以内置的 `DefaultRune` 作工坊范本细读。

## 师契

`DsRune` 申明 **七** 道方法。**没有任何一道带默认实现**：每一位具象的符文师都得给齐七道。

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

    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]);

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[DsTreeRef],
    );

    fn inscribe_niche(&mut self, name: &syn::Ident, children: &[DsTreeRef]);

    fn inscribe_match(&mut self, scrutinee: &syn::Expr, arms: &[DsMatchArm]);

    fn seal(self) -> proc_macro2::TokenStream;
}
```

## `decipher` 怎么调它们

`decipher(tree, &mut rune)` 遍历 AST，把节点逐一派给 inscribe 方法。要害一句：

> **`decipher` 只对 root 自动下钻。** 其余 inscribe 方法都只收一道 `children`（`inscribe_match` 收的是 `arms`，每个 arm 自带 children），**自己负责往下递归**。

> ⚠ **这是 xrune 最常见的坑。** 如果你的 `inscribe_widget` 收下 `children` 之后**没**调 `decipher(child, self)`，那棵子树会被**静默丢弃**，不报错、不警告，只是输出里突然少了几层节点。所有非 root 的 inscribe 方法都得自己跑那个递归。

这意味着典型的 `inscribe_widget` 长这样：

```rust,ignore
fn inscribe_widget(
    &mut self,
    name: &syn::Ident,
    attrs: &[DsAttr],
    enchants: &[syn::Expr],
    on_handlers: &[DsOn],
    children: &[DsTreeRef],
) {
    /* … 为 `name` / `attrs` 等发出 widget 构造代码 … */

    for child in children {
        decipher(child, self);   // 不写这行 → 子节点全部丢失
    }

    /* … 子节点走完后的收尾 … */
}
```

`inscribe_if` / `inscribe_iter` / `inscribe_niche` 跟它形态相同：单层 `for child in children`。

`inscribe_match` 比较特殊：trait 签名只收 `arms: &[DsMatchArm]`，**没**单独的 children slice。每个 arm 自带 `get_children()`，所以要写**双层循环**，外层走 arms，内层走每个 arm 的子树：

```rust,ignore
fn inscribe_match(&mut self, scrutinee: &syn::Expr, arms: &[DsMatchArm]) {
    /* … 发出 match 头 … */

    for arm in arms {
        /* … 发出本条 arm 的 pattern 头 … */
        for child in arm.get_children() {
            decipher(child, self);
        }
        /* … 发出本条 arm 的尾 … */
    }
}
```

深度由符文师驱动，`decipher` 一次只派一层。这是有意为之：把**顺序**（先发父再发子、父子交错、还是要等整棵子树看完才发）和**作用域**（递归前往栈里压一个 parent 符号、回来后弹掉）的全部权力都还给符文师。

## 封印一道

`seal(self) -> TokenStream` 在末尾按值消费符文师。一路 inscribe 累积进符文师内部，通常是一道 `proc_macro2::TokenStream` 字段，由 `seal` 一次还出去。

```rust,ignore
struct MyRune {
    out: proc_macro2::TokenStream,
}

impl DsRune for MyRune {
    /* … inscribe_* 方法靠 quote! { … } 把内容串进 self.out … */

    fn seal(self) -> proc_macro2::TokenStream {
        self.out
    }
}
```

`seal` 按值收 `self` 是有意的：让收尾这一步只发生一次。要做累积态的检查或后处理，就在 `seal` 内部跑。

> 这里的「seal」是 trait 方法名，跟 Rust 的 [sealed-trait 习语](https://rust-lang.github.io/api-guidelines/future-proofing.html) 同名不同义。

## 父级上下文：保存→设当前→递归→还原

后端常常要知道当前子节点正被 spawn 到哪个部件之下。`DefaultRune` 用的、真实 ECS 风符文师也都靠这一招：

```rust,ignore
fn inscribe_widget(&mut self, name: &syn::Ident, /* … */ children: &[DsTreeRef]) {
    let name_string = name.to_string();           // 1. 把 syn::Ident 转成 String
    let prev_parent = self.parent_name.clone();   // 2. 保存当前 parent 身份
    self.parent_name = name_string;               // 3. 把当前部件设为新 parent

    /* … 这里发的代码可以引用 `self.parent_name` … */

    for child in children {                       // 4. 子节点们看到的 parent 就是当前 widget
        decipher(child, self);
    }

    self.parent_name = prev_parent;               // 5. 走完还原，让下一个兄弟看到的 parent 跟我同级
}
```

这个形态把 parent 身份穿过任意层嵌套，**不动用全局**。

## 工坊范本：`DefaultRune`

内置的参考符文师就在 [`crates/xrune/src/default_rune.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune/src/default_rune.rs)，是七道方法最干净的现成实现。从头读到尾即可：每个 inscribe 处理器几行而已，parent 压入还原的形态一望即知，`seal` 还出累积好的 `println!` 形 `TokenStream`。

`DefaultRune` 在仓库里实际有**两份内容相同的实现**：

- `xrune::default_rune::DefaultRune`，公开、文档化，写自己符文师时照着抄的那一份。
- 藏在 `xrune-incant` 内部的私本，`ui! { … }` 宏展开时实际跑的那一份。

**为什么两份？** 因为 `xrune-incant` 是 proc-macro crate，Rust 编译器有一条硬规矩：

> proc-macro crate 对外只能导出 `#[proc_macro]` / `#[proc_macro_derive]` / `#[proc_macro_attribute]` 这三类宏函数。crate 里**所有**的 `pub struct` / `pub fn` / `pub mod`，对任何下游 crate 都不可见。

所以哪怕 `xrune-incant` 的 `DefaultRune` 标了 `pub`，下游想写 `pub use xrune_incant::DefaultRune;` 编译器也会拒收：

```text
error[E0432]: unresolved import `xrune_incant::DefaultRune`
  no `DefaultRune` in the root
```

`xrune-incant` 只能在内部留一份私本给自家 `ui!` expansion 用。`xrune` 拿不到那份，于是自己另写了一份独立的 `default_rune` 模块，作为对读者公开的"参考实现"。两份逻辑与输出按字节对齐，只差在可见性。

（理论上可以把 `default_rune` 沉到 `xrune-nexus` 让两边都 import，但那会把后端代码，以及它带来的 `quote` 依赖，拖进核心。`xrune-nexus` 要保持只有 AST、`DsRune` trait、`decipher`，不绑定任何具体后端。）

## `ui! { … }` 实际做了什么

这个过程宏**不是**扩展点。它的全部函数体：

```rust,ignore
#[proc_macro]
pub fn ui(input: TokenStream) -> TokenStream {
    let root = parse_macro_input!(input as DsRoot);
    let mut rune = DefaultRune::new();        // ← 写死的
    rune.inscribe_root(&root.get_parent());
    decipher(&root.get_content(), &mut rune);
    TokenStream::from(rune.seal())
}
```

那行 `DefaultRune::new()` **是字面意义上的写死**。`ui!` 的调用者**没有任何接口**能换成别的符文师。所以你在自家代码里写 `ui! { … }`，宏展开后塞回源码的，就是 `DefaultRune` 那份 println 形态的 `TokenStream`，仅此而已。

明白讲：**`ui!` 是「parser → `decipher` → `seal` 整条管子能跑通」的演示**，不是真后端的入口。

## 在你自己 crate 里宿主 xrune

要做真后端，你**不调** `ui!`。你新建**自己的 proc-macro crate**，把那五行宿主样板抄过去，把 `DefaultRune` 换成自己的符文师。形态如下：

**`my-host-incant/Cargo.toml`**

```toml
[package]
name = "my-host-incant"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
xrune = "1.5"
syn = "2"
proc-macro2 = "1"
quote = "1"
```

`xrune` 是 umbrella 主 crate，重导出了 `xrune-nexus`（parser、`DsRune` trait、`decipher` 走脚），且把 `xrune::default_rune::DefaultRune` 暴露成可抄写的参考符文师。你也可以直接依赖 `xrune-nexus` 跳过 umbrella，但走 `xrune` 路径更短，调试期还能直接用公本 `DefaultRune` 占位。

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

宏起一个**自己的名字**（`my_ui`、`bevy_ui`，随意）。`my_rune.rs` 里实现七道 `DsRune` 方法，发出你宿主真正需要的 spawn / render / 任何代码。开发期可以先把 `MyRune::new()` 换成 `xrune::default_rune::DefaultRune::new()`，让自己的宏先跑出 println trace，验证管子接好。

下游用户这样写：

```rust,ignore
use my_host_incant::my_ui;

my_ui! {
    :(
        parent: world
    :)
    /* … xrune 接受的同一套咏唱语法 … */
}
```

同一套 DSL，你的代码生成。

`xrune-fmt`（誊章）是同一类消费者的另一种形态：它走同一个 parser，但**不**实现 `DsRune`，直接遍历 `DsTree` 重新打印。这是第三种形态的消费者（离线工具），如果你想做的是分析或重排，而不是发出运行时代码，可以走这条路。

## 接下来去哪

- 拿 `DefaultRune` 跟 [誊章](scribe.md) 里的格式化器对照：两者走的是同一棵树，但只有一边实现 `DsRune`。差别处即学习处。
- [流变志](codex.md) 记录 trait 在跨版本之间的形态流转。
