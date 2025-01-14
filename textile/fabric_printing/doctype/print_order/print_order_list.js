frappe.listview_settings['Print Order'] = {
	add_fields: ["status"],

	get_indicator: function(doc) {
		if (doc.status === "Not Started") {
			return [__(doc.status), "yellow", "status,=," + doc.status];
		} else if(doc.status === "To Produce") {
			return [__(doc.status), "purple", "status,=," + doc.status];
		} else if(doc.status === "To Deliver") {
			return [__(doc.status), "orange", "status,=," + doc.status];
		} else if(doc.status === "To Bill") {
			return [__(doc.status), "yellow", "status,=," + doc.status];
		} else if(doc.status === "To Close") {
			return [__(doc.status), "blue", "status,=," + doc.status];
		} else if(["Completed", "Closed"].includes(doc.status)) {
			return [__(doc.status), "green", "status,=," + doc.status];
		}
	},

	onload: function(listview) {
		var method = "textile.fabric_printing.doctype.print_order.print_order.close_or_unclose_print_orders";

		if (listview.can_write) {
			listview.page.add_action_item(__("Close"), function () {
				listview.call_for_selected_items(method, {"status": "Closed"});
			});

			listview.page.add_action_item(__("Re-Open"), function () {
				listview.call_for_selected_items(method, {"status": "Submitted"});
			});
		}

		if (listview.page.fields_dict.fabric_item) {
			listview.page.fields_dict.fabric_item.get_query = () => {
				return erpnext.queries.item({"textile_item_type": "Ready Fabric", "include_disabled": 1});
			}
		}

		if (listview.page.fields_dict.process_item) {
			listview.page.fields_dict.process_item.get_query = () => {
				return erpnext.queries.item({"textile_item_type": "Print Process", "include_disabled": 1});
			}
		}
	},
};
