use super::DsRune;
use crate::ds_node::DsTreeRef;
use crate::ds_node::node_enum::DsNode;

/// Traverse a DsTree and invoke the appropriate DsRune methods.
pub fn decipher(tree: &DsTreeRef, rune: &mut dyn DsRune) {
    let borrowed = tree.borrow();
    match borrowed.get_node() {
        DsNode::Root(expr) => {
            rune.inscribe_root(expr);
            for child in borrowed.get_children() {
                decipher(child, rune);
            }
        }
        DsNode::Widget(widget) => {
            rune.inscribe_widget(
                widget.get_name(),
                &widget.get_attrs().attrs,
                widget.get_enchants(),
                borrowed.get_children(),
            );
        }
        DsNode::If(if_node) => {
            rune.inscribe_if(if_node.get_condition(), borrowed.get_children());
        }
        DsNode::Iter(iter_node) => {
            rune.inscribe_iter(
                iter_node.get_iterable(),
                iter_node.get_variable(),
                borrowed.get_children(),
            );
        }
    }
}
