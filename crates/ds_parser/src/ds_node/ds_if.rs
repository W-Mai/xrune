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
        let condition = input.parse::<syn::Expr>()?;
        Ok(DsIf { condition })
    }
}

impl DsNodeIsMe for DsIf {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Token![if])
    }
}
