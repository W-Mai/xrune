use super::ds_if::DsIf;
use super::ds_iter::DsIter;
use super::ds_traits::DsNodeIsMe;
use super::ds_widget::DsWidget;
use quote::ToTokens;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

#[derive(Debug)]
pub enum DsNodeType {
    Widget,
    If,
    Iter,
}

pub enum DsNode {
    Root(syn::Expr),
    Widget(DsWidget),
    If(DsIf),
    Iter(DsIter),
}

impl Debug for DsNode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DsNode::Root(expr) => write!(f, "Root({:?})", expr.to_token_stream().to_string()),
            DsNode::Widget(widget) => write!(f, "Widget({:?})", widget),
            DsNode::If(if_node) => write!(f, "If({:?})", if_node),
            DsNode::Iter(iter) => write!(f, "Iter({:?})", iter),
        }
    }
}

impl DsNodeType {
    fn what_type(input: ParseStream) -> DsNodeType {
        if DsWidget::is_me(input) {
            DsNodeType::Widget
        } else if DsIf::is_me(input) {
            DsNodeType::If
        } else if DsIter::is_me(input) {
            DsNodeType::Iter
        } else {
            panic!("Unknown type of DsTree")
        }
    }
}

impl Parse for DsNode {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let tree_type = DsNodeType::what_type(input);

        let node = match tree_type {
            DsNodeType::Widget => DsNode::Widget(input.parse()?),
            DsNodeType::If => DsNode::If(input.parse()?),
            DsNodeType::Iter => DsNode::Iter(input.parse()?),
        };

        Ok(node)
    }
}
