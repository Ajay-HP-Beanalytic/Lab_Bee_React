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
  db.query(sqlQuery, (err) => {
    if (err) console.log("Error creating ts1_chamber_spec table", err);
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
  },
  feasibility_request_tests: {
    eut_id: "INT DEFAULT NULL",
    method_or_section: "VARCHAR(500) DEFAULT NULL",
    procedure_or_category: "VARCHAR(500) DEFAULT NULL",
    applies_to: "VARCHAR(500) DEFAULT NULL",
    source: "VARCHAR(500) DEFAULT NULL",
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
};

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

async function migrateFeasibilityForEmailIntake() {
  await Promise.all([
    createFeasibilityRequestsTable(),
    createFeasibilityRequestTestsTable(),
    createInboundEmailsTable(),
    createFeasibilityRequestEutsTable(),
    createIntakeRunsTable(),
  ]);
  const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
  try {
    for (const [table, columns] of Object.entries(EMAIL_INTAKE_COLUMNS)) {
      const existing = await q(
        "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
        [table],
      );
      const have = new Set(existing.map((r) => r.c.toLowerCase()));
      for (const [column, definition] of Object.entries(columns)) {
        if (!have.has(column)) {
          await q(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
      }
    }
    const idx = await q(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'feasibility_requests' AND index_name = 'idx_fr_conversation_id'",
    );
    if (!idx.length) {
      await q("ALTER TABLE feasibility_requests ADD INDEX idx_fr_conversation_id (conversation_id(191))");
    }
    // Confidential requests created before confidential_handling existed
    await q(
      "UPDATE feasibility_requests SET confidential_handling = 'pending' WHERE is_confidential = 1 AND confidential_handling IS NULL",
    );
    return true;
  } catch (err) {
    console.log("Error migrating feasibility tables for email intake", err);
    return false;
  }
}

module.exports = {
  createFeasibilityRequestEutsTable,
  migrateFeasibilityForEmailIntake,
  createInboundEmailsTable,
  createFeasibilityLinkTokensTable,
  createFeasibilityRequestsTable,
  createFeasibilityRequestTestsTable,
  createTS1ChamberSpecTable,
  createTS1TestPricingTable,
};