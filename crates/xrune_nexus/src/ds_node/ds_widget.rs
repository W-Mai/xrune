use super::ds_attr::DsAttrs;
use super::ds_on::DsOn;
use super::ds_traits::DsNodeIsMe;
use crate::ds_node::ds_custom_token::is_custom_keyword;
use syn::parse::{Parse, ParseStream};

pub struct DsWidget {
    name: syn::Ident,
    attrs: DsAttrs,
    enchants: Vec<syn::Expr>,
    on_handlers: Vec<DsOn>,
}

impl std::fmt::Debug for DsWidget {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DsWidget")
            .field("name", &self.name.to_string())
            .field("attrs", &self.attrs)
            .field("enchants_count", &self.enchants.len())
            .field("on_handlers", &self.on_handlers.len())
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

    pub fn get_on_handlers(&self) -> &[DsOn] {
        &self.on_handlers
    }

    pub(crate) fn append_on_handler(&mut self, handler: DsOn) {
        self.on_handlers.push(handler);
    }
}

impl Parse for DsWidget {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let name = input.parse::<syn::Ident>()?;
        let attrs = input.parse::<DsAttrs>()?;

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

        let mut on_handlers = Vec::new();
        while DsOn::is_me(input) {
            on_handlers.push(input.parse::<DsOn>()?);
        }

        Ok(DsWidget {
            name,
            attrs,
            enchants,
            on_handlers,
        })
    }
}

impl DsNodeIsMe for DsWidget {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Ident) && !is_custom_keyword(input)
    }
}
