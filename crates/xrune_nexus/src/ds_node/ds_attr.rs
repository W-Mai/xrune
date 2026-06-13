use quote::{ToTokens, quote};
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsAttr {
    pub name: Option<syn::Ident>,
    pub value: syn::Expr,
    pub reactive: bool,
}

impl DsAttr {
    pub fn name_str(&self) -> Option<String> {
        self.name.as_ref().map(|n| n.to_string())
    }
}

impl Debug for DsAttr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let DsAttr { name, value, .. } = self;
        let name_repr = match name {
            Some(n) => n.to_string(),
            None => "<positional>".to_string(),
        };
        write!(
            f,
            "DsAttr {{ name: {}, value: {:?} }}",
            name_repr,
            value.to_token_stream().to_string()
        )
    }
}

#[derive(Debug)]
pub struct DsAttrs {
    pub attrs: Vec<DsAttr>,
}

impl Parse for DsAttr {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        if input.peek(syn::Ident) && input.peek2(syn::Token![:]) {
            let name = input.parse::<syn::Ident>()?;
            input.parse::<syn::Token![:]>()?;
            let (value, reactive) = super::reactive::reactive_attr_or_expr(input)?;
            Ok(DsAttr {
                name: Some(name),
                value,
                reactive,
            })
        } else {
            let (value, reactive) = super::reactive::reactive_attr_or_expr(input)?;
            Ok(DsAttr {
                name: None,
                value,
                reactive,
            })
        }
    }
}

impl Parse for DsAttrs {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut attrs = Vec::new();

        let params;
        if input.peek(syn::token::Paren) {
            syn::parenthesized!(params in input);
            while !params.is_empty() {
                attrs.push(params.parse()?);
                if params.peek(syn::Token![,]) {
                    params.parse::<syn::Token![,]>()?;
                }
            }
        }

        Ok(DsAttrs { attrs })
    }
}

impl ToTokens for DsAttr {
    fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
        let DsAttr { name, value, .. } = self;
        let name_string = match name {
            Some(n) => n.to_string(),
            None => "<positional>".to_string(),
        };
        let token_string = quote! {
            println!("setAttribute({}, {})", #name_string, stringify!(#value));
        };

        tokens.extend(quote! {
            #token_string
        });
    }
}
