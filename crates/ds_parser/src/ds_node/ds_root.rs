use std::fmt::Debug;
use std::ops::Deref;
use syn::parse::{Parse, ParseStream};
use syn::spanned::Spanned;

use crate::ds_node::ds_attr::DsAttr;
use crate::ds_node::node_enum::DsNode;
use crate::ds_node::{DsTree, DsTreeRef};

pub struct DsRoot {
    parent: syn::Expr,
    content: DsTreeRef,
}

impl DsRoot {
    pub fn get_parent(&self) -> syn::Expr {
        self.parent.clone()
    }

    pub fn get_content(&self) -> DsTreeRef {
        self.content.clone()
    }
}

impl Deref for DsRoot {
    type Target = DsTreeRef;

    fn deref(&self) -> &Self::Target {
        &self.content
    }
}

impl Debug for DsRoot {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DsRoot")
            .field("parent", &self.parent.span().unwrap())
            .field("content", &self.content)
            .finish()
    }
}

impl Parse for DsRoot {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let err = syn::Error::new(input.span(), "Root node must have a parent");

        if input.peek(syn::Token![:]) {
            input.parse::<syn::Token![:]>()?;

            let mut attrs = Vec::<DsAttr>::new();
            let params;
            syn::parenthesized!(params in input);
            while !params.is_empty() {
                attrs.push(params.parse()?);
                if params.peek(syn::Token![:]) {
                    params.parse::<syn::Token![:]>()?;
                }
            }

            let parent_attr = attrs.iter().find(|attr| attr.name == "parent").ok_or(err)?;
            let parent = parent_attr.value.clone();
            let content = DsTree::parse(input)?.into_ref();
            content.borrow_mut().set_parent(
                DsTree {
                    parent: None,
                    node: DsNode::Root(parent.clone()),
                    children: vec![],
                }
                .into_ref(),
            );

            Ok(DsRoot { parent, content })
        } else {
            Err(err)
        }
    }
}
