const formData = {
    "statusCode": 200,
    "data": {
        "components": [
            {
                "label": "Travel from",
                "labelPosition": "top",
                "widget": "choicesjs",
                "placeholder": "",
                "description": "",
                "tooltip": "",
                "customClass": "",
                "tabindex": "",
                "hidden": false,
                "hideLabel": false,
                "uniqueOptions": false,
                "autofocus": false,
                "disabled": false,
                "tableView": true,
                "modalEdit": false,
                "multiple": false,
                "dataSrc": "values",
                "defaultValue": "muscatCapital",
                "data": {
                    "values": [
                        {
                            "label": "Muscat Capital",
                            "value": "muscatCapital"
                        },
                        {
                            "label": "Al Dhahira",
                            "value": "alDhahira"
                        },
                        {
                            "label": "France",
                            "value": "france"
                        },
                        {
                            "label": "Jebel Akhdar",
                            "value": "jebelAkhdar"
                        },
                        {
                            "label": "Madinat Salalah",
                            "value": "madinatSalalah"
                        },
                        {
                            "label": "Maseerah Island",
                            "value": "maseerahIsland"
                        }
                    ]
                },
                "type": "select",
                "key": "travelFrom",
                "validate": {
                    "required": true
                }
            },
            {
                "label": "Travel to",
                "labelPosition": "top",
                "widget": "choicesjs",
                "placeholder": "Search for city",
                "type": "select",
                "key": "travelTo",
                "validate": {
                    "required": true
                },
                "data": {
                    "values": [
                        {
                            "label": "Al Dhahira",
                            "value": "alDhahira"
                        },
                        {
                            "label": "France",
                            "value": "france"
                        },
                        {
                            "label": "Jebel Akhdar",
                            "value": "jebelAkhdar"
                        },
                        {
                            "label": "Madinat Island",
                            "value": "madinatIsland"
                        },
                        {
                            "label": "Muscat Capital",
                            "value": "muscatCapital"
                        },
                        {
                            "label": "Rodha",
                            "value": "rodha"
                        },
                        {
                            "label": "Shleem & Hallaniyat Island",
                            "value": "shleemHallaniyatIsland"
                        }
                    ]
                }
            },
            {
                "label": "Travel date from",
                "labelPosition": "top",
                "type": "datetime",
                "key": "travelDate",
                "validate": {
                    "required": true
                },
                "datePicker": {
                    "minDate": "moment()",
                    "maxDate": "2025-01-18T12:00:00+03:00"
                }
            },
            {
                "label": "Travel date to",
                "labelPosition": "top",
                "type": "datetime",
                "key": "travelTo1",
                "validate": {
                    "required": true
                }
            },
            {
                "label": "Event cost",
                "labelPosition": "top",
                "type": "number",
                "key": "eventCost",
                "prefix": "JOD",
                "validate": {
                    "required": true
                }
            },
            {
                "label": "Visit type",
                "labelPosition": "top",
                "type": "select",
                "key": "visitType",
                "placeholder": "Search for visit type",
                "validate": {
                    "required": true
                },
                "data": {
                    "values": [
                        {
                            "label": "Conference",
                            "value": "conference"
                        },
                        {
                            "label": "Local Attending Court",
                            "value": "localAttendingCourt"
                        },
                        {
                            "label": "Local Fault Clearance",
                            "value": "localFaultClearance"
                        },
                        {
                            "label": "Local Fueling",
                            "value": "localFueling"
                        },
                        {
                            "label": "Local Investigation",
                            "value": "localInvestigation"
                        }
                    ]
                }
            },
            {
                "label": "Event title",
                "labelPosition": "top",
                "type": "textfield",
                "key": "eventTitle",
                "placeholder": "Enter event title",
                "validate": {
                    "required": true
                }
            },
            {
                "label": "Event organizer / institute",
                "labelPosition": "top",
                "type": "textfield",
                "key": "eventOrganizerInstitute",
                "placeholder": "Enter event organizer / institute",
                "validate": {
                    "required": true
                }
            },
            {
                "label": "Ticket booking",
                "labelPosition": "top",
                "type": "select",
                "key": "ticketBooking",
                "placeholder": "Pick a ticket booking",
                "validate": {
                    "required": true
                },
                "data": {
                    "values": [
                        {
                            "label": "None",
                            "value": "none"
                        },
                        {
                            "label": "Booking",
                            "value": "booking"
                        },
                        {
                            "label": "Provided By Vendor",
                            "value": "providedByVendor"
                        }
                    ]
                }
            },
            {
                "label": "Accommodation booking",
                "labelPosition": "top",
                "type": "select",
                "key": "accommodationBooking",
                "placeholder": "Pick an accommodation booking",
                "validate": {
                    "required": true
                },
                "data": {
                    "values": [
                        {
                            "label": "Vendor Provides Accommodation And Food",
                            "value": "vendorProvidesAccommodationAndFood"
                        },
                        {
                            "label": "Vendor Provides Accommodation Only",
                            "value": "vendorProvidesAccommodationOnly"
                        },
                        {
                            "label": "Vendor Provides Food Only",
                            "value": "vendorProvidesFoodOnly"
                        },
                        {
                            "label": "None",
                            "value": "none"
                        },
                        {
                            "label": "Books Accommodation",
                            "value": "booksAccommodation"
                        },
                        {
                            "label": "Zero Allowances",
                            "value": "zeroAllowances"
                        }
                    ]
                }
            },
            {
                "label": "Registration required",
                "type": "checkbox",
                "key": "registrationRequired"
            },
            {
                "label": "Car request",
                "type": "checkbox",
                "key": "carRequest"
            },
            {
                "label": "Remarks",
                "labelPosition": "top",
                "type": "textarea",
                "key": "textarea",
                "placeholder": "Add your remarks here...",
                "rows": 3
            },
            {
                "label": "I confirm above information is correct",
                "type": "checkbox",
                "key": "iConfirmAboveInformationIsCorrect"
            },
            {
                "label": "Submit",
                "type": "button",
                "key": "submit",
                "theme": "primary",
                "block": true
            },
            {
                "label": "Save as draft",
                "type": "button",
                "key": "saveAsDraft",
                "theme": "secondary",
                "block": true
            }
        ]
    }
}; 