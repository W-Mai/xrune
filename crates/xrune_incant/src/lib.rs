extern crate proc_macro;

use proc_macro::TokenStream;
use syn::parse_macro_input;

use xrune_nexus::ds_node::DsRoot;
use xrune_nexus::ds_rune::decipher::decipher;
use xrune_nexus::ds_rune::DsRune;

/// Default rune: generates println debug output (xrune style).
struct DefaultRune {
    tokens: proc_macro2::TokenStream,
    parent_name: String,
}

impl DefaultRune {
    fn new() -> Self {
        Self {
            tokens: proc_macro2::TokenStream::new(),
            parent_name: String::new(),
        }
    }
}

impl DsRune for DefaultRune {
    fn inscribe_root(&mut self, parent_expr: &syn::Expr) {
        use quote::quote;
        self.tokens.extend(quote! {
            println!("let parent = {:?}", #parent_expr);
        });
        self.parent_name = "parent".to_string();
    }

    fn inscribe_widget(
        &mut self,
        name: &syn::Ident,
        attrs: &[xrune_nexus::ds_node::ds_attr::DsAttr],
        _enchants: &[syn::Expr],
        children: &[xrune_nexus::ds_node::DsTreeRef],
    ) {
        use quote::quote;
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
            decipher(child, self);
        }
        self.parent_name = prev_parent;
    }

    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[xrune_nexus::ds_node::DsTreeRef]) {
        use quote::quote;
        let con = quote!(#condition).to_string();
        self.tokens.extend(quote! {
            println!("if {} {{", #con);
        });
        for child in children {
            decipher(child, self);
        }
        self.tokens.extend(quote! {
            println!("}}");
        });
    }

    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[xrune_nexus::ds_node::DsTreeRef],
    ) {
        use quote::quote;
        let iterable_str = quote!(#iterable).to_string();
        let variable_str = variable.to_string();
        self.tokens.extend(quote! {
            println!("for {} in {} {{", #variable_str, #iterable_str);
        });
        for child in children {
            decipher(child, self);
        }
        self.tokens.extend(quote! {
            println!("}}");
        });
    }

    fn seal(self) -> proc_macro2::TokenStream {
        self.tokens
    }
}

#[proc_macro]
pub fn ui(input: TokenStream) -> TokenStream {
    let root = parse_macro_input!(input as DsRoot);

    let mut rune = DefaultRune::new();

    // Inscribe root
    rune.inscribe_root(&root.get_parent());

    // Traverse the content tree
    let content = root.get_content();
    decipher(&content, &mut rune);

    TokenStream::from(rune.seal())
}
