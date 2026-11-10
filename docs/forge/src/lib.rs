//! The Forge — xrune's real parser, `decipher` walk and runes, compiled to
//! WebAssembly for the Grimoire's in-browser playground.
//!
//! The page hands over a casting (the body of a `ui! { … }` block) and gets
//! back one JSON document: the context header, every inscribe call in walk
//! order (`TraceRune`), what the bundled `DefaultRune` seals, and what the
//! scribe (`xrune-fmt`) writes back. Nothing is simulated; the parser is the
//! one published to crates.io from this commit.

mod json;
mod trace;

/// The scribe's formatter, shared verbatim with the `xrune-fmt` binary.
#[path = "../../../crates/xrune_fmt/src/formatter.rs"]
mod formatter;

use std::cell::RefCell;

use proc_macro2::{TokenStream, TokenTree};
use xrune::default_rune::DefaultRune;
use xrune_nexus::ds_node::DsRoot;
use xrune_nexus::ds_rune::DsRune;
use xrune_nexus::ds_rune::decipher::decipher;

use json::Obj;

/// Cast `src` through the parser and every rune; return the JSON report.
pub fn cast(src: &str) -> String {
    let out = cast_inner(src);
    // Each parse appends its text to proc-macro2's span source map. Every
    // span has been turned into numbers by now, so release the map.
    proc_macro2::extra::invalidate_current_thread_spans();
    out
}

fn cast_inner(src: &str) -> String {
    let tokens: TokenStream = match src.parse() {
        Ok(t) => t,
        Err(e) => return json::error(&e.to_string(), Some(e.span())),
    };
    let root: DsRoot = match syn::parse2(tokens) {
        Ok(r) => r,
        Err(e) => return json::error(&e.to_string(), Some(e.span())),
    };

    let context: Vec<String> = root
        .get_context_attrs()
        .iter()
        .map(trace::attr_json)
        .collect();
    let calls = trace::run(&root);

    let mut rune = DefaultRune::new();
    rune.inscribe_root(&root.get_parent());
    decipher(&root.get_content(), &mut rune);
    let sealed = rune.seal();
    let tokens = count(&sealed);

    let scribe = formatter::format_dsl(src, "").map(|f| format!("ui! {{\n{f}}}\n"));

    Obj::new()
        .bool("ok", true)
        .str("version", env!("CARGO_PKG_VERSION"))
        .raw("context", &json::arr(&context))
        .raw("calls", &calls)
        .num("tokens", tokens)
        .str("default", &pretty(sealed))
        .opt_str("scribe", scribe.as_deref())
        .finish()
}

fn count(ts: &TokenStream) -> usize {
    ts.clone()
        .into_iter()
        .map(|tt| match tt {
            TokenTree::Group(g) => 1 + count(&g.stream()),
            _ => 1,
        })
        .sum()
}

/// Wrap the sealed statements in a function so prettyplease can print them.
fn pretty(body: TokenStream) -> String {
    let wrapped = quote::quote! { fn casting() { #body } };
    match syn::parse2::<syn::File>(wrapped) {
        Ok(file) => prettyplease::unparse(&file),
        Err(_) => body.to_string(),
    }
}

// ---- WebAssembly surface -------------------------------------------------

thread_local! {
    static OUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    static PANIC: RefCell<String> = const { RefCell::new(String::new()) };
}

/// Install a panic hook that keeps the message, so the page can show why a
/// rune shattered after the trap.
#[unsafe(no_mangle)]
pub extern "C" fn forge_init() {
    std::panic::set_hook(Box::new(|info| {
        PANIC.with(|p| *p.borrow_mut() = info.to_string());
    }));
}

#[unsafe(no_mangle)]
pub extern "C" fn forge_alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::<u8>::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

/// # Safety
/// `ptr` and `cap` must come from one `forge_alloc` call.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn forge_free(ptr: *mut u8, cap: usize) {
    unsafe { drop(Vec::from_raw_parts(ptr, 0, cap)) };
}

/// Cast the UTF-8 text at `ptr..ptr+len`; returns the byte length of the
/// JSON report, readable at `forge_out_ptr()`.
///
/// # Safety
/// `ptr..ptr+len` must be readable memory.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn forge_cast(ptr: *const u8, len: usize) -> usize {
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let report = cast(&String::from_utf8_lossy(bytes));
    store(report.into_bytes())
}

/// Copy the last panic message into the output buffer; returns its length.
#[unsafe(no_mangle)]
pub extern "C" fn forge_panic() -> usize {
    let msg = PANIC.with(|p| p.borrow().clone());
    store(msg.into_bytes())
}

#[unsafe(no_mangle)]
pub extern "C" fn forge_out_ptr() -> *const u8 {
    OUT.with(|o| o.borrow().as_ptr())
}

fn store(bytes: Vec<u8>) -> usize {
    OUT.with(|o| {
        let len = bytes.len();
        *o.borrow_mut() = bytes;
        len
    })
}

#[cfg(test)]
mod tests {
    use super::cast;

    #[test]
    fn widget_tree_is_traced_in_walk_order() {
        let r = cast("div (width: 100) { text (\"hi\") button () on Tap { save(); } }");
        assert!(r.contains(r#""ok":true"#), "{r}");
        let mut at = 0;
        for needle in [
            "\"m\":\"root\"",
            "\"label\":\"div\"",
            "\"label\":\"text\"",
            "\"label\":\"button\"",
            "\"m\":\"seal\"",
        ] {
            let i = r[at..]
                .find(needle)
                .unwrap_or_else(|| panic!("{needle} missing in {r}"));
            at += i;
        }
        assert!(r.contains(r#""form":"body""#));
    }

    #[test]
    fn every_modern_form_parses() {
        let src = r#"
            :(
                parent: root
                theme: Theme::Dark
            :)
            column {
                if $ready { label ("ok") } elif waiting { spinner () } else { empty () }
                walk $items with item by item.id { row (text: item.name) }
                match state { State::A => { a () } _ => { b () } }
                @@header { title ("fallback") }
                ${ let n = 1; }
                slider (value: $level) on Slider::ValueChanged(commit)
            }
        "#;
        let r = cast(src);
        assert!(r.contains(r#""ok":true"#), "{r}");
        for needle in [
            r#""elif":true"#,
            r#""m":"else""#,
            r#""key":"item.id""#,
            r#""m":"arm""#,
            r#""label":"@@header""#,
            r#""m":"code""#,
            r#""form":"callback""#,
            r#""k":"theme""#,
            r#""r":true"#,
        ] {
            assert!(r.contains(needle), "{needle} missing in {r}");
        }
        assert!(r.contains(r#""scribe":"ui! {"#));
    }

    #[test]
    fn rejected_form_reports_a_located_error() {
        let r = cast("column { on Tap { fire(); } }");
        assert!(r.contains(r#""ok":false"#), "{r}");
        assert!(r.contains("must follow a widget"), "{r}");
        assert!(r.contains(r#""span":[1,"#), "{r}");
    }

    #[test]
    fn source_map_is_released_between_casts() {
        for _ in 0..200 {
            assert!(cast("a () { b () }").contains(r#""ok":true"#));
        }
    }
}
