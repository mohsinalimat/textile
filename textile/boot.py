import frappe
from frappe import _


def boot_session(bootinfo):
	if frappe.session['user'] != 'Guest':
		if not bootinfo.get('additional_sle_filters'):
			bootinfo.additional_sle_filters = []

		bootinfo.additional_sle_filters.append({
			'label': _("Fabric Item"),
			'fieldname': 'fabric_item',
			'fieldtype': 'Link',
			'options': 'Item',
			'get_query': {
				'filters': {
					'textile_item_type': ['in', ['Greige Fabric', 'Ready Fabric']]
				}
			}
		})


def set_sle_item_conditions(filters, conditions, alias="`tabItem`"):
	from textile.utils import get_combined_fabric_items

	fabric_item = filters.get('fabric_item')
	if fabric_item:
		combined = get_combined_fabric_items(fabric_item)
		if combined.textile_item_type not in ("Ready Fabric", "Greige Fabric"):
			frappe.throw(_("Fabric Item filter must be either Ready Fabric or Greige Fabric"))

		if combined.fabric_item_codes:
			filters["fabric_item_codes"] = combined.fabric_item_codes
			conditions.append(f"{alias}.name in %(fabric_item_codes)s")
		else:
			conditions.append(f"{alias}.name = %(fabric_item)s")
