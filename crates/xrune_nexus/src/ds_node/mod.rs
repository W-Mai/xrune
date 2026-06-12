pub mod ds_attr;
pub mod ds_context;
pub mod ds_custom_token;
pub mod ds_if;
pub mod ds_iter;
pub mod ds_match;
pub mod ds_niche;
pub mod ds_on;
pub mod ds_root;
pub mod ds_traits;
pub mod ds_widget;
pub mod node_enum;
pub mod reactive;

use std::fmt::{Debug, Formatter};
use syn::parse::{Parse, ParseStream};

pub use ds_root::DsRoot;
use node_enum::DsNode;
use xrune_sigil::DsRef;

#[derive(DsRef)]
pub struct DsTree {
    parent: Option<DsTreeRef>,

    node: DsNode,

    children: Vec<DsTreeRef>,
}

impl DsTree {
    pub fn set_parent(&mut self, parent: DsTreeRef) {
        self.parent = Some(parent);
    }

    pub fn get_node(&self) -> &DsNode {
        &self.node
    }

    pub fn get_children(&self) -> &[DsTreeRef] {
        &self.children
    }
}

impl Debug for DsTree {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let parent = match &self.parent {
            None => "None",
            Some(tree) => match tree.borrow().node {
                DsNode::Root(_) => "Root",
                DsNode::Widget(_) => "Widget",
                DsNode::If(_) => "If",
                DsNode::Iter(_) => "Iter",
                DsNode::Niche(_) => "Niche",
                DsNode::Match(_) => "Match",
            },
        };
        f.write_fmt(format_args!(
            "{{ parent: {}, node: {:?}, children: {:?} }}",
            parent, self.node, self.children
        ))
    }
}

impl Parse for DsTree {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        use ds_on::DsOn;
        use ds_traits::DsNodeIsMe;

        let mut node = DsNode::parse(input)?;

        let needs_body = matches!(node, DsNode::If(_) | DsNode::Iter(_) | DsNode::Niche(_));
        let has_braces = input.peek(syn::token::Brace);

        let children = if needs_body || has_braces {
            let content;
            syn::braced!(content in input);
            parse_children_with_trailing_on(&content)?
        } else {
            Vec::new()
        };

        while DsOn::is_me(input) {
            let on_handler = input.parse::<DsOn>()?;
            match &mut node {
                DsNode::Widget(w) => w.append_on_handler(on_handler),
                _ => {
                    return Err(syn::Error::new(
                        on_handler.get_name().span(),
                        "`on EventKind` can only follow a widget; if / walk / match / @niche \
                         cannot carry handlers directly",
                    ));
                }
            }
        }

        Ok(DsTree {
            parent: None,
            node,
            children,
        })
    }
}

pub(crate) fn parse_children_with_trailing_on(input: ParseStream) -> syn::Result<Vec<DsTreeRef>> {
    use ds_on::DsOn;
    use ds_traits::DsNodeIsMe;

    let mut children = Vec::new();
    while !input.is_empty() {
        if DsOn::is_me(input) {
            let on_handler = input.parse::<DsOn>()?;
            let last = children.last().cloned().ok_or_else(|| {
                syn::Error::new(
                    on_handler.get_name().span(),
                    "`on EventKind` must follow a widget; place it after a `Widget()` form, \
                         or between attrs and children as `Widget() on EventKind {} {}`",
                )
            })?;
            attach_on_to_last_widget(&last, on_handler)?;
        } else {
            let child = DsTree::parse(input)?.into_ref();
            child.borrow_mut().set_parent(child.clone());
            children.push(child);
        }
    }
    Ok(children)
}

fn attach_on_to_last_widget(tree: &DsTreeRef, on_handler: ds_on::DsOn) -> syn::Result<()> {
    let mut borrowed = tree.borrow_mut();
    match &mut borrowed.node {
        DsNode::Widget(w) => {
            w.append_on_handler(on_handler);
            Ok(())
        }
        _ => Err(syn::Error::new(
            on_handler.get_name().span(),
            "`on EventKind` can only follow a widget; if / walk / match / @niche cannot \
             carry handlers directly",
        )),
    }
}
