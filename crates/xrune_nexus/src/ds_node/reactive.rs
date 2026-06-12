use syn::parse::ParseStream;

/// Parse a control-flow head expression, detecting a leading `$` sigil.
/// Returns the inner `syn::Expr` (with `$` stripped) and whether the sigil was
/// present. `$expr` and `${ block }` set the flag; a bare expr does not.
pub fn reactive_or_expr(input: ParseStream) -> syn::Result<(syn::Expr, bool)> {
    if input.peek(syn::Token![$]) {
        input.parse::<syn::Token![$]>()?;
        if input.peek(syn::token::Brace) {
            let block: syn::ExprBlock = input.parse()?;
            return Ok((syn::Expr::Block(block), true));
        }
        return Ok((collect_until_brace(input)?, true));
    }
    Ok((collect_until_brace(input)?, false))
}

fn collect_until_brace(input: ParseStream) -> syn::Result<syn::Expr> {
    let mut tokens = proc_macro2::TokenStream::new();
    while !input.is_empty() && !input.peek(syn::token::Brace) {
        let tt: proc_macro2::TokenTree = input.parse()?;
        tokens.extend(std::iter::once(tt));
    }
    syn::parse2(tokens)
}
