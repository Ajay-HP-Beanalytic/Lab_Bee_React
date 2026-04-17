# Test Feasibility Automation

## Business Problem

Customers request feasibility checks for tests via email or phone.
The technical team takes 2–3 days to review, and the accounts team takes
another 1–2 days to prepare and send a quotation. This 3–5 day turnaround
is causing customer drop-off to competing laboratories.

**Goal:** Reduce the turnaround to 2–4 hours for standard requests using
AI-powered feasibility checking and automated quotation generation.

---

## New Workflow

```
TODAY (3–5 days):
  Phone/Email → Manual intake
  → Technical team checks manually (2–3 days)
  → Accounts fills quotation form + downloads + converts + emails (1–2 days)

AFTER AUTOMATION (2–4 hours):
  Unique link sent to customer → Customer fills self-service form (5 min)
  → AI engine checks feasibility instantly
      ├── Standard case (≈80%) → Quotation auto-generated
      │                        → Accounts clicks Approve → PDF emailed to customer
      └── Complex case (≈20%) → Technical team gets AI pre-analysis summary
                               → Quick human decision → Quotation generated
```

---

## Phases

### Phase 1 — Database Foundation

New and upgraded tables required before any other work begins.

#### 1A. `chamber_specs` (new table)
Stores the physical and operational capabilities of each chamber.
The existing `chamber_calibration` table only holds calibration dates and
status — it does not have specs needed for AI matching.

| Column | Type | Purpose |
|---|---|---|
| chamber_id | VARCHAR(100) | Links to existing chamber_calibration.chamber_id |
| chamber_category | VARCHAR(100) | 'TS1', 'TS2_EMI', 'Reliability' |
| internal_dimensions | JSON | `{ "length_cm": 60, "width_cm": 50, "height_cm": 60 }` |
| max_load_kg | DECIMAL(10,2) | Maximum EUT weight the chamber can hold |
| temperature_range | JSON | `{ "min_celsius": -70, "max_celsius": 180 }` |
| humidity_range | JSON | `{ "min_rh": 10, "max_rh": 98 }` |
| vibration_capability | JSON | `{ "frequency_hz": [10, 2000], "acceleration_g": 50 }` |
| supported_standards | JSON | `["IEC 60068-2-1", "MIL-STD-810H", ...]` |
| nabl_accredited | TINYINT(1) | Whether this chamber is NABL accredited |
| special_notes | TEXT | Any special capabilities or restrictions |
| is_active | TINYINT(1) | Soft delete flag |

#### 1A.1. `chamber_availability` (new table)
Stores the dynamic operational availability needed to decide the actual slot.

This table is different from `chamber_specs`:
- `chamber_specs` = what the chamber can do
- `chamber_availability` = when the chamber is actually free to take a job

This table can be updated from:
- existing slot booking data,
- maintenance blocks,
- calibration blocks,
- manual operational reservations.

| Column | Type | Purpose |
|---|---|---|
| chamber_id | VARCHAR(100) | Links to `chamber_specs.chamber_id` |
| availability_date | DATE | Day for which availability is tracked |
| shift_code | VARCHAR(50) | `FULL_DAY`, `SHIFT_1`, `SHIFT_2`, etc. |
| available_from | DATETIME | Slot start time |
| available_to | DATETIME | Slot end time |
| availability_status | ENUM | `available`, `booked`, `maintenance`, `blocked`, `tentative` |
| booking_reference | VARCHAR(255) | Existing booking / JC / RFQ reference |
| reserved_for_request_id | INT | Optional hold against a feasibility request |
| capacity_units_total | DECIMAL(10,2) | Total usable capacity for that slot |
| capacity_units_used | DECIMAL(10,2) | Already consumed capacity |
| remarks | TEXT | Reason for block or note |
| last_updated_by | INT | FK to `labbee_users` |

The slot suggestion logic will use:
- `chamber_specs` for physical fit and technical capability
- `chamber_availability` for earliest available operational slot

#### 1B. `test_pricing` (new table)
Stores per-test pricing so quotations can be generated automatically.
Currently pricing is filled manually by the accounts team.

