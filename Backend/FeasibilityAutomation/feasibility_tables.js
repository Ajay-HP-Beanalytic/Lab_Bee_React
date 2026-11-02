const { db } = require("../db");

function createFeasibilityLinkTokensTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS feasibility_link_tokens (
      id          INT NOT NULL AUTO_INCREMENT,
      token       VARCHAR(100) UNIQUE NOT NULL,
      generated_by INT NOT NULL,
      customer_email VARCHAR(500),
      customer_name  VARCHAR(500),
      is_used     TINYINT(1) DEFAULT 0,
      expires_at  TIMESTAMP NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`;
  db.query(sqlQuery, (err) => {
    if (err) console.log("Error creating feasibility_link_tokens table", err);
  });
}

function createFeasibilityRequestsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS feasibility_requests (
      id              INT NOT NULL AUTO_INCREMENT,
      request_token   VARCHAR(100) UNIQUE NOT NULL,
      customer_id     INT DEFAULT NULL,
      company_name    VARCHAR(500),
      contact_person  VARCHAR(500),
      contact_email   VARCHAR(500),
      contact_phone   VARCHAR(50),
      status          ENUM(
                        'pending',
                        'ai_processing',
                        'feasible',
                        'needs_review',
                        'not_feasible',
                        'quotation_generated',
                        'quotation_approved',
                        'quotation_sent',
                        'closed'
                      ) DEFAULT 'pending',
      ai_result       JSON DEFAULT NULL,
      ai_confidence   DECIMAL(5,2) DEFAULT NULL,
      technical_notes TEXT DEFAULT NULL,
      assigned_to     INT DEFAULT NULL,
      quotation_id    INT DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating feasibility_requests table", err);
      resolve(!err);
    });
  });
}

function createFeasibilityRequestTestsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS feasibility_request_tests (
      id                    INT NOT NULL AUTO_INCREMENT,
      request_id            INT NOT NULL,
      test_category         VARCHAR(100),
      test_name             VARCHAR(500),
      standard_reference    VARCHAR(500),
      eut_name              VARCHAR(500),
      eut_length_cm         DECIMAL(10,2),
      eut_width_cm          DECIMAL(10,2),
      eut_height_cm         DECIMAL(10,2),
      eut_weight_kg         DECIMAL(10,2),
      eut_quantity          INT DEFAULT 1,
      special_requirements  TEXT,
      ai_feasibility_result ENUM('feasible','needs_review','not_feasible') DEFAULT NULL,
      ai_reason             TEXT DEFAULT NULL,
      matched_chamber_id    VARCHAR(100) DEFAULT NULL,
      suggested_slot_start  DATETIME DEFAULT NULL,
      suggested_slot_end    DATETIME DEFAULT NULL,
      created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating feasibility_request_tests table", err);
      resolve(!err);
    });
  });
}

function createTS1ChamberSpecTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS ts1_chamber_spec (
      id                    INT NOT NULL AUTO_INCREMENT,
      chamber_name          VARCHAR(500) NOT NULL,
      chamber_id            VARCHAR(100) UNIQUE NOT NULL,
      chamber_category      VARCHAR(100),
      length_cm             DECIMAL(10,2),
      width_cm              DECIMAL(10,2),
      height_cm             DECIMAL(10,2),
      max_load_kg           DECIMAL(10,2),
      temp_min_celsius      DECIMAL(10,2),
      temp_max_celsius      DECIMAL(10,2),
      humidity_min_rh       DECIMAL(10,2),
      humidity_max_rh       DECIMAL(10,2),
      temp_ramp_rate        DECIMAL(10,2),
      humidity_ramp_rate    DECIMAL(10,2),
      vibration_freq_min_hz DECIMAL(10,2),
      vibration_freq_max_hz DECIMAL(10,2),
      vibration_max_g       DECIMAL(10,2),
      supported_tests       JSON DEFAULT NULL,
      supported_standards   JSON DEFAULT NULL,
      is_nabl_accredited    TINYINT(1) DEFAULT 0,
      special_notes         TEXT,
      created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating ts1_chamber_spec table", err);
      resolve(!err);
    });
  });
}

//Columns added to ts1_chamber_spec for the chamber master (feasibility step 3).
//chamber_id is the code, the same ID as in chamber_calibration.
//supported_tests / supported_standards are no longer used: chamber_test_types
//links chambers to test types instead.
const CHAMBER_COLUMNS = {
  // Other spellings used in job cards and the test/chamber mapping (HUMID-01, CATH CHAMBER …)
  aliases: "TEXT",
  // Heavier loads need a slower ramp: "20@10; 100@5" = up to 20 kg at 10 °C/min, up to 100 kg at 5 °C/min
  load_limits: "VARCHAR(255) DEFAULT NULL",
  altitude_max_m: "DECIMAL(10,2) DEFAULT NULL",
  vib_force_kgf: "DECIMAL(10,2) DEFAULT NULL",
  vib_table_length_mm: "DECIMAL(10,2) DEFAULT NULL",
  vib_table_width_mm: "DECIMAL(10,2) DEFAULT NULL",
  // Peak-to-peak
  vib_displacement_mm: "DECIMAL(10,2) DEFAULT NULL",
  // How the linked test types were set: NULL = not yet, 'auto' = from the job card mapping, 'reviewed'
  test_types_status: "VARCHAR(10) DEFAULT NULL",
  is_active: "TINYINT(1) NOT NULL DEFAULT 1",
  sort_order: "INT DEFAULT NULL",
  updated_by: "INT DEFAULT NULL",
};

//Which test types a chamber can run (TCC-1 -> HT, LT, TC …).
function createChamberTestTypesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS chamber_test_types (
      chamber_spec_id INT NOT NULL,
      test_type_id    INT NOT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(chamber_spec_id, test_type_id),
      KEY idx_test_type_id (test_type_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating chamber_test_types table", err);
      resolve(!err);
    });
  });
}

function createTS1TestPricingTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS ts1_test_pricing (
      id             INT NOT NULL AUTO_INCREMENT,
      test_name      VARCHAR(500) NOT NULL,
      test_category  VARCHAR(100),
      pricing_type   ENUM('per_hour', 'per_test') NOT NULL DEFAULT 'per_hour',
      charge_amount  DECIMAL(10,2) NOT NULL,
      min_hours      DECIMAL(10,2) DEFAULT NULL,
      is_nabl_accredited TINYINT(1) DEFAULT 0,
      is_active      TINYINT(1) DEFAULT 1,
      notes          TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`;
  db.query(sqlQuery, (err) => {
    if (err) console.log("Error creating ts1_test_pricing table", err);
  });
}

