import frappe


def execute():
	frappe.reload_doctype("Work Order")
	frappe.db.sql("""
		update `tabWork Order`
		set allow_process_loss = 1, allow_material_consumption = 1
		where pretreatment_order != '' and pretreatment_order is not null
	""")
