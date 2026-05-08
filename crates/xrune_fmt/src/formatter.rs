use quote::ToTokens;
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
                    out.push_str(&fmt_expr_indented(enchant, &child_indent));
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
    if attrs.is_empty() {
        out.push_str("()");
        return;
    }

    // Check if original was multiline (first attr and last attr on different lines)
    let first_line = attrs
        .first()
        .map(|a| a.name.span().start().line)
        .unwrap_or(0);
    let last_line = attrs
        .last()
        .map(|a| {
            a.value
                .to_token_stream()
                .into_iter()
                .last()
                .map(|t| t.span().end().line)
                .unwrap_or(first_line)
        })
        .unwrap_or(first_line);
    let was_multiline = last_line > first_line;

    // Build all attr strings
    let attr_indent = format!("{indent}    ");
    let attr_strs: Vec<String> = attrs
        .iter()
        .map(|attr| {
            format!(
                "{}: {}",
                attr.name,
                fmt_expr_indented(&attr.value, &attr_indent)
            )
        })
        .collect();

    let single_line = attr_strs.join(", ");
    let total_len = indent.len() + name_len + 1 + single_line.len() + 1 + 3;

    // Use multiline if: original was multiline OR exceeds max width
    if was_multiline || total_len > MAX_LINE_WIDTH {
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
    } else {
        out.push('(');
        out.push_str(&single_line);
        out.push(')');
    }
}

/// Format a syn::Expr into pretty Rust code using prettyplease
fn fmt_expr(expr: &syn::Expr) -> String {
    fmt_expr_indented(expr, "")
}

/// Format a syn::Expr with re-indentation for multi-line output
fn fmt_expr_indented(expr: &syn::Expr, indent: &str) -> String {
    let tokens = quote::quote!(#expr);
    let code = format!("const _: () = {{ let _ = {tokens}; }};");
    let Ok(file) = syn::parse_str::<syn::File>(&code) else {
        return tokens.to_string();
    };
    let formatted = prettyplease::unparse(&file);
    let Some(start) = formatted.find("let _ = ") else {
        return tokens.to_string();
    };
    let start = start + 8;
    let Some(end) = formatted[start..].find(";\n") else {
        return tokens.to_string();
    };
    let result = formatted[start..start + end].trim().to_string();

    // Re-indent multi-line results
    if result.contains('\n') && !indent.is_empty() {
        let inner_indent = format!("{indent}    ");
        result
            .lines()
            .enumerate()
            .map(|(i, line)| {
                if i == 0 {
                    line.to_string()
                } else {
                    let trimmed = line.trim_start();
                    if trimmed == "}" || trimmed == "}," || trimmed == ")" || trimmed == ")," {
                        // Closing brace aligns with opening
                        format!("{indent}{trimmed}")
                    } else {
                        format!("{inner_indent}{trimmed}")
                    }
                }
            })
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        result
    }
}
