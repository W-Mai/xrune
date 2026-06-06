use super::ds_traits::DsNodeIsMe;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsNiche {
    name: syn::Ident,
}

impl DsNiche {
    pub fn get_name(&self) -> &syn::Ident {
        &self.name
    }
}

impl Debug for DsNiche {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Niche({})", self.name)
    }
}

impl Parse for DsNiche {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<syn::Token![@]>()?;
        let name = input.parse::<syn::Ident>()?;
        Ok(DsNiche { name })
    }
}

impl DsNodeIsMe for DsNiche {
    fn is_me(input: ParseStream) -> bool {
        input.peek(syn::Token![@])
    }
}
