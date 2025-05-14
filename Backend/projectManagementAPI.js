const { db } = require("./db");

function projectManagementAPIs(app, io, labbeeUsers) {
  //API to save the task to 'project_tasks_table'
  app.post("/api/saveNewTask", async (req, res) => {
    const {
      title,
      description,
      assigned_to,
      story_points,
      estimated_hours,
      actual_hours,
      priority,
      status,
      last_updated_by,
    } = req.body;

    if (
      !title ||
      !description ||
      !assigned_to ||
      !story_points ||
      !estimated_hours ||
      !priority ||
      !status ||
      !last_updated_by
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const sqlQuery = `
        INSERT INTO project_tasks_table(title, description, assigned_to, story_points,
        estimated_hours, actual_hours, priority, status, sprint_id, last_updated_by)
        VALUES(?,?,?,?,?,?,?,?,?,?)`;

      let sprint_id = null;

      const values = [
        title,
        description,
        assigned_to,
        story_points,
        estimated_hours === "" || estimated_hours === undefined
          ? null
          : estimated_hours,
        actual_hours === "" || actual_hours === undefined ? null : actual_hours,
        priority,
        status,
        sprint_id || null,
        last_updated_by,
      ];

      db.query(sqlQuery, values, (error, result) => {
        if (error) {
          console.log(error);
          return res
            .status(500)
            .json({ message: "Internal server error while saving the task" });
        } else {
          res.status(200).json({
            message: "Task added successfully",
            task_id: result.insertId,
          });
        }
      });
    } catch (error) {
      console.log("Error occurred while saving the task", error);
    }
  });

  //API to update the task in 'project_tasks_table':
  app.put("/api/updateTask/:id", (req, res) => {
    const { id } = req.params;

    const {
      title,
      description,
      assigned_to,
      story_points,
      estimated_hours,
      actual_hours,
      priority,
      status,
      last_updated_by,
    } = req.body;

    if (
      !title ||
      !description ||
      !assigned_to ||
      !story_points ||
      !estimated_hours ||
      !priority ||
      !status ||
      !last_updated_by
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sqlQuery = `
      UPDATE project_tasks_table
      SET title = ?, description = ?, assigned_to = ?, story_points = ?, estimated_hours = ?, actual_hours = ?, priority = ?, status = ?, last_updated_by = ?
      WHERE id = ?
    `;

    const values = [
      title,
      description,
      assigned_to,
      story_points,
      estimated_hours === "" || estimated_hours === undefined
        ? null
        : estimated_hours,
      actual_hours === "" || actual_hours === undefined ? null : actual_hours,
      priority,
      status,
      last_updated_by,
      id,
    ];

    db.query(sqlQuery, values, (error, result) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Internal server error while updating the task" });
      } else {
        res.status(200).json({ message: "Task updated successfully" });
      }
    });
  });

  //API to fetch all the tasks from 'project_tasks_table'
  //   app.get("/api/getAllTasks", (req, res) => {
  //     const sqlQuery = "SELECT * FROM project_tasks_table";

  //     db.query(sqlQuery, (error, result) => {
  //       if (error) {
  //         return res
  //           .status(500)
  //           .json({ error: "An error occurred while fetching data" });
  //       }
  //       res.send(result);
  //     });
  //   });

  app.get("/api/getAllTasks", (req, res) => {
    const sqlQuery = `
    SELECT 
      t.id AS task_id,
      t.title,
      t.description,
      t.assigned_to,
      u1.name AS assigned_to_name, -- Fetch the username for assigned_to
      t.story_points,
      t.estimated_hours,
      t.actual_hours,
      t.priority,
      t.status,
      t.last_updated_by,
      u2.name AS last_updated_by_name -- Fetch the username for last_updated_by
    FROM 
      project_tasks_table t
    LEFT JOIN 
      labbee_users u1
    ON 
      t.assigned_to = u1.id -- Match assigned_to with user ID in labbee_users
    LEFT JOIN 
      labbee_users u2
    ON 
      t.last_updated_by = u2.id -- Match last_updated_by with user ID in labbee_users
  `;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });
}

module.exports = { projectManagementAPIs };
