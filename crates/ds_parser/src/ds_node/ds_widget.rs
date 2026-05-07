use super::ds_attr::DsAttrs;
use super::ds_traits::DsNodeIsMe;
use crate::ds_node::ds_custom_token::is_custom_keyword;
use syn::parse::{Parse, ParseStream};

#[derive(Debug)]
pub struct DsWidget {
    name: syn::Ident,
    attrs: DsAttrs,
}

impl DsWidget {
    pub fn get_name(&self) -> &syn::Ident {
        &self.name
    }

    pub fn get_attrs(&self) -> &DsAttrs {
        &self.attrs
    }
}

impl Parse for DsWidget {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let name = input.parse::<syn::Ident>()?;
        let attrs = input.parse::<DsAttrs>()?;
        Ok(DsWidget { name, attrs })
    }
}

impl DsNodeIsMe for DsWidget {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Ident) && !is_custom_keyword(input)
    }
}
