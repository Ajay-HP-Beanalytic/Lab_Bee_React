const { db } = require("./db");
const express = require("express");

// EMI Backend API's for test names and standards management
function emiTestNamesAndStandardsAPIs(app, io, labbeeUsers) {
  ///////////////////////////////////////////////////////////////////////////////////
  // EMI TEST NAMES API ENDPOINTS

  // API to add a new EMI test name
  app.post("/api/addNewEMITestName", (req, res) => {
    const { testName } = req.body;

    if (!testName || testName.trim() === "") {
      return res.status(400).json({ error: "Test name is required" });
    }

    try {
      const query = `INSERT INTO emi_test_names_table (test_name) VALUES (?)`;
      db.query(query, [testName.trim()], (error, results) => {
        if (error) {
          console.error("Error adding EMI test name:", error);
          return res.status(500).json({ error: "Failed to add EMI test name" });
        }

        // Send success response with the new ID
        res.status(200).json({
          message: "EMI test name added successfully",
          id: results.insertId,
        });
      });
    } catch (error) {
      console.error("Error adding EMI test name:", error);
      res.status(500).json({ error: "Failed to add EMI test name" });
    }
  });

  // API to update an EMI test name
  app.put("/api/updateEMITestName/:id", (req, res) => {
    const { id } = req.params;
    const { testName } = req.body;

    if (!testName || testName.trim() === "") {
      return res.status(400).json({ error: "Test name is required" });
    }

    try {
      const query = `UPDATE emi_test_names_table SET test_name = ? WHERE id = ?`;
      db.query(query, [testName.trim(), id], (error, results) => {
        if (error) {
          console.error("Error updating EMI test name:", error);
          return res
            .status(500)
            .json({ error: "Failed to update EMI test name" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "EMI test name not found" });
        }

        res.status(200).json({ message: "EMI test name updated successfully" });
      });
    } catch (error) {
      console.error("Error updating EMI test name:", error);
      res.status(500).json({ error: "Failed to update EMI test name" });
    }
  });

  // API to delete an EMI test name
  app.delete("/api/deleteEMITestName/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `DELETE FROM emi_test_names_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting EMI test name:", error);
          return res
            .status(500)
            .json({ error: "Failed to delete EMI test name" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "EMI test name not found" });
        }

        res.status(200).json({ message: "EMI test name deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting EMI test name:", error);
      res.status(500).json({ error: "Failed to delete EMI test name" });
    }
  });

  // API to get all EMI test names
  app.get("/api/getAllEMITestNames", (req, res) => {
    try {
      const query = "SELECT * FROM emi_test_names_table ORDER BY test_name ASC";

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching EMI test names:", error);
          return res
            .status(500)
            .json({ error: "Failed to fetch EMI test names" });
        }

        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching EMI test names:", error);
      res.status(500).json({ error: "Failed to fetch EMI test names" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////
  // EMI STANDARDS API ENDPOINTS

  // API to add a new EMI standard
  app.post("/api/addNewEMIStandard", (req, res) => {
    const { standardName } = req.body;

    if (!standardName || standardName.trim() === "") {
      return res.status(400).json({ error: "Standard name is required" });
    }

    try {
      const query = `INSERT INTO emi_test_standards_table (standard_name) VALUES (?)`;
      db.query(query, [standardName.trim()], (error, results) => {
        if (error) {
          console.error("Error adding EMI standard:", error);
          return res.status(500).json({ error: "Failed to add EMI standard" });
        }

        // Send success response with the new ID
        res.status(200).json({
          message: "EMI standard added successfully",
          id: results.insertId,
        });
      });
    } catch (error) {
      console.error("Error adding EMI standard:", error);
      res.status(500).json({ error: "Failed to add EMI standard" });
    }
  });

  // API to update an EMI standard
  app.put("/api/updateEMIStandard/:id", (req, res) => {
    const { id } = req.params;
    const { standardName } = req.body;

    if (!standardName || standardName.trim() === "") {
      return res.status(400).json({ error: "Standard name is required" });
    }

    try {
      const query = `UPDATE emi_test_standards_table SET standard_name = ? WHERE id = ?`;
      db.query(query, [standardName.trim(), id], (error, results) => {
        if (error) {
          console.error("Error updating EMI standard:", error);
          return res
            .status(500)
            .json({ error: "Failed to update EMI standard" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "EMI standard not found" });
        }

        res.status(200).json({ message: "EMI standard updated successfully" });
      });
    } catch (error) {
      console.error("Error updating EMI standard:", error);
      res.status(500).json({ error: "Failed to update EMI standard" });
    }
  });

  // API to delete an EMI standard
  app.delete("/api/deleteEMIStandard/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `DELETE FROM emi_test_standards_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting EMI standard:", error);
          return res
            .status(500)
            .json({ error: "Failed to delete EMI standard" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "EMI standard not found" });
        }

        res.status(200).json({ message: "EMI standard deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting EMI standard:", error);
      res.status(500).json({ error: "Failed to delete EMI standard" });
    }
  });

  // API to get all EMI standards
  app.get("/api/getAllEMIStandards", (req, res) => {
    try {
      const query =
        "SELECT * FROM emi_test_standards_table ORDER BY standard_name ASC";

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching EMI standards:", error);
          return res
            .status(500)
            .json({ error: "Failed to fetch EMI standards" });
        }

        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching EMI standards:", error);
      res.status(500).json({ error: "Failed to fetch EMI standards" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////
  // MAPPING API ENDPOINTS (for JSON-based standard-test mapping)

  // API to get test names by standard using JSON mapping
  app.get("/api/getEMITestNamesByStandard/:standardName", (req, res) => {
    const { standardName } = req.params;

    try {
      const query = `
        SELECT test_names 
        FROM emi_test_standard_mapping_table 
        WHERE standard = ?
        AND is_active = TRUE
      `;

      db.query(query, [standardName], (error, results) => {
        if (error) {
          console.error("Error fetching test names by standard:", error);
          return res
            .status(500)
            .json({ error: "Failed to fetch test names by standard" });
        }

        if (results.length === 0) {
          return res.status(200).json([]);
        }

        const rawTestNames = results[0].test_names;

        let testNames = [];

        try {
          // Case 1: If it's already an array (MySQL might return parsed JSON)
          if (Array.isArray(rawTestNames)) {
            testNames = rawTestNames;
          }
          // Case 2: If it's a JSON string, parse it
          else if (
            typeof rawTestNames === "string" &&
            rawTestNames.startsWith("[")
          ) {
            testNames = JSON.parse(rawTestNames);
          }
          // Case 3: If it's a comma-separated string
          else if (
            typeof rawTestNames === "string" &&
            rawTestNames.includes(",")
          ) {
            testNames = rawTestNames.split(",").map((name) => name.trim());
          }
          // Case 4: Single test name as string
          else if (typeof rawTestNames === "string") {
            testNames = [rawTestNames.trim()];
          }
          // Case 5: Fallback
          else {
            console.warn("Unexpected test_names format:", rawTestNames);
            testNames = [];
          }
        } catch (parseError) {
          console.error("Error processing test_names:", parseError);
          console.error("Raw data that caused error:", rawTestNames);

          // Fallback: try to handle as comma-separated string
          if (typeof rawTestNames === "string") {
            testNames = rawTestNames.split(",").map((name) => name.trim());
          } else {
            return res
              .status(500)
              .json({ error: "Invalid test names data format" });
          }
        }
        // Ensure we return an array of strings
        const cleanTestNames = testNames
          .filter((name) => name && typeof name === "string")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
        res.status(200).json(cleanTestNames);
      });
    } catch (error) {
      console.error("Error fetching test names by standard:", error);
      res.status(500).json({ error: "Failed to fetch test names by standard" });
    }
  });

  // API to get all standard-test mappings
  app.get("/api/getAllEMIStandardTestMappings", (req, res) => {
    try {
      const query = `
        SELECT id, standard, test_names, created_at, updated_at, created_by, updated_by
        FROM emi_test_standard_mapping_table 
        WHERE is_active = TRUE
        ORDER BY standard ASC
      `;

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching standard-test mappings:", error);
          return res.status(500).json({ error: "Failed to fetch mappings" });
        }

        // Parse JSON data and format response
        const mappings = results.map((row) => ({
          id: row.id,
          standard: row.standard,
          //   test_names: JSON.parse(row.test_names),
          test_names: row.test_names,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
          updated_by: row.updated_by,
        }));

        res.status(200).json(mappings);
      });
    } catch (error) {
      console.error("Error fetching standard-test mappings:", error);
      res.status(500).json({ error: "Failed to fetch mappings" });
    }
  });

  // API to add or update standard-test mapping
  app.post("/api/addOrUpdateEMIStandardTestMapping", (req, res) => {
    const { standard, test_names, created_by, updated_by } = req.body;

    if (!standard || !Array.isArray(test_names) || test_names.length === 0) {
      return res
        .status(400)
        .json({ error: "Standard and test names array are required" });
    }

    try {
      // Check if mapping already exists
      const checkQuery = `
        SELECT id FROM emi_test_standard_mapping_table 
        WHERE standard = ? AND is_active = TRUE
      `;

      db.query(checkQuery, [standard], (checkError, checkResults) => {
        if (checkError) {
          console.error("Error checking existing mapping:", checkError);
          return res
            .status(500)
            .json({ error: "Failed to check existing mapping" });
        }

        if (checkResults.length > 0) {
          // Update existing mapping
          const updateQuery = `
            UPDATE emi_test_standard_mapping_table 
            SET test_names = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE id = ?
          `;

          db.query(
            updateQuery,
            [JSON.stringify(test_names), updated_by, checkResults[0].id],
            (updateError) => {
              if (updateError) {
                console.error("Error updating mapping:", updateError);
                return res
                  .status(500)
                  .json({ error: "Failed to update mapping" });
              }

              res.status(200).json({ message: "Mapping updated successfully" });
            }
          );
        } else {
          // Insert new mapping
          const insertQuery = `
            INSERT INTO emi_test_standard_mapping_table (standard, test_names, created_by) 
            VALUES (?, ?, ?)
          `;

          db.query(
            insertQuery,
            [standard, JSON.stringify(test_names), created_by],
            (insertError, insertResults) => {
              if (insertError) {
                console.error("Error adding mapping:", insertError);
                return res.status(500).json({ error: "Failed to add mapping" });
              }

              res.status(200).json({
                message: "Mapping added successfully",
                id: insertResults.insertId,
              });
            }
          );
        }
      });
    } catch (error) {
      console.error("Error processing mapping:", error);
      res.status(500).json({ error: "Failed to process mapping" });
    }
  });

  // API to delete standard-test mapping
  app.delete("/api/deleteEMIStandardTestMapping/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `
        UPDATE emi_test_standard_mapping_table 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting mapping:", error);
          return res.status(500).json({ error: "Failed to delete mapping" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Mapping not found" });
        }

        res.status(200).json({ message: "Mapping deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting mapping:", error);
      res.status(500).json({ error: "Failed to delete mapping" });
    }
  });

  // API to get standards by test name (reverse lookup)
  app.get("/api/getEMIStandardsByTestName/:testName", (req, res) => {
    const { testName } = req.params;

    try {
      const query = `
        SELECT standard, test_names 
        FROM emi_test_standard_mapping_table 
        WHERE JSON_SEARCH(test_names, 'one', ?) IS NOT NULL
        AND is_active = TRUE
      `;

      db.query(query, [testName], (error, results) => {
        if (error) {
          console.error("Error fetching standards by test name:", error);
          return res
            .status(500)
            .json({ error: "Failed to fetch standards by test name" });
        }

        const standards = results.map((row) => ({
          standard: row.standard,
          all_test_names: JSON.parse(row.test_names),
        }));

        res.status(200).json(standards);
      });
    } catch (error) {
      console.error("Error fetching standards by test name:", error);
      res.status(500).json({ error: "Failed to fetch standards by test name" });
    }
  });

  // API to add test name to existing standard
  app.post("/api/addTestNameToStandard", (req, res) => {
    const { standard, testName, updated_by } = req.body;

    if (!standard || !testName) {
      return res
        .status(400)
        .json({ error: "Standard and test name are required" });
    }

    try {
      const selectQuery = `
        SELECT id, test_names 
        FROM emi_test_standard_mapping_table 
        WHERE standard = ? AND is_active = TRUE
      `;

      db.query(selectQuery, [standard], (selectError, selectResults) => {
        if (selectError) {
          console.error("Error fetching standard mapping:", selectError);
          return res
            .status(500)
            .json({ error: "Failed to fetch standard mapping" });
        }

        if (selectResults.length === 0) {
          return res.status(404).json({ error: "Standard not found" });
        }

        const currentTestNames = JSON.parse(selectResults[0].test_names);

        // Check if test name already exists
        if (currentTestNames.includes(testName)) {
          return res
            .status(400)
            .json({ error: "Test name already exists for this standard" });
        }

        // Add new test name
        const updatedTestNames = [...currentTestNames, testName];

        const updateQuery = `
          UPDATE emi_test_standard_mapping_table 
          SET test_names = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
          WHERE id = ?
        `;

        db.query(
          updateQuery,
          [JSON.stringify(updatedTestNames), updated_by, selectResults[0].id],
          (updateError) => {
            if (updateError) {
              console.error("Error updating test names:", updateError);
              return res
                .status(500)
                .json({ error: "Failed to update test names" });
            }

            res.status(200).json({ message: "Test name added successfully" });
          }
        );
      });
    } catch (error) {
      console.error("Error adding test name to standard:", error);
      res.status(500).json({ error: "Failed to add test name to standard" });
    }
  });

  // API to remove test name from standard
  app.delete("/api/removeTestNameFromStandard", (req, res) => {
    const { standard, testName, updated_by } = req.body;

    if (!standard || !testName) {
      return res
        .status(400)
        .json({ error: "Standard and test name are required" });
    }

    try {
      const selectQuery = `
        SELECT id, test_names 
        FROM emi_test_standard_mapping_table 
        WHERE standard = ? AND is_active = TRUE
      `;

      db.query(selectQuery, [standard], (selectError, selectResults) => {
        if (selectError) {
          console.error("Error fetching standard mapping:", selectError);
          return res
            .status(500)
            .json({ error: "Failed to fetch standard mapping" });
        }

        if (selectResults.length === 0) {
          return res.status(404).json({ error: "Standard not found" });
        }

        const currentTestNames = JSON.parse(selectResults[0].test_names);

        // Check if test name exists
        if (!currentTestNames.includes(testName)) {
          return res
            .status(400)
            .json({ error: "Test name not found for this standard" });
        }

        // Remove test name
        const updatedTestNames = currentTestNames.filter(
          (name) => name !== testName
        );

        const updateQuery = `
          UPDATE emi_test_standard_mapping_table 
          SET test_names = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
          WHERE id = ?
        `;

        db.query(
          updateQuery,
          [JSON.stringify(updatedTestNames), updated_by, selectResults[0].id],
          (updateError) => {
            if (updateError) {
              console.error("Error updating test names:", updateError);
              return res
                .status(500)
                .json({ error: "Failed to update test names" });
            }

            res.status(200).json({ message: "Test name removed successfully" });
          }
        );
      });
    } catch (error) {
      console.error("Error removing test name from standard:", error);
      res
        .status(500)
        .json({ error: "Failed to remove test name from standard" });
    }
  });

  // API to search EMI test names
  app.get("/api/searchEMITestNames", (req, res) => {
    const { q } = req.query; // search query parameter

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    try {
      const query = `
        SELECT * FROM emi_test_names_table 
        WHERE test_name LIKE ? 
        ORDER BY test_name ASC
      `;

      db.query(query, [`%${q}%`], (error, results) => {
        if (error) {
          console.error("Error searching EMI test names:", error);
          return res
            .status(500)
            .json({ error: "Failed to search EMI test names" });
        }

        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error searching EMI test names:", error);
      res.status(500).json({ error: "Failed to search EMI test names" });
    }
  });

  // API to search EMI standards
  app.get("/api/searchEMIStandards", (req, res) => {
    const { q } = req.query; // search query parameter

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    try {
      const query = `
        SELECT * FROM emi_test_standards_table 
        WHERE standard_name LIKE ? 
        ORDER BY standard_name ASC
      `;

      db.query(query, [`%${q}%`], (error, results) => {
        if (error) {
          console.error("Error searching EMI standards:", error);
          return res
            .status(500)
            .json({ error: "Failed to search EMI standards" });
        }

        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error searching EMI standards:", error);
      res.status(500).json({ error: "Failed to search EMI standards" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////
  // BULK OPERATIONS

  // API to bulk insert EMI test names
  app.post("/api/bulkAddEMITestNames", (req, res) => {
    const { testNames } = req.body;

    if (!testNames || !Array.isArray(testNames) || testNames.length === 0) {
      return res.status(400).json({ error: "Test names array is required" });
    }

    try {
      const query = `INSERT INTO emi_test_names_table (test_name) VALUES ?`;
      const values = testNames
        .map((name) => [name.trim()])
        .filter((name) => name[0] !== "");

      if (values.length === 0) {
        return res.status(400).json({ error: "No valid test names provided" });
      }

      db.query(query, [values], (error, results) => {
        if (error) {
          console.error("Error bulk adding EMI test names:", error);
          return res
            .status(500)
            .json({ error: "Failed to bulk add EMI test names" });
        }

        res.status(200).json({
          message: `${results.affectedRows} EMI test names added successfully`,
          insertedCount: results.affectedRows,
        });
      });
    } catch (error) {
      console.error("Error bulk adding EMI test names:", error);
      res.status(500).json({ error: "Failed to bulk add EMI test names" });
    }
  });

  // API to bulk insert EMI standards
  app.post("/api/bulkAddEMIStandards", (req, res) => {
    const { standards } = req.body;

    if (!standards || !Array.isArray(standards) || standards.length === 0) {
      return res.status(400).json({ error: "Standards array is required" });
    }

    try {
      const query = `INSERT INTO emi_test_standards_table (standard_name) VALUES ?`;
      const values = standards
        .map((name) => [name.trim()])
        .filter((name) => name[0] !== "");

      if (values.length === 0) {
        return res.status(400).json({ error: "No valid standards provided" });
      }

      db.query(query, [values], (error, results) => {
        if (error) {
          console.error("Error bulk adding EMI standards:", error);
          return res
            .status(500)
            .json({ error: "Failed to bulk add EMI standards" });
        }

        res.status(200).json({
          message: `${results.affectedRows} EMI standards added successfully`,
          insertedCount: results.affectedRows,
        });
      });
    } catch (error) {
      console.error("Error bulk adding EMI standards:", error);
      res.status(500).json({ error: "Failed to bulk add EMI standards" });
    }
  });

  // API to get statistics
  app.get("/api/getEMITestNamesAndStandardsStats", (req, res) => {
    try {
      const testNamesCountQuery =
        "SELECT COUNT(*) as count FROM emi_test_names_table";
      const standardsCountQuery =
        "SELECT COUNT(*) as count FROM emi_test_standards_table";

      db.query(testNamesCountQuery, (error1, testNamesResult) => {
        if (error1) {
          console.error("Error getting test names count:", error1);
          return res.status(500).json({ error: "Failed to get statistics" });
        }

        db.query(standardsCountQuery, (error2, standardsResult) => {
          if (error2) {
            console.error("Error getting standards count:", error2);
            return res.status(500).json({ error: "Failed to get statistics" });
          }

          res.status(200).json({
            testNamesCount: testNamesResult[0].count,
            standardsCount: standardsResult[0].count,
            totalItems: testNamesResult[0].count + standardsResult[0].count,
          });
        });
      });
    } catch (error) {
      console.error("Error getting statistics:", error);
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });
}

module.exports = { emiTestNamesAndStandardsAPIs };
