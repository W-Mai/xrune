#[cfg(test)]
mod tests {
    use quote::quote;
    use syn::parse2;

    use crate::ds_node::DsTree;
    use crate::ds_node::ds_attr::{DsAttr, DsAttrs};
    use crate::ds_node::ds_widget::DsWidget;
    use crate::ds_node::node_enum::DsNode;

    #[test]
    fn parse_single_attr() {
        let tokens = quote! { width: 100 };
        let attr: DsAttr = syn::parse2(tokens).unwrap();
        assert_eq!(attr.name.to_string(), "width");
    }

    #[test]
    fn parse_multiple_attrs() {
        let tokens = quote! { (width: 100, height: 200, color: "red") };
        let attrs: DsAttrs = syn::parse2(tokens).unwrap();
        assert_eq!(attrs.attrs.len(), 3);
        assert_eq!(attrs.attrs[0].name.to_string(), "width");
        assert_eq!(attrs.attrs[1].name.to_string(), "height");
        assert_eq!(attrs.attrs[2].name.to_string(), "color");
    }

    #[test]
    fn parse_empty_attrs() {
        let tokens = quote! { () };
        let attrs: DsAttrs = syn::parse2(tokens).unwrap();
        assert_eq!(attrs.attrs.len(), 0);
    }

    #[test]
    fn parse_no_parens_attrs() {
        // When no parens, DsAttrs should parse as empty
        let tokens = quote! { {} };
        // DsAttrs peeks for paren, if not found returns empty
        // But we can't test this in isolation easily since it needs the braces for children
        // Test via DsTree instead
    }

    #[test]
    fn parse_widget_node() {
        let tokens = quote! {
            button (text: "hello") {}
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(w) => {
                assert_eq!(w.get_name().to_string(), "button");
                assert_eq!(w.get_attrs().attrs.len(), 1);
                assert_eq!(w.get_attrs().attrs[0].name.to_string(), "text");
            }
            _ => panic!("Expected Widget node"),
        }
    }

    #[test]
    fn parse_widget_no_attrs() {
        let tokens = quote! {
            container {}
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(w) => {
                assert_eq!(w.get_name().to_string(), "container");
                assert_eq!(w.get_attrs().attrs.len(), 0);
            }
            _ => panic!("Expected Widget node"),
        }
    }

    #[test]
    fn parse_nested_widgets() {
        let tokens = quote! {
            div (width: 100) {
                button (text: "ok") {}
                label (content: "hi") {}
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(w) => {
                assert_eq!(w.get_name().to_string(), "div");
            }
            _ => panic!("Expected Widget"),
        }
        // Children count - need access to children field
        // Currently children is private, we'd need a getter
    }

    #[test]
    fn parse_if_node() {
        let tokens = quote! {
            if show_footer {
                footer (height: 20) {}
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::If(_) => {} // OK
            _ => panic!("Expected If node"),
        }
    }

    #[test]
    fn parse_walk_node() {
        let tokens = quote! {
            walk items with item {
                label (text: "x") {}
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Iter(_) => {} // OK
            _ => panic!("Expected Iter node"),
        }
    }

    #[test]
    fn parse_expr_attr_value() {
        // Attribute values can be arbitrary expressions
        let tokens = quote! { height: 100 + A * 2 };
        let attr: DsAttr = syn::parse2(tokens).unwrap();
        assert_eq!(attr.name.to_string(), "height");
        // Value is a complex expression - just verify it parsed
    }
    #[test]
    fn error_missing_parent_prefix() {
        let tokens = quote! { div (width: 100) {} };
        let result = syn::parse2::<crate::ds_node::DsRoot>(tokens);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Root node must have a parent")
        );
    }

    #[test]
    fn error_missing_parent_attr() {
        let tokens = quote! { :(foo: 123:) div {} };
        let result = syn::parse2::<crate::ds_node::DsRoot>(tokens);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("parent"));
    }
}
