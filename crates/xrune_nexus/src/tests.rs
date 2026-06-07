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
        assert_eq!(attr.name.as_ref().unwrap().to_string(), "width");
    }

    #[test]
    fn parse_multiple_attrs() {
        let tokens = quote! { (width: 100, height: 200, color: "red") };
        let attrs: DsAttrs = syn::parse2(tokens).unwrap();
        assert_eq!(attrs.attrs.len(), 3);
        assert_eq!(attrs.attrs[0].name.as_ref().unwrap().to_string(), "width");
        assert_eq!(attrs.attrs[1].name.as_ref().unwrap().to_string(), "height");
        assert_eq!(attrs.attrs[2].name.as_ref().unwrap().to_string(), "color");
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
                assert_eq!(
                    w.get_attrs().attrs[0].name.as_ref().unwrap().to_string(),
                    "text"
                );
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
        assert_eq!(attr.name.as_ref().unwrap().to_string(), "height");
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

    #[test]
    fn parse_widget_no_braces() {
        let tokens = quote! { Image (path: "x.png") };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(w) => {
                assert_eq!(w.get_name().to_string(), "Image");
                assert_eq!(w.get_attrs().attrs.len(), 1);
            }
            _ => panic!("Expected Widget"),
        }
        assert_eq!(tree.get_children().len(), 0);
    }

    #[test]
    fn parse_widget_empty_braces_still_works() {
        let tokens = quote! { Image (path: "x.png") {} };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(_) => {}
            _ => panic!("Expected Widget"),
        }
        assert_eq!(tree.get_children().len(), 0);
    }

    #[test]
    fn error_if_without_body() {
        let tokens = quote! { if show_footer };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err());
    }

    #[test]
    fn error_walk_without_body() {
        let tokens = quote! { walk items with x };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err());
    }

    #[test]
    fn parse_niche_node() {
        let tokens = quote! {
            @header { Text (text: "hi") {} }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Niche(n) => assert_eq!(n.get_name().to_string(), "header"),
            _ => panic!("Expected Niche node"),
        }
        assert_eq!(tree.get_children().len(), 1);
    }

    #[test]
    fn parse_niche_multiple_children() {
        let tokens = quote! {
            @body { Text (text: "a") {} Text (text: "b") {} }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Niche(_) => {}
            _ => panic!("Expected Niche"),
        }
        assert_eq!(tree.get_children().len(), 2);
    }

    #[test]
    fn error_niche_without_body() {
        let tokens = quote! { @header };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err());
    }

    #[test]
    fn parse_match_node() {
        let tokens = quote! {
            match state {
                State::Loading => { Spinner () }
                State::Ready => { Content (text: "ok") }
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Match(m) => {
                assert_eq!(m.get_arms().len(), 2);
            }
            _ => panic!("Expected Match node"),
        }
    }

    #[test]
    fn parse_match_with_binding() {
        let tokens = quote! {
            match state {
                State::Ready(d) => { Content (text: "x") }
                _ => { Empty () }
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Match(m) => {
                assert_eq!(m.get_arms().len(), 2);
                let arms = m.get_arms();
                assert_eq!(arms[0].get_children().len(), 1);
                assert_eq!(arms[1].get_children().len(), 1);
            }
            _ => panic!("Expected Match"),
        }
    }

    #[test]
    fn error_match_without_body() {
        let tokens = quote! { match x };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err());
    }

    #[test]
    fn root_header_accepts_commas() {
        let tokens = quote! {
            :(
                parent: root,
                world: w,
            :)
            Foo {}
        };
        let result = syn::parse2::<crate::ds_node::DsRoot>(tokens);
        assert!(result.is_ok(), "trailing-comma form must parse");
    }

    #[test]
    fn root_header_accepts_no_commas() {
        let tokens = quote! {
            :(
                parent: root
                world: w
            :)
            Foo {}
        };
        let result = syn::parse2::<crate::ds_node::DsRoot>(tokens);
        assert!(result.is_ok(), "no-comma form must still parse");
    }

    #[test]
    fn parse_on_node_no_args() {
        let tokens = quote! {
            on Tap { call_me() }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::On(on) => {
                assert_eq!(on.get_name().to_string(), "Tap");
                assert!(on.get_qualifier().is_none());
                assert_eq!(on.get_args().len(), 0);
            }
            _ => panic!("Expected On node"),
        }
    }

    #[test]
    fn parse_on_node_with_args() {
        let tokens = quote! {
            on Tap(2) { fire() }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::On(on) => {
                assert_eq!(on.get_name().to_string(), "Tap");
                assert_eq!(on.get_args().len(), 1);
            }
            _ => panic!("Expected On node"),
        }
    }

    #[test]
    fn parse_on_node_qualified() {
        let tokens = quote! {
            on Slider::ValueChanged { persist(*new) }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::On(on) => {
                assert_eq!(on.get_name().to_string(), "ValueChanged");
                assert_eq!(on.get_qualifier().unwrap().to_string(), "Slider");
            }
            _ => panic!("Expected qualified On node"),
        }
    }

    #[test]
    fn error_on_node_without_body() {
        let tokens = quote! { on Tap };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err(), "on without {{}} body must fail");
    }

    #[test]
    fn error_on_node_multi_qualifier() {
        let tokens = quote! {
            on Foo::Bar::Baz { x() }
        };
        let result = syn::parse2::<DsTree>(tokens);
        assert!(result.is_err(), "multi-segment qualifier must fail");
    }

    #[test]
    fn parse_on_inside_widget_body() {
        let tokens = quote! {
            Slider (min: 0, max: 100) {
                on Tap { fire_a() }
                on Slider::ValueChanged { fire_b() }
            }
        };
        let tree: DsTree = syn::parse2(tokens).unwrap();
        match tree.get_node() {
            DsNode::Widget(_) => {}
            _ => panic!("Expected Widget root"),
        }
        let children = tree.get_children();
        assert_eq!(children.len(), 2, "two on handlers");
        for child in children {
            match child.borrow().get_node() {
                DsNode::On(_) => {}
                _ => panic!("Expected On child"),
            }
        }
    }
}
