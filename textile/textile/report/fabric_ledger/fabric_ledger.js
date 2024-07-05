// Copyright (c) 2024, ParaLogic and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Fabric Ledger"] = {
	"filters": [
		{
			"fieldname": "company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company"),
			"bold": 1
		},
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"reqd": 1
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1
		},
		{
			"fieldname": "customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer"
		},
		{
			"fieldname": "item_code",
			"label": __("Fabric Item"),
			"fieldtype": "Link",
			"options": "Item",
			"get_query": function() {
				let out = {
					query: "erpnext.controllers.queries.item_query",
					filters: {
						"include_disabled": 1,
						"textile_item_type": ["in", ["Greige Fabric", "Ready Fabric"]]
					}
				}

				let customer = frappe.query_report.get_filter_value("customer");
				if (customer) {
					out.filters['customer'] = customer;
				}

				return out;
			},
			on_change: function() {
				let item_code = frappe.query_report.get_filter_value('item_code');
				if (!item_code) {
					frappe.query_report.set_filter_value('item_name', "");
				} else {
					frappe.db.get_value("Item", item_code, ['item_name', 'customer'], function(value) {
						frappe.query_report.set_filter_value('customer', value['customer']);
						frappe.query_report.set_filter_value('item_name', value['item_name']);
					});
				}
			}
		},
		{
			"fieldname": "item_name",
			"label": __("Fabric Name"),
			"fieldtype": "Data",
			"read_only": 1,
		},
		{
			"fieldname": "batch_no",
			"label": __("Batch No"),
			"fieldtype": "Link",
			"options": "Batch",
			"get_query": function() {
				let filters = {};

				let item_code = frappe.query_report.get_filter_value("item_code");
				if (item_code) {
					filters['item'] = item_code;
				}

				return {
					filters: filters
				};
			},
		},
		{
			"fieldname": "hide_internal_entries",
			"label": __("Hide Internal Entries"),
			"fieldtype": "Check",
			"default": 1,
		},
		{
			"fieldname": "merge_print_production",
			"label": __("Merge Print Production Entries"),
			"fieldtype": "Check",
			"default": 1,
		},
		{
			"fieldname": "combine_greige_ready",
			"label": __("Combine Greige and Ready Fabric"),
			"fieldtype": "Check",
			"default": 1,
		},
		{
			"fieldname": "orientation",
			"label": __("Orientation"),
			"fieldtype": "Data",
			"default": "Portrait",
			"hidden": 1,
		},
	],
	formatter: function(value, row, column, data, default_formatter) {
		var style = {};

		$.each(['in_qty', 'out_qty'], function (i, f) {
			if (flt(value)) {
				if (column.fieldname === 'in_qty') {
					style['color'] = 'green';
				}
				if (column.fieldname === 'out_qty') {
					style['color'] = 'red';
				}

				if (data.is_internal_entry && ['in_qty', 'out_qty'].includes(column.fieldname)) {
					style['color'] = 'var(--gray-600)';
				}
			}
		});

		return default_formatter(value, row, column, data, {css: style});
	},
};
