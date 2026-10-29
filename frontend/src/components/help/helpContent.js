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
        "1. Enquiry - arrives by email or through the customer portal and appears in the RFQ Inbox.",
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
    title: "RFQ Inbox",
    summary:
      "Every enquiry, whether it came by email or from the customer portal, in one list.",
    sections: [
      {
        heading: "Using it",
        points: [
          "New - not looked at yet. Needs review - the system could not decide, a person must check it.",
          "Confidential - the email looks confidential. Choose whether it may be sent to the AI or must be handled by hand.",
          "Click a row to see the email, the details read from it and the tests requested.",
          "The list refreshes every minute.",
        ],
      },
      {
        heading: "Chips",
        points: [
          "Free mail - sent from Gmail / Yahoo etc., so the company may need confirming.",
          "Non-testing - asks for design, consultancy, analysis, calibration or other non-testing work. These go to Needs review.",
          "Urgent - the customer asked for a quick answer.",
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
