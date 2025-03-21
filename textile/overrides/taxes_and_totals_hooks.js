frappe.provide("textile");

textile.calculate_panel_qty = function() {
	if (
		!frappe.meta.has_field(this.frm.doc.doctype + " Item", 'panel_length_meter')
		|| !frappe.meta.has_field(this.frm.doc.doctype + " Item", 'panel_qty')
	) {
		return;
	}

	for (let row of this.frm.doc.items || []) {
		if (cint(row.panel_based_qty) && flt(row.panel_length_meter)) {
			row.panel_qty = flt(flt(row.stock_qty) / flt(row.panel_length_meter), precision("panel_qty", row));
		} else {
			row.panel_qty = 0;
		}
	}
}

textile.calculate_panel_length_meter = function(frm, cdt, cdn) {
	let row = frappe.get_doc(cdt, cdn);

	if (row.panel_qty && row.panel_based_qty) {
		row.panel_length_meter = flt(row.stock_qty) / flt(row.panel_qty);
	} else {
		row.panel_length_meter = 0;
	}

	if (frm.doc.doctype == "Packing Slip") {
		frm.cscript.calculate_totals();
	} else {
		frm.cscript.calculate_taxes_and_totals();
	}
}

textile.set_printed_fabric_details = function () {
	if (!frappe.meta.has_field(this.frm.doc.doctype, "printed_fabrics")) {
		return;
	}

	const get_key = (obj) => cstr([obj.fabric_item, cint(obj.is_return_fabric)]);

	// Group fabrics and calculate totals
	let fabric_summary = {}
	for (let item of this.frm.doc.items) {
		if (!item.fabric_item || (item.textile_item_type != "Printed Design" && !item.is_return_fabric)) {
			continue;
		}

		let empty_row = {
			"fabric_item": item.fabric_item,
			"fabric_item_name": item.fabric_item_name + (item.is_return_fabric ? " (Return Fabric)" : ""),
			"fabric_qty": 0,
			"fabric_rate": 0,
			"fabric_amount": 0,
			"is_return_fabric": cint(item.is_return_fabric),
		}

		let key = get_key(item);
		let fabric_dict = fabric_summary[key];
		if (!fabric_dict) {
			fabric_dict = fabric_summary[key] = Object.assign({}, empty_row);
		}

		fabric_dict.fabric_qty += flt(item.stock_qty);
		fabric_dict.fabric_amount += flt(item.amount);
	}

	// Calculate Rate
	for (let fabric_dict of Object.values(fabric_summary)) {
		let fabric_qty_df = frappe.meta.get_docfield("Printed Fabric Detail", "fabric_qty", this.frm.doc.name);
		let qty_precision = frappe.meta.get_field_precision(fabric_qty_df);
		fabric_dict.fabric_qty = flt(fabric_dict.fabric_qty, qty_precision);
		fabric_dict.fabric_rate = fabric_dict.fabric_qty ? fabric_dict.fabric_amount / fabric_dict.fabric_qty : 0;
	}

	// Update Rows
	const get_row = (fabric_item, is_return_fabric) => {
		let existing_rows = (this.frm.doc.printed_fabrics || []).filter((d) => {
			return (
				d.fabric_item == fabric_item
				&& cint(d.is_return_fabric) == cint(is_return_fabric)
			)
		});
		return existing_rows.length ? existing_rows[0] : null;
	}

	for (let fabric_dict of Object.values(fabric_summary)) {
		let row = get_row(fabric_dict.fabric_item, fabric_dict.is_return_fabric);
		if (!row) {
			row = this.frm.add_child("printed_fabrics");
		}

		Object.assign(row, fabric_dict);
	}

	// Reset removed fabrics rows
	for (let printed_fabric_row of this.frm.doc.printed_fabrics || []) {
		let key = get_key(printed_fabric_row);
		if (!fabric_summary[key]) {
			printed_fabric_row.fabric_qty = 0;
			printed_fabric_row.fabric_rate = 0;
			printed_fabric_row.fabric_amount = 0;
		}
	}
}

textile.update_item_args_for_pricing = function (row, item_args) {
	item_args.pretreatment_order = row.pretreatment_order;
	item_args.print_order = row.print_order;
}

erpnext.taxes_and_totals_hooks.push(textile.calculate_panel_qty);
erpnext.taxes_and_totals_hooks.push(textile.set_printed_fabric_details);

erpnext.update_item_args_for_pricing_hooks.push(textile.update_item_args_for_pricing);
