// Copyright (c) 2023, ParaLogic and contributors
// For license information, please see license.txt

frappe.provide("textile");

textile.PrintOrder = class PrintOrder extends textile.TextileOrder {
	print_order_item_editable_fields = [
		"design_name", "qty", "uom", "qty_type", "design_gap",
	]

	print_order_item_static_fields = [
		"design_size", "design_image",
		"stock_print_length", "stock_fabric_length", "panel_qty",
		"produced_qty", "packed_qty", "delivered_qty",
	]

	print_order_item_fields = this.print_order_item_editable_fields.concat(this.print_order_item_static_fields)

	setup() {
		super.setup();

		this.frm.custom_make_buttons = {
			'Sales Order': 'Sales Order',
			'Work Order': 'Work Order',
			'Packing Slip': 'Packing Slip',
			'Delivery Note': 'Delivery Note',
			'Sales Invoice': 'Sales Invoice',
			'Stock Entry': 'Fabric Transfer Entry',
		}

		this.setup_custom_items_table();
	}

	refresh() {
		super.refresh();
		this.setup_buttons();
		this.setup_route_options();
		this.set_default_warehouse();
		this.set_default_cost_center();
		this.setup_progressbars();
	}

	on_upload_complete() {
		if (this.frm.doc.docstatus == 0) {
			this.frm.dirty();
			return this.get_items_from_attachments();
		}
	}

	setup_queries() {
		super.setup_queries();

		this.frm.set_query("fabric_item", () => {
			let filters = {
				'textile_item_type': 'Ready Fabric',
			}
			if (this.frm.doc.is_fabric_provided_by_customer) {
				filters.customer = this.frm.doc.customer;
			}
			return erpnext.queries.item(filters);
		});

		this.frm.set_query("process_item", () => {
			return erpnext.queries.item({ textile_item_type: 'Print Process' });
		});

		for (let [component_item_field, component_type] of Object.entries(textile.printing_components)) {
			this.frm.set_query(component_item_field, () => {
				let filters = {
					textile_item_type: 'Process Component',
					process_component: component_type
				};

				if (["Sublimation Paper", "Protection Paper"].includes(component_type) && this.frm.doc.fabric_item) {
					filters["fabric_item"] = this.frm.doc.fabric_item;
					return {
						query: "textile.fabric_printing.doctype.print_process_rule.print_process_rule.paper_item_query",
						filters: filters,
					}
				} else {
					return erpnext.queries.item(filters);
				}
			});
		}
	}

	setup_custom_items_table() {
		this.frm.fields_dict.items.grid.template = (doc, grid_row) => this.render_print_order_item_row(doc, grid_row);
	}

	render_print_order_item_row(doc, grid_row) {
		if (!grid_row.row_display) {
			grid_row.row_display = $(frappe.render(frappe.templates.print_order_item_row, {
				doc: doc ? frappe.get_format_helper(doc) : null,
				frm: this.frm,
				row: grid_row,
			})).appendTo(grid_row.row);
		}

		if (doc) {
			if (!grid_row.pro_fields) {
				grid_row.pro_fields = {};
				for (let fieldname of this.print_order_item_fields) {
					let field = grid_row.pro_fields[fieldname] = {};
					field.fieldname = fieldname;
					field.df = frappe.meta.get_docfield(doc.doctype, fieldname, doc.name);

					field.$value = $(`.formatted-value[data-fieldname="${fieldname}"]`, grid_row.row_display);

					if (this.print_order_item_editable_fields.includes(fieldname)) {
						field.$control = frappe.ui.form.make_control({
							parent: $(`.field-control[data-fieldname=${fieldname}]`, grid_row.row_display),
							df: field.df,
							doc: doc,
							only_input: true,
							render_input: true,
							with_link_btn: true,
							doctype: doc.doctype,
							docname: doc.name,
							frm: this.frm,
							value: doc[fieldname],
						});
						field.$control.$input.attr("placeholder", __(field.df.placeholder || field.df.label));
						field.$control.$input.on("keydown", (e) => this.handle_arrow_key(e, grid_row));
					}
				}
			}

			this.update_print_order_item_row(doc, grid_row);
		}
	}

	handle_arrow_key(e, grid_row) {
		let { UP: UP_ARROW, DOWN: DOWN_ARROW } = frappe.ui.keyCode;
		if (!in_list([UP_ARROW, DOWN_ARROW], e.which)) {
			return;
		}

		let ignore_fieldtypes = ["Text", "Small Text", "Code", "Text Editor", "HTML Editor", "Select"];

		let values = grid_row.grid.get_data();
		let fieldname = $(e.target).attr("data-fieldname");
		let fieldtype = $(e.target).attr("data-fieldtype");

		let move_up_down = function (base) {
			if (in_list(ignore_fieldtypes, fieldtype) && !e.altKey) {
				return false;
			}

			if (e.target) {
				e.target.blur();
			}
			let input = base.pro_fields[fieldname]?.$control?.$input;
			if (input) {
				input.focus();
			}
			return true;
		};

		if (e.which === UP_ARROW) {
			if (grid_row.doc.idx > 1) {
				let prev = grid_row.grid.grid_rows[grid_row.doc.idx - 2];
				if (move_up_down(prev)) {
					return false;
				}
			}
		} else if (e.which === DOWN_ARROW) {
			if (grid_row.doc.idx < values.length) {
				let next = grid_row.grid.grid_rows[grid_row.doc.idx];
				if (move_up_down(next)) {
					return false;
				}
			}
		}
	}

	update_print_order_item_row(doc, grid_row) {
		for (let fieldname of this.print_order_item_fields) {
			let field = grid_row.pro_fields[fieldname];
			let value = doc[fieldname];
			let is_editable_field = this.print_order_item_editable_fields.includes(fieldname);

			field.df = grid_row.docfields.find((col) => col?.fieldname === fieldname);

			if (field.df) {
				grid_row.set_dependant_property(field.df);
			}

			if (!field.df) {
				field.display_status = "Read";
			} else if (field.df.fieldtype == "Attach Image") {
				field.display_status = value ? "Read" : "None";
			} else {
				field.display_status = frappe.perm.get_field_display_status(field.df, doc, this.frm.perm);
			}

			let formatted_value = this.get_formatted_print_order_item_value(field, doc);
			if (field.df?.fieldtype == "Attach Image") {
				field.$value.attr("src", formatted_value);
			} else {
				field.$value.html(this.get_formatted_print_order_item_value(field, doc));
			}

			field.$value.toggle(field.display_status == "Read" || !is_editable_field);

			if (is_editable_field) {
				field.$control.docname = doc.name;
				field.$control.df = field.df;
				field.$control.doc = doc;
				field.$control.refresh();
				field.$control.$wrapper.toggle(field.display_status == "Write");
			}
		}
	}

	get_formatted_print_order_item_value(field, doc) {
		let fieldnames_with_suffix = {
			"stock_print_length": " m",
			"stock_fabric_length": " m",
			"produced_qty": " m",
			"packed_qty": " m",
			"delivered_qty": " m",
		}

		let nbsp_fields = ["design_name"];

		if (field.fieldname == "design_size") {
			let width_df = frappe.meta.get_docfield(doc.doctype, "design_width");
			let height_df = frappe.meta.get_docfield(doc.doctype, "design_height");

			return frappe.format(doc["design_width"], width_df, { inline: 1 }, doc)
				+ " x "
				+ frappe.format(doc["design_height"], height_df, { inline: 1 }, doc);
		} else if (field.fieldname == "design_image") {
			if (doc[field.fieldname]) {
				return `/api/method/textile.utils.get_rotated_image?file=${encodeURIComponent(doc.design_image)}`;
			} else {
				return "";
			}
		} else {
			let txt = frappe.format(doc[field.fieldname], field.df, { inline: 1 }, doc);
			if (fieldnames_with_suffix[field.fieldname]) {
				txt += fieldnames_with_suffix[field.fieldname];
			}

			if (["packed_qty", "delivered_qty", "produced_qty"].includes(field.fieldname)) {
				if (doc.docstatus == 0) {
					return "";
				}
				if (
					(["packed_qty", "delivered_qty"].includes(field.fieldname) && this.frm.doc.is_internal_customer)
					|| (field.fieldname == "packed_qty" && !this.frm.doc.packing_slip_required)
				) {
					return "<span class='indicator light-gray text-faded'>N/A</span>";
				}

				let min_qty = flt(doc.stock_print_length, precision("stock_print_length", doc));

				let indicator_color = "orange";
				if (flt(doc[field.fieldname], precision("stock_print_length", doc)) >= min_qty) {
					indicator_color = "green";
				} else if (flt(doc[field.fieldname]) > 0) {
					indicator_color = "yellow";
				}

				txt = `<span class="indicator ${indicator_color}">${txt}</span>`;
			}

			if (!txt && nbsp_fields.includes(field.fieldname)) {
				return "&nbsp";
			} else {
				return txt;
			}
		}
	}

	setup_route_options() {
		let fabric_item_field = this.frm.get_docfield("fabric_item");
		if (fabric_item_field) {
			fabric_item_field.get_route_options_for_new_doc = () => {
				let route_options = {
					is_customer_provided_item: this.frm.doc.is_fabric_provided_by_customer,
				}
				if (this.frm.doc.is_fabric_provided_by_customer && this.frm.doc.customer) {
					route_options["customer"] = this.frm.doc.customer;
				}
				return route_options;
			}
		}
	}

	setup_buttons() {
		let doc = this.frm.doc;

		if (doc.docstatus == 1) {
			if (doc.per_work_ordered > 0) {
				this.frm.add_custom_button(__("Work Order List"), () => this.show_work_orders());
			}

			if (this.frm.has_perm("submit")) {
				if (doc.status == "Closed") {
					this.frm.add_custom_button(__('Re-Open'), () => this.update_status("Re-Opened"), __("Status"));
				} else if(doc.status != "Completed") {
					this.frm.add_custom_button(__('Close'), () => this.update_status("Closed"), __("Status"));
				}
			}

			let has_start_permission = frappe.model.can_write("Print Order")

			let has_missing_item = doc.items.filter(d => !d.item_code || !d.design_bom).length;
			if (has_missing_item && has_start_permission) {
				this.frm.add_custom_button(__('Items and BOMs'), () => this.create_design_items_and_boms(),
					__("Create"));
			}

			let can_create_sales_order = false;
			let can_create_work_order = false;

			let has_unpacked = !doc.is_internal_customer && doc.items.some(d => {
				let qty_precision = precision("stock_print_length", d);
				let packing_completion = flt(d.packed_qty) + flt(d.rejected_qty) + flt(d.shrinked_qty);
				return flt(d.produced_qty, qty_precision)
					&& flt(packing_completion, qty_precision) < flt(d.produced_qty, qty_precision)
			});

			let has_undelivered = !doc.is_internal_customer && doc.items.some(d => {
				let qty_precision = precision("stock_print_length", d);
				return flt(d.produced_qty, qty_precision)
					&& flt(d.delivered_qty, qty_precision) < flt(d.produced_qty, qty_precision)
					&& (!doc.packing_slip_required || flt(d.delivered_qty, qty_precision) < flt(d.packed_qty, qty_precision)
					)
			});

			if (!has_missing_item && doc.status != "Closed") {
				if (!doc.is_internal_customer && flt(doc.per_ordered) < 100) {
					can_create_sales_order = true;
					if (frappe.model.can_create("Sales Order")) {
						this.frm.add_custom_button(__('Sales Order'), () => this.make_sales_order(),
							__("Create"));
					}
				}

				if (
					(!doc.is_internal_customer && doc.per_ordered && doc.per_work_ordered < doc.per_ordered)
					|| (doc.is_internal_customer && flt(doc.per_work_ordered) < 100)
				) {
					can_create_work_order = true;
					if (frappe.model.can_create("Work Order") || has_start_permission) {
						this.frm.add_custom_button(__('Work Order'), () => this.create_work_orders(),
							__("Create"));
					}
				}

				if (
					frappe.model.can_create("Stock Entry")
					&& !doc.skip_transfer
					&& (doc.fabric_transfer_status == "To Transfer" || doc.delivery_status == "To Deliver")
				) {
					this.frm.add_custom_button(__('Fabric Transfer Entry'), () => this.make_fabric_transfer_entry(),
						__("Create"));
				}

				if (
					frappe.model.can_create("Stock Entry")
					&& doc.packing_slip_required
					&& has_unpacked
				) {
					this.frm.add_custom_button(__('Fabric Rejection Entry'), () => this.make_fabric_rejection_entry(),
						__("Create"));
					this.frm.add_custom_button(__('Fabric Shrinkage Entry'), () => this.make_fabric_shrinkage_entry(),
						__("Create"));
				}

				if (has_unpacked && frappe.model.can_create("Packing Slip")) {
					let packing_slip_btn = this.frm.add_custom_button(__("Packing Slip"), () => this.make_packing_slip());

					if (doc.packing_status != "Packed") {
						$(packing_slip_btn).removeClass("btn-default").addClass("btn-primary");
					}
				}

				if (has_undelivered && frappe.model.can_create("Delivery Note")) {
					let delivery_note_btn = this.frm.add_custom_button(__("Delivery Note"), () => this.make_delivery_note());

					if (
						(doc.packing_slip_required && doc.packing_status == "Packed")
						|| (!doc.packing_slip_required && doc.production_status == "Produced")
					) {
						$(delivery_note_btn).removeClass("btn-default").addClass("btn-primary");
					}
				}
			}

			if (doc.status != "Closed" && has_start_permission) {
				if (has_missing_item || can_create_sales_order || can_create_work_order) {
					let start_btn = this.frm.add_custom_button(__("Quick Start"), () => this.start_print_order());
					$(start_btn).removeClass("btn-default").addClass("btn-primary");
				}
			}
		}
	}

	set_default_warehouse() {
		if (this.frm.is_new()) {
			const po_to_dps_warehouse_fn_map = {
				'fabric_warehouse': 'default_printing_fabric_warehouse',
				'source_warehouse': 'default_printing_source_warehouse',
				'wip_warehouse': 'default_printing_wip_warehouse',
				'fg_warehouse': 'default_printing_fg_warehouse',
			}

			for (let [po_warehouse_fn, dps_warehouse_fn] of Object.entries(po_to_dps_warehouse_fn_map)) {
				let warehouse = frappe.defaults.get_default(dps_warehouse_fn);
				if (!this.frm.doc[po_warehouse_fn] && warehouse) {
					this.frm.set_value(po_warehouse_fn, warehouse);
				}
			}
			this.set_default_fabric_warehouse();
		}
	}

	set_default_fabric_warehouse() {
		let printing_fabric_warehouse = frappe.defaults.get_global_default("default_printing_fabric_warehouse");
		let coated_fabric_warehouse = frappe.defaults.get_global_default("default_coating_fg_warehouse");

		let warehouse = printing_fabric_warehouse;
		if (this.frm.doc.coating_item_separate_process) {
			warehouse = coated_fabric_warehouse || warehouse;
		}

		if (warehouse) {
			this.frm.set_value("fabric_warehouse", warehouse);
		}

		this.frm.set_value("skip_transfer", this.frm.doc.coating_item_separate_process);
	}

	set_default_cost_center() {
		if (this.frm.is_new()) {
			let default_cost_center = frappe.defaults.get_default("default_printing_cost_center");
			if (default_cost_center && !this.frm.doc.cost_center) {
				this.frm.set_value("cost_center", default_cost_center);
			}
		}
	}

	customer() {
		this.get_order_defaults_from_customer();
		this.get_is_internal_customer();
	}

	company() {
		this.get_is_internal_customer();
	}

	is_internal_customer() {
		if (this.frm.doc.is_internal_customer) {
			this.frm.set_value({
				is_fabric_provided_by_customer: 0,
			});
		}
	}

	fabric_item() {
		this.get_fabric_stock_qty();
		this.get_fabric_item_details();
	}

	process_item() {
		return frappe.run_serially([
			() => this.get_process_item_details(),
			() => this.set_default_fabric_warehouse(),
		]);
	}

	fabric_warehouse() {
		this.get_fabric_stock_qty();
	}

	get_fabric_item_details() {
		if (this.frm.doc.fabric_item) {
			return this.frm.call({
				method: "textile.fabric_printing.doctype.print_order.print_order.get_fabric_item_details",
				args: {
					fabric_item: this.frm.doc.fabric_item,
					get_default_process: 1
				},
				callback: (r) => {
					if (r.message) {
						this.frm.set_value(r.message);
					}
				}
			});
		}
	}

	get_process_item_details() {
		if (this.frm.doc.process_item) {
			return this.frm.call({
				method: "textile.fabric_printing.doctype.print_order.print_order.get_process_item_details",
				args: {
					process_item: this.frm.doc.process_item,
					fabric_item: this.frm.doc.fabric_item,
					get_default_paper: 1,
				},
				callback: (r) => {
					if (r.message) {
						this.frm.set_value(r.message);
					}
				}
			});
		}
	}

	default_gap() {
		this.override_default_value_in_items('design_gap', true);
	}

	default_qty() {
		this.override_default_value_in_items('qty');
	}

	default_uom() {
		this.override_default_value_in_items('uom');
		if (this.frm.doc.default_uom == "Panel") {
			this.frm.set_value("default_qty_type", "Print Qty");
		} else {
			this.frm.set_value("default_length_uom", this.frm.doc.default_uom);
		}
	}

	default_qty_type() {
		this.override_default_value_in_items('qty_type');
	}

	default_wastage() {
		this.override_default_value_in_items('per_wastage', true);
	}

	default_length_uom() {
		this.override_default_value_in_items('length_uom');
	}

	items_add(doc, cdt, cdn) {
		this.set_default_values_in_item(cdt, cdn);
	}

	items_remove() {
		this.calculate_totals();
	}

	before_items_remove(doc, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		return this.frm.attachments.remove_attachment_by_filename(row.design_image);
	}

	design_image(doc, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);

		if (row.design_image) {
			return frappe.call({
				method: "textile.fabric_printing.doctype.print_order.print_order.get_image_details",
				args: {
					image_url: row.design_image
				},
				callback: function (r) {
					if (!r.exc && r.message) {
						return frappe.model.set_value(cdt, cdn, r.message);
					}
				}
			});
		}
	}

	design_gap() {
		this.calculate_totals();
	}

	qty() {
		this.calculate_totals();
	}

	uom(doc, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);

		if (row.uom == 'Panel') {
			frappe.model.set_value(cdt, cdn, "qty_type", "Print Qty");
		} else {
			frappe.model.set_value(cdt, cdn, "length_uom", row.uom);
		}
		this.calculate_totals();
	}

	qty_type() {
		this.calculate_totals();
	}

	per_wastage() {
		this.calculate_totals();
	}

	length_uom() {
		this.calculate_totals();
	}

	get_order_defaults_from_customer() {
		if (!this.frm.doc.customer) return

		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.get_order_defaults_from_customer",
			args: {
				customer: this.frm.doc.customer
			},
			callback: (r) => {
				if (r.message) {
					this.frm.set_value(r.message);
				}
			}
		});
	}

	override_default_value_in_items(cdf, allow_zero=false) {
		(this.frm.doc.items || []).forEach(d => {
			this.set_default_values_in_item(d.doctype, d.name, cdf, allow_zero);
		});
	}

	set_default_values_in_item(cdt, cdn, cdf=null, allow_zero=false) {
		let defaults = {
			'design_gap': this.frm.doc.default_gap,
			'qty': this.frm.doc.default_qty,
			'uom': this.frm.doc.default_uom,	
			'qty_type': this.frm.doc.default_qty_type,
			'per_wastage': this.frm.doc.default_wastage,
			'length_uom': this.frm.doc.default_length_uom,
		}

		if (cdf) {
			if (defaults[cdf] || allow_zero) {
				frappe.model.set_value(cdt, cdn, cdf, defaults[cdf]);
			}
		} else {
			for (const [key, value] of Object.entries(defaults)) {
				if (value || allow_zero) {
					frappe.model.set_value(cdt, cdn, key, value);
				}
			}
		}
	}

	calculate_totals = () => {
		this.frm.doc.total_print_length = 0;
		this.frm.doc.total_fabric_length = 0;
		this.frm.doc.total_panel_qty = 0;

		let conversion_factors = textile.get_textile_conversion_factors();

		this.frm.doc.items.forEach(d => {
			frappe.model.round_floats_in(d);

			d.panel_based_qty = cint(Boolean(d.design_gap));

			d.panel_length_inch = flt(d.design_height) + flt(d.design_gap);
			d.panel_length_meter = d.panel_length_inch * conversion_factors.inch_to_meter;
			d.panel_length_yard = d.panel_length_meter / conversion_factors.yard_to_meter;

			if (d.uom != "Panel") {
				d.length_uom = d.uom;
			}

			let waste = d.per_wastage / 100;
			let uom_to_convert = d.length_uom + '_to_' + d.stock_uom;
			let conversion_factor = conversion_factors[uom_to_convert.toLowerCase()] || 1;

			if (d.uom != "Panel") {
				d.print_length = d.qty_type == "Print Qty" ? d.qty : waste < 1 ? d.qty * (1 - waste) : 0;
				d.fabric_length = d.qty_type == "Fabric Qty" ? d.qty : waste < 1 ? d.qty / (1 - waste) : 0;
			} else {
				d.print_length = d.qty * d.panel_length_meter / conversion_factor;
				d.fabric_length = waste < 1 ? d.print_length / (1 - waste) : 0;
			}

			d.print_length = flt(d.print_length, precision("print_length", d));
			d.fabric_length = flt(d.fabric_length, precision("fabric_length", d));

			d.stock_print_length = flt(d.print_length * conversion_factor, 6);
			d.stock_fabric_length = flt(d.fabric_length * conversion_factor, 6);

			d.panel_qty = d.panel_length_meter ? d.stock_print_length / d.panel_length_meter : 0;
			d.panel_qty = flt(d.panel_qty, precision("panel_qty", d));

			this.frm.doc.total_print_length += d.stock_print_length;
			this.frm.doc.total_fabric_length += d.stock_fabric_length;
			this.frm.doc.total_panel_qty += d.panel_qty;
		});

		this.frm.doc.total_print_length = flt(this.frm.doc.total_print_length, precision("total_print_length"));
		this.frm.doc.total_fabric_length = flt(this.frm.doc.total_fabric_length, precision("total_fabric_length"));
		this.frm.doc.total_panel_qty = flt(this.frm.doc.total_panel_qty, precision("total_panel_qty"));

		this.frm.debounced_refresh_fields();
	}

	get_items_from_attachments = frappe.utils.debounce(() => {
		let me = this;
		return frappe.call({
			method: "on_upload_complete",
			doc: me.frm.doc,
			callback: function(r) {
				if (!r.exc) {
					me.calculate_totals();
				}
			}
		});
	}, 1000);

	update_status(status) {
		this.frm.check_if_unsaved();

		frappe.ui.form.is_saving = true;
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.update_status",
			args: {
				print_order: this.frm.doc.name,
				status: status
			},
			callback: (r) => {
				this.frm.reload_doc();
			},
			always: () => {
				frappe.ui.form.is_saving = false;
			}
		});
	}

	start_print_order() {
		if (this.frm.doc.skip_transfer) {
			frappe.confirm(__("Quick starting will create Design Items and BOMs, Sales Order and Work Orders"), () => {
				return this._start_print_order(0);
			});
		} else {
			this.show_fabric_transfer_qty_prompt((data) => {
				return this._start_print_order(data.fabric_transfer_qty);
			}, __("Quick starting will create Design Items and BOMs, Fabric Transfer Entry, Sales Order and Work Orders"));
		}
	}

	_start_print_order(fabric_transfer_qty) {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.start_print_order",
			args: {
				print_order: this.frm.doc.name,
				fabric_transfer_qty: flt(fabric_transfer_qty),
			},
			freeze: true,
			callback: (r) => {
				if (!r.exc) {
					this.frm.reload_doc();
				}
			}
		});
	}

	create_design_items_and_boms() {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.create_design_items_and_boms",
			args: {
				print_order: this.frm.doc.name
			},
			freeze: true,
			callback: (r) => {
				if (!r.exc) {
					this.frm.reload_doc();
				}
			}
		});
	}

	make_sales_order() {
		frappe.model.open_mapped_doc({
			method: "textile.fabric_printing.doctype.print_order.print_order.make_sales_order",
			frm: this.frm
		});
	}

	create_work_orders() {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.create_work_orders",
			args: {
				print_order: this.frm.doc.name
			},
			freeze: true,
			callback: (r) => {
				if (!r.exc) {
					this.frm.reload_doc();
				}
			}
		});
	}

	make_fabric_transfer_entry() {
		this.show_fabric_transfer_qty_prompt((data) => {
			return frappe.call({
				method: "textile.fabric_printing.doctype.print_order.print_order.make_fabric_transfer_entry",
				args: {
					"print_order": this.frm.doc.name,
					"fabric_transfer_qty": flt(data.fabric_transfer_qty),
				},
				callback: function (r) {
					if (!r.exc) {
						let doclist = frappe.model.sync(r.message);
						frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
					}
				}
			});
		}, null, true);
	}

	make_fabric_rejection_entry() {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.make_fabric_reconciliation_entry",
			args: {
				"print_order": this.frm.doc.name,
				"purpose": "Material Transfer",
			},
			callback: function (r) {
				if (!r.exc) {
					let doclist = frappe.model.sync(r.message);
					frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
				}
			}
		});
	}

	make_fabric_shrinkage_entry() {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.make_fabric_reconciliation_entry",
			args: {
				"print_order": this.frm.doc.name,
				"purpose": "Material Issue",
			},
			callback: function (r) {
				if (!r.exc) {
					let doclist = frappe.model.sync(r.message);
					frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
				}
			}
		});
	}

	show_fabric_transfer_qty_prompt(callback, qty_description, suggest_qty) {
		let remaining_transfer_qty = Math.max(flt(this.frm.doc.total_fabric_length) - flt(this.frm.doc.fabric_transfer_qty), 0);
		return frappe.prompt([
			{
				label: __("Fabric Transfer Qty"),
				fieldname: "fabric_transfer_qty",
				fieldtype: "Float",
				default: suggest_qty ? remaining_transfer_qty : null,
				description: qty_description,
				reqd: 1,
			},
			{
				label: __("Ordered Print Qty"),
				fieldname: "total_print_length",
				fieldtype: "Float",
				default: this.frm.doc.total_print_length,
				read_only: 1,
			},
			{
				label: __("Required Fabric Qty"),
				fieldname: "total_fabric_length",
				fieldtype: "Float",
				default: this.frm.doc.total_fabric_length,
				read_only: 1,
			},
			{
				label: __("Fabric Qty In Stock"),
				fieldname: "fabric_stock_qty",
				fieldtype: "Float",
				default: this.frm.doc.fabric_stock_qty,
				read_only: 1,
			},
		], (data) => {
			return callback && callback(data);
		}, "Enter Fabric Transfer Qty");
	}

	make_packing_slip() {
		let selected_rows = this.frm.fields_dict.items.grid.get_selected();

		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.make_packing_slip",
			args: {
				source_name: this.frm.doc.name,
				selected_rows: selected_rows,
			},
			callback: function (r) {
				if (!r.exc) {
					let doclist = frappe.model.sync(r.message);
					frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
				}
			}
		});
	}

	make_delivery_note() {
		return frappe.call({
			method: "textile.fabric_printing.doctype.print_order.print_order.make_delivery_note",
			args: {
				source_name: this.frm.doc.name,
			},
			callback: function (r) {
				if (!r.exc) {
					let doclist = frappe.model.sync(r.message);
					frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
				}
			}
		});
	}

	show_work_orders() {
		frappe.route_options = {
			print_order: this.frm.doc.name,
			selected_page_count: 100,
		}
		return frappe.set_route("print-work-order");
	}

	setup_progressbars() {
		frappe.realtime.off("print_order_progress");
		frappe.realtime.on("print_order_progress", (progress_data) => {
			if (progress_data && progress_data.print_order == this.frm.doc.name) {
				this.update_progress(progress_data);
			}
		});

		if (this.frm.doc.docstatus == 1 && this.frm.doc.per_work_ordered) {
			this.show_progress_for_production();
			this.show_progress_for_packing();
			this.show_progress_for_delivery();
		}
	}

	update_progress(progress_data) {
		if (progress_data) {
			this.frm.dashboard.show_progress(
				progress_data.title || "Progress",
				cint(progress_data.total) ? cint(progress_data.progress) / cint(progress_data.total) * 100 : 0,
				progress_data.description
			);

			if (progress_data.reload) {
				this.frm.reload_doc();
			}
		}
	}

	show_progress_for_production() {
		let produced_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.produced_qty));
		let remaining_print = this.frm.doc.total_print_length - produced_qty;
		remaining_print = Math.max(remaining_print, 0);

		erpnext.utils.show_progress_for_qty({
			frm: this.frm,
			title: __('Production Status'),
			total_qty: this.frm.doc.total_print_length,
			progress_bars: [
				{
					title: __('<b>Produced:</b> {0} / {1} {2} ({3}%)', [
						frappe.format(produced_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						frappe.format(this.frm.doc.total_print_length, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter",
						format_number(produced_qty / this.frm.doc.total_print_length * 100, null, 1),
					]),
					completed_qty: produced_qty,
					progress_class: "progress-bar-success",
					add_min_width: 0.5,
				},
				{
					title: __("<b>Remaining:</b> {0} {1}", [
						frappe.format(remaining_print, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter"
					]),
					completed_qty: remaining_print,
					progress_class: "progress-bar-warning",
				},
			],
		});
	}

	show_progress_for_packing() {
		let produced_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.produced_qty));
		if (!produced_qty || this.frm.doc.is_internal_customer || !this.frm.doc.packing_slip_required) {
			return;
		}

		let packed_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.packed_qty));
		let rejected_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.rejected_qty));
		let shrinked_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.shrinked_qty));
		let to_pack_qty = produced_qty - packed_qty - rejected_qty - shrinked_qty;
		to_pack_qty = Math.max(to_pack_qty, 0);

		erpnext.utils.show_progress_for_qty({
			frm: this.frm,
			title: __('Packing Status'),
			total_qty: this.frm.doc.total_print_length,
			progress_bars: [
				{
					title: __('<b>Packed:</b> {0} {1} ({2}%)', [
						frappe.format(packed_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter",
						format_number(packed_qty / this.frm.doc.total_print_length * 100, null, 1),
					]),
					completed_qty: packed_qty,
					progress_class: "progress-bar-success",
					add_min_width: 0.5,
				},
				{
					title: __("<b>Rejected:</b> {0} {1} ({2}%)", [
						frappe.format(rejected_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter",
						format_number(rejected_qty / this.frm.doc.total_print_length * 100, null, 1),
					]),
					completed_qty: rejected_qty,
					progress_class: "progress-bar-yellow",
				},
				{
					title: __("<b>Shrinked:</b> {0} {1} ({2}%)", [
						frappe.format(shrinked_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter",
						format_number(shrinked_qty / this.frm.doc.total_print_length * 100, null, 1),
					]),
					completed_qty: shrinked_qty,
					progress_class: "progress-bar-info",
				},
				{
					title: __("<b>To Pack:</b> {0} {1}", [
						frappe.format(to_pack_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter"
					]),
					completed_qty: to_pack_qty,
					progress_class: "progress-bar-warning",
				},
			],
		});
	}

	show_progress_for_delivery() {
		if (this.frm.doc.is_internal_customer) {
			return;
		}

		let produced_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.produced_qty));
		let packed_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.packed_qty));
		let deliverable_qty = this.frm.doc.packing_slip_required ? packed_qty : produced_qty;
		if (!deliverable_qty) {
			return;
		}

		let delivered_qty = frappe.utils.sum(this.frm.doc.items.map(d => d.delivered_qty));
		let to_deliver = deliverable_qty - delivered_qty;
		to_deliver = Math.max(to_deliver, 0);

		erpnext.utils.show_progress_for_qty({
			frm: this.frm,
			title: __('Delivery Status'),
			total_qty: this.frm.doc.total_print_length,
			progress_bars: [
				{
					title: __('<b>Delivered:</b> {0} {1} ({2}%)', [
						frappe.format(delivered_qty, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter",
						format_number(delivered_qty / this.frm.doc.total_print_length * 100, null, 1),
					]),
					completed_qty: delivered_qty,
					progress_class: "progress-bar-success",
					add_min_width: 0.5,
				},
				{
					title: __("<b>Ready to Deliver:</b> {0} {1}", [
						frappe.format(to_deliver, {'fieldtype': 'Float'}, { inline: 1 }),
						"Meter"
					]),
					completed_qty: to_deliver,
					progress_class: "progress-bar-warning",
				},
			],
		});
	}
};

extend_cscript(cur_frm.cscript, new textile.PrintOrder({frm: cur_frm}));
