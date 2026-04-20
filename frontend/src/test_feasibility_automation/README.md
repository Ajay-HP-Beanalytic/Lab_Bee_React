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

## Implementation Status

| Phase | Description | Status |
|---|---|---|
| 1A | `ts1_chamber_spec` table + admin UI | ✅ Done |
| 1A.1 | Chamber availability | ✅ Not needed — derived from `slot_booking` table |
| 1B | `ts1_test_pricing` table + admin UI | ✅ Done |
| 1C–1E | `feasibility_requests`, `feasibility_request_tests`, `feasibility_link_tokens` tables | ✅ Done |
| 2 | Customer intake portal (public form + link generation) | ✅ Done |
| 3 | AI Feasibility Engine | 🔲 Pending |
| 4 | Auto Quotation Generation | 🔲 Pending |
| 5 | Email Automation | 🔲 Pending |
| 6 | Internal Feasibility Dashboard | 🔲 Pending |

---

## Phases

### Phase 1 — Database Foundation ✅

All new tables live in `Backend/FeasibilityAutomation/` (separate folder, not mixed with existing tables).

#### 1A. `ts1_chamber_spec` (done)

Stores the physical and operational capabilities of each TS1 chamber.
The existing `chamber_calibration` table only holds calibration dates and status — specs for AI matching are stored here.

**Design decisions:**
- Flat DECIMAL columns for all ranges (not JSON) — enables direct SQL comparison (`WHERE temp_min_celsius <= ?`)
- Two separate ramp rate columns (`temp_ramp_rate`, `humidity_ramp_rate`) for clarity
- `supported_tests` and `supported_standards` stored as JSON arrays
- `is_calibrated`, `is_active`, `chamber_status` are **not stored here** — they are derived via LEFT JOIN on `chamber_calibration` using `chamber_id` (no duplication)

| Column | Type | Purpose |
|---|---|---|
| chamber_name | VARCHAR(500) | Display name |
| chamber_id | VARCHAR(100) UNIQUE | Must match `chamber_calibration.chamber_id` exactly |
| chamber_category | VARCHAR(100) | Thermal / Humidity / Altitude / Vibration / Salt / Rain / Dust |
| length_cm / width_cm / height_cm | DECIMAL(10,2) | Internal usable dimensions |
| max_load_kg | DECIMAL(10,2) | Maximum EUT weight |
| temp_min_celsius / temp_max_celsius | DECIMAL(10,2) | Temperature capability range |
| humidity_min_rh / humidity_max_rh | DECIMAL(10,2) | Humidity capability range |
| temp_ramp_rate | DECIMAL(10,2) | °C per minute |
| humidity_ramp_rate | DECIMAL(10,2) | %RH per minute |
| vibration_freq_min_hz / vibration_freq_max_hz | DECIMAL(10,2) | Vibration frequency range |
| vibration_max_g | DECIMAL(10,2) | Maximum acceleration |
| supported_tests | JSON | Array of test names this chamber supports |
| supported_standards | JSON | Array of standard references (e.g. IEC 60068-2-1) |
| is_nabl_accredited | TINYINT(1) | Whether this chamber is NABL accredited |
| special_notes | TEXT | Special capabilities or restrictions |

**Admin UI:** `src/test_feasibility_automation/ChamberSpecsManager.jsx`
- DataGrid with all chambers and derived calibration/active status
- Add/Edit dialog with category-driven field rendering (e.g. Vibration chambers only show vibration fields)
- Search bar, Export to Excel, Import from Excel (with template download + preview dialog)
- Sidebar: "Chamber Specs" (item i:16) — visible to Administration + TS1 Testing

**Backend:** `Backend/FeasibilityAutomation/ChamberSpecsAPI.js`
- `GET /api/ts1_chamber_specs` — all specs with JOIN-derived calibration fields
- `GET /api/ts1_chamber_specs/:id`
- `POST /api/ts1_chamber_specs`
- `PUT /api/ts1_chamber_specs/:id`
- `DELETE /api/ts1_chamber_specs/:id`

