import frappe
from frappe.utils.fixtures import sync_fixtures


def execute():
	frappe.reload_doctype("Quotation Item")
	frappe.reload_doctype("Sales Order Item")
	frappe.reload_doctype("Delivery Note Item")
	frappe.reload_doctype("Sales Invoice Item")

	sync_fixtures(app="textile")

	dts = ["Quotation Item", "Sales Order Item", "Delivery Note Item", "Sales Invoice Item"]
	for dt in dts:
		if frappe.get_meta(dt).has_field("textile_item_type"):
			frappe.db.sql(f"""
				update `tab{dt}` line
				inner join `tabItem` im on im.name = line.item_code
				set
					line.textile_item_type = im.textile_item_type
			""")
