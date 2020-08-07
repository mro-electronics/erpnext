frappe.query_reports["Time Tracker"] = {
    "filters": [
        {
            "fieldname": "time_operator_name",
            "label": ("Operator Name"),
            "fieldtype": "Link",
            "options": "Operators",
            "default": "*"
        }
    ]
}