import frappe


def execute():
	print_orders = frappe.db.sql_list("""
		select distinct print_order
		from `tabPacking Slip Item`
		where print_order is not null and print_order != '' and rejected_qty != 0 and docstatus = 1
	""")

	for name in print_orders:
		doc = frappe.get_doc("Print Order", name)
		doc.set_production_packing_status(update=True, update_modified=False)
		doc.set_status(update=True, update_modified=False)
