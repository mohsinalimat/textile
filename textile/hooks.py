from . import __version__ as app_version

app_name = "textile"
app_title = "Textile"
app_publisher = "ParaLogic"
app_description = "Textile ERP Application"
app_email = "info@paralogic.io"
app_license = "GNU General Public License (v3)"
required_apps = ["ParaLogicTech/erpnext"]

app_include_js = "textile.bundle.js"
app_include_css = "textile.bundle.css"

after_install = "textile.install.after_install"
notification_config = "textile.notifications.get_notification_config"

boot_session = "textile.boot.boot_session"
set_sle_item_conditions = "textile.boot.set_sle_item_conditions"

has_permission = {
	"Work Order": "textile.overrides.work_order_hooks.work_order_has_permission",
	"Stock Entry": "textile.overrides.stock_entry_hooks.stock_entry_has_permission",
}

permission_query_conditions = {
	"Work Order": "textile.overrides.work_order_hooks.get_work_order_permission_query_conditions",
	"Stock Entry": "textile.overrides.stock_entry_hooks.get_stock_entry_permission_query_conditions",
}

doc_events = {
	"Sales Order": {
		"autoname": "textile.overrides.sales_order_hooks.sales_order_autoname",
	},
	"Customer": {
		"validate": "textile.overrides.customer_hooks.customer_order_default_validate",
	},
	"UOM": {
		"before_rename": "textile.overrides.uom_hooks.before_uom_rename",
	},
	"UOM Conversion Factor": {
		"on_update": "textile.overrides.uom_hooks.on_uom_conversion_factor_update",
	},
	"BOM": {
		"on_cancel": "textile.overrides.bom_hooks.on_bom_cancel",
	}
}

override_doctype_class = {
	"Item": "textile.overrides.item_hooks.ItemDP",
	"Quotation": "textile.overrides.quotation_hooks.QuotationDP",
	"Sales Order": "textile.overrides.sales_order_hooks.SalesOrderDP",
	"Delivery Note": "textile.overrides.delivery_note_hooks.DeliveryNoteDP",
	"Sales Invoice": "textile.overrides.sales_invoice_hooks.SalesInvoiceDP",
	"Packing Slip": "textile.overrides.packing_slip_hooks.PackingSlipDP",
	"Work Order": "textile.overrides.work_order_hooks.WorkOrderDP",
	"Stock Entry": "textile.overrides.stock_entry_hooks.StockEntryDP",
}

override_doctype_dashboards = {
	"Item": "textile.overrides.item_hooks.override_item_dashboard",
	"Customer": "textile.overrides.customer_hooks.override_customer_dashboard",
	"Sales Order": "textile.overrides.sales_order_hooks.override_sales_order_dashboard",
	"Delivery Note": "textile.overrides.delivery_note_hooks.override_delivery_note_dashboard",
	"Sales Invoice": "textile.overrides.sales_invoice_hooks.override_sales_invoice_dashboard",
	"Packing Slip": "textile.overrides.packing_slip_hooks.override_packing_slip_dashboard",
	"Purchase Order": "textile.overrides.purchase_hooks.override_purchase_order_dashboard",
	"Purchase Receipt": "textile.overrides.purchase_hooks.override_purchase_receipt_dashboard",
	"Purchase Invoice": "textile.overrides.purchase_hooks.override_purchase_invoice_dashboard",
}

doctype_js = {
	"Item": "overrides/item_hooks.js",
	"Customer": "overrides/customer_hooks.js",
	"Stock Entry": "overrides/stock_entry_hooks.js",
	"Sales Order": "overrides/sales_order_hooks.js",
	"Packing Slip": "overrides/packing_slip_hooks.js",
	"Delivery Note": "overrides/delivery_note_hooks.js",
	"Sales Invoice": "overrides/sales_invoice_hooks.js",
	"Purchase Order": "overrides/purchase_order_hooks.js",
}

doctype_list_js = {
	"Work Order": "overrides/work_order_list_hooks.js"
}

update_item_override_fields = [
	"textile.overrides.item_hooks.update_item_override_fields",
]

calculate_taxes_and_totals = [
	"textile.overrides.taxes_and_totals_hooks.calculate_taxes_and_totals"
]

