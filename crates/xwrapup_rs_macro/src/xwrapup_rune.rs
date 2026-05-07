use proc_macro2::TokenStream;
use quote::quote;

use ds_parser::ds_node::ds_attr::DsAttr;
use ds_parser::ds_node::DsTreeRef;
use ds_parser::ds_rune::traverse::traverse;
use ds_parser::ds_rune::DsRune;

/// XwrapupRune — generates println-based debug output (original xwrapup behavior).
pub struct XwrapupRune {
    tokens: TokenStream,
    parent_name: String,
}

impl Default for XwrapupRune {
    fn default() -> Self {
        Self::new()
    }
}

impl XwrapupRune {
    pub fn new() -> Self {
        Self {
            tokens: TokenStream::new(),
            parent_name: String::new(),
        }
    }
}

impl DsRune for XwrapupRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr) {
        let parent_string = "parent".to_string();
        self.tokens.extend(quote! {
            println!("let {} = {:?}", #parent_string, #parent_expr);
        });
        self.parent_name = "parent".to_string();
    }

    fn inscribe_widget(&mut self, name: &syn::Ident, attrs: &[DsAttr], children: &[DsTreeRef]) {
        let name_string = name.to_string();
        let parent_name = &self.parent_name;

        self.tokens.extend(quote! {
            println!("let {} = obj::new({})", #name_string, #parent_name);
        });

        for attr in attrs {
            let attr_name = attr.name.to_string();
            let attr_value = &attr.value;
            self.tokens.extend(quote! {
                println!("{}.set_{}({:?})", #name_string, #attr_name, #attr_value);
            });
        }

        let prev_parent = self.parent_name.clone();
        self.parent_name = name_string;
        for child in children {
            traverse(child, self);
        }
        self.parent_name = prev_parent;
    }

    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]) {
        let con = quote!(#condition).to_string();
        self.tokens.extend(quote! {
            println!("if {} {{", #con);
        });

        for child in children {
            traverse(child, self);
        }

        self.tokens.extend(quote! {
            println!("}}");
        });
    }

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[DsTreeRef],
    ) {
        let iterable_str = quote!(#iterable).to_string();
        let variable_str = variable.to_string();

        self.tokens.extend(quote! {
            println!("for {} in {} {{", #variable_str, #iterable_str);
        });

        for child in children {
            traverse(child, self);
        }

        self.tokens.extend(quote! {
            println!("}}");
        });
    }

    fn seal(self) -> TokenStream {
        self.tokens
    }
}
