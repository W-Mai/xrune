/// Format xrune DSL content (inside ui! { ... })
pub fn format_dsl(input: &str, base_indent: &str) -> String {
    let tokens = tokenize(input);
    let mut out = String::new();
    let mut indent_level: usize = 1; // start at 1 (inside ui! {})
    let mut i = 0;

    while i < tokens.len() {
        let tok = &tokens[i];
        match tok.as_str() {
            ":(" => {
                // Context area start — put on its own line
                out.push_str(&make_indent(base_indent, indent_level));
                out.push_str(":(\n");
                indent_level += 1;
                i += 1;
                // Collect key: value pairs until :)
                while i < tokens.len() && tokens[i] != ":)" {
                    // Each key: value on its own line
                    let mut line = String::new();
                    while i < tokens.len() && tokens[i] != ":)" {
                        if tokens[i] == ":" && !line.is_empty() && i + 1 < tokens.len() && tokens[i + 1] != "(" && tokens[i + 1] != ")" {
                            // key: value separator — collect value until next key or :)
                            line.push_str(": ");
                            i += 1;
                            // Collect value tokens until next bare ident followed by : or :)
                            while i < tokens.len() && tokens[i] != ":)" {
                                if is_ident(&tokens[i]) && i + 1 < tokens.len() && tokens[i + 1] == ":" {
                                    break;
                                }
                                line.push_str(&tokens[i]);
                                if !tokens[i].ends_with(' ') {
                                    line.push(' ');
                                }
                                i += 1;
                            }
                            break;
                        }
                        line.push_str(&tokens[i]);
                        i += 1;
                    }
                    let line = line.trim().to_string();
                    if !line.is_empty() {
                        out.push_str(&make_indent(base_indent, indent_level));
                        out.push_str(&line);
                        out.push('\n');
                    }
                }
                indent_level -= 1;
                out.push_str(&make_indent(base_indent, indent_level));
                out.push_str(":)\n\n");
                if i < tokens.len() && tokens[i] == ":)" {
                    i += 1;
                }
            }
            "{" => {
                out.push_str("{\n");
                indent_level += 1;
                i += 1;
            }
            "}" => {
                indent_level -= 1;
                out.push_str(&make_indent(base_indent, indent_level));
                out.push_str("}\n");
                i += 1;
            }
            _ => {
                // Regular token — widget name, attrs, etc.
                // Detect widget: ident followed by (
                if is_ident(tok) && i + 1 < tokens.len() && tokens[i + 1] == "(" {
                    // Widget declaration
                    out.push_str(&make_indent(base_indent, indent_level));
                    out.push_str(tok);
                    out.push(' ');
                    i += 1;
                    // Collect everything until matching ) then optional [] then {}
                    // Just pass through for now
                } else {
                    out.push_str(tok);
                    if !tok.ends_with('\n') {
                        out.push(' ');
                    }
                    i += 1;
                }
            }
        }
    }

    out
}

fn make_indent(base: &str, level: usize) -> String {
    let mut s = base.to_string();
    for _ in 0..level {
        s.push_str("    ");
    }
    s
}

fn is_ident(s: &str) -> bool {
    !s.is_empty() && s.chars().next().unwrap().is_alphabetic()
        && s.chars().all(|c| c.is_alphanumeric() || c == '_')
}

/// Simple tokenizer — splits on whitespace but keeps delimiters as tokens
fn tokenize(input: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut chars = input.chars().peekable();

    while let Some(&c) = chars.peek() {
        match c {
            ' ' | '\t' | '\n' | '\r' => {
                chars.next();
            }
            '{' | '}' | '(' | ')' | '[' | ']' | ',' | ';' => {
                tokens.push(c.to_string());
                chars.next();
            }
            ':' => {
                chars.next();
                if chars.peek() == Some(&'(') {
                    chars.next();
                    tokens.push(":(".to_string());
                } else if chars.peek() == Some(&')') {
                    chars.next();
                    tokens.push(":)".to_string());
                } else {
                    tokens.push(":".to_string());
                }
            }
            '"' => {
                // String literal
                let mut s = String::new();
                s.push(chars.next().unwrap());
                while let Some(&ch) = chars.peek() {
                    s.push(chars.next().unwrap());
                    if ch == '"' && !s.ends_with("\\\"") {
                        break;
                    }
                }
                tokens.push(s);
            }
            _ => {
                // Word/expression token — collect until delimiter
                let mut word = String::new();
                while let Some(&ch) = chars.peek() {
                    if ch.is_whitespace() || "{}()[],:;".contains(ch) {
                        break;
                    }
                    word.push(chars.next().unwrap());
                }
                if !word.is_empty() {
                    tokens.push(word);
                }
            }
        }
    }

    tokens
}
