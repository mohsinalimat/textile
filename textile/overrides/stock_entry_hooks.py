import frappe
from frappe import _
from frappe.utils import flt
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
from erpnext.stock.get_item_details import get_conversion_factor


class StockEntryDP(StockEntry):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.force_item_fields += ["fabric_item", "fabric_item_name"]

	def validate(self):
		super().validate()
		self.validate_fabric_printer()
		self.validate_print_process()

	def on_submit(self):
		super().on_submit()
		self.update_print_order_fabric_transfer_status()
		self.update_order_reconciliation_status()
		self.update_coating_order(validate_coating_order_qty=True)

	def on_cancel(self):
		super().on_cancel()
		self.update_print_order_fabric_transfer_status()
		self.update_order_reconciliation_status()
		self.update_coating_order()

	def set_stock_entry_type(self):
		printing_settings = frappe.get_cached_doc("Fabric Printing Settings", None)
		pretreatment_settings = frappe.get_cached_doc("Fabric Pretreatment Settings", None)

		ste_type = None
		if self.get("print_order"):
			if self.purpose == "Manufacture":
				ste_type = printing_settings.stock_entry_type_for_print_production
			elif self.purpose == "Material Transfer for Manufacture":
				ste_type = printing_settings.stock_entry_type_for_fabric_transfer
			elif self.purpose == "Material Issue":
				ste_type = printing_settings.stock_entry_type_for_fabric_shrinkage
			elif self.purpose == "Material Transfer":
				ste_type = printing_settings.stock_entry_type_for_fabric_rejection

		elif self.get("coating_order"):
			if self.purpose == "Manufacture":
				ste_type = printing_settings.stock_entry_type_for_fabric_coating

		elif self.get("pretreatment_order"):
			if self.purpose == "Manufacture":
				ste_type = pretreatment_settings.stock_entry_type_for_pretreatment_production
			elif self.purpose == "Material Transfer for Manufacture":
				ste_type = pretreatment_settings.stock_entry_type_for_fabric_transfer
			elif self.purpose == "Material Consumption for Manufacture":
				ste_type = pretreatment_settings.stock_entry_type_for_operation_consumption
			elif self.purpose == "Material Transfer":
				ste_type = pretreatment_settings.stock_entry_type_for_fabric_rejection

		if ste_type:
			self.stock_entry_type = ste_type
		else:
			super().set_stock_entry_type()

	def update_print_order_fabric_transfer_status(self):
		if not self.get("print_order") or self.purpose != "Material Transfer for Manufacture" or self.get("work_order"):
			return

		if not frappe.flags.skip_print_order_status_update:
			print_order = frappe.get_doc("Print Order", self.print_order)
			print_order.set_fabric_transfer_status(update=True)
			print_order.notify_update()

	def update_order_reconciliation_status(self):
		if self.purpose not in ("Material Issue", "Material Transfer"):
			return

		work_orders = list(set([d.work_order for d in self.items if d.get("work_order")]))
		if not work_orders:
			return

		wo_details = frappe.db.sql("""
			select print_order, pretreatment_order
			from `tabWork Order`
			where name in %s and docstatus = 1
		""", [work_orders], as_dict=True)

		pretreatment_orders = set([d.pretreatment_order for d in wo_details if d.pretreatment_order])
		print_orders = set([d.print_order for d in wo_details if d.print_order])

		for name in pretreatment_orders:
			doc = frappe.get_doc("Pretreatment Order", name)
			doc.set_production_packing_status(update=True)
			doc.set_status(update=True)
			doc.notify_update()

		for name in print_orders:
			doc = frappe.get_doc("Print Order", name)
			doc.set_production_packing_status(update=True)
			doc.set_status(update=True)
			doc.notify_update()

	def update_coating_order(self, validate_coating_order_qty=False):
		if not self.coating_order:
			return

		coating_order_doc = frappe.get_doc("Coating Order", self.coating_order)

		if coating_order_doc.docstatus != 1:
			frappe.throw(_("Coating Order {0} must be submitted").format(self.coating_order))

		if coating_order_doc.status == 'Stopped':
			frappe.throw(_("Transaction not allowed against stopped Coating Order {0}").format(self.coating_order))

		coating_order_doc.set_coating_status(update=True)

		if validate_coating_order_qty:
			coating_order_doc.validate_coating_order_qty(from_doctype=self.doctype)

		coating_order_doc.set_status(update=True)
		coating_order_doc.notify_update()

	def validate_fabric_printer(self):
		if self.purpose != "Manufacture":
			return

		if self.get("print_order"):
			if not self.get("fabric_printer"):
				frappe.throw(_("Fabric Printer mandatory for Manufacture Stock Entry of Print Order"))
		else:
			self.fabric_printer = None

	def validate_print_process(self):
		if self.purpose != "Manufacture":
			return
		if not self.get("fabric_printer") or not self.get("work_order"):
			return

		printer_process = frappe.get_cached_value("Fabric Printer", self.fabric_printer, "process_item")
		work_order_process = frappe.db.get_value("Work Order", self.work_order, "process_item", cache=1)

		if printer_process and printer_process != work_order_process:
			frappe.throw(_("Fabric Printer {0} is not allowed to manufacture using Process {1} in {2}").format(
				self.fabric_printer, work_order_process, frappe.get_desk_link("Work Order", self.work_order)
			))

	def get_bom_raw_materials(self, qty, process_loss_qty=0):
		from textile.utils import gsm_to_grams

		if self.coating_order:
			coating_order_doc = frappe.get_doc("Coating Order", self.coating_order)

			if coating_order_doc.coating_item_by_fabric_weight:
				fabric_grams_per_meter = gsm_to_grams(coating_order_doc.fabric_gsm, coating_order_doc.fabric_width)
				consumption_grams_per_meter = fabric_grams_per_meter * flt(coating_order_doc.fabric_per_pickup) / 100
				cf_coating = get_conversion_factor(coating_order_doc.coating_item, "Gram").conversion_factor * consumption_grams_per_meter
			else:
				cf_coating = get_conversion_factor(coating_order_doc.coating_item, coating_order_doc.stock_uom).conversion_factor

			# Add raw materials
			coating_item_qty = qty * cf_coating
			items_dict = super().get_bom_raw_materials(coating_item_qty, process_loss_qty)
			for d in items_dict.values():
				d.from_warehouse = coating_order_doc.source_warehouse

			# Add fabric item
			items_dict = {
				coating_order_doc.fabric_item: frappe._dict({
					'item_code': coating_order_doc.fabric_item,
					'from_warehouse': coating_order_doc.fabric_warehouse,
					'uom': coating_order_doc.stock_uom,
					'qty': qty,
				}), **items_dict
			}

		else:
			items_dict = super().get_bom_raw_materials(qty, process_loss_qty)

		return items_dict

	def add_finished_goods_items_from_bom(self):
		if self.coating_order:
			fabric_details = frappe.db.get_value("Coating Order", self.coating_order, ["fabric_item", "fg_warehouse"], as_dict=1)
			item = frappe.get_cached_doc("Item", fabric_details.fabric_item)

			self.add_to_stock_entry_detail({
				item.name: {
					"to_warehouse": fabric_details.fg_warehouse,
					"qty": self.fg_completed_qty,
					"item_name": item.item_name,
					"description": item.description,
					"stock_uom": item.stock_uom,
				}
			})
		else:
			super().add_finished_goods_items_from_bom()


