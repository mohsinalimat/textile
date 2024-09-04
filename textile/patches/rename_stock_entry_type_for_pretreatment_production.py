import frappe
from frappe.model.utils.rename_field import rename_field


def execute():
	frappe.reload_doc("fabric_pretreatment", "doctype", "fabric_pretreatment_settings")
	rename_field("Fabric Pretreatment Settings",
		"stock_entry_type_for_pretreatment_prodution", "stock_entry_type_for_pretreatment_production")
