const { db } = require("./db");

//Generate unique project ID:
const generateUniqueProjectId = (department, company) => {
  const departmentCode = department.slice(0, 3).toUpperCase();
  const companyCode = company.slice(0, 3).toUpperCase();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;
  let uniqueId = `${departmentCode}-${companyCode}-${formattedDate}`;
  console.log("Generated Project ID:", uniqueId);
  return uniqueId;
};

generateUniqueProjectId("Software", "TechCorp"); // Example usage
generateUniqueProjectId("Reliability", "Ametek"); // Example usage

function projectManagementAPIs(app, io, labbeeUsers) {
  /// API to create the new project:
  app.post("/api/createProject", (req, res) => {
    const {
      project_name,
      department,
      project_manager,
      project_start_date,
      total_tasks_count,
      pending_tasks_count,
      in_progress_tasks_count,
      completed_tasks_count,
      project_end_date,
      project_status,
      remarks,
      last_updated_by,
    } = req.body;

    try {
      const sqlQuery = `INSERT INTO projects_table(project_id, department, project_name,  project_manager, project_start_date, total_tasks_count, pending_tasks_count, in_progress_tasks_count, 
      completed_tasks_count, project_end_date, project_status, remarks, last_updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const values = [
        project_name,
        department,
        project_manager,
        project_start_date,
        total_tasks_count,
        pending_tasks_count,
        in_progress_tasks_count,
        completed_tasks_count,
        project_end_date,
        project_status,
        remarks,
        last_updated_by,
      ];

      db.query(sqlQuery, values, (error, result) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Error creating project" });
        } else {
          return res
            .status(200)
            .json({ message: "Project created successfully" });
        }
      });
    } catch (error) {
      console.error("Error creating project:", error);
      return res.status(500).json({ message: "Error creating project" });
    }
  });

  ///API to fetch all the projects:
  app.get("/api/getProjects", (req, res) => {
    const sqlQuery = `
    SELECT 
      t.id AS project_id,
      t.project_name,
      t.department,
      t.project_manager,
      u1.name AS project_manager_name, -- Fetch the username for assigned_to
      t.project_start_date,
      t.total_tasks_count,
      t.pending_tasks_count,
      t.in_progress_tasks_count,
      t.completed_tasks_count,
      t.project_end_date,
      t.project_status,
      t.remarks,
      t.last_updated_by,
      u2.name AS last_updated_by_name -- Fetch the username for last_updated_by
    FROM 
      projects_table t
    LEFT JOIN 
      labbee_users u1
    ON 
      t.project_manager = u1.id -- Match project_manager with user ID in labbee_users
    LEFT JOIN 
      labbee_users u2
    ON 
      t.last_updated_by = u2.id -- Match last_updated_by with user ID in labbee_users
  `;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching projects" });
      } else {
        // console.log("Projects fetched successfully");
        return res.status(200).json(result);
      }
    });
  });

  //API to fetch the selected task data:
  app.get("/api/getProjectData/:id", (req, res) => {
    const { id } = req.params;
    try {
      const sqlQuery = "SELECT * FROM projects_table WHERE id = ?";

      db.query(sqlQuery, [id], (error, result) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "An error occurred while fetching data" });
        }
        //Return single object instead of an array:
        if (result.length > 0) {
          res.status(200).json(result[0]);
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      });
    } catch (error) {
      console.error(
        `Error While fetching the project data of ${id} project:`,
        error
      );
    }
  });

  //API to update the project:
  app.put("/api/updateProject/:id", (req, res) => {
    const { id } = req.params;
    const {
      project_name,
      department,
      project_manager,
      project_start_date,
      total_tasks_count,
      pending_tasks_count,
      in_progress_tasks_count,
      completed_tasks_count,
      project_end_date,
      project_status,
      remarks,
      last_updated_by,
    } = req.body;

    try {
      const sqlQuery = `
      UPDATE projects_table
      SET
        project_name = ?,
        department = ?,
        project_manager = ?,
        project_start_date = ?,
        total_tasks_count = ?,
        pending_tasks_count = ?,
        in_progress_tasks_count = ?,
        completed_tasks_count = ?,
        project_end_date = ?,
        project_status = ?,
        remarks = ?,
        last_updated_by = ?
      WHERE
        id = ?
    `;

      const values = [
        project_name,
        department,
        project_manager,
        project_start_date,
        total_tasks_count,
        pending_tasks_count,
        in_progress_tasks_count,
        completed_tasks_count,
        project_end_date,
        project_status,
        remarks,
        last_updated_by,
        id,
      ];

      db.query(sqlQuery, values, (error, result) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Error updating project" });
        } else {
          return res
            .status(200)
            .json({ message: "Project updated successfully" });
        }
      });
    } catch (error) {
      console.error("Error updating project:", error);
      return res.status(500).json({ message: "Error updating project" });
    }
  });

  /////////////////////////////////////////////////////////////////
  //API to save the task to 'project_tasks_table'
  app.post("/api/saveNewTask", async (req, res) => {
    const {
      title,
      description,
      assigned_to,
      story_points,
      estimated_hours,
      actual_hours,
      task_assigned_date,
      task_due_date,
      task_completed_date,
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
      !last_updated_by ||
      !task_assigned_date
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const sqlQuery = `
        INSERT INTO project_tasks_table(title, description, assigned_to, story_points,
        estimated_hours, actual_hours, task_assigned_date, task_due_date, task_completed_date, priority, status, sprint_id, last_updated_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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

        task_assigned_date,
        task_due_date,
        task_completed_date,
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
      task_assigned_date,
      task_due_date,
      task_completed_date,
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
      SET title = ?, description = ?, assigned_to = ?, story_points = ?, estimated_hours = ?, actual_hours = ?, 
      task_assigned_date = ?, task_due_date = ?, task_completed_date = ?, priority = ?, status = ?, last_updated_by = ?
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
      task_assigned_date,
      task_due_date,
      task_completed_date,
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

  //API to fetch the selected task data:
  app.get("/api/getTaskData/:id", (req, res) => {
    const { id } = req.params;
    try {
      const sqlQuery = "SELECT * FROM project_tasks_table WHERE id = ?";

      //     const sqlQuery = `
      //   SELECT
      //     t.title,
      //     t.description,
      //     t.assigned_to,
      //     u1.name AS assigned_to_name, -- Fetch the username for assigned_to
      //     t.story_points,
      //     t.estimated_hours,
      //     t.actual_hours,
      //     t.task_assigned_date,
      //     t.task_due_date,
      //     t.task_completed_date,
      //     t.priority,
      //     t.status,
      //     t.last_updated_by,
      //     u2.name AS last_updated_by_name -- Fetch the username for last_updated_by
      //   FROM
      //     project_tasks_table t
      //   LEFT JOIN
      //     labbee_users u1
      //   ON
      //     t.assigned_to = u1.id -- Match assigned_to with user ID in labbee_users
      //   LEFT JOIN
      //     labbee_users u2
      //   ON
      //     t.last_updated_by = u2.id -- Match last_updated_by with user ID in labbee_users
      //     WHERE t.id = ?
      // `;

      db.query(sqlQuery, [id], (error, result) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "An error occurred while fetching data" });
        }
        //Return single object instead of an array:
        if (result.length > 0) {
          res.status(200).json(result[0]);
        } else {
          res.status(404).json({ message: "Task not found" });
        }
      });
    } catch (error) {
      console.error(`Error While fetching the task data of ${id} task:`, error);
    }
  });

  //API to delete the task:
  app.delete("/api/deleteTask/:id", (req, res) => {
    const { id } = req.params;
    try {
      const sqlQuery = "DELETE FROM project_tasks_table WHERE id = ?";
      db.query(sqlQuery, [id], (error, result) => {
        if (error) {
          console.error("Error deleting task:", error);
          return res
            .status(500)
            .json({ message: "Internal server error while deleting the task" });
        } else {
          res.status(200).json({ message: "Task deleted successfully" });
        }
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
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
      t.task_assigned_date,
      t.task_due_date,
      t.task_completed_date,
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

  ///API to patch the task to the sprints:
  app.post("/api/tasks/:id/move-to-sprint", async (req, res) => {
    const { id } = req.params;
    const { sprint_id } = req.body;

    if (!sprint_id) {
      return res.status(400).json({ message: "Sprint ID is required." });
    }

    const sql = `UPDATE project_tasks_table SET sprint_id = ? WHERE id = ?`;

    db.query(sql, [sprint_id, id], (err, result) => {
      if (err) {
        console.error("Error updating sprint_id:", err);
        return res.status(500).json({ message: "Failed to update task." });
      }
      return res
        .status(200)
        .json({ message: "Task moved to sprint successfully." });
    });
  });

  app.post("/api/createSprint", (req, res) => {
    const { sprint_number, goal, start_date, end_date } = req.body;

    if (!sprint_number || !goal || !start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "All sprint fields are required" });
    }

    const sql = `
    INSERT INTO project_sprints_table (sprint_number, goal, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `;

    db.query(
      sql,
      [sprint_number, goal, start_date, end_date],
      (err, result) => {
        if (err) {
          console.error("Error creating sprint:", err);
          return res.status(500).json({ message: "Failed to create sprint" });
        }
        res
          .status(200)
          .json({ message: "Sprint created", sprint_id: result.insertId });
      }
    );
  });

  //Api to get all sprints:
  app.get("/api/getAllSprints", (req, res) => {
    const sqlQuery = "SELECT * FROM project_sprints_table";
    db.query(sqlQuery, (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.send(result);
    });
  });

  //API to fetch the tasks and display it in the Kanban board:
  app.get("/api/tasks/by-sprint/:sprintId", (req, res) => {
    const { sprintId } = req.params;
    const sql = `SELECT * FROM project_tasks_table WHERE sprint_id = ?`;

    db.query(sql, [sprintId], (err, result) => {
      if (err) {
        console.error("Error fetching tasks by sprint:", err);
        return res.status(500).json({ message: "Failed to fetch tasks" });
      }
      res.status(200).json(result);
    });
  });

  //API to update the project status from the drag and drop kanban board:
  app.post("/api/updateTaskStatus", (req, res) => {
    const { task_id, status } = req.body;

    if (!task_id || !status) {
      return res
        .status(400)
        .json({ message: "Task ID and status are required" });
    }

    const sql = `UPDATE project_tasks_table SET status = ? WHERE id = ?`;
    db.query(sql, [status, task_id], (err, result) => {
      if (err) {
        console.error("Error updating task status:", err);
        return res
          .status(500)
          .json({ message: "Failed to update task status" });
      }
      res.status(200).json({ message: "Task status updated successfully" });
    });
  });
}

module.exports = { projectManagementAPIs };
