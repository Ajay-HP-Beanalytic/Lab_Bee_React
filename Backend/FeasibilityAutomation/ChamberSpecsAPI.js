const { db } = require("../db");

const chamberSpecsAPIs = (app) => {

  // Get all chamber specs joined with calibration status from chamber_calibration
  app.get("/api/ts1_chamber_specs", (req, res) => {
    const sql = `
      SELECT
        s.id,
        s.chamber_name,
        s.chamber_id,
        s.chamber_category,
        s.length_cm,
        s.width_cm,
        s.height_cm,
        s.max_load_kg,
        s.temp_min_celsius,
        s.temp_max_celsius,
        s.humidity_min_rh,
        s.humidity_max_rh,
        s.temp_ramp_rate,
        s.humidity_ramp_rate,
        s.vibration_freq_min_hz,
        s.vibration_freq_max_hz,
        s.vibration_max_g,
        s.supported_tests,
        s.supported_standards,
        s.is_nabl_accredited,
        s.special_notes,
        s.created_at,
        s.updated_at,
        -- Joined from chamber_calibration:
        c.chamber_status,
        CASE
          WHEN c.calibration_due_date IS NULL THEN 'Unknown'
          WHEN c.calibration_due_date < CURDATE() THEN 'Expired'
          ELSE 'Up to Date'
        END AS calibration_status,
        CASE
          WHEN c.chamber_status = 'Active' THEN 1
          ELSE 0
        END AS is_active,
        CASE
          WHEN c.calibration_due_date IS NULL THEN 0
          WHEN c.calibration_due_date >= CURDATE() THEN 1
          ELSE 0
        END AS is_calibrated
      FROM ts1_chamber_spec s
      LEFT JOIN chamber_calibration c ON c.chamber_id = s.chamber_id
      ORDER BY s.chamber_name ASC`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("GET ts1_chamber_specs error:", err);
        return res.status(500).json({ error: "Failed to fetch chamber specs" });
      }
      res.json(results);
    });
  });

  // Get single chamber spec by id
  app.get("/api/ts1_chamber_specs/:id", (req, res) => {
    const sql = `
      SELECT s.*,
        c.chamber_status,
        CASE WHEN c.calibration_due_date >= CURDATE() THEN 1 ELSE 0 END AS is_calibrated,
        CASE WHEN c.chamber_status = 'Active' THEN 1 ELSE 0 END AS is_active
      FROM ts1_chamber_spec s
      LEFT JOIN chamber_calibration c ON c.chamber_id = s.chamber_id
      WHERE s.id = ?`;

    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (results.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(results[0]);
    });
  });

  // Add new chamber spec
  app.post("/api/ts1_chamber_specs", (req, res) => {
    const {
      chamber_name, chamber_id, chamber_category,
      length_cm, width_cm, height_cm, max_load_kg,
      temp_min_celsius, temp_max_celsius,
      humidity_min_rh, humidity_max_rh,
      temp_ramp_rate, humidity_ramp_rate,
      vibration_freq_min_hz, vibration_freq_max_hz, vibration_max_g,
      supported_tests, supported_standards,
      is_nabl_accredited, special_notes,
    } = req.body;

    if (!chamber_name || !chamber_id) {
      return res.status(400).json({ error: "Chamber name and ID are required" });
    }

    const sql = `
      INSERT INTO ts1_chamber_spec (
        chamber_name, chamber_id, chamber_category,
        length_cm, width_cm, height_cm, max_load_kg,
        temp_min_celsius, temp_max_celsius,
        humidity_min_rh, humidity_max_rh,
        temp_ramp_rate, humidity_ramp_rate,
        vibration_freq_min_hz, vibration_freq_max_hz, vibration_max_g,
        supported_tests, supported_standards,
        is_nabl_accredited, special_notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      chamber_name, chamber_id, chamber_category || null,
      length_cm || null, width_cm || null, height_cm || null, max_load_kg || null,
      temp_min_celsius || null, temp_max_celsius || null,
      humidity_min_rh || null, humidity_max_rh || null,
      temp_ramp_rate || null, humidity_ramp_rate || null,
      vibration_freq_min_hz || null, vibration_freq_max_hz || null, vibration_max_g || null,
      supported_tests ? JSON.stringify(supported_tests) : null,
      supported_standards ? JSON.stringify(supported_standards) : null,
      is_nabl_accredited ? 1 : 0,
      special_notes || null,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("POST ts1_chamber_specs error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "A chamber with this Chamber ID already exists" });
        }
        return res.status(500).json({ error: "Failed to save chamber spec" });
      }
      res.status(201).json({ success: true, id: result.insertId });
    });
  });

  // Update existing chamber spec
  app.put("/api/ts1_chamber_specs/:id", (req, res) => {
    const {
      chamber_name, chamber_id, chamber_category,
      length_cm, width_cm, height_cm, max_load_kg,
      temp_min_celsius, temp_max_celsius,
      humidity_min_rh, humidity_max_rh,
      temp_ramp_rate, humidity_ramp_rate,
      vibration_freq_min_hz, vibration_freq_max_hz, vibration_max_g,
      supported_tests, supported_standards,
      is_nabl_accredited, special_notes,
    } = req.body;

    const sql = `
      UPDATE ts1_chamber_spec SET
        chamber_name = ?, chamber_id = ?, chamber_category = ?,
        length_cm = ?, width_cm = ?, height_cm = ?, max_load_kg = ?,
        temp_min_celsius = ?, temp_max_celsius = ?,
        humidity_min_rh = ?, humidity_max_rh = ?,
        temp_ramp_rate = ?, humidity_ramp_rate = ?,
        vibration_freq_min_hz = ?, vibration_freq_max_hz = ?, vibration_max_g = ?,
        supported_tests = ?, supported_standards = ?,
        is_nabl_accredited = ?, special_notes = ?
      WHERE id = ?`;

    const values = [
      chamber_name, chamber_id, chamber_category || null,
      length_cm || null, width_cm || null, height_cm || null, max_load_kg || null,
      temp_min_celsius || null, temp_max_celsius || null,
      humidity_min_rh || null, humidity_max_rh || null,
      temp_ramp_rate || null, humidity_ramp_rate || null,
      vibration_freq_min_hz || null, vibration_freq_max_hz || null, vibration_max_g || null,
      supported_tests ? JSON.stringify(supported_tests) : null,
      supported_standards ? JSON.stringify(supported_standards) : null,
      is_nabl_accredited ? 1 : 0,
      special_notes || null,
      req.params.id,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("PUT ts1_chamber_specs error:", err);
        return res.status(500).json({ error: "Failed to update chamber spec" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });

  // Delete chamber spec
  app.delete("/api/ts1_chamber_specs/:id", (req, res) => {
    db.query("DELETE FROM ts1_chamber_spec WHERE id = ?", [req.params.id], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to delete" });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });
};

module.exports = { chamberSpecsAPIs };