#### 1A.1. Chamber Availability — Not a separate table

After review, chamber availability does **not** need a new table.
Availability is derived directly from the existing `slot_booking` table:
"Is Chamber X free during date range Y?" = query `slot_booking` for no overlapping bookings.
Creating a separate `chamber_availability` table would duplicate data and require constant sync. The AI engine (Phase 3) will query `slot_booking` directly.

#### 1B. `ts1_test_pricing` (done)

Stores per-test pricing so quotations can be generated automatically.

**Design decisions:**
- Two pricing models: `per_hour` (hourly rate × hours used) and `per_test` (flat fee per test run)
- No `standard_reference` column — tests are identified by name + category, not by standard
- No `report_charges` or `setup_charges` — these are not how BE Analytic charges customers
- `min_hours` only applies to `per_hour` type; stored as NULL for `per_test`

| Column | Type | Purpose |
|---|---|---|
| test_name | VARCHAR(500) | Display name of the test |
| test_category | VARCHAR(100) | Thermal / Humidity / Altitude / Vibration / Salt / Rain / Dust |
| pricing_type | ENUM('per_hour', 'per_test') | How this test is charged |
| charge_amount | DECIMAL(10,2) | ₹ rate (per hour OR per test depending on type) |
| min_hours | DECIMAL(10,2) | Minimum billable hours (per_hour type only; NULL for per_test) |
| is_nabl_accredited | TINYINT(1) | Whether this pricing applies to NABL-accredited tests |
| is_active | TINYINT(1) | Soft disable without deleting |
| notes | TEXT | Any conditions or restrictions |

**Admin UI:** `src/test_feasibility_automation/TestPricingManager.jsx`
- DataGrid with Per Hour / Per Test chips, ₹ formatted amounts
- Add/Edit dialog with pricing type toggle (Per Hour / Per Test) — Min Hours field appears only for Per Hour
- Search bar, Export to Excel, Import from Excel (with template + preview dialog)
- Sidebar: "Test Pricing" (item i:17) — visible to Administration + TS1 Testing

**Backend:** `Backend/FeasibilityAutomation/TestPricingAPI.js`
- `GET /api/ts1_test_pricing`
- `POST /api/ts1_test_pricing`
- `PUT /api/ts1_test_pricing/:id`
- `DELETE /api/ts1_test_pricing/:id`

#### 1C. `feasibility_requests` (done)

Tracks every customer feasibility request end-to-end.

| Column | Type | Purpose |
|---|---|---|
| request_token | VARCHAR(100) UNIQUE | Token embedded in the customer link (NULL for future Path B) |
| customer_id | INT | FK to customers_details (NULL if new customer) |
| company_name | VARCHAR(500) | |
| contact_person | VARCHAR(500) | |
| contact_email | VARCHAR(500) | |
| contact_phone | VARCHAR(50) | |
| status | ENUM | pending → ai_processing → feasible / needs_review / not_feasible → quotation_generated → quotation_approved → quotation_sent → closed |
| ai_result | JSON | Full AI analysis output |
| ai_confidence | DECIMAL(5,2) | 0.00 to 100.00 |
| technical_notes | TEXT | Added by technical team for needs_review cases |
| assigned_to | INT | FK to labbee_users (assigned technical reviewer) |
| quotation_id | INT | FK to bea_quotations_table once generated |

#### 1D. `feasibility_request_tests` (done)

One row per test within a feasibility request.

| Column | Type | Purpose |
|---|---|---|
| request_id | INT | FK to feasibility_requests |
| test_category | VARCHAR(100) | As selected by customer |
| test_name | VARCHAR(500) | As described by the customer |
| standard_reference | VARCHAR(500) | e.g. "IEC 60068-2-1 Clause 7.1" |
| eut_name | VARCHAR(500) | Equipment Under Test name |
| eut_length_cm / eut_width_cm / eut_height_cm | DECIMAL(10,2) | EUT dimensions |
| eut_weight_kg | DECIMAL(10,2) | |
| eut_quantity | INT | |
| special_requirements | TEXT | Free text from customer |
| ai_feasibility_result | ENUM | 'feasible', 'needs_review', 'not_feasible' |
| ai_reason | TEXT | AI explanation for this specific test |
| matched_chamber_id | VARCHAR(100) | Chamber the AI matched for this test |
| suggested_slot_start / suggested_slot_end | DATETIME | Earliest suggested available slot |

