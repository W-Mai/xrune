use xrune_nexus::ds_node::ds_attr::DsAttr;
use xrune_nexus::ds_node::node_enum::DsNode;
use xrune_nexus::ds_node::{DsRoot, DsTreeRef};

/// Format xrune DSL content (inside ui! { ... }) using the real parser
pub fn format_dsl(input: &str, base_indent: &str) -> Option<String> {
    let tokens: proc_macro2::TokenStream = input.parse().ok()?;
    let root: DsRoot = syn::parse2(tokens).ok()?;

    let mut out = String::new();
    let indent1 = format!("{base_indent}    ");

    // Context area
    out.push_str(&indent1);
    out.push_str(":(\n");
    let indent2 = format!("{indent1}    ");
    for attr in root.get_context_attrs() {
        out.push_str(&indent2);
        out.push_str(&attr.name.to_string());
        out.push_str(": ");
        out.push_str(&fmt_expr(&attr.value));
        out.push('\n');
    }
    out.push_str(&indent1);
    out.push_str(":)\n\n");

    // Content tree
    let content = root.get_content();
    let borrowed = content.borrow();
    for child in borrowed.get_children() {
        format_tree(child, &indent1, &mut out);
    }

    Some(out)
}

fn format_tree(tree: &DsTreeRef, indent: &str, out: &mut String) {
    let borrowed = tree.borrow();
    let child_indent = format!("{indent}    ");

    match borrowed.get_node() {
        DsNode::Root(_) => {
            for child in borrowed.get_children() {
                format_tree(child, indent, out);
            }
        }
        DsNode::Widget(widget) => {
            out.push_str(indent);
            out.push_str(&widget.get_name().to_string());
            out.push(' ');

            // Attributes
            format_attrs(&widget.get_attrs().attrs, out);

            // Enchants
            let enchants = widget.get_enchants();
            if !enchants.is_empty() {
                out.push_str(" [\n");
                for enchant in enchants {
                    out.push_str(&child_indent);
                    out.push_str(&fmt_expr(enchant));
                    out.push_str(",\n");
                }
                out.push_str(indent);
                out.push(']');
            }

            // Children
            let children = borrowed.get_children();
            if children.is_empty() {
                out.push_str(" {}\n");
            } else {
                out.push_str(" {\n");
                for child in children {
                    format_tree(child, &child_indent, out);
                }
                out.push_str(indent);
                out.push_str("}\n");
            }
        }
        DsNode::If(if_node) => {
            out.push_str(indent);
            out.push_str("if ");
            out.push_str(&fmt_expr(if_node.get_condition()));
            out.push_str(" {\n");
            for child in borrowed.get_children() {
                format_tree(child, &child_indent, out);
            }
            out.push_str(indent);
            out.push_str("}\n");
        }
        DsNode::Iter(iter_node) => {
            out.push_str(indent);
            out.push_str("walk ");
            out.push_str(&fmt_expr(iter_node.get_iterable()));
            out.push_str(" with ");
            out.push_str(&iter_node.get_variable().to_string());
            out.push_str(" {\n");
            for child in borrowed.get_children() {
                format_tree(child, &child_indent, out);
            }
            out.push_str(indent);
            out.push_str("}\n");
        }
    }
}

fn format_attrs(attrs: &[DsAttr], out: &mut String) {
    out.push('(');
    for (i, attr) in attrs.iter().enumerate() {
        if i > 0 {
            out.push_str(", ");
        }
        out.push_str(&attr.name.to_string());
        out.push_str(": ");
        out.push_str(&fmt_expr(&attr.value));
    }
    out.push(')');
}

/// Format a syn::Expr into pretty Rust code using prettyplease
fn fmt_expr(expr: &syn::Expr) -> String {
    let tokens = quote::quote!(#expr);
    let code = format!("const _: () = {{ let _ = {tokens}; }};");
    let Ok(file) = syn::parse_str::<syn::File>(&code) else {
        return tokens.to_string();
    };
    let formatted = prettyplease::unparse(&file);
    // Extract between "let _ = " and ";\n"
    let Some(start) = formatted.find("let _ = ") else {
        return tokens.to_string();
    };
    let start = start + 8;
    let Some(end) = formatted[start..].find(";\n") else {
        return tokens.to_string();
    };
    formatted[start..start + end].trim().to_string()
}
