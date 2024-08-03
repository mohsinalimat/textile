frappe.provide("textile");

frappe.ui.form.on("Sales Invoice", {
	setup: function (frm) {
		if (frm.fields_dict.printed_fabrics?.grid) {
			frm.fields_dict.printed_fabrics.grid.cannot_add_rows = 1;
		}
	},

	refresh: function (frm) {
		frm.add_custom_button(__('Check Printing Rate'), () => textile.show_print_pricing_dialog(frm.doc.customer, frm.doc.customer_name),
			__("Prices"));
		frm.add_custom_button(__('Check Pretreatment Rate'), () => textile.show_pretreatment_pricing_dialog(frm.doc.customer, frm.doc.customer_name),
			__("Prices"));

		if (frappe.model.can_read("Print Order") || frappe.model.can_select("Print Order")) {
			frm.add_custom_button(__('Print Order'), function () {
				textile.get_items_from_print_order(
					frm,
					"textile.fabric_printing.doctype.print_order.print_order.make_sales_invoice",
					null,
					"textile.fabric_printing.doctype.print_order.print_order.get_print_orders_to_be_billed"
				);
			}, __("Get Items From"));
		}

		if (frappe.model.can_read("Pretreatment Order") || frappe.model.can_select("Pretreatment Order")) {
			frm.add_custom_button(__('Pretreatment Order'), function () {
				textile.get_items_from_pretreatment_order(
					frm,
					"textile.fabric_pretreatment.doctype.pretreatment_order.pretreatment_order.make_sales_invoice",
					null,
					"textile.fabric_pretreatment.doctype.pretreatment_order.pretreatment_order.get_pretreatment_orders_to_be_billed"
				);
			}, __("Get Items From"));
		}
	},

	onload: function (frm) {
		$(frm.wrapper).on("grid-row-render", function (e, grid_row) {
			frm.events.highlight_fabric_item_row(frm, grid_row);
		});
	},

	highlight_fabric_item_rows: function(frm) {
		let grid_rows = [...frm.fields_dict.items.grid.grid_rows, ...frm.fields_dict.printed_fabrics.grid.grid_rows];
		for (let grid_row of grid_rows) {
			frm.events.highlight_fabric_item_row(frm, grid_row);
		}
	},

	highlight_fabric_item_row: function(frm, grid_row) {
		let row = grid_row?.doc;
		if (!row || !["Sales Invoice Item", "Printed Fabric Detail"].includes(row.doctype)) {
			return;
		}

		grid_row.row.removeClass("highlight");

		if (
			frm.focused_printed_fabric_item
			&& (row.textile_item_type == "Printed Design" || row.is_return_fabric || row.doctype == "Printed Fabric Detail")
			&& row.fabric_item === frm.focused_printed_fabric_item
			&& cint(row.is_return_fabric) == cint(frm.focused_printed_is_return_fabric)
		) {
			grid_row.row.addClass("highlight");
		}
	},
});

frappe.ui.form.on("Sales Invoice Item", {
	panel_qty: function(frm, cdt, cdn) {
		textile.calculate_panel_length_meter(frm, cdt, cdn);
	},

	panel_based_qty: function(frm, cdt, cdn) {
		frm.cscript.calculate_taxes_and_totals();
	},
});

frappe.ui.form.on("Printed Fabric Detail", {
	fabric_rate: function(frm, cdt, cdn) {
		let fabric_row = frappe.get_doc(cdt, cdn);
		if (!fabric_row.fabric_item) {
			return;
		}

		const is_fabric_item_row = (item_row) => {
			return (
				(item_row.textile_item_type == "Printed Design" || item_row.is_return_fabric)
				&& item_row.fabric_item == fabric_row.fabric_item
				&& cint(item_row.is_return_fabric) == cint(fabric_row.is_return_fabric)
			)
		};

		let fabric_item_rows = (frm.doc.items || []).filter(d => is_fabric_item_row(d));

		let total_fabric_qty = frappe.utils.sum(fabric_item_rows.map(d => d.stock_qty));
		let rounded_fabric_qty = flt(total_fabric_qty,
			precision("fabric_qty", fabric_row));

		let total_amount = flt(flt(fabric_row.fabric_rate) * rounded_fabric_qty,
			precision("fabric_amount", fabric_row));
		let remaining_amount = total_amount;

		let last_row = fabric_item_rows.length ? fabric_item_rows[fabric_item_rows.length - 1] : null;
		for (let item_row of fabric_item_rows) {
			let amount = flt(total_amount * (flt(item_row.stock_qty) / total_fabric_qty),
				precision("amount", item_row));

			remaining_amount = flt(remaining_amount - amount, precision("amount", item_row));

			if (item_row == last_row && remaining_amount) {
				amount += remaining_amount;
				amount = flt(amount, precision("amount", item_row));
			}

			item_row.rate = flt(amount / item_row.qty);
			frm.cscript.set_item_rate(item_row);
		}

		frm.cscript.calculate_taxes_and_totals();
	},

	printed_fabrics_row_focused: function(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		frm.focused_printed_fabric_item = row.fabric_item;
		frm.focused_printed_is_return_fabric = row.is_return_fabric;

		frm.events.highlight_fabric_item_rows(frm);
	},

	before_printed_fabrics_remove: function(frm, cdt, cdn) {
		let printed_fabric_row = frappe.get_doc(cdt, cdn);
		let parent_field = frm.get_field('items');
		if (!parent_field) {
			return;
		}

		let rows = (frm.doc.items || []).filter(d => {
			return (
				(d.textile_item_type == "Printed Design" || d.is_return_fabric)
				&& d.fabric_item === printed_fabric_row.fabric_item
				&& cint(d.is_return_fabric) == cint(printed_fabric_row.is_return_fabric)
			)
		});

		for (let row of rows) {
			let grid_row = parent_field.grid.grid_rows_by_docname[row.name];
			if (grid_row) {
				grid_row.remove();
			}
		}
	},
});