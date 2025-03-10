frappe.provide("textile");

frappe.ui.form.on("Sales Order", {
	refresh: function(frm) {
		if (frm.doc.docstatus === 0) {
			if (frappe.model.can_read("Pretreatment Order") || frappe.model.can_select("Pretreatment Order")) {
				frm.add_custom_button(__('Pretreatment Order'), function () {
					textile.get_items_from_pretreatment_order(
						frm,
						"textile.fabric_pretreatment.doctype.pretreatment_order.pretreatment_order.make_sales_order",
						{per_ordered: ["<", 100]}
					);
				}, __("Get Items From"));
			}

			if (frappe.model.can_read("Print Order") || frappe.model.can_select("Print Order")) {
				frm.add_custom_button(__('Print Order'), function () {
					textile.get_items_from_print_order(
						frm,
						"textile.fabric_printing.doctype.print_order.print_order.make_sales_order",
						{per_ordered: ["<", 100]}
					);
				}, __("Get Items From"));
			}
		}
	},
});

frappe.ui.form.on("Sales Order Item", {
	panel_qty: function(frm, cdt, cdn) {
		textile.calculate_panel_length_meter(frm, cdt, cdn);
	},

	panel_based_qty: function(frm, cdt, cdn) {
		frm.cscript.calculate_taxes_and_totals();
	},
});
