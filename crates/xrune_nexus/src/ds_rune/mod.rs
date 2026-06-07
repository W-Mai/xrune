pub mod decipher;

use crate::ds_node::DsTreeRef;
use crate::ds_node::ds_attr::DsAttr;

/// DsRune — the codegen interface.
/// Implement this trait to generate code from the parsed DSL tree.
/// Each method "inscribes" a node type into the output.
pub trait DsRune {
    /// Inscribe the root node (provides the parent expression).
    fn inscribe_root(&mut self, parent_expr: &syn::Expr);

    /// Inscribe a widget node.
    fn inscribe_widget(
        &mut self,
        name: &syn::Ident,
        attrs: &[DsAttr],
        enchants: &[syn::Expr],
        children: &[DsTreeRef],
    );

    /// Inscribe a conditional node.
    fn inscribe_if(&mut self, condition: &syn::Expr, children: &[DsTreeRef]);

    /// Inscribe an iteration node.
    fn inscribe_iter(
        &mut self,
        iterable: &syn::Expr,
        variable: &syn::Ident,
        children: &[DsTreeRef],
    );

    /// Inscribe a niche node — `@name { ... }` at the call site.
    fn inscribe_niche(&mut self, name: &syn::Ident, children: &[DsTreeRef]);

    /// Inscribe a match node — `match expr { Pat => { ... } ... }`.
    fn inscribe_match(
        &mut self,
        scrutinee: &syn::Expr,
        arms: &[crate::ds_node::ds_match::DsMatchArm],
    );

    /// Inscribe an `on` handler — `on Path::EventKind(args) { body }`.
    fn inscribe_on(
        &mut self,
        qualifier: Option<&syn::Ident>,
        name: &syn::Ident,
        args: &[syn::Expr],
        body: &syn::Block,
    );

    /// Seal the rune — finalize and return the generated TokenStream.
    fn seal(self) -> proc_macro2::TokenStream;
}
