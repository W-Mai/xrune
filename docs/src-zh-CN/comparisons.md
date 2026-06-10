# 同道比较

xrune 立身于一片 Rust DSL / UI 宏林立的同道之间。要快速摸清它在哪一档：

|  | xrune | typed-builder 风 DSL（`leptos::view!` / `dioxus::rsx!` / `yew::html!`） | macro-by-example 类（`maud` / `html!`） |
| --- | --- | --- | --- |
| 校验时机 | 符文师阶段。DSL 自身接受任意 ident 作部件，任意 `syn::Expr` 作属性值。 | parse 时。部件名是具体类型，属性 map 到 typed setter。 | 多在编译期，但绑死在固定语法（HTML）。 |
| 部件词汇 | 开放。你的符文师认什么、就有什么。 | 封闭。host crate 的组件库定义有什么。 | 封闭。绑死单一输出（HTML）。 |
| 一套语法的后端数 | 多。一套 DSL → 多个符文师（renderer / ECS / 格式化器 / 分析器…）。 | 一。DSL 与框架捆绑。 | 一。 |
| 你写代码生成的位置 | 在自己 crate 里写 `DsRune` 实现。 | 框架内置。 | 在宏内部。 |
| 属性值的类型检查 | parse 期没有；由符文师定。 | 强；属性变成 typed builder 调用。 | 限于宏 pattern-match 能做的。 |
| 迭代/条件/match | 一等公民 DSL 节点（`walk` / `if` / `match`）。 | 通常委托给宏内的 inline Rust 表达式。 | inline Rust。 |

## 何时召请 xrune

- 宿主已有自己的组件 / 状态 / 渲染机关，想在上层加一层咏唱，但**不愿**把咏唱绑死在那套类型上。
- 渲染目标尚未敲定，但表层咏唱要先立。
- 一套语法要被多种消费者共享，比如**一位** ECS 运行时符文师 + **一位**誊章符文师 + **一位**静态分析符文师。

## 何时另请高明

- 你想要部件名与属性值在编译期就强类型化，去 typed-builder 风格的 DSL（`leptos`、`dioxus`、`yew`、或者直接 `typed-builder`）。xrune 故意把所有类型层校验扔给符文师。
- 你的输出就是 HTML，对可插拔后端没兴趣，`maud` / `html!` 在那个目标上更紧凑。
- 你想要现成的部件库，xrune 一个不带。野外的符文师都自带组件。

## 一幅约略的心象

> typed-builder 风 DSL 把语法面焊死在一个后端上，换来安全。xrune 反过来，它焊死的是**咏唱形态**（一个 parser、一棵树、一种遍历），后端可以是任何能塞进 `DsRune` 七方法 trait 的东西。

两者都是合理的取舍。当「部件到底干什么」本身就是个流动问题时，xrune 是合手的工具。