| Column | Type | Purpose |
|---|---|---|
| test_category | VARCHAR(100) | 'TS1', 'TS2_EMI', 'Reliability', 'Software' |
| test_name | VARCHAR(500) | Display name of the test |
| standard_reference | VARCHAR(500) | e.g. "IEC 60068-2-1" |
| price_per_hour | DECIMAL(10,2) | Hourly rate for this test |
| minimum_hours | DECIMAL(10,2) | Minimum billable hours |
| setup_charges | DECIMAL(10,2) | One-time setup fee |
| report_charges | DECIMAL(10,2) | Report preparation fee |
| is_active | TINYINT(1) | Soft delete flag |

#### 1C. `feasibility_requests` (new table)
Tracks every customer feasibility request end-to-end.

| Column | Type | Purpose |
|---|---|---|
| request_token | VARCHAR(100) UNIQUE | Token embedded in the customer link |
| customer_id | INT | FK to customers_details (NULL if new customer) |
| company_name | VARCHAR(500) | |
| contact_person | VARCHAR(500) | |
| contact_email | VARCHAR(500) | |
| status | ENUM | pending → ai_processing → feasible / needs_review / not_feasible → quotation_generated → quotation_approved → quotation_sent |
| ai_result | JSON | Full AI analysis output |
| ai_confidence | DECIMAL(5,2) | 0.00 to 100.00 |
| technical_notes | TEXT | Added by technical team for NEEDS_REVIEW cases |
| assigned_to | INT | FK to labbee_users (assigned technical reviewer) |
| quotation_id | INT | FK to bea_quotations_table once generated |

#### 1D. `feasibility_request_tests` (new table)
One row per test within a feasibility request.

| Column | Type | Purpose |
|---|---|---|
| request_id | INT | FK to feasibility_requests |
| test_category | VARCHAR(100) | 'TS1', 'TS2_EMI', 'Reliability', 'Software' |
| test_name | VARCHAR(500) | As described by the customer |
| standard_reference | VARCHAR(500) | e.g. "IEC 60068-2-1 Clause 7.1" |
| eut_name | VARCHAR(500) | Equipment Under Test name |
| eut_dimensions | JSON | `{ "length_cm": 30, "width_cm": 20, "height_cm": 15 }` |
| eut_weight_kg | DECIMAL(10,2) | |
| eut_quantity | INT | |
| special_requirements | TEXT | Free text from customer |
| ai_feasibility_result | ENUM | 'feasible', 'needs_review', 'not_feasible' |
| ai_reason | TEXT | AI explanation for this specific test |
| matched_chamber_id | VARCHAR(100) | Chamber the AI matched for this test |
| suggested_slot_start | DATETIME | Earliest suggested available slot |
| suggested_slot_end | DATETIME | Suggested slot end time |

#### 1E. `feasibility_link_tokens` (new table)
Tracks generated customer links.

| Column | Type | Purpose |
|---|---|---|
| token | VARCHAR(100) UNIQUE | Random secure token |
| generated_by | INT | FK to labbee_users (staff member who sent the link) |
| customer_email | VARCHAR(500) | Pre-filled for the customer |
| customer_name | VARCHAR(500) | Pre-filled for the customer |
| is_used | TINYINT(1) | Marks token as consumed after form submission |
| expires_at | TIMESTAMP | 7 days from creation |

---

### Phase 2 — Customer Intake Portal

A public-facing multi-step form. No login required. Accessed via the token link.

**Link format:**
```
https://yourdomain.com/feasibility-request?token=abc123xyz
```

**Form steps:**

1. **Your Details** — Company name, contact person, email, phone
   (auto-filled if staff pre-populated the token)

2. **Test Requirements** — Repeatable section, one entry per test:
   - Test category (TS1 / TS2-EMI / Reliability / Software)
   - Test name / standard reference
   - EUT: name, dimensions (L × W × H cm), weight (kg), quantity
   - Special requirements (free text)

3. **Review & Submit** — Summary view before final submission

On submission the customer receives an immediate confirmation email with
a reference number and a link to check status.

**New files:**
```
src/test_feasibility_automation/
  FeasibilityRequestForm.jsx          ← public page, no auth wrapper (already created)
  FeasibilityRequestSuccess.jsx       ← thank you / confirmation page
  FeasibilityRequestStatus.jsx        ← customer-facing status tracker
  components/
    TestItemForm.jsx                  ← single test entry (used in Step 2)
    EUTDetailsForm.jsx                ← EUT dimensions and weight fields
    FormStepper.jsx                   ← step indicator UI
```

