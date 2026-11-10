# 工坊

工作区怎么排列、`cargo xtask` 给维护者哪些手段。这一章是给贡献者看的。终端用户只需要 [第一次咏唱](first-incantation.md) 和 [绑定符文](binding.md)。

## 五位 crate 加一名 xtask

```
xrune/
├─ crates/
│  ├─ xrune-sigil      ← derive 宏：`#[derive(DsRef)]`
│  ├─ xrune-nexus      ← AST + DsRune trait + decipher
│  ├─ xrune-incant     ← 过程宏：`ui! { … }`
│  ├─ xrune            ← 聚合入口：重导出 nexus + ui!，并放 default_rune
│  └─ xrune-fmt        ← CLI 二进制：誊章
├─ docs/
│  ├─ src/, src-zh-CN/ ← 这本魔典，英文与中文
│  ├─ landing/         ← 站点根目录的落地页
│  ├─ forge/           ← 熔炉：编译到 wasm32 的 parser（独立工作区）
│  └─ test/            ← doctest 一步编译的一次性 crate
├─ examples/
│  └─ example0         ← 经典 hello-world fixture
└─ xtask/              ← CI/build/test/lint/doctest/forge/site/bump/publish/release
```

五位发版 crate 同住一座工作区，同步推一道版号。`cargo install xrune` 顺带把 `xrune-incant` 与 `xrune-nexus` 间接拉进来。

`xtask` 标了 `publish = false`，**永不**进 crates.io。它只为驱动工作区本身存在。

## `cargo xtask` 命令面

```text
cargo xtask <ci|build|test|lint|doctest|forge|site [--out <dir>] [--book]|bump <level>|publish [--dry-run]|release>
```

- **`ci`**：依次跑 `build` + `test` + `lint` + `doctest` + `forge`。`.github/workflows/ci.yml` 调的就是它。本地绿 = CI 绿。
- **`build`**：`cargo build --workspace`。
- **`test`**：`cargo test --workspace`。
- **`lint`**：`cargo +stable clippy --workspace -- -D warnings`，再跑 `cargo +stable fmt --all --check`。`+stable` toolchain 是为了跟 CI 对齐。
- **`doctest`**：把 `docs/src/` 与 `docs/src-zh-CN/` 里所有 ` ```rust ` 块抽出来，倒进 `docs/test/` 这个一次性测试 crate 里跑 `cargo build --tests`。文档跟实现脱节会被它当场抓住。
- **`forge`**：对 `docs/forge` 跑 clippy（`-D warnings`）、`fmt --check` 与测试。熔炉的目标是 wasm32，所以单独成一个工作区，工作区级的那几步碰不到它。
- **`site [--out <dir>] [--book]`**：把发布用的站点装配到 `target/site`（或 `<dir>`）：落地页与字体、为 `wasm32-unknown-unknown` 构建的熔炉，带 `--book` 时再加上两棵 mdBook。`.github/workflows/docs.yml` 部署的就是这个目录；本地起个静态服务指向它，就能预览整站。需要先 `rustup target add wasm32-unknown-unknown`。
- **`bump <major|minor|patch>`**：递归改写每个 `Cargo.toml` 的版本（workspace 那一处加上 `[workspace.dependencies]` 里五条 `version = "=X.Y.Z"` 锁版）。**禁止**手改版号。
- **`publish [--dry-run]`**：按固定顺序推 crates.io：`xrune-sigil → xrune-nexus → xrune-incant → xrune → xrune-fmt`，每个 crate 之间 sleep 30 秒等 crates.io 索引刷新。已发布的会被跳过。**别直接调它**，走 `release`。
- **`release`**：发版的唯一通路。先要工作区干净，然后内部按顺序：push `main` → 通过 `gh run list` 等 CI 全绿（10 分钟超时）→ 打 `vX.Y.Z` 标签 → 推 tag → `gh release create --generate-notes` → 调 `publish`。

## 工作区约定

- `[workspace.package].version` 是版号唯一来源。`[workspace.dependencies]` 里五条 crate 各用 `version = "=X.Y.Z"` 精确锁版，确保五位永远同步推进。
- `Cargo.lock` 已 gitignore，这是工作区有意为之，不是疏忽。
- `default-members = ["crates/*"]`，在仓库根 `cargo build` 只会构发版 crate，不动 `xtask` 或 `examples/`。
- 整个工作区 `edition = "2024"`。
- `resolver = "2"`，让 cargo 走现代 feature 统一规则。

## 源码出处

- 工作区 manifest：[`Cargo.toml`](https://github.com/W-Mai/xrune/blob/main/Cargo.toml)
- xtask：[`xtask/src/main.rs`](https://github.com/W-Mai/xrune/blob/main/xtask/src/main.rs)
- CI：[`.github/workflows/ci.yml`](https://github.com/W-Mai/xrune/blob/main/.github/workflows/ci.yml)
- 站点部署：[`.github/workflows/docs.yml`](https://github.com/W-Mai/xrune/blob/main/.github/workflows/docs.yml)
