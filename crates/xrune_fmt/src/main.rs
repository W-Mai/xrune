use regex::Regex;
use std::env;
use std::fs;

mod formatter;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: xrune-fmt <file.rs> [--check]");
        std::process::exit(1);
    }

    let path = &args[1];
    let check_only = args.iter().any(|a| a == "--check");

    let content = fs::read_to_string(path).expect("failed to read file");
    let formatted = format_ui_macros(&content);

    if check_only {
        if formatted != content {
            eprintln!("{path}: not formatted");
            std::process::exit(1);
        }
    } else {
        fs::write(path, &formatted).expect("failed to write file");
    }
}

fn format_ui_macros(source: &str) -> String {
    // Find ui! { ... } blocks (handling nested braces)
    let re = Regex::new(r"ui!\s*\{").unwrap();
    let mut result = String::new();
    let mut last_end = 0;

    for m in re.find_iter(source) {
        let start = m.start();
        let brace_start = m.end() - 1; // position of '{'

        // Find matching closing brace
        let Some(brace_end) = find_matching_brace(source, brace_start) else {
            continue;
        };

        // Copy everything before this macro
        result.push_str(&source[last_end..start]);

        // Extract inner content (between { and })
        let inner = &source[brace_start + 1..brace_end];

        // Detect indentation of the ui! line
        let line_start = source[..start].rfind('\n').map(|p| p + 1).unwrap_or(0);
        let indent = &source[line_start..start]
            .chars()
            .take_while(|c| c.is_whitespace())
            .collect::<String>();

        // Format the inner content
        let formatted_inner = formatter::format_dsl(inner, indent);

        // Write formatted macro
        result.push_str("ui! {\n");
        result.push_str(&formatted_inner);
        result.push_str(indent);
        result.push('}');

        last_end = brace_end + 1;
    }

    result.push_str(&source[last_end..]);
    result
}

fn find_matching_brace(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut depth = 0;
    let mut i = start;
    while i < bytes.len() {
        match bytes[i] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}
