# Plan: Automate RFQ → Quotation → PO/Slot Booking, and Test Reports

## Context

Today every enquiry passes between people by hand:
customer email (Outlook) → staff forward → testing team checks feasibility → accounts/marketing write the quotation → customer sends PO → accounts ask testing for a slot → testing books it.
Each handoff adds hours or days of waiting. After testing, the reports team rebuilds reports from job card data by hand.

The repo already has part of this. `Backend/FeasibilityAutomation/` and `frontend/src/test_feasibility_automation/README.md` define a 6-phase RFQ automation, and phases 1–2 are **done**: chamber specs (`ts1_chamber_spec`), test pricing (`ts1_test_pricing`), the `feasibility_requests`/`feasibility_request_tests` tables and a token-link customer portal. TS1 reports are already generated from JC data (`JC/TS1ReportDocument.js` → `Reports/MainReportDocument.jsx`), but they still need manual inputs.

**Goal:** the AI does the reading, checking and drafting, and a person approves anything that goes to a customer (user decision: human approves).
**Scope agreed with the user:** an email-reading agent for intake, plus report automation for **TS1 Environmental and TS2 EMI**.

---

## Part A — Enquiry to Quotation to Slot

### A1. Email intake agent (new: Phase 2B)
Reads the company Outlook mailbox and turns enquiry emails into `feasibility_requests` rows, so nobody forwards emails anymore.

- **Mailbox connection: Microsoft Graph API.** Recommended because Microsoft 365 has turned off basic-auth IMAP. It needs an Azure app registration with `Mail.Read` and `Mail.Send` application permissions, limited to one shared mailbox (e.g. `rfq@…`) with an *ApplicationAccessPolicy*. **This is an action for IT.**
  Put it behind a small `mailSource` adapter (`listNew()`, `getMessage()`, `getAttachments()`, `markProcessed()`, `send()`). That way an IMAP or Gmail adapter can be added later without touching the agent.
- **Polling:** a `node-schedule` job every 2–5 min. This follows the pattern in `Backend/notifications.js`. Graph webhooks can come later, because they need a public HTTPS callback.
- **New table `inbound_emails`:** message_id (UNIQUE, so the same email is never processed twice), from, subject, received_at, classification, extracted JSON, linked request_id / quotation_id, status, error.
- **Classifier and extractor agent** (`@openai/agents` + `zod` structured output, following the existing `BEA_Marketing/agents/*.mjs` pattern):
  - Classify each email as `new_enquiry | po_or_approval | slot_query | other`.
  - For `new_enquiry`: extract company, contact, and for each test the category, test name, standard and clause, EUT name, L×W×H, weight, quantity and special requirements. Use the body plus PDF/DOCX/XLSX attachments; `mammoth` is already used in the frontend, and you can add `pdf-parse`.
  - Fields the agent can't find are left empty and listed as `missing_fields`. The agent must never guess dimensions or standards.
  - Match the sender to `customers_details` by email domain to fill `customer_id`.
- **Outcome:**
  - **Enough data:** create the `feasibility_requests` row (status `pending`, new column `source='email'`) and start A2.
  - **Missing fields:** auto-reply with the existing portal link, pre-filled with what was found. This reuses `generate-link` logic in `FeasibilityAPI.js`; move the token creation into a shared function.
  - **`other`:** leave the email for a person to handle.
- Add a `source` column and a `source_email_id` column to `feasibility_requests` (an `ALTER` in `feasibility_tables.js`).

### A2. AI feasibility engine (existing Phase 3, as designed in the README)
Files: `feasibilityRunner.mjs`, `chamberMatcher.mjs`, `standardsChecker.mjs`, `feasibilityAgent.mjs` in `Backend/FeasibilityAutomation/`.
- **Rules first, done in SQL, not by the AI:**
  - Dimensions and weight are checked against `ts1_chamber_spec`.
  - Temp, humidity and vibration ranges are compared directly on the columns.
  - Calibration validity comes from a JOIN on `chamber_calibration`.
  - Standards are checked against `supported_standards`, `test_names_table` and `emi_test_names_table` / `emi_test_standards_table`.
  - Earliest free slot comes from `bookings_table` (TS1) and `emi_slot_table` (EMI).
