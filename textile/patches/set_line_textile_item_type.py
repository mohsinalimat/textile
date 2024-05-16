import frappe
from frappe.utils.fixtures import sync_fixtures


def execute():
	dts = ["Quotation Item", "Sales Order Item", "Delivery Note Item", "Sales Invoice Item"]

	for dt in dts:
		frappe.reload_doctype(dt)

	sync_fixtures(app="textile")

	for dt in dts:
		if frappe.get_meta(dt).has_field("textile_item_type"):
			frappe.db.sql(f"""
				update `tab{dt}` line
				inner join `tabItem` im on im.name = line.item_code
				set
					line.textile_item_type = im.textile_item_type
			""")

		frappe.delete_doc_if_exists("Custom Field", f"{dt}-is_printed_fabric")
