use super::DsTree;
use super::DsTreeRef;
use super::ds_traits::DsNodeIsMe;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsMatchArm {
    pat: syn::Pat,
    children: Vec<DsTreeRef>,
}

impl DsMatchArm {
    pub fn get_pat(&self) -> &syn::Pat {
        &self.pat
    }

    pub fn get_children(&self) -> &[DsTreeRef] {
        &self.children
    }
}

pub struct DsMatch {
    scrutinee: syn::Expr,
    arms: Vec<DsMatchArm>,
}

impl DsMatch {
    pub fn get_scrutinee(&self) -> &syn::Expr {
        &self.scrutinee
    }

    pub fn get_arms(&self) -> &[DsMatchArm] {
        &self.arms
    }
}

impl Debug for DsMatch {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Match(arms={})", self.arms.len())
    }
}

impl Parse for DsMatch {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<syn::Token![match]>()?;
        let scrutinee: syn::Expr = parse_scrutinee(input)?;

        let body;
        syn::braced!(body in input);

        let mut arms = Vec::new();
        while !body.is_empty() {
            let pat = syn::Pat::parse_multi_with_leading_vert(&body)?;
            body.parse::<syn::Token![=>]>()?;

            let arm_content;
            syn::braced!(arm_content in body);

            let mut children = Vec::new();
            while !arm_content.is_empty() {
                let child = DsTree::parse(&arm_content)?.into_ref();
                child.borrow_mut().set_parent(child.clone());
                children.push(child);
            }

            arms.push(DsMatchArm { pat, children });

            if body.peek(syn::Token![,]) {
                body.parse::<syn::Token![,]>()?;
            }
        }

        Ok(DsMatch { scrutinee, arms })
    }
}

impl DsNodeIsMe for DsMatch {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Token![match])
    }
}

fn parse_scrutinee(input: ParseStream) -> syn::Result<syn::Expr> {
    let mut tokens = proc_macro2::TokenStream::new();
    while !input.is_empty() && !input.peek(syn::token::Brace) {
        let tt: proc_macro2::TokenTree = input.parse()?;
        tokens.extend(std::iter::once(tt));
    }
    syn::parse2(tokens)
}
