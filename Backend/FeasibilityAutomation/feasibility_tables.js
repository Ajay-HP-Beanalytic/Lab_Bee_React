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
  db.query(sqlQuery, (err) => {
    if (err) console.log("Error creating feasibility_requests table", err);
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
  db.query(sqlQuery, (err) => {
    if (err) console.log("Error creating feasibility_request_tests table", err);
  });
}

module.exports = {
  createFeasibilityLinkTokensTable,
  createFeasibilityRequestsTable,
  createFeasibilityRequestTestsTable,
};