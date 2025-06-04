const { db } = require("./db");
const express = require("express");

// API's to add, update and delete tests and chambers
function TestsAndChambersUpdateAPIs(app, io, labbeeUsers) {
  //API to add test category:
  app.post("/api/addTestCategory", (req, res) => {
    const { testCategory } = req.body;

    try {
      const query = `INSERT INTO test_category_table (test_category) VALUES (?)`;
      db.query(query, [testCategory], (error, results) => {
        if (error) {
          console.error("Error adding test category:", error);
          return res.status(500).json({ error: "Failed to add test category" });
        }
        // Send a success response
        res.status(200).json({
          message: "Test category added successfully",
          id: results.insertId,
        });
      });
    } catch (error) {
      console.error("Error adding test category:".error);
      res.status(500).json({ error: "Failed to add test category" });
    }
  });

  app.put("/api/updateTestCategory/:id", (req, res) => {
    const { id } = req.params;
    const { testCategory } = req.body;

    try {
      const query = `UPDATE test_category_table SET test_category = ? WHERE id = ?`;
      db.query(query, [testCategory, id], (error, results) => {
        if (error) {
          console.error("Error updating test category:", error);
          return res
            .status(500)
            .json({ error: "Failed to update test category" });
        }
        // Send a success response
        res.status(200).json({ message: "Test category updated successfully" });
      });
    } catch (error) {
      console.error("Error updating test category:", error);
      res.status(500).json({ error: "Failed to update test category" });
    }
  });

  // API to delete test category:
  app.delete("/api/deleteTestCategory/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `DELETE FROM test_category_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleteing test category:", error);
          return res
            .status(500)
            .json({ error: "Failed to delete test category" });
        }
        // Send a success response
        res.status(200).json({ message: "Test category deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleteing test category:", error);
      res.status(500).json({ error: "Failed to delete test category" });
    }
  });

  // API to get all test categories
  app.get("/api/getAllTestCategories", (req, res) => {
    try {
      const query = "SELECT * FROM test_category_table";

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching test categories:", error);
          return res
            .status(500)
            .json({ error: "Failed to fetch test categories" });
        }
        // Send the results as a JSON response
        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching test categories:", error);
      res.status(500).json({ error: "Failed to fetch test categories" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // API's to add, update and delete the test:
  // API to add test:
  app.post("/api/addTestName", (req, res) => {
    const { testName } = req.body;

    try {
      const query = `INSERT INTO test_names_table (test_name) VALUES (?)`;
      db.query(query, [testName], (error, results) => {
        if (error) {
          console.error("Error adding test name:", error);
          return res.status(500).json({ error: "Failed to add test name" });
        }
        // Send a success response
        res.status(200).json({
          message: "Test name added successfully",
          id: results.insertId,
        });
      });
    } catch (error) {
      console.error("Error adding test:", error);
      res.status(500).json({ error: "Failed to add test" });
    }
  });

  /// API to update test:
  app.put("/api/updateTestName/:id", (req, res) => {
    const { id } = req.params;
    const { testName } = req.body;

    try {
      const query = `UPDATE test_names_table SET test_name = ? WHERE id = ?`;
      db.query(query, [testName, id], (error, results) => {
        if (error) {
          console.error("Error updating test name:", error);
          return res.status(500).json({ error: "Failed to update test name" });
        }
        // Send a success response
        res.status(200).json({ message: "Test name updated successfully" });
      });
    } catch (error) {
      console.error("Error updating test name:", error);
      res.status(500).json({ error: "Failed to update test name" });
    }
  });

  // API to delete test:
  app.delete("/api/deleteTest/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `DELETE FROM test_names_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting test name:", error);
          return res.status(500).json({ error: "Failed to delete test name" });
        }
        // Send a success response
        res.status(200).json({ message: "Test name deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting test name:", error);
      res.status(500).json({ error: "Failed to delete test name" });
    }
  });

  /// API to get all test names:
  app.get("/api/getAllTestNames", (req, res) => {
    try {
      const query = "SELECT * FROM test_names_table";

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching test names:", error);
          return res.status(500).json({ error: "Failed to fetch test names" });
        }
        // Send the results as a JSON response
        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching test names:", error);
      res.status(500).json({ error: "Failed to fetch test names" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // API's to add, update and delete the chamber:
  // API to add chamber:
  app.post("/api/addChamber", (req, res) => {
    const { chamber } = req.body;

    try {
      const query = `INSERT INTO chambers_list_table (chamber_name) VALUES (?)`;
      db.query(query, [chamber], (error, results) => {
        if (error) {
          console.error("Error adding chamber:", error);
          return res.status(500).json({ error: "Failed to add chamber" });
        }
        // Send a success response
        res.status(200).json({
          message: "Chamber added successfully",
          id: results.insertId,
        });
      });
    } catch (error) {
      console.error("Error adding chamber:", error);
      res.status(500).json({ error: "Failed to add chamber" });
    }
  });

  // API to update chamber:
  app.put("/api/updateChamber/:id", (req, res) => {
    const { id } = req.params;
    const { chamber } = req.body;

    try {
      const query = `UPDATE chambers_list_table SET chamber_name = ? WHERE id = ?`;
      db.query(query, [chamber, id], (error, results) => {
        if (error) {
          console.error("Error updating chamber:", error);
          return res.status(500).json({ error: "Failed to update chamber" });
        }
        // Send a success response
        res.status(200).json({ message: "Chamber updated successfully" });
      });
    } catch (error) {
      console.error("Error updating chamber:", error);
      res.status(500).json({ error: "Failed to update chamber" });
    }
  });

  // API to delete chamber:
  app.delete("/api/deleteChamber/:id", (req, res) => {
    const { id } = req.params;

    try {
      const query = `DELETE FROM chambers_list_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting chamber:", error);
          return res.status(500).json({ error: "Failed to delete chamber" });
        }
        // Send a success response
        res.status(200).json({ message: "Chamber deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting chamber:", error);
      res.status(500).json({ error: "Failed to delete chamber" });
    }
  });

  // API to get all chambers:
  app.get("/api/getAllChambers", (req, res) => {
    try {
      const query = "SELECT * FROM chambers_list_table";

      db.query(query, (error, results) => {
        if (error) {
          console.error("Error fetching chambers:", error);
          return res.status(500).json({ error: "Failed to fetch chambers" });
        }
        // Send the results as a JSON response
        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching chambers:", error);
      res.status(500).json({ error: "Failed to fetch chambers" });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // API to map test name and test chamber to test category:
  app.post("/api/mapTestNameAndChamber", (req, res) => {
    const { testType, testNamesAndChambers } = req.body;

    console.log(
      "input data for mapping test name and chamber:",
      testType,
      testNamesAndChambers
    );
    try {
      const query = `INSERT INTO test_and_chamber_mapping_table (test_category, mapped_testname_and_chamber) VALUES (?, ?)`;
      db.query(
        query,
        [testType, JSON.stringify(testNamesAndChambers)],
        (error, results) => {
          if (error) {
            console.error("Error mapping test name and chamber:", error);
            return res
              .status(500)
              .json({ error: "Failed to map test name and chamber" });
          }
          // Send a success response
          res
            .status(200)
            .json({ message: "Test name and chamber mapped successfully" });
        }
      );
    } catch (error) {
      console.error("Error mapping test name and chamber:", error);
      res.status(500).json({ error: "Failed to map test name and chamber" });
    }
  });

  ///API to fetch all mapped test names and chambers data:
  app.get("/api/getAllMappedTestNamesAndChambers", (req, res) => {
    try {
      const query = "SELECT * FROM test_and_chamber_mapping_table";

      db.query(query, (error, results) => {
        if (error) {
          console.error(
            "Error fetching mapped test names and chambers:",
            error
          );
          return res
            .status(500)
            .json({ error: "Failed to fetch mapped test names and chambers" });
        }
        // Send the results as a JSON response
        res.status(200).json(results);
      });
    } catch (error) {
      console.error("Error fetching mapped test names and chambers:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch mapped test names and chambers" });
    }
  });

  // Add to your API file
  app.put("/api/updateMappedTestAndChamber/:id", (req, res) => {
    // Implementation for updating existing mapping
    const { id } = req.params;
    const { testType, testNamesAndChambers } = req.body;

    try {
      const query = `UPDATE test_and_chamber_mapping_table SET test_category = ?, mapped_testname_and_chamber = ? WHERE id = ?`;
      db.query(
        query,
        [testType, JSON.stringify(testNamesAndChambers), id],
        (error, results) => {
          if (error) {
            console.error("Error updating mapped test and chamber:", error);
            return res
              .status(500)
              .json({ error: "Failed to update mapped test and chamber" });
          }
          // Send a success response
          res
            .status(200)
            .json({ message: "Mapped test and chamber updated successfully" });
        }
      );
    } catch (error) {
      console.error("Error updating mapped test and chamber:", error);
      res
        .status(500)
        .json({ error: "Failed to update mapped test and chamber" });
    }
  });

  app.delete("/api/deleteMappedTestAndChamber/:id", (req, res) => {
    // Implementation for deleting mapping
    const { id } = req.params;
    try {
      const query = `DELETE FROM test_and_chamber_mapping_table WHERE id = ?`;
      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting mapped test and chamber:", error);
          return res
            .status(500)
            .json({ error: "Failed to delete mapped test and chamber" });
        }
        // Send a success response
        res
          .status(200)
          .json({ message: "Mapped test and chamber deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting mapped test and chamber:", error);
      res
        .status(500)
        .json({ error: "Failed to delete mapped test and chamber" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////
}

module.exports = { TestsAndChambersUpdateAPIs };