- **The AI handles only the free-text parts:** mapping the customer's test wording to the catalogue, reading special requirements, and writing the per-test reason. The DB context is injected into the prompt.
- **Results are saved** to `feasibility_request_tests.ai_feasibility_result/ai_reason/matched_chamber_id/suggested_slot_*`, and the request status is rolled up following the README rules.
- **Any error or timeout** sets the status to `needs_review`, so no request is ever dropped.
- **Triggers:** called after `/api/feasibility/submit` and after A1 creates a request.

### A3. Auto quotation (existing Phase 4)
- Map each feasible test to `ts1_test_pricing`:
  - `per_hour`: `charge × max(hours, min_hours)`
  - `per_test`: `charge × qty`
- Insert into `bea_quotations_table`. First, pull the insert and ID-generation logic out of the `POST /api/quotation` handler (`Backend/BEAQuotationsTable.js:43`) and `/api/getLatestQuotationID` into a reusable `createQuotation()` service, so the HTTP route and the automation share one code path. Also fix the `usersToNotifyQuotation` reference at line ~123, which isn't declared in the snippet reviewed.
- Generate the DOCX from the existing templates (`EnvironmentalQuoteTemplate.docx`, `EMICQuoteTemplate.docx`) with `docxtemplater` on the server, then convert to PDF with the existing `libreoffice-convert` path (`convertToPdfAPI.js`).
- Set the status to `quotation_generated` and notify Accounts through the existing socket and `saveNotificationToDatabase` flow.
- **For `needs_review`:** the testing team sees the AI analysis and clicks Feasible or Not Feasible for each test. The quotation is then generated automatically.

### A4. Approval and sending (existing Phase 5)
- **Accounts approves:** send the PDF from the Outlook mailbox as a **reply in the original email thread**, using Graph `reply`. This keeps the customer conversation in one place. Set the status to `quotation_sent`.
- **Not feasible:** send a polite email to the customer, drafted by AI and approved by a person before it goes out.
- **Move all email sending to the shared `mailSource.send()`.** `FeasibilityAPI.js` currently sends through Gmail SMTP.