#### 1E. `feasibility_link_tokens` (done)

Tracks generated customer links.

| Column | Type | Purpose |
|---|---|---|
| token | VARCHAR(100) UNIQUE | `crypto.randomBytes(32)` — 64 hex chars, unguessable |
| generated_by | INT | FK to labbee_users (staff member who sent the link) |
| customer_email | VARCHAR(500) | Pre-filled for the customer |
| customer_name | VARCHAR(500) | Pre-filled for the customer |
| is_used | TINYINT(1) | Marked 1 immediately after successful form submission (single-use) |
| expires_at | TIMESTAMP | 7 days from creation |

---

### Phase 2 — Customer Intake Portal ✅

A public-facing multi-step form. No login required. Accessed via the token link.

**Link format:**
```
https://yourdomain.com/feasibility-request?token=abc123xyz
```

**Files created:**
```
src/test_feasibility_automation/
  FeasibilityRequestForm.jsx        ← public 3-step form (no auth)
  FeasibilityRequestSuccess.jsx     ← confirmation page with reference number
Backend/FeasibilityAutomation/
  FeasibilityAPI.js                 ← all feasibility endpoints
```

**Form steps:**
1. **Your Details** — Company name, contact person, email, phone (auto-filled if token had pre-populated values)
2. **Test Requirements** — Repeatable cards, one per test: category, test name, standard reference, EUT name/dimensions/weight/quantity, special requirements
3. **Review & Submit** — Summary before final submission

**On submission:**
- Request saved to `feasibility_requests` + `feasibility_request_tests`
- Token marked `is_used = 1` (prevents resubmission)
- Customer receives confirmation email with reference number (e.g. `RFQ-00001`)
- Customer redirected to `/feasibility-submitted?ref=...&email=...`

**Staff UI:** "Send Feasibility Link" button added to the Quotations Dashboard
- Dialog with customer name + email fields
- Calls `POST /api/feasibility/generate-link` → returns unique URL
- Copy-to-clipboard button + "Open in Email Client" mailto link

**Backend endpoints (all in `FeasibilityAPI.js`):**
```
POST /api/feasibility/generate-link          ← staff generates customer link (session-authenticated)
GET  /api/feasibility/validate-token/:token  ← validates token on form load (public)
POST /api/feasibility/submit                 ← customer submits the form (public, token-validated)
GET  /api/feasibility/status/:token          ← customer checks their request status (public)
```

**App routing:**
- `/feasibility-request` — public route, excluded from loading gate
- `/feasibility-submitted` — public route, excluded from loading gate

---

### Phase 3 — AI Feasibility Engine 🔲

Runs automatically in the background as soon as the customer submits the form.
Uses the `@openai/agents` package already installed in the backend.

**New backend files (to be created):**
```
Backend/FeasibilityAutomation/
  feasibilityAgent.mjs        ← main AI agent definition and runner
  chamberMatcher.mjs          ← matches EUT specs against ts1_chamber_spec table
  standardsChecker.mjs        ← checks if requested standard is in DB / NABL scope
  feasibilityRunner.mjs       ← orchestrates all checks, saves result to DB
```

**AI checks per test (in order):**

1. **Chamber Matching** (`chamberMatcher.mjs`)
   - Queries `ts1_chamber_spec` filtered by `chamber_category`
   - Checks: EUT dimensions fit inside chamber, weight ≤ max_load_kg,
     required temperature/humidity/vibration range within chamber capability
   - Output: matched `chamber_id` or null

