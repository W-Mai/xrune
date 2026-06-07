use super::ds_custom_token::on as on_kw;
use super::ds_traits::DsNodeIsMe;
use std::fmt::Debug;
use syn::parse::{Parse, ParseStream};

pub struct DsOn {
    qualifier: Option<syn::Ident>,
    name: syn::Ident,
    args: Vec<syn::Expr>,
    body: syn::Block,
}

impl DsOn {
    pub fn get_qualifier(&self) -> Option<&syn::Ident> {
        self.qualifier.as_ref()
    }

    pub fn get_name(&self) -> &syn::Ident {
        &self.name
    }

    pub fn get_args(&self) -> &[syn::Expr] {
        &self.args
    }

    pub fn get_body(&self) -> &syn::Block {
        &self.body
    }
}

impl Debug for DsOn {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let prefix = match &self.qualifier {
            Some(q) => format!("{}::{}", q, self.name),
            None => self.name.to_string(),
        };
        write!(
            f,
            "On({prefix}, args={}, stmts={})",
            self.args.len(),
            self.body.stmts.len()
        )
    }
}

impl Parse for DsOn {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<on_kw>()?;

        let first: syn::Ident = input.parse()?;
        let (qualifier, name) = if input.peek(syn::Token![::]) {
            input.parse::<syn::Token![::]>()?;
            let name: syn::Ident = input.parse()?;
            if input.peek(syn::Token![::]) {
                return Err(input.error("`on Path::Event` accepts only a single qualifier"));
            }
            (Some(first), name)
        } else {
            (None, first)
        };

        let args = if input.peek(syn::token::Paren) {
            let content;
            syn::parenthesized!(content in input);
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

        let body: syn::Block = input.parse()?;

        Ok(DsOn {
            qualifier,
            name,
            args,
            body,
        })
    }
}

impl DsNodeIsMe for DsOn {
    fn is_me(input: ParseStream) -> bool {
        input.peek(on_kw)
    }
}