update_work_order_on_create = [
	"textile.overrides.work_order_hooks.update_work_order_on_create",
]

update_job_card_on_create = [
	"textile.overrides.work_order_hooks.update_job_card_on_create",
]

update_stock_entry_from_work_order = [
	"textile.overrides.stock_entry_hooks.update_stock_entry_from_work_order"
]

update_packing_slip_from_sales_order_mapper = [
	"textile.overrides.sales_order_hooks.update_sales_order_mapper",
]

postprocess_sales_order_to_packing_slip = [
	"textile.overrides.packing_slip_hooks.postprocess_sales_order_to_packing_slip",
]

postprocess_work_orders_to_packing_slip = [
	"textile.overrides.packing_slip_hooks.postprocess_work_orders_to_packing_slip",
]

postprocess_work_order_to_packing_slip_item = [
	"textile.overrides.packing_slip_hooks.postprocess_work_order_to_packing_slip_item",
]

update_delivery_note_from_sales_order_mapper = [
	"textile.overrides.sales_order_hooks.update_sales_order_mapper",
]

update_sales_invoice_from_sales_order_mapper = [
	"textile.overrides.sales_order_hooks.update_sales_order_mapper",
]

update_sales_invoice_from_delivery_note_mapper = [
	"textile.overrides.delivery_note_hooks.update_delivery_note_mapper",
]

update_delivery_note_from_packing_slip_mapper = [
	"textile.overrides.packing_slip_hooks.update_packing_slip_mapper",
]

update_sales_invoice_from_packing_slip_mapper = [
	"textile.overrides.packing_slip_hooks.update_packing_slip_mapper",
]

update_unpack_from_packing_slip_mapper = [
	"textile.overrides.packing_slip_hooks.update_unpack_from_packing_slip_mapper",
]

update_purchase_order_from_work_order = [
	"textile.overrides.purchase_hooks.update_purchase_order_from_work_order",
]

update_purchase_receipt_from_purchase_order_mapper = [
	"textile.overrides.purchase_hooks.update_purchase_order_mapper",
]

update_purchase_invoice_from_purchase_order_mapper = [
	"textile.overrides.purchase_hooks.update_purchase_order_mapper",
]

update_purchase_invoice_from_purchase_receipt_mapper = [
	"textile.overrides.purchase_hooks.update_purchase_receipt_mapper",
]

update_sales_purchase_return_mapper = [
	"textile.overrides.delivery_note_hooks.update_return_mapper",
]

delete_file_data_content = "textile.rotated_image.delete_file_data_content"

get_item_details = "textile.overrides.item_details_hooks.get_item_details"
packing_slip_get_item_details = "textile.overrides.item_details_hooks.packing_slip_get_item_details"
stock_entry_get_item_details = "textile.overrides.item_details_hooks.stock_entry_get_item_details"

get_price_list_rate = "textile.overrides.item_details_hooks.get_price_list_rate"

scheduler_events = {
	"hourly_long": [
		"textile.textile.doctype.textile_email_digest.textile_email_digest.send_textile_email_digest",
	],
}

