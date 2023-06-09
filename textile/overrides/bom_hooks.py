import frappe


def on_bom_cancel(doc, method):
	print_orders = frappe.db.sql_list("""
		select distinct parent
		from `tabPrint Order Item`
		where design_bom = %s
	""", doc.name)

	if not print_orders:
		return

	frappe.db.sql("""
		update `tabPrint Order Item`
		set design_bom = null
		where design_bom = %s
	""", doc.name)

	for name in print_orders:
		doc = frappe.get_doc("Print Order", name)
		doc.set_item_creation_status(update=True)
		doc.notify_update()