//One row per email read from the RFQ mailbox by the intake agent.
//internet_message_id is unique, so the same email is never processed twice.
function createInboundEmailsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS inbound_emails (
      id                  INT NOT NULL AUTO_INCREMENT,
      internet_message_id VARCHAR(512) NOT NULL,
      graph_message_id    VARCHAR(512) NOT NULL,
      conversation_id     VARCHAR(512),
      mailbox             VARCHAR(255),
      from_name           VARCHAR(500),
      from_address        VARCHAR(500),
      subject             VARCHAR(1000),
      body_preview        TEXT,
      received_at         DATETIME,
      attachment_names    JSON DEFAULT NULL,
      decision            ENUM('confidential','internal','analysed','error') NOT NULL,
      decision_reasons    JSON DEFAULT NULL,
      classification      VARCHAR(50) DEFAULT NULL,
      extracted           JSON DEFAULT NULL,
      attachment_notes    JSON DEFAULT NULL,
      model               VARCHAR(100) DEFAULT NULL,
      input_tokens        INT DEFAULT NULL,
      output_tokens       INT DEFAULT NULL,
      request_id          INT DEFAULT NULL,
      error               TEXT DEFAULT NULL,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_internet_message_id (internet_message_id),
      KEY idx_conversation_id (conversation_id(191)),
      KEY idx_received_at (received_at)
    )`;
  // Returns a promise so scripts can wait for the table; index.js ignores it.
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating inbound_emails table", err);
      resolve(!err);
    });
  });
}

//EUTs of a request. One request can have several units/versions, and each
//test row points to its EUT through feasibility_request_tests.eut_id.
function createFeasibilityRequestEutsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS feasibility_request_euts (
      id                    INT NOT NULL AUTO_INCREMENT,
      request_id            INT NOT NULL,
      eut_name              VARCHAR(500),
      model_or_part_no      VARCHAR(500),
      quantity              INT DEFAULT NULL,
      dimensions_as_written VARCHAR(500),
      length_cm             DECIMAL(10,2),
      width_cm              DECIMAL(10,2),
      height_cm             DECIMAL(10,2),
      weight_kg             DECIMAL(10,3),
      weight_as_written     VARCHAR(255),
      notes                 TEXT,
      created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      KEY idx_request_id (request_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating feasibility_request_euts table", err);
      resolve(!err);
    });
  });
}

//Columns added for email intake. MySQL 8.0 has no "ADD COLUMN IF NOT EXISTS",
//so each column is added only when information_schema says it is missing.
const EMAIL_INTAKE_COLUMNS = {
  feasibility_requests: {
    source: "ENUM('portal','email') NOT NULL DEFAULT 'portal'",
    source_email_id: "INT DEFAULT NULL",
    conversation_id: "VARCHAR(512) DEFAULT NULL",
    email_subject: "VARCHAR(1000) DEFAULT NULL",
    customer_reference: "VARCHAR(255) DEFAULT NULL",
    quote_deadline: "VARCHAR(255) DEFAULT NULL",
    requested_test_window: "VARCHAR(255) DEFAULT NULL",
    missing_fields: "JSON DEFAULT NULL",
    request_flags: "JSON DEFAULT NULL",
    is_confidential: "TINYINT(1) NOT NULL DEFAULT 0",
    // For confidential requests: 'pending' (staff to choose), 'ai' (staff sent it
    // to the AI) or 'manual' (staff enter the details themselves)
    confidential_handling: "VARCHAR(20) DEFAULT NULL",
    confidential_handled_by: "INT DEFAULT NULL",
    confidential_handled_at: "DATETIME DEFAULT NULL",
    // Enquiry workflow (enquiry/workflow.js): stage, who has it, outcome
    stage: "VARCHAR(30) NOT NULL DEFAULT 'new'",
    stage_changed_at: "DATETIME DEFAULT NULL",
    departments: "VARCHAR(20) DEFAULT NULL", // testing teams needed: 'TS1', 'TS2' or 'TS1,TS2'
    departments_unsure: "TINYINT(1) NOT NULL DEFAULT 0", // some tests could not be placed: a person should choose
    departments_by: "INT DEFAULT NULL", // set by a person (then never changed automatically)
    owner_id: "INT DEFAULT NULL",
    quote_requested: "TINYINT(1) NOT NULL DEFAULT 0",
    feasibility_result: "VARCHAR(20) DEFAULT NULL",
    quotation_ref: "VARCHAR(255) DEFAULT NULL",
    quote_value: "DECIMAL(14,2) DEFAULT NULL",
    next_followup_at: "DATE DEFAULT NULL",
    outcome_reason: "VARCHAR(255) DEFAULT NULL",
    po_number: "VARCHAR(100) DEFAULT NULL",
    won_value: "DECIMAL(14,2) DEFAULT NULL",
    closed_at: "DATETIME DEFAULT NULL",
    // Company details the AI read from the emails, until staff save them as a customer
    customer_suggestion: "JSON DEFAULT NULL",
  },
  // Customer list (Quote/AddCustomerDetails.js): extra details for customers added from enquiries
  customers_details: {
    gstin: "VARCHAR(20) DEFAULT NULL",
    website: "VARCHAR(255) DEFAULT NULL",
    created_from_request: "INT DEFAULT NULL",
    created_by: "INT DEFAULT NULL",
  },
  feasibility_request_tests: {
    eut_id: "INT DEFAULT NULL",
    method_or_section: "VARCHAR(500) DEFAULT NULL",
    procedure_or_category: "VARCHAR(500) DEFAULT NULL",
    applies_to: "VARCHAR(500) DEFAULT NULL",
    source: "VARCHAR(500) DEFAULT NULL",
    // Quote line of the test (enquiry/testLines.js): test type, the customer's
    // values for the hours, hours / quantity entered by a person
    test_type_id: "INT DEFAULT NULL",
    quote_values: "JSON DEFAULT NULL",
    values_source: "VARCHAR(10) DEFAULT NULL", // 'ai' (read by the AI) | 'person' (checked / edited)
    values_note: "VARCHAR(500) DEFAULT NULL",
    values_by: "INT DEFAULT NULL",
    values_at: "DATETIME DEFAULT NULL",
    hours_override: "DECIMAL(8,2) DEFAULT NULL",
    hours_reason: "VARCHAR(255) DEFAULT NULL",
    quote_qty: "DECIMAL(10,2) DEFAULT NULL",
    quote_excluded: "TINYINT(1) NOT NULL DEFAULT 0",
    // Split of a combined request ("IP67" -> dust + immersion): the customer's wording and the first part
    requested_as: "VARCHAR(500) DEFAULT NULL",
    split_from: "INT DEFAULT NULL",
  },
  inbound_emails: {
    // created | duplicate | followup | linked | ignored (NULL = not handled yet)
    request_action: "VARCHAR(30) DEFAULT NULL",
    // Set when staff sent a confidential email to the AI (audit trail)
    ai_released_by: "INT DEFAULT NULL",
    ai_released_at: "DATETIME DEFAULT NULL",
    // How many times analysis was tried (failed mails are retried up to 3 times)
    attempts: "INT NOT NULL DEFAULT 1",
  },
  intake_runs: {
    mailbox: "VARCHAR(255) DEFAULT NULL", // RFQ_MAILBOX at the time of the run
  },
};

//Enquiry history: one row per action (who did what, when). The timeline and the
//time / conversion figures are built from it.
function createRfqEventsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS rfq_events (
      id          INT NOT NULL AUTO_INCREMENT,
      request_id  INT NOT NULL,
      action      VARCHAR(40) NOT NULL,
      from_stage  VARCHAR(30) DEFAULT NULL,
      to_stage    VARCHAR(30) DEFAULT NULL,
      user_id     INT DEFAULT NULL,
      note        TEXT,
      data        JSON DEFAULT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      KEY idx_request_id (request_id),
      KEY idx_action_created (action, created_at)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating rfq_events table", err);
      resolve(!err);
    });
  });
}

//Files attached to enquiry emails, stored by enquiry/attachments.js
//Draft quotation of an enquiry (enquiry/draftQuote.js): one per enquiry, opened
//pre-filled in the Quotation page. quotation_ids is set once it was saved there.
function createRfqQuoteDraftsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS rfq_quote_drafts (
      id             INT NOT NULL AUTO_INCREMENT,
      request_id     INT NOT NULL,
      status         VARCHAR(10) NOT NULL DEFAULT 'draft',
      test_lines     JSON DEFAULT NULL,
      total          DECIMAL(14,2) DEFAULT NULL,
      customer       JSON DEFAULT NULL,
      notes          JSON DEFAULT NULL,
      ai_model       VARCHAR(100) DEFAULT NULL,
      built_by       INT DEFAULT NULL,
      quotation_ids  VARCHAR(255) DEFAULT NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_request_id (request_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating rfq_quote_drafts table", err);
      resolve(!err);
    });
  });
}

//Customer logos, one per customer (customers_details.id). Kept in the database so
//the quotation download (Quote/DocToPdf.js) puts the logo in without an upload.
function createCustomerLogosTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS customer_logos (
      customer_id  INT NOT NULL,
      mime         VARCHAR(50) NOT NULL,
      data         MEDIUMBLOB NOT NULL,
      file_name    VARCHAR(255) DEFAULT NULL,
      updated_by   INT DEFAULT NULL,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(customer_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating customer_logos table", err);
      resolve(!err);
    });
  });
}

function createRfqAttachmentsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS rfq_attachments (
      id               INT NOT NULL AUTO_INCREMENT,
      inbound_email_id INT NOT NULL,
      file_name        VARCHAR(255) NOT NULL,
      stored_path      VARCHAR(500) NOT NULL,
      size_bytes       INT DEFAULT NULL,
      content_type     VARCHAR(150) DEFAULT NULL,
      from_forwarded   VARCHAR(500) DEFAULT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      KEY idx_inbound_email_id (inbound_email_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating rfq_attachments table", err);
      resolve(!err);
    });
  });
}

//One row per scheduled intake run (shown on the dashboard as "last checked").
function createIntakeRunsTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS intake_runs (
      id                INT NOT NULL AUTO_INCREMENT,
      started_at        DATETIME NOT NULL,
      finished_at       DATETIME DEFAULT NULL,
      checked_since     DATETIME DEFAULT NULL,
      status            ENUM('running','success','failed') NOT NULL DEFAULT 'running',
      mails_seen        INT DEFAULT 0,
      mail_counts       JSON DEFAULT NULL,
      request_counts    JSON DEFAULT NULL,
      input_tokens      INT DEFAULT 0,
      output_tokens     INT DEFAULT 0,
      error             TEXT DEFAULT NULL,
      PRIMARY KEY(id),
      KEY idx_started_at (started_at)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating intake_runs table", err);
      resolve(!err);
    });
  });
}

//NABL accreditation certificates (e.g. TC-5078) and their validity.
function createNablCertificatesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS nabl_certificates (
      id                     INT NOT NULL AUTO_INCREMENT,
      certificate_no         VARCHAR(50) NOT NULL,
      accreditation_standard VARCHAR(100) DEFAULT NULL,
      valid_from             DATE DEFAULT NULL,
      valid_to               DATE DEFAULT NULL,
      last_amended_on        DATE DEFAULT NULL,
      notes                  TEXT,
      updated_by             INT DEFAULT NULL,
      created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_certificate_no (certificate_no)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating nabl_certificates table", err);
      resolve(!err);
    });
  });
}

//One row per line of the NABL scope annexure (TS1 environmental and TS2 EMC).
//A line is identified by certificate + location + S.No, which is how re-imports
//of an amended scope find the existing row. Lines dropped from the certificate
//are set inactive, not deleted.
function createLabScopeTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS lab_scope (
      id              INT NOT NULL AUTO_INCREMENT,
      certificate_no  VARCHAR(50) NOT NULL,
      location        ENUM('permanent','site') NOT NULL DEFAULT 'permanent',
      s_no            INT NOT NULL,
      department      ENUM('TS1','TS2') NOT NULL,
      discipline      VARCHAR(255) DEFAULT NULL,
      product_group   VARCHAR(500) DEFAULT NULL,
      test_name       VARCHAR(500) NOT NULL,
      standard        VARCHAR(500) NOT NULL,
      is_withdrawn    TINYINT(1) NOT NULL DEFAULT 0,
      is_active       TINYINT(1) NOT NULL DEFAULT 1,
      -- How the linked test types (lab_scope_test_types) were set:
      -- NULL = not yet, 'ai' = suggested by AI, not checked, 'reviewed' = confirmed by staff
      test_types_status VARCHAR(10) DEFAULT NULL,
      notes           TEXT,
      source          VARCHAR(20) DEFAULT NULL,
      updated_by      INT DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_scope_line (certificate_no, location, s_no),
      KEY idx_department (department)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating lab_scope table", err);
      resolve(!err);
    });
  });
}

//Catalogue of test types (High temperature, Vibration, IPX5, CE102 …): the level
//at which tests are priced and matched to chambers. Scope lines link to it.
function createTestTypesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS test_types (
      id          INT NOT NULL AUTO_INCREMENT,
      code        VARCHAR(30) NOT NULL,
      name        VARCHAR(255) NOT NULL,
      department  ENUM('TS1','TS2') NOT NULL,
      category    VARCHAR(100) DEFAULT NULL,
      description TEXT,
      aliases     TEXT,
      sort_order  INT DEFAULT NULL,
      is_active   TINYINT(1) NOT NULL DEFAULT 1,
      notes       TEXT,
      updated_by  INT DEFAULT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_test_type_code (code)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating test_types table", err);
      resolve(!err);
    });
  });
}

//Which test types a scope line covers. One line can cover several
//("Drop test, toppling and bench handling" -> DROP, TOPPLE, BENCH).
function createLabScopeTestTypesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS lab_scope_test_types (
      scope_id     INT NOT NULL,
      test_type_id INT NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(scope_id, test_type_id),
      KEY idx_test_type_id (test_type_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating lab_scope_test_types table", err);
      resolve(!err);
    });
  });
}

//Which test types a job card test name (test_names_table for TS1,
//emi_test_names_table for TS2) belongs to. Keyed by the name text because job
//cards store the name, not an id. status: 'auto' (matched by name, to be
//checked) or 'reviewed'; match_rule says how an auto link was found.
function createTestNameLinksTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS test_name_links (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      department   ENUM('TS1','TS2') NOT NULL,
      test_name    VARCHAR(255) NOT NULL,
      test_type_id INT NOT NULL,
      status       VARCHAR(10) NOT NULL DEFAULT 'auto',
      match_rule   VARCHAR(10) DEFAULT NULL,
      updated_by   INT DEFAULT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_name_type (department, test_name, test_type_id),
      KEY idx_test_type_id (test_type_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating test_name_links table", err);
      resolve(!err);
    });
  });
}

//Price list for TS1 and TS2 (prices exclude GST; NABL and non-NABL cost the same).
//charged_per: 'hour' (rate x hours), 'test' (rate x tests) or 'unit' (rate x
//units named by unit_label, e.g. per chemical). min_qty is the minimum charged
//(TS1: 1 hour or 1 test). rate is the normal (compliance) rate; when
//rate_precompliance is set, pre-compliance testing uses it instead (TS2 EMC:
//80,000 compliance / 40,000 pre-compliance per test). add_on_rate is charged
//per extra item, e.g. CS114: 18,000 per power cable + 6,500 per add-on cable.
function createTestPricesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS test_prices (
      id                      INT NOT NULL AUTO_INCREMENT,
      code                    VARCHAR(40) NOT NULL,
      department              ENUM('TS1','TS2') NOT NULL,
      name                    VARCHAR(255) NOT NULL,
      charged_per             VARCHAR(10) NOT NULL DEFAULT 'test',
      unit_label              VARCHAR(50) DEFAULT NULL,
      rate                    DECIMAL(12,2) NOT NULL,
      min_qty                 DECIMAL(10,2) DEFAULT 1,
      rate_precompliance      DECIMAL(12,2) DEFAULT NULL,
      add_on_rate            DECIMAL(12,2) DEFAULT NULL,
      add_on_label            VARCHAR(50) DEFAULT NULL,
      sort_order              INT DEFAULT NULL,
      is_active               TINYINT(1) NOT NULL DEFAULT 1,
      notes                   TEXT,
      updated_by              INT DEFAULT NULL,
      created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_price_code (code)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating test_prices table", err);
      resolve(!err);
    });
  });
}

//Which test types a price covers ("Vibration, shock and bump" -> VIB, SHOCK, BUMP).
function createTestPriceTestTypesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS test_price_test_types (
      price_id     INT NOT NULL,
      test_type_id INT NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(price_id, test_type_id),
      KEY idx_test_type_id (test_type_id)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating test_price_test_types table", err);
      resolve(!err);
    });
  });
}

//How the chamber hours of a test type are worked out (masterData/durationCalculator.js).
//standard = '' is the test type's rule (method and default values); a row with a
//standard (e.g. "IEC 60068-2-14") only overrides values, e.g. the ramp rate that
//standard asks for, and is used when the customer's standard contains it.
function createTestDurationRulesTable() {
  const sqlQuery = `
    CREATE TABLE IF NOT EXISTS test_duration_rules (
      id            INT NOT NULL AUTO_INCREMENT,
      test_type_id  INT NOT NULL,
      standard      VARCHAR(100) NOT NULL DEFAULT '',
      method        VARCHAR(20) DEFAULT NULL,
      params        JSON DEFAULT NULL,
      checked       TINYINT(1) NOT NULL DEFAULT 0,
      is_active     TINYINT(1) NOT NULL DEFAULT 1,
      notes         TEXT,
      updated_by    INT DEFAULT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id),
      UNIQUE KEY uq_type_standard (test_type_id, standard)
    )`;
  return new Promise((resolve) => {
    db.query(sqlQuery, (err) => {
      if (err) console.log("Error creating test_duration_rules table", err);
      resolve(!err);
    });
  });
}

//Creates the master data tables (NABL scope, test types, chambers, prices), updates older
//versions of them and loads the starting test type list into an empty table.
async function migrateMasterData() {
  await Promise.all([
    createNablCertificatesTable(), createLabScopeTable(), createTestTypesTable(), createLabScopeTestTypesTable(),
    createTestNameLinksTable(), createTS1ChamberSpecTable(), createChamberTestTypesTable(),
    createTestPricesTable(), createTestPriceTestTypesTable(), createTestDurationRulesTable(),
  ]);
  const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
  try {
    const cols = await q(
      "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lab_scope'",
    );
    const have = new Set(cols.map((r) => r.c.toLowerCase()));
    if (!have.has("test_types_status")) {
      await q("ALTER TABLE lab_scope ADD COLUMN test_types_status VARCHAR(10) DEFAULT NULL AFTER is_active");
    }
    // First version had a single test type per line (never used)
    if (have.has("test_type_id")) await q("ALTER TABLE lab_scope DROP COLUMN test_type_id");

    const chamberCols = await q(
      "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ts1_chamber_spec'",
    );
    const haveChamber = new Set(chamberCols.map((r) => r.c.toLowerCase()));
    for (const [column, definition] of Object.entries(CHAMBER_COLUMNS)) {
      if (!haveChamber.has(column)) await q(`ALTER TABLE ts1_chamber_spec ADD COLUMN ${column} ${definition}`);
    }

    // First version priced pre-compliance / compliance by minimum hours (never used)
    const priceCols = await q(
      "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'test_prices'",
    );
    const havePrice = new Set(priceCols.map((r) => r.c.toLowerCase()));
    if (!havePrice.has("rate_precompliance")) {
      await q("ALTER TABLE test_prices ADD COLUMN rate_precompliance DECIMAL(12,2) DEFAULT NULL AFTER min_qty");
    }
    for (const old of ["min_hours_precompliance", "min_hours_compliance"]) {
      if (havePrice.has(old)) await q(`ALTER TABLE test_prices DROP COLUMN ${old}`);
    }

    const [{ n }] = await q("SELECT COUNT(*) AS n FROM test_types");
    if (!n) {
      const { TEST_TYPES } = require("./masterData/testTypesSeed");
      await q(
        "INSERT INTO test_types (code, name, department, category, description, aliases, sort_order) VALUES ?",
        [TEST_TYPES.map((tt, i) => [tt.code, tt.name, tt.department, tt.category, tt.description, tt.aliases, (i + 1) * 10])],
      );
    }

    // Starting duration rules (shown as "to check" until someone saves them)
    const [{ rules }] = await q("SELECT COUNT(*) AS rules FROM test_duration_rules");
    if (!rules) {
      const { DURATION_RULES } = require("./masterData/durationRulesSeed");
      const types = await q("SELECT id, code FROM test_types");
      const idOf = new Map(types.map((t) => [t.code, t.id]));
      const rows = DURATION_RULES.filter((r) => idOf.has(r.code)).map((r) => [
        idOf.get(r.code), r.standard || "", r.method || null, JSON.stringify(r.params || {}), r.notes || null,
      ]);
      if (rows.length) await q("INSERT INTO test_duration_rules (test_type_id, standard, method, params, notes) VALUES ?", [rows]);
    }
    return true;
  } catch (err) {
    console.log("Error migrating master data tables", err);
    return false;
  }
}

async function migrateFeasibilityForEmailIntake() {
  await Promise.all([
    createFeasibilityRequestsTable(),
    createFeasibilityRequestTestsTable(),
    createInboundEmailsTable(),
    createFeasibilityRequestEutsTable(),
    createIntakeRunsTable(),
    createRfqEventsTable(),
    createRfqAttachmentsTable(),
    createRfqQuoteDraftsTable(),
    createCustomerLogosTable(),
  ]);
  const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
  try {
    const added = new Set(); // "table.column" added now
    for (const [table, columns] of Object.entries(EMAIL_INTAKE_COLUMNS)) {
      const existing = await q(
        "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
        [table],
      );
      if (!existing.length) continue; // table not created yet (customers_details: database_tables.js)
      const have = new Set(existing.map((r) => r.c.toLowerCase()));
      for (const [column, definition] of Object.entries(columns)) {
        if (!have.has(column)) {
          await q(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
          added.add(`${table}.${column}`);
        }
      }
    }
    const idx = await q(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'feasibility_requests' AND index_name = 'idx_fr_conversation_id'",
    );
    if (!idx.length) {
      await q("ALTER TABLE feasibility_requests ADD INDEX idx_fr_conversation_id (conversation_id(191))");
    }
    const stageIdx = await q(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'feasibility_requests' AND index_name = 'idx_fr_stage'",
    );
    if (!stageIdx.length) await q("ALTER TABLE feasibility_requests ADD INDEX idx_fr_stage (stage)");
    // Enquiries created before the workflow: teams from their tests, stage age from creation
    const { departmentsFor } = require("./enquiry/workflow");
    for (const r of await q("SELECT id FROM feasibility_requests WHERE departments IS NULL")) {
      const tests = await q("SELECT test_category FROM feasibility_request_tests WHERE request_id = ?", [r.id]);
      await q("UPDATE feasibility_requests SET departments = ? WHERE id = ?", [departmentsFor(tests), r.id]);
    }
    await q("UPDATE feasibility_requests SET stage_changed_at = created_at WHERE stage_changed_at IS NULL");
    // New enquiries start at 'new' (a trial of a shorter workflow had changed the default)
    await q("ALTER TABLE feasibility_requests ALTER COLUMN stage SET DEFAULT 'new'");
    // Runs from before intake_runs.mailbox: they read the mailbox the stored mails came from
    await q(
      `UPDATE intake_runs SET mailbox = (SELECT mailbox FROM inbound_emails WHERE mailbox IS NOT NULL ORDER BY id DESC LIMIT 1)
       WHERE mailbox IS NULL`,
    );
    // Confidential requests created before confidential_handling existed
    await q(
      "UPDATE feasibility_requests SET confidential_handling = 'pending' WHERE is_confidential = 1 AND confidential_handling IS NULL",
    );
    // Once, when departments_unsure arrives: mark open enquiries whose team is unclear
    if (added.has("feasibility_requests.departments_unsure")) {
      const { refreshDepartments, OPEN_STAGES } = require("./enquiry/workflow");
      for (const r of await q("SELECT id FROM feasibility_requests WHERE stage IN (?)", [OPEN_STAGES])) await refreshDepartments(r.id);
    }
    return true;
  } catch (err) {
    console.log("Error migrating feasibility tables for email intake", err);
    return false;
  }
}

module.exports = {
  createNablCertificatesTable,
  createLabScopeTable,
  migrateMasterData,
  createFeasibilityRequestEutsTable,
  migrateFeasibilityForEmailIntake,
  createInboundEmailsTable,
  createFeasibilityLinkTokensTable,
  createFeasibilityRequestsTable,
  createFeasibilityRequestTestsTable,
  createTS1ChamberSpecTable,
  createTS1TestPricingTable,
};