fixtures = [
	{
		"doctype": "Custom Field",
		"filters": {
			"name": ["in", [
				'File-rotated_image',

				'Customer-printing_tab',
				'Customer-printing_cb_1',
				'Customer-default_printing_uom',
				'Customer-default_printing_gap',
				'Customer-default_printing_qty_type',
				'Customer-default_printing_length_uom',
				'Customer-pricing_section_break',
				'Customer-base_printing_rate',
				'Customer-base_pretreatment_rate',
				'Customer-is_fixed_pretreatment_rate',
				'Customer-is_fixed_printing_rate',
				'Customer-custom_column_break_yfvrm',

				'Item-textile_item_type',
				'Item-process_component',
				'Item-consumption_by_fabric_weight',

				'Item-print_process_properties',
				'Item-softener_item_required',
				'Item-column_break_wdop0',
				'Item-coating_item_required',
				'Item-coating_item_separate_process',
				'Item-column_break_ceseq',
				'Item-sublimation_paper_item_required',
				'Item-column_break_0brhk',
				'Item-protection_paper_item_required',

				'Item-sec_design_properties',
				'Item-design_width',
				'Item-design_height',
				'Item-column_break_9y2g0',
				'Item-design_gap',
				'Item-per_wastage',
				'Item-column_break_mjbrg',
				'Item-design_notes',

				'Item-sec_fabric_properties',
				'Item-fabric_material',
				'Item-fabric_type',
				'Item-column_break_fb7ki',
				'Item-fabric_width',
				'Item-fabric_gsm',
				'Item-column_break_vknw6',
				'Item-fabric_construction',
				'Item-fabric_per_pickup',
				'Item-column_break_zr6ct',
				'Item-fabric_item',
				'Item-fabric_item_name',

				'Item-paper_properties',
				'Item-paper_width',
				'Item-column_break_ysj7q',
				'Item-paper_gsm',

				'Item Group-textile_item_type',
				'Item Source-textile_item_type',
				'Brand-textile_item_type',

				'Quotation Item-textile_item_type',

				'Sales Order Item-fabric_item',
				'Sales Order Item-fabric_item_name',
				'Sales Order Item-textile_item_type',
				'Sales Order Item-pretreatment_order',
				'Sales Order Item-print_order',
				'Sales Order Item-print_order_item',
				'Sales Order Item-panel_length_meter',
				'Sales Order Item-panel_qty',
				'Sales Order Item-panel_based_qty',

				'Delivery Note Item-fabric_item',
				'Delivery Note Item-fabric_item_name',
				'Delivery Note Item-textile_item_type',
				'Delivery Note Item-pretreatment_order',
				'Delivery Note Item-print_order',
				'Delivery Note Item-print_order_item',
				'Delivery Note Item-panel_length_meter',
				'Delivery Note Item-panel_qty',
				'Delivery Note Item-panel_based_qty',
				'Delivery Note Item-is_return_fabric',

				'Sales Invoice-sec_printed_fabrics',
				'Sales Invoice-printed_fabrics',

				'Sales Invoice Item-fabric_item',
				'Sales Invoice Item-fabric_item_name',
				'Sales Invoice Item-textile_item_type',
				'Sales Invoice Item-pretreatment_order',
				'Sales Invoice Item-print_order',
				'Sales Invoice Item-print_order_item',
				'Sales Invoice Item-panel_length_meter',
				'Sales Invoice Item-panel_qty',
				'Sales Invoice Item-panel_based_qty',
				'Sales Invoice Item-is_return_fabric',

				'Packing Slip Item-fabric_item',
				'Packing Slip Item-fabric_item_name',
				'Packing Slip Item-pretreatment_order',
				'Packing Slip Item-print_order',
				'Packing Slip Item-print_order_item',
				'Packing Slip Item-column_break_zytx5',
				'Packing Slip Item-panel_length_meter',
				'Packing Slip Item-panel_qty',
				'Packing Slip Item-panel_based_qty',
				'Packing Slip Item-is_return_fabric',

				'Work Order-pretreatment_order',
				'Work Order-print_order',
				'Work Order-print_order_item',

				'Work Order-fabric_details',
				'Work Order-fabric_item',
				'Work Order-fabric_item_name',
				'Work Order-column_break_tdpdc',
				'Work Order-fabric_material',
				'Work Order-fabric_width',
				'Work Order-column_break_xvc9e',
				'Work Order-fabric_gsm',

				'Work Order-process_details',
				'Work Order-process_item',
				'Work Order-column_break_4pknu',
				'Work Order-process_item_name',

				'Job Card-pretreatment_order',

				'Stock Entry-pretreatment_order',
				'Stock Entry-print_order',
				'Stock Entry-coating_order',
				'Stock Entry-fabric_printer',

				'Stock Entry Detail-fabric_item',
				'Stock Entry Detail-fabric_item_name',

				'Purchase Order Item-pretreatment_order',
				'Purchase Receipt Item-pretreatment_order',
				'Purchase Invoice Item-pretreatment_order',
			]]
		}
	},
	{
		"doctype": "Property Setter",
		"filters": {
			"name": ["in", [
				'Item-customer-depends_on',
			]]
		}
	}
]