**New backend endpoints:**
```
POST /api/feasibility/generate-link          ← staff generates customer link (authenticated)
GET  /api/feasibility/validate-token/:token  ← validates token when customer opens link (public)
POST /api/feasibility/submit                 ← customer submits the form (public, token-validated)
GET  /api/feasibility/status/:token          ← customer checks their request status (public)
```

---

### Phase 3 — AI Feasibility Engine

Runs automatically in the background as soon as the customer submits the form.
Uses the `@openai/agents` package already installed in the backend.

**New backend files:**
```
Backend/FeasibilityAI/
  feasibilityAgent.mjs        ← main AI agent definition and runner
  chamberMatcher.mjs          ← matches EUT specs against chamber_specs table
  standardsChecker.mjs        ← checks if requested standard is in DB / NABL scope
  feasibilityRunner.mjs       ← orchestrates all checks, saves result to DB
```

**AI checks per test (in order):**

1. **Chamber Matching** (`chamberMatcher.mjs`)
   - Queries `chamber_specs` filtered by `chamber_category`
   - Checks: EUT dimensions fit inside chamber, weight ≤ max load,
     required temperature/humidity/vibration range within chamber capability
   - Output: matched chamber ID or null

2. **Chamber Availability Check**
   - Queries `chamber_availability` for the matched chamber
   - Checks: earliest available slot, blocked periods, maintenance periods,
     and available capacity for the requested duration
   - Output: suggested slot window or `needs_review`

3. **Standards Check** (`standardsChecker.mjs`)
   - Queries `chamber_specs.supported_standards`, `ts1_tests`,
     `emi_test_names`, `emi_standards_table`
   - Checks: standard exists in DB, NABL accreditation status
   - Output: `in_scope: true/false`, `nabl_accredited: true/false`

4. **Special Requirements Analysis** (AI reasoning)
   - Reads free-text special requirements from the customer
   - Flags unusual combinations (e.g. "simultaneous vibration + temperature")
   - Reasons about edge cases with DB context injected into the prompt

**Result logic per test:**
```
ALL checks pass                          → feasible
Any check fails but may be recoverable  → needs_review (with reason)
Hard block (no matching chamber,
  standard out of scope)                → not_feasible
```

**Overall request result:**
```
All tests feasible          → request status = feasible
Any test needs_review       → request status = needs_review
Any test not_feasible
  + rest feasible           → request status = needs_review (human decides)
All tests not_feasible      → request status = not_feasible
```

The AI receives structured DB context (chamber specs, supported standards,
test catalog) injected at runtime — it reasons with real data, not assumptions.

---

### Phase 4 — Auto Quotation Generation

Extends the existing quotation module in Labbee.

**For FEASIBLE requests (fully automated):**
1. AI maps each feasible test to a row in `test_pricing`
2. Calculates total: `(price_per_hour × minimum_hours) + setup_charges + report_charges`
3. Creates a row in `bea_quotations_table` via existing quotation logic
4. Generates the Word/PDF using existing `docxtemplater` pipeline
5. Notifies the Accounts team to review and approve

**For NEEDS_REVIEW requests:**
- Technical team receives a notification with the AI pre-analysis summary
- They see which tests are flagged and the AI's reasoning
- They click "Mark Feasible" or "Not Feasible" per flagged test
- Once resolved, the system auto-generates the quotation for approved tests

**Accounts team approval UI:**

| Company | Tests | AI Result | Amount | Action |
|---|---|---|---|---|
| ABC Corp | 3 (TS1) | Feasible | ₹45,000 | [Approve] [Edit] |
| XYZ Ltd | 2 (EMI) | Feasible | ₹32,000 | [Approve] [Edit] |

- **Approve** → system emails the PDF quotation to the customer automatically
- **Edit** → opens the existing quotation editor for price adjustments

---

### Phase 5 — Email Automation

All emails use the existing Nodemailer / Gmail SMTP setup.

| Trigger | Recipient | Content |
|---|---|---|
| Staff generates link | Customer | Link to fill the form |
| Customer submits form | Customer | Confirmation + reference number |
| Customer opens the link | Staff who sent it | "Customer has opened the form" |
| AI result: NOT_FEASIBLE | Customer | Explanation of which tests are not feasible + contact info |
| AI result: NEEDS_REVIEW | Technical team | Pre-analysis summary with AI reasoning per test |
| Technical team resolves | Accounts team | "Quotation ready for approval" |
| Accounts team approves | Customer | Professional email with PDF quotation attached |

