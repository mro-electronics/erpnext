frappe.provide('erpnext.accounts');

erpnext.accounts.unreconcile_payments = {
	add_unreconcile_btn(frm) {
		if (frm.doc.docstatus == 1) {
			frappe.call({
				"method": "erpnext.accounts.doctype.unreconcile_payments.unreconcile_payments.doc_has_payments",
				"args": {
					"doctype": frm.doc.doctype,
					"docname": frm.doc.name
				},
				callback: function(r) {
					if (r.message) {
						frm.add_custom_button(__("Un-Reconcile"), function() {
							erpnext.accounts.unreconcile_payments.build_unreconcile_dialog(frm);
						});
					}
				}
			});
		}
	},

	build_unreconcile_dialog(frm) {
		if (['Sales Invoice', 'Purchase Invoice', 'Payment Entry', 'Journal Entry'].includes(frm.doc.doctype)) {
			let child_table_fields = [
				{ label: __("Voucher Type"), fieldname: "voucher_type", fieldtype: "Dynamic Link", options: "DocType", in_list_view: 1, read_only: 1},
				{ label: __("Voucher No"), fieldname: "voucher_no", fieldtype: "Link", options: "voucher_type", in_list_view: 1, read_only: 1 },
				{ label: __("Allocated Amount"), fieldname: "allocated_amount", fieldtype: "Float", in_list_view: 1, read_only: 1 },
			]
			let unreconcile_dialog_fields = [
				{
					label: __('Allocations'),
					fieldname: 'allocations',
					fieldtype: 'Table',
					read_only: 1,
					fields: child_table_fields,
				},
			];

			// get linked payments
			frappe.call({
				"method": "erpnext.accounts.doctype.unreconcile_payments.unreconcile_payments.get_linked_payments_for_doc",
				"args": {
					"company": frm.doc.company,
					"doctype": frm.doc.doctype,
					"docname": frm.doc.name
				},
				callback: function(r) {
					if (r.message) {
						// populate child table with allocations
						unreconcile_dialog_fields[0].data = r.message;
						unreconcile_dialog_fields[0].get_data = function(){ return r.message};

						let d = new frappe.ui.Dialog({
							title: 'Un-Reconcile Allocations',
							fields: unreconcile_dialog_fields,
							size: 'large',
							cannot_add_rows: 1,
							primary_action_label: 'Un-Reconcile',
							primary_action(values) {

								let selected_allocations = values.allocations.filter(x=>x.__checked);
								if (selected_allocations.length > 0) {
									// assuming each row is an individual voucher
									// pass this to server side method that creates unreconcile doc for each row
									if (['Sales Invoice', 'Purchase Invoice'].includes(frm.doc.doctype)) {
										let selection_map = selected_allocations.map(function(elem) {
											return {
												company: elem.company,
												voucher_type: elem.voucher_type,
												voucher_no: elem.voucher_no,
												against_voucher_type: frm.doc.doctype,
												against_voucher_no: frm.doc.name
											};

										});

										erpnext.utils.create_unreconcile_docs(selection_map);
										d.hide();
									}

								} else {
									frappe.msgprint("No Selection");
								}
							}
						});

						d.show();
					}
				}
			});
		}
	},

	create_unreconcile_docs(selection_map) {
		frappe.call({
			"method": "erpnext.accounts.doctype.unreconcile_payments.unreconcile_payments.create_unreconcile_doc_for_selection",
			"args": {
				"selections": selection_map
			},
		});
	}



}
