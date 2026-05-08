use super::ds_attr::DsAttrs;
use super::ds_traits::DsNodeIsMe;
use crate::ds_node::ds_custom_token::is_custom_keyword;
use syn::parse::{Parse, ParseStream};

pub struct DsWidget {
    name: syn::Ident,
    attrs: DsAttrs,
    enchants: Vec<syn::Expr>,
}

impl std::fmt::Debug for DsWidget {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DsWidget")
            .field("name", &self.name.to_string())
            .field("attrs", &self.attrs)
            .field("enchants_count", &self.enchants.len())
            .finish()
    }
}

impl DsWidget {
    pub fn get_name(&self) -> &syn::Ident {
        &self.name
    }

    pub fn get_attrs(&self) -> &DsAttrs {
        &self.attrs
    }

    pub fn get_enchants(&self) -> &[syn::Expr] {
        &self.enchants
    }
}

impl Parse for DsWidget {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let name = input.parse::<syn::Ident>()?;
        let attrs = input.parse::<DsAttrs>()?;

        // Optional enchants: [expr, expr, ...]
        let enchants = if input.peek(syn::token::Bracket) {
            let content;
            syn::bracketed!(content in input);
            let mut exprs = Vec::new();
            while !content.is_empty() {
                exprs.push(content.parse::<syn::Expr>()?);
                if content.peek(syn::Token![,]) {
                    content.parse::<syn::Token![,]>()?;
                }
            }
            exprs
        } else {
            Vec::new()
        };

        Ok(DsWidget {
            name,
            attrs,
            enchants,
        })
    }
}

impl DsNodeIsMe for DsWidget {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Ident) && !is_custom_keyword(input)
    }
}