### A5. PO and slot booking (new: Phase 4B, which was missing from the README)
- When A1 classifies an email as `po_or_approval`, the agent:
  - matches it to the quotation (quotation ID in the subject or body, or the thread's conversationId),
  - extracts the PO number, date, amount and requested dates from the PO attachment,
  - creates a draft `po_invoice_table` entry.
- **Slot proposal:** use the `suggested_slot_*` saved in A2, re-checked against `bookings_table` / `emi_slot_table` for clashes. Reuse the overlap validation already in `slotbookingBackend.js` (`POST /api/slotBooking`).
- **Testing team:** a "Pending slot confirmations" list. One click confirms or adjusts the slot, which creates the booking and emails the customer the confirmation. The account team no longer has to pass the request along.
- **Optional:** pre-create the job card skeleton from the quotation, PO and EUT data.

### A6. Dashboard (existing Phase 6)
New file: `test_feasibility_automation/FeasibilityDashboard.jsx`. It shows:
- an inbox of requests by status,
- the AI analysis panel,
- the review, approve and slot-confirm actions,
- a timeline per request,
- metrics such as time from email to quotation sent, and the share of requests handled by AI versus people.

Add it to `sidenavbar.js` and `App.js`, following the Chamber Specs and Test Pricing entries.

---

## Part B — Report Automation (TS1 + TS2 EMI)

### B1. TS1: remove the manual inputs from the existing generator
The generator is `JC/TS1ReportDocument.js` (`prepareReportData`) feeding `Reports/MainReportDocument.jsx`, configured through `components/ReportConfigDialog.jsx`.
- **Report number and ULR:** generated automatically from a new `report_register` table (sequence per year / NABL vs non-NABL). This also records who issued which report.
- **NABL vs NON-NABL:** defaults from the test or chamber `is_nabl_accredited`.
- **Chamber info and make:** pulled from the JC's chamber plus `chamber_calibration` / `ts1_chamber_spec`.
- **Images and graphs:** loaded from the JC `attachments` table, now viewable after commit 126873b. Testers tag them as before, during, after or graph at upload time, so the dialog just confirms them.
- **Customer logo:** stored once per customer (see `COMPANY_LOGO_AUTOMATION_GUIDE.md`).
- The dialog becomes a confirm screen instead of a data-entry screen.

### B2. TS2 EMI report generator (new)
- Same structure as the TS1 one: `EMI/EMIReportDocument.js` with a `prepareEmiReportData()`.
- Data comes from `emi_jobcards`, `emi_eut_table`, `emi_tests_table`, `emi_tests_details_table`, the standards tables, and the acceptance rule and performance criteria added in 8c6d75a.
- Reuse the shared `Reports/*` building blocks: header and footer, first page, general and EUT tables, image sections.
- Add EMI-specific sections: test setup, limits, observation tables built from the CS/RS observation-form data, and pass/fail against the acceptance rule.

### B3. AI-drafted text plus a review workflow (both disciplines)
- **AI-drafted sections:** a report agent writes observations, deviations and the conclusion from structured JC data such as test steps, observations and pass/fail.
  - The agent may only restate data that exists; numbers are copied from the DB, never generated.
  - Drafts are marked as such for the reviewer.
- **Workflow:** add a report status (`draft → reviewed → approved → issued`) with reviewer and approver tracked, which NABL traceability needs.
- **Issuing:** on approval, generate the PDF, store it with the JC (existing file storage service), and email it to the customer from the Outlook mailbox after one click.
- **Optional later:** move generation to the server so reports can be created automatically once a JC is marked complete. This is not needed for the first version.

---

## Suggested Build Order
1. **A2 + A3**: the engine and auto quotation work with today's portal. This gives the biggest time saving and no IT dependency.
2. **A4 + A6**: approval UI and sending.
3. **B1, then B2, then B3**: reports. These can run in parallel with step 2.
4. **A1**: the email agent, once IT has set up the Azure app registration. Start that request now.
5. **A5**: PO and slot automation, which relies on A1's classifier.

## Critical Files
- **Modify:**
  - `Backend/FeasibilityAutomation/FeasibilityAPI.js`
  - `Backend/FeasibilityAutomation/feasibility_tables.js`
  - `Backend/BEAQuotationsTable.js` (extract the service)
  - `Backend/slotbookingBackend.js` (extract the overlap check)
  - `Backend/index.js` (register routers and the scheduler)
  - `frontend/src/components/ReportConfigDialog.jsx`
  - `frontend/src/JC/TS1ReportDocument.js`
  - `frontend/src/App.js`
  - `frontend/src/components/sidenavbar.js`
  - the README phase table
- **New:**
  - `Backend/FeasibilityAutomation/{mailSource/graphAdapter.js, emailIntakeAgent.mjs, emailPoller.js, feasibilityRunner.mjs, chamberMatcher.mjs, standardsChecker.mjs, quotationService.js}`
  - `frontend/src/test_feasibility_automation/FeasibilityDashboard.jsx`
  - `frontend/src/EMI/EMIReportDocument.js`
- **Env:** `OPEN_AI_API_KEY` (exists), `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `RFQ_MAILBOX`.

## Verification
- **Engine:** seed `ts1_chamber_spec` and `ts1_test_pricing`, then submit portal requests that should be feasible, oversize (EUT bigger than every chamber, expect not_feasible), and unclear (unusual special requirements, expect needs_review). Check the per-test results, slot suggestion and status roll-up in MySQL.
- **Quotation:** check the generated row in `bea_quotations_table`, the totals by hand, and that the DOCX and PDF render in the existing Quotations Dashboard.
- **Email agent:** run against a test mailbox with about 10 real anonymised past enquiries (including PDF attachments) and compare the extracted fields with what the testing team recorded. Resend the same email and confirm it isn't processed twice. Confirm `other` emails are left alone.
- **PO/slot:** reply to a sent quotation with a sample PO, then confirm the PO draft, the clash-free slot proposal and the booking in `bookings_table` after confirmation.
- **Reports:** generate TS1 and EMI reports for 2–3 completed JCs and have the reports team compare them with their manually prepared versions. Check that report and ULR numbers increment correctly and that AI-drafted text contains no numbers that aren't in the DB.
- Run the app with `npm start` in `Backend` and `frontend`, and click through the full flow.
