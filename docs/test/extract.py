"""Extract every ```rust block from docs/src/ + docs/src-zh-CN/ into
docs/test/tests/*.rs files so `cargo test --no-run` compiles them all.

Block fence rules:
  ```rust            -> compile (with `# `-hidden lines unhidden)
  ```rust,ignore     -> skip
  ```rust,no_run     -> compile (don't run)
  ```text / ```toml  -> skip
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOCS_SRC_ROOTS = [ROOT.parent / "src", ROOT.parent / "src-zh-CN"]
OUT_DIR = ROOT / "tests"

FENCE_OPEN = re.compile(r"^```rust(?:,(.*))?\s*$")
FENCE_CLOSE = re.compile(r"^```\s*$")
HIDDEN_LINE = re.compile(r"^# ?")


def extract_blocks(md):
    in_block = False
    flags = []
    buf = []
    n = 0
    for line in md.read_text(encoding="utf-8").splitlines():
        if not in_block:
            m = FENCE_OPEN.match(line)
            if m:
                in_block = True
                flags = (m.group(1) or "").split(",") if m.group(1) else []
                flags = [f.strip() for f in flags if f.strip()]
                buf = []
            continue
        if FENCE_CLOSE.match(line):
            n += 1
            skip = "ignore" in flags or "no_run" in flags
            if not skip:
                yield n, flags, buf
            in_block = False
            buf = []
            flags = []
            continue
        unhidden = HIDDEN_LINE.sub("", line)
        buf.append(unhidden)


def file_slug(md):
    parts = []
    for r in DOCS_SRC_ROOTS:
        try:
            rel = md.relative_to(r)
            parts.append(r.name)
            parts.extend(rel.with_suffix("").parts)
            break
        except ValueError:
            continue
    return "_".join(parts).replace("-", "_").replace(".", "_")


def main():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir()

    total = 0
    for root in DOCS_SRC_ROOTS:
        for md in sorted(root.rglob("*.md")):
            slug = file_slug(md)
            for n, flags, body in extract_blocks(md):
                test_name = f"{slug}__block_{n}"
                out_path = OUT_DIR / f"{test_name}.rs"
                has_main = any("fn main(" in line for line in body)
                main_stub = "" if has_main else f"\nfn main_block_{n}() {{ }}\n"
                content = (
                    f"//! Auto-extracted from {md.relative_to(ROOT.parent)} block #{n}\n"
                    f"//! flags: {flags}\n"
                    "#![allow(unused, dead_code, unused_imports, non_snake_case, "
                    "non_upper_case_globals, non_camel_case_types)]\n"
                    "\n"
                    + "\n".join(body)
                    + main_stub
                )
                out_path.write_text(content, encoding="utf-8")
                total += 1
    print(f"  extracted {total} test files into {OUT_DIR.relative_to(ROOT.parent.parent)}")


if __name__ == "__main__":
    main()