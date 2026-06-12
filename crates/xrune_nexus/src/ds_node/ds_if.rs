use super::ds_traits::DsNodeIsMe;
use quote::ToTokens;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsIf {
    condition: syn::Expr,
    reactive: bool,
}

impl DsIf {
    pub fn get_condition(&self) -> &syn::Expr {
        &self.condition
    }

    pub fn is_reactive(&self) -> bool {
        self.reactive
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
        let (condition, reactive) = super::reactive::reactive_or_expr(input)?;
        Ok(DsIf {
            condition,
            reactive,
        })
    }
}

impl DsNodeIsMe for DsIf {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Token![if])
    }
}
