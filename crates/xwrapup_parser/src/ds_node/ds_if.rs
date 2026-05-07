use super::ds_traits::DsNodeIsMe;
use quote::ToTokens;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsIf {
    condition: syn::Expr,
}

impl DsIf {
    pub fn get_condition(&self) -> &syn::Expr {
        &self.condition
    }
}

impl Debug for DsIf {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "If({:?})", self.condition.to_token_stream().to_string())
    }
}

impl Parse for DsIf {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<syn::Token![if]>()?;
        // Parse condition without consuming the braces (which are for children)
        let condition: syn::Expr = input.call(expr_without_block)?;
        Ok(DsIf { condition })
    }
}

fn expr_without_block(input: ParseStream) -> syn::Result<syn::Expr> {
    let mut tokens = proc_macro2::TokenStream::new();
    while !input.is_empty() && !input.peek(syn::token::Brace) {
        let tt: proc_macro2::TokenTree = input.parse()?;
        tokens.extend(std::iter::once(tt));
    }
    syn::parse2(tokens)
}

impl DsNodeIsMe for DsIf {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Token![if])
    }
}
