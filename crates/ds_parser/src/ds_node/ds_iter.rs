use super::ds_traits::DsNodeIsMe;
use crate::ds_node::ds_custom_token;
use quote::ToTokens;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsIter {
    iterable: syn::Expr,
    variable: syn::Ident,
}

impl DsIter {
    pub fn get_iterable(&self) -> &syn::Expr {
        &self.iterable
    }

    pub fn get_variable(&self) -> &syn::Ident {
        &self.variable
    }
}

impl Debug for DsIter {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{{iterable: {:?}, variable: {:?}}}",
            self.iterable.to_token_stream().to_string(),
            self.variable
        )
    }
}

impl Parse for DsIter {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<ds_custom_token::walk>()?;
        let iterable = input.parse::<syn::Expr>()?;
        input.parse::<ds_custom_token::with>()?;
        let variable = input.parse::<syn::Ident>()?;
        Ok(DsIter { iterable, variable })
    }
}

impl DsNodeIsMe for DsIter {
    fn is_me(input: ParseStream) -> bool {
        input.peek(ds_custom_token::walk)
    }
}