2. **Chamber Availability Check**
   - Queries `slot_booking` for the matched chamber (no separate availability table needed)
   - Checks: earliest available slot overlapping with customer's preferred dates
   - Output: suggested slot window or `needs_review`

3. **Standards Check** (`standardsChecker.mjs`)
   - Queries `ts1_chamber_spec.supported_standards`, `tests_list`,
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

### Phase 4 — Auto Quotation Generation 🔲

Extends the existing quotation module in Labbee.

**For FEASIBLE requests (fully automated):**
1. AI maps each feasible test to a row in `ts1_test_pricing`
2. Calculates total:
   - `per_hour`: `charge_amount × max(hours_requested, min_hours)`
   - `per_test`: `charge_amount × eut_quantity`
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
| XYZ Ltd | 2 (TS1) | Feasible | ₹32,000 | [Approve] [Edit] |

- **Approve** → system emails the PDF quotation to the customer automatically
- **Edit** → opens the existing quotation editor for price adjustments

---

### Phase 5 — Email Automation 🔲

All emails use the existing Nodemailer / Gmail SMTP setup (`EMAIL_ID`, `EMAIL_PASSWORD` env vars).

| Trigger | Recipient | Content |
|---|---|---|
| Staff generates link | Customer | Link to fill the form |
| Customer submits form | Customer | Confirmation + reference number ← **already done in Phase 2** |
| AI result: NOT_FEASIBLE | Customer | Which tests are not feasible + contact info |
| AI result: NEEDS_REVIEW | Technical team | Pre-analysis summary with AI reasoning per test |
| Technical team resolves | Accounts team | "Quotation ready for approval" |
| Accounts team approves | Customer | Professional email with PDF quotation attached |

---

### Phase 6 — Internal Dashboards 🔲

**Feasibility Requests Dashboard** (visible to internal roles with appropriate data filtering):

```
src/test_feasibility_automation/
  FeasibilityDashboard.jsx            ← main list/overview page
  FeasibilityRequestDetail.jsx        ← detail view for a single request
  components/
    RequestStatusTimeline.jsx         ← stage-by-stage timeline with timestamps
    AIAnalysisPanel.jsx               ← AI reasoning and confidence per test
    TechnicalReviewPanel.jsx          ← technical team: add notes + approve/reject
    QuotationApprovalPanel.jsx        ← accounts team: review, edit, approve
```

**Key metrics on the dashboard:**
- Average time from form submission to quotation sent (SLA target: 4 hours)
- % of requests resolved by AI automatically vs. needing human review
- Pending approvals and how long they have been waiting

---

## Files Created / Modified

| File | Type | Purpose |
|---|---|---|
| `Backend/FeasibilityAutomation/feasibility_tables.js` | New | All 5 table creators for this feature |
| `Backend/FeasibilityAutomation/FeasibilityAPI.js` | New | Link generation, token validation, form submit, status check |
| `Backend/FeasibilityAutomation/ChamberSpecsAPI.js` | New | CRUD for `ts1_chamber_spec` with JOIN-derived calibration fields |
| `Backend/FeasibilityAutomation/TestPricingAPI.js` | New | CRUD for `ts1_test_pricing` |
| `Backend/index.js` | Modified | Imports + registers all new table creators and API routers; adds feasibility public route bypass in `validateSession` |
| `src/test_feasibility_automation/FeasibilityRequestForm.jsx` | New | Public 3-step customer intake form |
| `src/test_feasibility_automation/FeasibilityRequestSuccess.jsx` | New | Confirmation page with reference number |
| `src/test_feasibility_automation/ChamberSpecsManager.jsx` | New | Admin UI for chamber specs (DataGrid + Add/Edit/Delete + Import/Export) |
| `src/test_feasibility_automation/TestPricingManager.jsx` | New | Admin UI for test pricing (DataGrid + Add/Edit/Delete + Import/Export) |
| `src/Quote/QuotationsDashboard.js` | Modified | Added "Send Feasibility Link" button + dialog |
| `src/components/sidenavbar.js` | Modified | Added Chamber Specs (i:16) and Test Pricing (i:17) sidebar items |
| `src/App.js` | Modified | Public routes for feasibility form; protected routes for Chamber Specs and Test Pricing |