---

### Phase 6 — Internal Dashboards

**Feasibility Requests Dashboard** (visible to all internal roles with appropriate data filtering):

```
src/test_feasibility_automation/
  FeasibilityDashboard.jsx            ← main list/overview page
  FeasibilityRequestDetail.jsx        ← detail view for a single request
  components/
    RequestStatusTimeline.jsx         ← stage-by-stage timeline with timestamps
    AIAnalysisPanel.jsx               ← shows AI reasoning and confidence per test
    TechnicalReviewPanel.jsx          ← technical team: add notes + approve/reject
    QuotationApprovalPanel.jsx        ← accounts team: review, edit, approve
```

**Key metrics on the dashboard:**
- Average time from form submission to quotation sent (SLA)
- % of requests resolved by AI automatically vs. needing human review
- Pending approvals and how long they have been waiting

---

## Development Sequence

```
Week 1 — Foundation
  ├── Create chamber_specs table
  ├── Admin UI to enter chamber capabilities
  ├── Create test_pricing table
  ├── Admin UI to enter test pricing
  └── Create feasibility_requests, feasibility_request_tests,
      feasibility_link_tokens tables

Week 2 — Customer Intake
  ├── Link generation (backend API + staff UI button)
  ├── Public customer form (React, no auth)
  └── Form submission API + confirmation email

Week 3 — AI Engine
  ├── chamberMatcher.mjs
  ├── standardsChecker.mjs
  ├── feasibilityAgent.mjs
  └── Wire up: form submit → AI runs → result stored in DB

Week 4 — Quotation Automation
  ├── Auto-quotation generation from AI result
  ├── Accounts team approval UI
  └── Auto-email PDF quotation to customer on approval

Week 5 — Polish & Dashboard
  ├── Feasibility dashboard with SLA tracking
  ├── Technical team review UI with AI summary
  └── End-to-end testing across all paths
```

---

## Files Changed / Created (Summary)

| Area | Type | File / Location |
|---|---|---|
| DB schema | New tables | `Backend/database_tables.js` |
| Chamber specs API | New backend | `Backend/ChambersAndCalibrationAPI.js` (extend) |
| Chamber availability API | New backend | `Backend/slotbookingBackend.js` (extend) or `Backend/ChamberAvailabilityAPI.js` |
| Test pricing API | New backend | `Backend/TestPricingAPI.js` |
| Feasibility API | New backend | `Backend/FeasibilityAPI.js` |
| AI engine | New backend | `Backend/FeasibilityAI/` (4 files) |
| Customer form | New frontend | `src/test_feasibility_automation/FeasibilityRequestForm.jsx` |
| Dashboard | New frontend | `src/test_feasibility_automation/FeasibilityDashboard.jsx` |
| Detail view | New frontend | `src/test_feasibility_automation/FeasibilityRequestDetail.jsx` |
| Sub-components | New frontend | `src/test_feasibility_automation/components/` (5 files) |
| Email templates | Extend existing | `Backend/UsersData.js` or new `Backend/FeasibilityEmails.js` |
| Quotation auto-gen | Extend existing | `Backend/BEAQuotationsTable.js` |
| App routing | Modify existing | `src/App.js` (add public route for customer form) |

---

## Key Design Decisions

- **Public route for customer form:** The feasibility form has no authentication.
  It is protected only by the time-limited token in the URL.

- **AI uses DB data, not training knowledge:** Chamber specs, supported standards,
  chamber availability, and the test catalog are injected into the AI prompt at
  runtime. This prevents hallucination and ensures the AI reasons about your
  actual capabilities and actual slot availability.

- **Static vs dynamic chamber data are separated:** `chamber_specs` stores what
  a chamber is capable of; `chamber_availability` stores when it is free,
  booked, blocked, or under maintenance. Both are required to suggest a slot.

- **Graceful degradation:** If the AI engine is unavailable, the request falls
  through to the NEEDS_REVIEW path so a human always handles it.
  No customer request is ever dropped.

- **Existing quotation module is reused:** Auto-generation writes to the same
  `bea_quotations_table` and uses the same docxtemplater pipeline. The accounts
  team can edit any auto-generated quotation before approving it.

- **Pricing is editable before approval:** Auto-calculated prices are a starting
  point. The accounts team always has the option to adjust before sending.
