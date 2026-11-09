# 被拒形态

不是每一种**看起来合理**的形态都能 parse。下面的情形都是**有意**拒收：parser 宁可拒收一个有歧义的咒文，也不会替你猜。

## 只有一个顶层节点

一段咒文是一棵树。顶层并列两个兄弟节点会被拒收：

```text
header ()
footer ()      /* parse error: unexpected token */
```

改为把它们包进一个容器部件。

## 上下文头

| 你写的 | 为什么失败 |
| --- | --- |
| `:( parent: r, world: w :)`（多属性单行） | 属性 >1 时必须多行 |

不写上下文头，或上下文头里不写 `parent`，都**不**算错（从 1.10.0 起）：`get_parent()` 回落为 `()`。

## 没 body 的 `if` / `walk` / `match`

```text
if cond                /* parse error: body required */
walk it with x         /* parse error */
match e                /* parse error */
```

控制节点没 body 等于空操作。parser 宁可直接拒绝，不会默许这种形同摆设的语法落地。每个 `elif` 与 `else` 分支同理。

## 分支

| 被拒的写法 | 原因 |
| --- | --- |
| `} else if b { … }` | 关键字是 `elif`；`else` 之后 parser 只等 `{` |
| 前面没有 `if` 的 `else { … }` / `elif c { … }` | 分支只能接在 `if` 后面 |

## 保留字

`walk`、`with`、`by`、`on`、`elif` 是 DSL 的关键字，都不能当部件名。拿来当属性名仍然可以（`row (by: 1)`）。

## `on` 的几种被拒形态

| 被拒的写法 | 原因 |
| --- | --- |
| `on Tap { … }` 写在 root，前面没部件 | `on` 必须有一个兄弟部件可附着 |
| `@slot { … } on Tap { … }` | 只有部件能挂处理器；`if` / `walk` / `match` / 壁龛 / 代码块都不行 |
| `on Tap call_me() {}` | 处理器要么 body 块、要么 `(args)` 形态，不能裸调用 |
| `on Foo::Bar::Baz { … }` | 限定段只允许一段 |
| `on Tap` 既无 body 又无 args | 处理器至少要带其中一种 |

## 壁龛名是单 ident

`@foo::bar { }` 不会 parse：壁龛名是单一 `syn::Ident`。`match` 里的模式则用 `Pat::parse_multi_with_leading_vert` 解析，凡 `syn` 在普通 `match` arm 里接受的，这里都接受。

## 什么**不是**错

部件无子节点合法，`header (text: "x")` 与 `header (text: "x") {}` 解析结果相同。部件不带括号也合法，`container {}` 是零属性零子节点。不带 body 的 `@slot` 或 `@@slot` 是合法的引用或声明，咒文也可以不写 `:( … :)` 上下文头。这些形态都对，读者有时会误以为不行。

## 这些拒收用例藏在哪

body 与 `on` 相关的拒收在 [`crates/xrune_nexus/src/tests.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/tests.rs) 里都有单测，测试名以 `error_*` 起头：真正的 `ui!` 块 parse 失败、错误消息一时又看不出端倪时，那卷 `tests.rs` 是个好去处。其余情形，把咒文贴进[熔炉](https://xrune.to01.icu/#forge)：它跑的是同一个 parser，会指出出错的 token。
