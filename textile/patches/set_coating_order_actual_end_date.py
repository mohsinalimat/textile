import frappe


def execute():
	names = frappe.get_all("Coating Order", filters={"docstatus": 1})
	for name in names:
		doc = frappe.get_doc("Coating Order", name)
		doc.set_coating_status(update=False)
		doc.db_set("actual_end_date", doc.actual_end_date, update_modified=False)
		doc.clear_cache()
