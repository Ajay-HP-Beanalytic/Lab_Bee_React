const { db } = require("../db");

const testPricingAPIs = (app) => {

  // Get all test pricing entries
  app.get("/api/ts1_test_pricing", (req, res) => {
    db.query(
      "SELECT * FROM ts1_test_pricing ORDER BY test_category ASC, test_name ASC",
      (err, results) => {
        if (err) {
          console.error("GET ts1_test_pricing error:", err);
          return res.status(500).json({ error: "Failed to fetch test pricing" });
        }
        res.json(results);
      }
    );
  });

  // Add new test pricing entry
  app.post("/api/ts1_test_pricing", (req, res) => {
    const {
      test_name, test_category, pricing_type,
      charge_amount, min_hours, is_nabl_accredited, is_active, notes,
    } = req.body;

    if (!test_name || charge_amount == null) {
      return res.status(400).json({ error: "Test name and charge amount are required" });
    }

    const sql = `
      INSERT INTO ts1_test_pricing
        (test_name, test_category, pricing_type, charge_amount, min_hours, is_nabl_accredited, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      test_name,
      test_category || null,
      pricing_type || "per_hour",
      charge_amount,
      min_hours || null,
      is_nabl_accredited ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      notes || null,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("POST ts1_test_pricing error:", err);
        return res.status(500).json({ error: "Failed to save test pricing" });
      }
      res.status(201).json({ success: true, id: result.insertId });
    });
  });

  // Update test pricing entry
  app.put("/api/ts1_test_pricing/:id", (req, res) => {
    const {
      test_name, test_category, pricing_type,
      charge_amount, min_hours, is_nabl_accredited, is_active, notes,
    } = req.body;

    const sql = `
      UPDATE ts1_test_pricing SET
        test_name = ?, test_category = ?, pricing_type = ?,
        charge_amount = ?, min_hours = ?, is_nabl_accredited = ?, is_active = ?, notes = ?
      WHERE id = ?`;

    const values = [
      test_name,
      test_category || null,
      pricing_type || "per_hour",
      charge_amount,
      min_hours || null,
      is_nabl_accredited ? 1 : 0,
      is_active ? 1 : 0,
      notes || null,
      req.params.id,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("PUT ts1_test_pricing error:", err);
        return res.status(500).json({ error: "Failed to update test pricing" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });

  // Delete test pricing entry
  app.delete("/api/ts1_test_pricing/:id", (req, res) => {
    db.query("DELETE FROM ts1_test_pricing WHERE id = ?", [req.params.id], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to delete" });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });
};

module.exports = { testPricingAPIs };