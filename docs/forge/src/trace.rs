//! `TraceRune` records every inscribe call `decipher` makes, in order, with
//! the depth the rune itself chose to recurse at and the source range of the
//! node. It is an ordinary `DsRune`: like any rune, it has to recurse into
//! children on its own, and only `seal` ends the walk.

use std::cell::RefCell;
use std::rc::Rc;

use proc_macro2::{LineColumn, Span, TokenStream};
use quote::ToTokens;
use syn::spanned::Spanned;
use xrune_nexus::ds_node::ds_attr::DsAttr;
use xrune_nexus::ds_node::ds_match::DsMatchArm;
use xrune_nexus::ds_node::ds_on::DsOn;
use xrune_nexus::ds_node::node_enum::DsNode;
use xrune_nexus::ds_node::{DsRoot, DsTreeRef};
use xrune_nexus::ds_rune::DsRune;
use xrune_nexus::ds_rune::decipher::decipher;

use crate::json::{self, Obj};

type Range = Option<(LineColumn, LineColumn)>;

pub struct TraceRune {
    log: Rc<RefCell<Vec<String>>>,
    depth: usize,
    elif_next: bool,
}

/// Walk `root` the way the bundled `ui!` host does: `inscribe_root`, then
/// `decipher` over the content, then `seal`.
pub fn run(root: &DsRoot) -> String {
    let log = Rc::new(RefCell::new(Vec::new()));
    let mut rune = TraceRune {
        log: log.clone(),
        depth: 0,
        elif_next: false,
    };
    rune.inscribe_root(&root.get_parent());
    rune.depth = 1;
    decipher(&root.get_content(), &mut rune);
    rune.depth = 0;
    let _ = rune.seal();
    let items = log.borrow();
    json::arr(&items)
}

pub fn text<T: ToTokens>(t: &T) -> String {
    t.span()
        .source_text()
        .unwrap_or_else(|| t.to_token_stream().to_string())
}

fn range_of(s: Span) -> Range {
    Some((s.start(), s.end()))
}

fn later(a: LineColumn, b: LineColumn) -> LineColumn {
    if (b.line, b.column) > (a.line, a.column) {
        b
    } else {
        a
    }
}

pub fn attr_json(a: &DsAttr) -> String {
    Obj::new()
        .opt_str("k", a.name_str().as_deref())
        .str("v", &text(&a.value))
        .bool("r", a.reactive)
        .finish()
}

fn on_json(on: &DsOn) -> String {
    let name = match on.get_qualifier() {
        Some(q) => format!("{q}::{}", on.get_name()),
        None => on.get_name().to_string(),
    };
    let args: Vec<String> = on.get_args().iter().map(|a| json::esc(&text(a))).collect();
    Obj::new()
        .str("n", &name)
        .raw("a", &json::arr(&args))
        .str(
            "form",
            if on.get_body().is_some() {
                "body"
            } else {
                "callback"
            },
        )
        .finish()
}

impl TraceRune {
    fn rec(&self, kind: &str, label: &str, at: Range, extra: Obj) -> Obj {
        extra
            .str("m", kind)
            .num("d", self.depth)
            .str("label", label)
            .raw("span", &json::range(at))
    }

    fn push(&self, o: Obj) {
        self.log.borrow_mut().push(o.finish());
    }

    fn walk(&mut self, children: &[DsTreeRef], step: usize) {
        self.depth += step;
        for child in children {
            decipher(child, self);
        }
        self.depth -= step;
    }
}

