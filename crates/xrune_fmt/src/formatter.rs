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
    format_tree(&content, &indent1, &mut out);

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
            let name_str = widget.get_name().to_string();
            out.push_str(&name_str);
            out.push(' ');

            // Attributes
            format_attrs(&widget.get_attrs().attrs, indent, name_str.len(), out);

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

const MAX_LINE_WIDTH: usize = 100;

fn format_attrs(attrs: &[DsAttr], indent: &str, name_len: usize, out: &mut String) {
    // Build all attr strings first
    let attr_strs: Vec<String> = attrs
        .iter()
        .map(|attr| format!("{}: {}", attr.name, fmt_expr(&attr.value)))
        .collect();

    // Check if single-line fits within MAX_LINE_WIDTH
    let single_line = attr_strs.join(", ");
    let total_len = indent.len() + name_len + 1 + single_line.len() + 1 + 3; // "name (...) {}"

    if total_len <= MAX_LINE_WIDTH {
        out.push('(');
        out.push_str(&single_line);
        out.push(')');
    } else {
        // Multi-line
        let attr_indent = format!("{indent}    ");
        out.push_str("(\n");
        for (i, s) in attr_strs.iter().enumerate() {
            out.push_str(&attr_indent);
            out.push_str(s);
            if i + 1 < attr_strs.len() {
                out.push(',');
            }
            out.push('\n');
        }
        out.push_str(indent);
        out.push(')');
    }
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
