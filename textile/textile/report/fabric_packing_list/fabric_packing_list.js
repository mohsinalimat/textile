// Copyright (c) 2023, ParaLogic and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.provide("textile");

textile.group_field_opts_fpl = [
	"",
	"Group by Package",
	"Group by Customer",
	"Group by Print Order",
	"Group by Fabric Item",
	"Group by Design Item",
]

frappe.query_reports["Fabric Packing List"] = {
	"filters": [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
			reqd: 1,
			print_hide: 1,
		},
		{
			fieldname: "customer",
			label: __("Customer"),
			fieldtype: "Link",
			options: "Customer",
			on_change: () => {
				var customer = frappe.query_report.get_filter_value('customer');
				if (customer) {
					frappe.db.get_value('Customer', customer, ["customer_name"], function(value) {
						frappe.query_report.set_filter_value('customer_name', value["customer_name"]);
					});
				} else {
					frappe.query_report.set_filter_value('customer_name', "");
				}
			},
			print_hide: 1,
		},
		{
			fieldname: "customer_name",
			label: __("Customer Name"),
			fieldtype: "Data",
			read_only: 1,
			hidden: 1,
		},
		{
			"fieldname":"print_order",
			"label": __("Print Order"),
			"fieldtype": "MultiSelectList",
			get_data: function(txt) {
				let filters = {
					company: frappe.query_report.get_filter_value("company")
				}
				customer = frappe.query_report.get_filter_value("customer");
				if (customer) {
					filters.customer = customer;
				}
				return frappe.db.get_link_options('Print Order', txt, filters);
			}
		},
		{
			fieldname: "packing_slip",
			label: __("Package"),
			fieldtype: "Link",
			options: "Packing Slip",
		},
		{
			fieldname: "package_type",
			label: __("Package Type"),
			fieldtype: "Link",
			options: "Package Type",
		},
		{
			fieldname: "fabric_item",
			label: __("Fabric Item"),
			fieldtype: "Link",
			options: "Item",
			get_query: function() {
				return {
					query: "erpnext.controllers.queries.item_query",
					filters: {
						'textile_item_type': "Ready Fabric"
					}
				};
			},
			on_change: () => {
				var item = frappe.query_report.get_filter_value('fabric_item');
				if (item) {
					frappe.db.get_value('Item', item, ["item_name"], function(value) {
						frappe.query_report.set_filter_value('fabric_item_name', value["item_name"]);
					});
				} else {
					frappe.query_report.set_filter_value('fabric_item_name', "");
				}
			},
		},
		{
			fieldname: "fabric_item_name",
			label: __("Fabric Item Name"),
			fieldtype: "Data",
			read_only: 1,
			hidden: 1,
		},
		{
			fieldname: "fabric_material",
			label: __("Fabric Material"),
			fieldtype: "Link",
			options: "Fabric Material",
		},
		{
			fieldname: "fabric_type",
			label: __("Fabric Type"),
			fieldtype: "Link",
			options: "Fabric Type",
		},
		{
			fieldname: "warehouse",
			label: __("Warehouse"),
			fieldtype: "Link",
			options: "Warehouse",
			get_query: function() {
				return {
					filters: {'company': frappe.query_report.get_filter_value("company")}
				}
			},
		},
		{
			fieldname: "group_by_1",
			label: __("Group By Level 1"),
			fieldtype: "Select",
			options: textile.group_field_opts_fpl,
			default: "",
			print_hide: 1,
		},
		{
			fieldname: "group_by_2",
			label: __("Group By Level 2"),
			fieldtype: "Select",
			options: textile.group_field_opts_fpl,
			default: "Group by Package",
			print_hide: 1,
		},
		{
			fieldname: "totals_only",
			label: __("Group Totals Only"),
			fieldtype: "Check",
			print_hide: 1,
		},
		{
			fieldname: "show_delivered",
			label: __("Show Delivered"),
			fieldtype: "Check"
		},
		{
			fieldname: "show_image_in_print",
			label: __("Show Design Image in Print"),
			fieldtype: "Check",
		},
	],
	formatter: function(value, row, column, data, default_formatter) {
		var style = {};

		if (data.is_return_fabric) {
			style['color'] = 'var(--alert-text-info)';
		}

		return default_formatter(value, row, column, data, {css: style});
	},
	initial_depth: 1
};