impl DsRune for TraceRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr) {
        let at = range_of(parent_expr.span());
        self.push(self.rec("root", &text(parent_expr), at, Obj::new()));
    }

    fn inscribe_widget(
        &mut self,
        name: &syn::Ident,
        attrs: &[DsAttr],
        enchants: &[syn::Expr],
        on_handlers: &[DsOn],
        children: &[DsTreeRef],
    ) {
        let start = name.span().start();
        let mut end = name.span().end();
        for a in attrs {
            end = later(end, a.value.span().end());
        }
        for e in enchants {
            end = later(end, e.span().end());
        }
        for on in on_handlers {
            end = later(end, on.get_name().span().end());
            for a in on.get_args() {
                end = later(end, a.span().end());
            }
            if let Some(b) = on.get_body() {
                end = later(end, b.span().end());
            }
        }
        let attrs_json: Vec<String> = attrs.iter().map(attr_json).collect();
        let ench: Vec<String> = enchants.iter().map(|e| json::esc(&text(e))).collect();
        let ons: Vec<String> = on_handlers.iter().map(on_json).collect();
        let extra = Obj::new()
            .raw("attrs", &json::arr(&attrs_json))
            .raw("enchants", &json::arr(&ench))
            .raw("on", &json::arr(&ons))
            .num("children", children.len());
        self.push(self.rec("widget", &name.to_string(), Some((start, end)), extra));
        self.walk(children, 1);
    }

    fn inscribe_if(
        &mut self,
        condition: &syn::Expr,
        reactive: bool,
        children: &[DsTreeRef],
        else_branch: Option<&DsTreeRef>,
    ) {
        let elif = std::mem::take(&mut self.elif_next);
        let extra = Obj::new()
            .bool("reactive", reactive)
            .bool("elif", elif)
            .bool("else", else_branch.is_some())
            .num("children", children.len());
        let at = range_of(condition.span());
        self.push(self.rec("if", &text(condition), at, extra));
        self.walk(children, 1);

        if let Some(branch) = else_branch {
            let is_elif = matches!(branch.borrow().get_node(), DsNode::If(_));
            if is_elif {
                self.elif_next = true;
                decipher(branch, self);
            } else {
                self.push(self.rec("else", "else", None, Obj::new()));
                self.depth += 1;
                decipher(branch, self);
                self.depth -= 1;
            }
        }
    }

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        reactive: bool,
        key: Option<&syn::Expr>,
        children: &[DsTreeRef],
    ) {
        let start = iterable.span().start();
        let mut end = later(iterable.span().end(), variable.span().end());
        if let Some(k) = key {
            end = later(end, k.span().end());
        }
        let key_text = key.map(text);
        let extra = Obj::new()
            .str("var", &variable.to_string())
            .opt_str("key", key_text.as_deref())
            .bool("reactive", reactive)
            .num("children", children.len());
        self.push(self.rec("iter", &text(iterable), Some((start, end)), extra));
        self.walk(children, 1);
    }

    fn inscribe_niche(&mut self, name: &syn::Ident, is_declaration: bool, children: &[DsTreeRef]) {
        let sigil = if is_declaration { "@@" } else { "@" };
        let extra = Obj::new()
            .bool("decl", is_declaration)
            .num("children", children.len());
        let at = range_of(name.span());
        self.push(self.rec("niche", &format!("{sigil}{name}"), at, extra));
        self.walk(children, 1);
    }

    fn inscribe_match(&mut self, scrutinee: &syn::Expr, reactive: bool, arms: &[DsMatchArm]) {
        let extra = Obj::new()
            .bool("reactive", reactive)
            .num("arms", arms.len());
        let at = range_of(scrutinee.span());
        self.push(self.rec("match", &text(scrutinee), at, extra));
        self.depth += 1;
        for arm in arms {
            let pat = arm.get_pat();
            let extra = Obj::new().num("children", arm.get_children().len());
            self.push(self.rec("arm", &text(pat), range_of(pat.span()), extra));
            self.walk(arm.get_children(), 1);
        }
        self.depth -= 1;
    }

    fn inscribe_code_block(&mut self, tokens: &TokenStream) {
        let at = if tokens.is_empty() {
            None
        } else {
            range_of(tokens.span())
        };
        self.push(self.rec("code", &text(tokens), at, Obj::new()));
    }

    fn seal(self) -> TokenStream {
        self.push(self.rec("seal", "TokenStream", None, Obj::new()));
        TokenStream::new()
    }
}