---

## Key Design Decisions

- **All feasibility backend files are isolated:** Everything lives in `Backend/FeasibilityAutomation/`
  to keep it separate from existing job card, quotation, and calibration code.

- **Public route security model:** The feasibility form is accessible without a session.
  The `validateSession` middleware has an explicit bypass for feasibility public routes:
  `validate-token/:token`, `submit`, and `status/:token`.

- **Token is single-use and time-limited:** Each generated link contains a
  `crypto.randomBytes(32)` token (64 hex chars, 2²⁵⁶ combinations — unguessable).
  The token is marked `is_used = 1` immediately after successful form submission,
  so the same link cannot be resubmitted. Default expiry is 7 days.
  The worst-case scenario of link interception results only in someone submitting
  test requirements — no financial transaction, no data leak, no system access occurs.

- **Token doubles as a request reference:** After submission the token is stored
  in `feasibility_requests.request_token`. Customers can check their status at
  `/api/feasibility/status/:token` without logging in.

- **Chamber specs use flat columns, not JSON:** All numeric ranges (temperature, humidity,
  vibration) are stored as individual DECIMAL columns rather than JSON objects.
  This enables direct SQL range comparisons (`WHERE temp_min_celsius <= ? AND temp_max_celsius >= ?`)
  which the AI engine needs in Phase 3.

- **Calibration data is not duplicated:** `ts1_chamber_spec` stores only static specs.
  `is_calibrated`, `is_active`, and `chamber_status` are derived via LEFT JOIN on
  `chamber_calibration` in every GET query, keyed on `chamber_id`.

- **Chamber availability uses existing slot_booking table:** A separate
  `chamber_availability` table was considered but rejected — it would duplicate
  booking data and require constant sync. The AI engine queries `slot_booking` directly.

- **Two pricing models:** `per_hour` charges by time (with optional minimum hours);
  `per_test` charges a flat fee per test run. This matches how BE Analytic actually
  bills customers. No `report_charges` or `setup_charges` columns.

- **Category-driven form fields:** The Add/Edit form in ChamberSpecsManager renders
  only the relevant spec sections based on the selected chamber category
  (e.g. Vibration chambers show only vibration fields; Thermal chambers show only temperature fields).

- **AI uses DB data, not training knowledge:** Chamber specs, supported standards,
  the test catalog, and slot availability are injected into the AI prompt at runtime.
  This prevents hallucination and ensures the AI reasons about actual capabilities.

- **Graceful degradation:** If the AI engine is unavailable, the request falls through
  to the `needs_review` path so a human always handles it. No request is ever dropped.

- **Existing quotation module is reused:** Auto-generation writes to the same
  `bea_quotations_table` and uses the same docxtemplater pipeline. The accounts
  team can edit any auto-generated quotation before approving it.

---

## Future Enhancement — Open Public Submission (Path B)

The current token-based flow (Path A) requires staff to generate a link first.
A future Path B will allow any customer to submit directly without a token.

```
Path A (current): Staff sends link → Token-gated form → Customer submits
Path B (future) : Fixed public URL → Open form (no token) → Customer submits
```

### What Path B needs

1. **Fixed public URL** — `/request-feasibility` (no token in URL, always accessible)
2. **New backend endpoint** — `POST /api/feasibility/open-submit`
   - Skips token validation
   - Saves to the same `feasibility_requests` table with `request_token = NULL`
   - Same AI engine and quotation flow applies after submission
3. **Spam protection** — Google reCAPTCHA v3 on the form + IP-based rate limiting (max 3 per IP per hour)
4. **No schema changes** — `request_token` is already nullable (`DEFAULT NULL`)

### When to build Path B

Build after Phase 3 (AI engine) is complete and the full Path A flow is
verified end-to-end in production.