import frappe


def execute():
	dns = frappe.db.sql_list("""
		select distinct i.parent
		from `tabDelivery Note Item` i
		inner join `tabDelivery Note` p on p.name = i.parent
		inner join `tabItem` item on item.name = i.item_code
		where p.docstatus = 1
			and i.skip_sales_invoice = 1 and item.is_customer_provided_item = 0 and i.is_return_fabric = 1
	""")

	for i, name in enumerate(dns):
		print(f"{i+1} / {len(dns)}: {name}")
		doc = frappe.get_doc("Delivery Note", name)
		doc.set_skip_sales_invoice(update=True, update_modified=True)
		doc.set_billing_status(update=True, update_modified=True)
		doc.set_status(update=True, update_modified=True)
