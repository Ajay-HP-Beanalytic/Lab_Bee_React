// Help shown by the "?" button in the app bar, keyed by the first part of the
// page path (e.g. /test_types -> "test_types"). Pages without an entry show
// only the enquiry-to-quotation overview.

export const PROCESS_HELP = {
  title: "From enquiry to quotation",
  summary:
    "Lab Bee is being set up to turn a customer enquiry into a quotation with less passing around. The master data pages below are what the automatic checks read, so keeping them right keeps the quotes right.",
  sections: [
    {
      heading: "The steps",
      points: [
        "1. Enquiry - arrives by email or through the customer portal and appears in Enquiries. The testing team (TS1 or TS2, by the tests) is notified.",
        "2. Feasibility - each requested test is matched to a test type, then to a chamber that is big and strong enough, covers the temperature / humidity / vibration needed and has valid calibration.",
        "3. Quotation - the matched tests are priced from Test Pricing and a draft quotation is made.",
        "4. Approval - a person checks and approves everything before it goes to the customer.",
        "5. PO and slot - when the PO arrives, a slot is proposed for the testing team to confirm.",
      ],
    },
    {
      heading: "Master data and how it connects",
      points: [
        "Test Types - the list of tests the lab offers (High temperature, Vibration, IPX5, CE102 …). Everything else links to these.",
        "NABL Scope - the lines of the NABL certificate. Linking a line to a test type tells the quote that this test can be offered under NABL.",
        "Job card test names - names used on past job cards, linked to test types so history can be read.",
        "TS1 Chambers - size, load and limits of each chamber and the test types it can run.",
        "Chamber Calibration - calibration dates and status of all chambers and equipment.",
        "Test Pricing - the price of each test type (per hour, per test or per unit).",
        "Test Durations - how the chamber hours of each hourly test are worked out (cycles, dwell, ramp rate by standard, buffer).",
      ],
    },
    {
      heading: "Common terms",
      points: [
        "Sort order - the position of a row in lists and drop-downs. Lower numbers come first; rows without a number come after, by code.",
        "Active - switch off instead of deleting, so old links and history are kept.",
        "Auto / not checked - filled in by the system or AI and still to be checked by a person. Saving or \"Mark checked\" confirms it.",
        "Import / Export - export to Excel, edit, and import back. The import shows a preview of every change before anything is saved.",
      ],
    },
  ],
};