def update_stock_entry_from_work_order(stock_entry, work_order):
	stock_entry.pretreatment_order = work_order.pretreatment_order
	stock_entry.print_order = work_order.print_order


def get_stock_entry_permission_query_conditions(user=None):
	# hide print/pretreatment stock entries if user does not have print/pretreatment roles
	user_has_roles = frappe.get_roles(user)

	conditions = []

	if ("Pretreatment Production User" not in user_has_roles) and ("Pretreatment Sales User" not in user_has_roles):
		conditions.append("(`tabStock Entry`.pretreatment_order IS NULL OR `tabStock Entry`.pretreatment_order = '')")

	if ("Pretreatment Production User" not in user_has_roles) and ("Pretreatment Sales User" not in user_has_roles) and ("Coating User" not in user_has_roles):
		conditions.append("(`tabStock Entry`.coating_order IS NULL OR `tabStock Entry`.coating_order = '')")

	if ("Print Production User" not in user_has_roles) and ("Print Sales User" not in user_has_roles):
		conditions.append("(`tabStock Entry`.print_order IS NULL OR `tabStock Entry`.print_order = '')")

	conditions = f"({' AND '.join(conditions)})" if conditions else ""
	return conditions


def stock_entry_has_permission(doc, user=None, permission_type=None):
	# restrict print/pretreatment stock entries if user does not have print/pretreatment roles
	user_has_roles = frappe.get_roles(user)

	if doc.get("print_order"):
		if ("Print Production User" not in user_has_roles) and ("Print Sales User" not in user_has_roles):
			return False

	if doc.get("coating_order"):
		if ("Print Production User" not in user_has_roles) and ("Print Sales User" not in user_has_roles) and ("Coating User" not in user_has_roles):
			return False

	if doc.get("pretreatment_order"):
		if ("Pretreatment Production User" not in user_has_roles) and ("Pretreatment Sales User" not in user_has_roles):
			return False
