# 被拒形态

不是每一种**看起来合理**的形态都能 parse。下面的情形都是**有意**拒收：parser 宁可拒一个有歧义的咒文，也不会替你猜。

## 上下文头

| 你写的 | 为什么失败 |
| --- | --- |
| `:( :)`（无 `parent`） | `Root node must have a parent` |
| `:( foo: 1 :)` | 同上：缺 `parent` 键 |
| `:( parent: r world: w :)`（多属性单行） | 属性 >1 时必须多行 |

## 没 body 的 `if` / `walk` / `@niche` / `match`

```text
if cond                /* parse error: body required */
walk it with x         /* parse error */
@slot                  /* parse error */
match e                /* parse error */
```

控制节点没 body 等于空操作。parser 宁可直接拒绝，不会默许这种形同摆设的语法落地。

## `on` 的几种被拒形态

| 被拒的写法 | 原因 |
| --- | --- |
| `on Tap { … }` 写在 root，前面没部件 | `on` 必须有一个兄弟部件可附着 |
| `on Tap call_me() {}` | 处理器要么 body 块、要么 `(args)` 形态，不能裸调用 |
| `on Foo::Bar::Baz { … }` | 限定段只允许一段 |
| `on Tap` 既无 body 又无 args | 处理器至少要带其中一种 |

## 壁龛名是单 ident

`@foo::bar { }` 不会 parse：壁龛名是单一 `syn::Ident`。`match` 里的模式则用 `Pat::parse_multi_with_leading_vert` 解析，凡 `syn` 在普通 `match` arm 里接受的，这里都接受。

## 什么**不是**错

部件无子节点合法，`header (text: "x")` 与 `header (text: "x") {}` 解析结果相同。部件不带括号也合法，`container {}` 是零属性零子节点。这些形态都对，读者有时会误以为不行。

## 这些拒收用例藏在哪

每条 error case 在 [`crates/xrune_nexus/src/tests.rs`](https://github.com/W-Mai/xrune/blob/main/crates/xrune_nexus/src/tests.rs) 里都有一条单测。测试名以 `error_*` 起头：真正的 `ui!` 块 parse 失败而错误消息一时看不出端倪时，那张目录是个好去处。