export const PAGE_HELP = {
  rfq_inbox: {
    title: "Enquiries",
    summary:
      "Every enquiry, from the RFQ mailbox or the customer portal, followed from feasibility to quote to order. Every step records who did it and when.",
    sections: [
      {
        heading: "Stages and who acts",
        points: [
          "New / Feasibility check - TS1 or TS2 testing team. Click \"Take it\", check the tests, then \"Feasibility done\" (or \"Need details from customer\").",
          "Waiting for customer - Accounts / Marketing get the missing details from the customer, then click \"Customer sent the details\". It goes back to the same tester.",
          "Reply to customer - Accounts / Marketing send the feasibility confirmation (or regret) from Outlook, then click \"Reply sent\".",
          "Quote - prepare and send the quote, then click \"Quote sent\" with the quotation number. If the customer already asked for a quote, feasibility goes straight here: one reply with the confirmation and the quote.",
          "New customer - the Quote tab shows the company details the AI read from the emails (address, GSTIN, contact). Check them and click \"Save to customer list\"; nothing is added before that. Then add the logo there (choose, drop or paste); it goes on every quotation download for that customer.",
          "Follow-up - the person who sent the quote follows it up (\"Log follow-up\") until it is Won or Lost.",
        ],
      },
      {
        heading: "Using the list",
        points: [
          "My work - only what waits for you: your enquiries, and unassigned ones at your team's stage.",
          "Red time in the Stage column - the enquiry has been in that stage too long, or a follow-up is overdue.",
          "Click a row: Summary (what the customer wants), Emails & files (open the attachments), Timeline (who did what).",
          "Confidential emails are not sent to the AI. Choose \"Send to AI\" or \"Handle manually\" in the enquiry.",
          "The list refreshes every minute. You also get a notification when something needs your team.",
        ],
      },
      {
        heading: "Icons and chips",
        points: [
          "Quote icon - the customer asked for a price.",
          "Free mail - sent from Gmail / Yahoo etc., so the company may need confirming.",
          "Non-testing - asks for design, consultancy, analysis, calibration or other non-testing work.",
          "Urgent - the customer asked for a quick answer. \"n missing\" - details still needed to quote.",
        ],
      },
    ],
  },

  nabl_scope: {
    title: "NABL Scope",
    summary:
      "The lines of the lab's NABL accreditation certificate(s), with the test types each line covers.",
    sections: [
      {
        heading: "Why it matters",
        points: [
          "A test can be offered as NABL accredited only if a current scope line covers its test type and standard.",
          "Withdrawn standards and inactive lines are kept for history but not used.",
        ],
      },
      {
        heading: "Keeping it up to date",
        points: [
          "Import - choose the NABL annexure PDF (or an Excel file exported from here). You see a preview before saving.",
          "Suggest test types - the AI proposes test types for lines that have none. They show as not checked.",
          "Tick lines and click Mark checked, or edit a line and save, to confirm its test types.",
        ],
      },
    ],
  },

  test_types: {
    title: "Test Types",
    summary:
      "The lab's own list of tests, at the level they are priced and assigned to chambers. This is the common language that links NABL scope, job cards, chambers and prices.",
    sections: [
      {
        heading: "Columns",
        points: [
          "Scope lines - how many NABL scope lines cover this type. 0 means it is not NABL accredited.",
          "Job card names - how many test names used on past job cards mean this type.",
          "Chambers - how many TS1 chambers can run it. 0 means the feasibility check cannot find a chamber.",
          "Priced - whether it has an active price. \"No price\" means it cannot be quoted automatically.",
        ],
      },
      {
        heading: "Changing links",
        points: [
          "Open a type (double-click) to see exactly what it is linked to.",
          "Each link is changed on its own page: scope lines in NABL Scope, chambers in TS1 Chambers, prices in Test Pricing, job card names in the Job card test names tab. This keeps each link in one place.",
          "\"Other names\" and \"What it covers\" help match customer wording to the right type - add the names customers actually use.",
        ],
      },
    ],
  },

  ts1_chamber_specs: {
    title: "TS1 Chambers",
    summary:
      "What each TS1 chamber can do. The feasibility check uses this to decide whether a test fits and in which chamber.",
    sections: [
      {
        heading: "What is checked",
        points: [
          "Inside size and max load (and load limits by ramp rate) against the EUT.",
          "Temperature, humidity, altitude and vibration limits against what the standard needs.",
          "Test types - the chamber is only considered for the types listed here.",
          "Calibration must be valid and the chamber Active and in Good status.",
        ],
      },
      {
        heading: "Test types",
        points: [
          "Fill test types - fills chambers that have none from the job card Tests & Chambers Mapping. They show amber (Auto - to check).",
          "Remove wrong ones by editing the chamber, then save - saving marks them checked (green). Or tick rows and click Mark checked.",
        ],
      },
      {
        heading: "Calibration",
        points: [
          "Calibration is stored once, in Chamber Calibration, and shown here by matching the Chamber ID or one of its Other names.",
          "Click the calibration chip or the calendar button to update it from here. Certificates are uploaded on the Chamber Calibration page.",
          "\"Not found\" means no calibration record matches - add the calibration's ID as an Other name, or save a calibration here.",
        ],
      },
    ],
  },

  ts1_test_pricing: {
    title: "Test Pricing",
    summary:
      "The price of each test type, used to draft quotations. Prices are without GST; NABL and non-NABL cost the same.",
    sections: [
      {
        heading: "How a price is worked out",
        points: [
          "Per hour - rate × hours, at least the minimum (default 1 hour).",
          "Per test - rate × number of tests (at least the minimum, default 1).",
          "Pre-compliance rate - for tests that cost less as pre-compliance. TS2 EMC: ₹80,000 per test compliance, ₹40,000 pre-compliance; 2 tests = ₹1,60,000 / ₹80,000. If the purpose isn't known, the compliance rate is used.",
          "Per unit - rate × number of units (e.g. per chemical, per power cable).",
          "Add-on - an extra rate per add-on item (e.g. ₹6,500 per extra cable on CS114).",
          "Use \"Try it\" in an open price to check the amount for given hours or quantities.",
        ],
      },
      {
        heading: "Warnings",
        points: [
          "Test types without a price are listed at the top - they cannot be quoted automatically.",
          "A test type in more than one active price is flagged, because the quote would not know which to use.",
        ],
      },
    ],
  },

  test_durations: {
    title: "Test Durations",
    summary:
      "How the chamber hours of each test type are worked out for quotations. The enquiry engine uses this to estimate hours from the customer's spec; the tester checks them before the quote.",
    sections: [
      {
        heading: "How hours are worked out",
        points: [
          "Steady (high / low temperature, damp heat, altitude): ramp to the temperature + time there + ramp back, × number of cycles.",
          "Temperature cycling: start → first extreme, dwell, → other extreme, dwell, → back to ambient, for every cycle.",
          "Thermal shock: transition + time to reach temperature + dwell at each extreme, per cycle.",
          "Per axis (vibration, shock, bump): axes × minutes per axis × units tested one after another.",
          "Fixed: the given duration × runs (salt fog, dust, temperature steps).",
          "The buffer (maintenance / setup) is added only when you tick it. The hours to quote are rounded up to whole hours, and at least the minimum.",
        ],
      },
      {
        heading: "Where the values come from",
        points: [
          "First the customer's spec, then the test type's defaults.",
          "The ramp rate comes from the customer's spec or standard and has no default: if it isn't given, it is listed as missing - never guessed.",
          "The ramp is limited to what the chosen chamber can do at that load (TS1 Chambers - load limits).",
          "Rules filled in by the system show amber (Auto - to check). Saving a rule, or ticking rows and Mark checked, confirms it.",
          "Use Try it in an open test type to check the hours for a spec.",
        ],
      },
    ],
  },

  "chamber-calibration": {
    title: "Chamber Calibration",
    summary:
      "Calibration dates, status and certificates of all chambers and equipment.",
    sections: [
      {
        heading: "Using it",
        points: [
          "Status (Up to Date / Expired) is worked out from the due date.",
          "Due soon - due within 45 days. Click a card to see the chambers.",
          "Chambers in Good status are offered in slot booking.",
          "TS1 test chambers also have a page of their own (TS1 Chambers) with size, limits and test types. It reads the calibration from here.",
        ],
      },
    ],
  },
};
