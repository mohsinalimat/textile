import frappe
from erpnext.selling.doctype.quotation.quotation import Quotation


class QuotationDP(Quotation):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.force_item_fields += ["textile_item_type"]
