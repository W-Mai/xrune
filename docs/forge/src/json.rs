//! A tiny JSON writer. The Forge emits one document per casting, so a
//! serializer dependency would cost more wasm bytes than it saves.

use proc_macro2::{LineColumn, Span};

pub fn esc(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{2028}' => out.push_str("\\u2028"),
            '\u{2029}' => out.push_str("\\u2029"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

pub struct Obj {
    buf: String,
    first: bool,
}

impl Obj {
    pub fn new() -> Self {
        Obj {
            buf: String::from("{"),
            first: true,
        }
    }

    fn key(&mut self, k: &str) {
        if !self.first {
            self.buf.push(',');
        }
        self.first = false;
        self.buf.push_str(&esc(k));
        self.buf.push(':');
    }

    pub fn str(mut self, k: &str, v: &str) -> Self {
        self.key(k);
        self.buf.push_str(&esc(v));
        self
    }

    pub fn opt_str(self, k: &str, v: Option<&str>) -> Self {
        match v {
            Some(v) => self.str(k, v),
            None => self.raw(k, "null"),
        }
    }

    pub fn num(mut self, k: &str, v: usize) -> Self {
        self.key(k);
        self.buf.push_str(&v.to_string());
        self
    }

    pub fn bool(mut self, k: &str, v: bool) -> Self {
        self.key(k);
        self.buf.push_str(if v { "true" } else { "false" });
        self
    }

    pub fn raw(mut self, k: &str, json: &str) -> Self {
        self.key(k);
        self.buf.push_str(json);
        self
    }

    pub fn finish(mut self) -> String {
        self.buf.push('}');
        self.buf
    }
}

pub fn arr(items: &[String]) -> String {
    let mut out = String::from("[");
    out.push_str(&items.join(","));
    out.push(']');
    out
}

/// `[startLine, startCol, endLine, endCol]`, lines 1-based, columns 0-based
/// in chars. `null` for spans that carry no source position (call-site).
pub fn range(r: Option<(LineColumn, LineColumn)>) -> String {
    match r {
        Some((a, b)) if a.line > 0 => {
            format!("[{},{},{},{}]", a.line, a.column, b.line, b.column)
        }
        _ => "null".to_string(),
    }
}

pub fn span(s: Span) -> String {
    range(Some((s.start(), s.end())))
}

pub fn error(message: &str, at: Option<Span>) -> String {
    Obj::new()
        .bool("ok", false)
        .str("version", env!("CARGO_PKG_VERSION"))
        .str("error", message)
        .raw("span", &at.map(span).unwrap_or_else(|| "null".into()))
        .finish()
}
