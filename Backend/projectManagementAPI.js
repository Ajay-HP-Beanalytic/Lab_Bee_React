const { db } = require("./db");
const { v4: uuidv4 } = require("uuid");

//Generate unique project ID:
const generateUniqueProjectId = (department, company, dbId) => {
  const departmentCode = department.slice(0, 3).toUpperCase();
  const companyCode = company.slice(0, 3).toUpperCase();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;
  let uniqueId = `${departmentCode}-${companyCode}-${formattedDate}-${dbId}`;
  return uniqueId;
};

//Generate unique task ID:
const generateUniqueTaskID = () => {
  const taskPrefix = "TASK";
  const datetime = new Date();
  const timeStamp = datetime.getTime(); // Get the current timestamp in milliseconds
  const uniqueTaskId = `${taskPrefix}-${timeStamp}`;
  return uniqueTaskId;
};

function projectManagementAPIs(app, io, labbeeUsers) {
  /// API to create the new project:
  app.post("/api/createProject", (req, res) => {
    const {
      po_number,
      department,
      company_name,
      project_name,
      project_manager,
      project_start_date,
      allocated_hours,
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
      const sqlQuery = `INSERT INTO projects_table(po_number,department, company_name, project_name,  project_manager, project_start_date, allocated_hours, total_tasks_count, pending_tasks_count, in_progress_tasks_count, 
      completed_tasks_count, project_end_date, project_status, remarks, last_updated_by) VALUES(?, ?,?,?,?,?,?,?,?,?,?,?,?,?, ?)`;

      const values = [
        po_number,
        department,
        company_name,
        project_name,
        project_manager,
        project_start_date,
        parseInt(allocated_hours || 0),
        parseInt(total_tasks_count || 0),
        parseInt(pending_tasks_count || 0),
        parseInt(in_progress_tasks_count || 0),
        parseInt(completed_tasks_count || 0),
        project_end_date,
        project_status,
        remarks,
        last_updated_by,
      ];

      db.query(sqlQuery, values, (error, result) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Error creating project" });
        }

        //Get the auto-incremented ID of the newly created project
        const dbId = result.insertId; //The auto-incremented ID

        // Now generate the unique project_id
        const project_id = generateUniqueProjectId(
          department,
          company_name,
          dbId
        );

        // Update the row with the generated project_id
        const updateQuery = `UPDATE projects_table SET project_id = ? WHERE id =?`;
        db.query(
          updateQuery,
          [project_id, dbId],
          (updateError, updateResult) => {
            if (updateError) {
              console.error("Error updating project_id:", updateError);
              return res
                .status(500)
                .json({ message: "Error updating project_id" });
            } else {
              return res.status(200).json({
                message: "Project created successfully",
                project_id: project_id, // Return the generated project_id
              });
            }
          }
        );
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
      t.id ,
      t.po_number,
      t.project_id AS project_id,
      t.project_name,
      t.department,
      t.project_manager,
      u1.name AS project_manager_name, -- Fetch the username for assigned_to
      t.project_start_date,
      t.allocated_hours,
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

    //   const sqlQuery = `
    //   SELECT
    //     t.id AS project_id,
    //     t.project_name,
    //     t.department,
    //     t.project_manager,
    //     u1.name AS project_manager_name, -- Fetch the username for assigned_to
    //     t.project_start_date,
    //     t.total_tasks_count,
    //     t.pending_tasks_count,
    //     t.in_progress_tasks_count,
    //     t.completed_tasks_count,
    //     t.project_end_date,
    //     t.project_status,
    //     t.remarks,
    //     t.last_updated_by,
    //     u2.name AS last_updated_by_name -- Fetch the username for last_updated_by
    //   FROM
    //     projects_table t
    //   LEFT JOIN
    //     labbee_users u1
    //   ON
    //     t.project_manager = u1.id -- Match project_manager with user ID in labbee_users
    //   LEFT JOIN
    //     labbee_users u2
    //   ON
    //     t.last_updated_by = u2.id -- Match last_updated_by with user ID in labbee_users
    // `;

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

  //API to fetch the selected project data:
  app.get("/api/getProjectData/:project_id", (req, res) => {
    const { project_id } = req.params;
    try {
      const sqlQuery = "SELECT * FROM projects_table WHERE project_id = ?";

      db.query(sqlQuery, [project_id], (error, result) => {
        if (error) {
          return res.status(500).json({
            error: "An error occurred while fetching the project data",
          });
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
  app.put("/api/updateProject/:project_id", (req, res) => {
    const { project_id } = req.params;
    const {
      po_number,
      department,
      company_name,
      project_name,
      project_manager,
      project_start_date,
      allocated_hours,
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
      po_number = ?,
      department = ?,
      company_name = ?,
        project_name = ?,
        project_manager = ?,
        project_start_date = ?,
        allocated_hours = ?,
        total_tasks_count = ?,
        pending_tasks_count = ?,
        in_progress_tasks_count = ?,
        completed_tasks_count = ?,
        project_end_date = ?,
        project_status = ?,
        remarks = ?,
        last_updated_by = ?
      WHERE
        project_id = ?
    `;

      const values = [
        po_number,
        department,
        company_name,
        project_name,
        project_manager,
        project_start_date,
        parseInt(allocated_hours || 0),
        parseInt(total_tasks_count || 0),
        parseInt(pending_tasks_count || 0),
        parseInt(in_progress_tasks_count || 0),
        parseInt(completed_tasks_count || 0),
        project_end_date,
        project_status,
        remarks,
        last_updated_by,
        project_id,
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

  //  API to get all projects for dropdown
  app.get("/api/getAllProjectsForDropdown", (req, res) => {
    db.query(
      "SELECT project_id, project_name FROM projects_table",
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error fetching projects" });
        }
        res.status(200).json(result);
      }
    );
  });

  //API to delete the project:
  app.delete("/api/deleteProject/:project_id", (req, res) => {
    const { project_id } = req.params;
    try {
      const sqlQuery = "DELETE FROM projects_table WHERE project_id = ?";
      db.query(sqlQuery, [project_id], (error, result) => {
        if (error) {
          console.error("Error deleting project:", error);
          return res
            .status(500)
            .json({
              message: "Internal server error while deleting the project",
            });
        } else {
          res.status(200).json({ message: "project deleted successfully" });
        }
      });
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  });

  /////////////////////////////////////////////////////////////////
  //API to save the task to 'project_tasks_table'
  app.post("/api/saveNewTask", async (req, res) => {
    const {
      corresponding_project_id,
      department,
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

    try {
      const sqlQuery = `
        INSERT INTO project_tasks_table(corresponding_project_id, department, title, description, assigned_to, story_points,
        estimated_hours, actual_hours, task_assigned_date, task_due_date, task_completed_date, priority, status, sprint_id, last_updated_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      let sprint_id = null;

      const values = [
        corresponding_project_id,
        department,
        title,
        description,
        assigned_to,
        story_points,
        parseInt(estimated_hours || 0),
        parseInt(actual_hours || 0),
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
        }

        const dbId = result.insertId; //The auto-incremented ID
        const taskId = generateUniqueTaskID();
        // 2. Update the row with the generated task_id
        const updateSql = `UPDATE project_tasks_table SET task_id = ? WHERE id = ?`;
        db.query(updateSql, [taskId, dbId], function (updateError) {
          if (updateError) {
            return res.status(500).json({ message: "Error updating task_id" });
          }
          return res
            .status(200)
            .json({ message: "Task created successfully", taskId });
        });
      });
    } catch (error) {
      console.log("Error occurred while saving the task", error);
    }
  });

  //API to update the task in 'project_tasks_table':
  app.put("/api/updateTask/:task_id", (req, res) => {
    const { task_id } = req.params;

    const {
      corresponding_project_id,
      department,
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

    const sqlQuery = `
      UPDATE project_tasks_table
      SET corresponding_project_id = ?, department=?,title = ?, description = ?, assigned_to = ?, story_points = ?, estimated_hours = ?, actual_hours = ?, 
      task_assigned_date = ?, task_due_date = ?, task_completed_date = ?, priority = ?, status = ?, last_updated_by = ?
      WHERE task_id = ?
    `;

    const values = [
      corresponding_project_id,
      department,
      title,
      description,
      assigned_to,
      story_points,
      parseInt(estimated_hours || 0),
      parseInt(actual_hours || 0),
      task_assigned_date,
      task_due_date,
      task_completed_date,
      priority,
      status,
      last_updated_by,
      task_id,
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
  app.get("/api/getTaskData/:task_id", (req, res) => {
    const { task_id } = req.params;
    try {
      const sqlQuery = "SELECT * FROM project_tasks_table WHERE task_id = ?";

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

      db.query(sqlQuery, [task_id], (error, result) => {
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
  app.delete("/api/deleteTask/:task_id", (req, res) => {
    const { task_id } = req.params;
    try {
      const sqlQuery = "DELETE FROM project_tasks_table WHERE task_id = ?";
      db.query(sqlQuery, [task_id], (error, result) => {
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
  app.get("/api/getAllTasks", (req, res) => {
    const sqlQuery = `
    SELECT 
    t.id,
      t.task_id AS task_id,
      t.corresponding_project_id,
      t.department,
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

  /////////////////////////////////////////////////////////////////////////////////////////////

  // API to fetch tasks assigned to a specific user
  app.get("/api/getMyTasks/:userId", (req, res) => {
    const { userId } = req.params;

    try {
      const sqlQuery = `
      SELECT 
        t.id,
        t.task_id AS task_id,
        t.corresponding_project_id,
        t.department,
        t.title,
        t.description,
        t.assigned_to,
        u1.name AS assigned_to_name,
        t.story_points,
        t.estimated_hours,
        t.actual_hours,
        t.task_assigned_date,
        t.task_due_date,
        t.task_completed_date,
        t.priority,
        t.status,
        t.last_updated_by,
        u2.name AS last_updated_by_name,
        p.project_name
      FROM 
        project_tasks_table t
      LEFT JOIN 
        labbee_users u1 ON t.assigned_to = u1.id
      LEFT JOIN 
        labbee_users u2 ON t.last_updated_by = u2.id
      LEFT JOIN 
        projects_table p ON t.corresponding_project_id = p.project_id
      WHERE 
        t.assigned_to = ?
      ORDER BY 
        CASE 
          WHEN t.status = 'In Progress' THEN 1
          WHEN t.status = 'To Do' THEN 2
          WHEN t.status = 'Blocked' THEN 3
          WHEN t.status = 'Done' THEN 4
          ELSE 5
        END,
        t.task_due_date ASC,
        CASE 
          WHEN t.priority = 'High' THEN 1
          WHEN t.priority = 'Medium' THEN 2
          WHEN t.priority = 'Low' THEN 3
          ELSE 4
        END
    `;

      db.query(sqlQuery, [userId], (error, result) => {
        if (error) {
          console.error("Error fetching user tasks:", error);
          return res.status(500).json({
            message: "Error fetching user tasks",
            error: error.message,
          });
        }

        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getMyTasks API:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  // API to get task statistics for a specific user
  app.get("/api/getMyTasksStats/:userId", (req, res) => {
    const { userId } = req.params;

    try {
      const sqlQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'To Do' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked_tasks,
        SUM(CASE WHEN task_due_date < CURDATE() AND status != 'Done' THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(story_points) as avg_story_points,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM 
        project_tasks_table 
      WHERE 
        assigned_to = ?
    `;

      db.query(sqlQuery, [userId], (error, result) => {
        if (error) {
          console.error("Error fetching user task statistics:", error);
          return res.status(500).json({
            message: "Error fetching task statistics",
            error: error.message,
          });
        }

        res.status(200).json(result[0]);
      });
    } catch (error) {
      console.error("Error in getMyTasksStats API:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////
  // APIs for project management dashboard:
  // API to get comprehensive dashboard data
  app.get("/api/getDashboardData", (req, res) => {
    try {
      // Get all necessary data in parallel
      const queries = {
        projects: `
        SELECT 
          p.*,
          u.name AS project_manager_name
        FROM projects_table p
        LEFT JOIN labbee_users u ON p.project_manager = u.id
      `,
        tasks: `
        SELECT 
          t.*,
          u1.name AS assigned_to_name,
          u2.name AS last_updated_by_name
        FROM project_tasks_table t
        LEFT JOIN labbee_users u1 ON t.assigned_to = u1.id
        LEFT JOIN labbee_users u2 ON t.last_updated_by = u2.id
      `,
        members: `
        SELECT 
          id, name, department, email
        FROM labbee_users 
        WHERE department IN ('Reliability', 'Software', 'Administration')
      `,
      };

      // Execute all queries
      Promise.all([
        new Promise((resolve, reject) => {
          db.query(queries.projects, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(queries.tasks, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(queries.members, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        }),
      ])
        .then(([projects, tasks, members]) => {
          res.status(200).json({
            projects,
            tasks,
            members,
          });
        })
        .catch((error) => {
          console.error("Error fetching dashboard data:", error);
          res.status(500).json({ message: "Error fetching dashboard data" });
        });
    } catch (error) {
      console.error("Error in getDashboardData API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get project analytics
  app.get("/api/getProjectAnalytics", (req, res) => {
    try {
      const analyticsQuery = `
      SELECT 
        p.department,
        p.project_status,
        COUNT(*) as project_count,
        AVG(
          CASE 
            WHEN p.project_end_date IS NOT NULL 
            THEN DATEDIFF(COALESCE(p.project_end_date, CURDATE()), p.project_start_date)
            ELSE NULL 
          END
        ) as avg_duration_days,
        SUM(p.total_tasks_count) as total_tasks,
        SUM(p.completed_tasks_count) as completed_tasks
      FROM projects_table p
      GROUP BY p.department, p.project_status
      ORDER BY p.department, p.project_status
    `;

      db.query(analyticsQuery, (error, result) => {
        if (error) {
          console.error("Error fetching project analytics:", error);
          return res
            .status(500)
            .json({ message: "Error fetching project analytics" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getProjectAnalytics API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get team productivity metrics
  app.get("/api/getTeamProductivity", (req, res) => {
    try {
      const productivityQuery = `
      SELECT 
        u.id,
        u.name,
        u.department,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END) as blocked_tasks,
        SUM(CASE WHEN t.task_due_date < CURDATE() AND t.status != 'Done' THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(t.story_points) as avg_story_points,
        SUM(t.estimated_hours) as total_estimated_hours,
        SUM(t.actual_hours) as total_actual_hours,
        AVG(
          CASE 
            WHEN t.status = 'Done' AND t.task_assigned_date IS NOT NULL AND t.task_completed_date IS NOT NULL
            THEN DATEDIFF(t.task_completed_date, t.task_assigned_date)
            ELSE NULL 
          END
        ) as avg_completion_days
      FROM labbee_users u
      LEFT JOIN project_tasks_table t ON u.id = t.assigned_to
      WHERE u.department IN ('Reliability', 'Software', 'Administration')
      GROUP BY u.id, u.name, u.department
      ORDER BY 
        (SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) DESC,
        u.name
    `;

      db.query(productivityQuery, (error, result) => {
        if (error) {
          console.error("Error fetching team productivity:", error);
          return res
            .status(500)
            .json({ message: "Error fetching team productivity" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getTeamProductivity API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get task trends over time
  app.get("/api/getTaskTrends", (req, res) => {
    try {
      const { period = "8weeks" } = req.query;

      let dateRange = "";
      let groupBy = "";

      switch (period) {
        case "8weeks":
          dateRange = "DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
          groupBy = "WEEK(t.task_assigned_date)";
          break;
        case "6months":
          dateRange = "DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
          groupBy = "MONTH(t.task_assigned_date)";
          break;
        case "1year":
          dateRange = "DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
          groupBy = "MONTH(t.task_assigned_date)";
          break;
        default:
          dateRange = "DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
          groupBy = "WEEK(t.task_assigned_date)";
      }

      const trendsQuery = `
      SELECT 
        DATE(t.task_assigned_date) as date,
        COUNT(*) as tasks_created,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as tasks_completed,
        SUM(t.story_points) as story_points_created,
        SUM(CASE WHEN t.status = 'Done' THEN t.story_points ELSE 0 END) as story_points_completed
      FROM project_tasks_table t
      WHERE t.task_assigned_date >= ${dateRange}
      GROUP BY DATE(t.task_assigned_date)
      ORDER BY t.task_assigned_date
    `;

      db.query(trendsQuery, (error, result) => {
        if (error) {
          console.error("Error fetching task trends:", error);
          return res
            .status(500)
            .json({ message: "Error fetching task trends" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getTaskTrends API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get resource utilization
  app.get("/api/getResourceUtilization", (req, res) => {
    try {
      const utilizationQuery = `
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as total_members,
        COUNT(t.id) as total_tasks_assigned,
        SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as active_tasks,
        SUM(t.estimated_hours) as total_estimated_hours,
        SUM(t.actual_hours) as total_actual_hours,
        AVG(
          CASE 
            WHEN user_tasks.task_count > 0 
            THEN user_tasks.task_count 
            ELSE 0 
          END
        ) as avg_tasks_per_member
      FROM labbee_users u
      LEFT JOIN project_tasks_table t ON u.id = t.assigned_to
      LEFT JOIN (
        SELECT 
          assigned_to,
          COUNT(*) as task_count
        FROM project_tasks_table 
        WHERE status IN ('To Do', 'In Progress', 'Blocked')
        GROUP BY assigned_to
      ) user_tasks ON u.id = user_tasks.assigned_to
      WHERE u.department IN ('Reliability', 'Software', 'Administration')
      GROUP BY u.department
    `;

      db.query(utilizationQuery, (error, result) => {
        if (error) {
          console.error("Error fetching resource utilization:", error);
          return res
            .status(500)
            .json({ message: "Error fetching resource utilization" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getResourceUtilization API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get project health indicators
  app.get("/api/getProjectHealth", (req, res) => {
    try {
      const healthQuery = `
      SELECT 
        p.project_id,
        p.project_name,
        p.department,
        p.project_status,
        p.project_start_date,
        p.project_end_date,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END) as blocked_tasks,
        SUM(CASE WHEN t.task_due_date < CURDATE() AND t.status != 'Done' THEN 1 ELSE 0 END) as overdue_tasks,
        CASE 
          WHEN p.project_end_date < CURDATE() AND p.project_status != 'Done' THEN 'At Risk'
          WHEN SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END) > 0 THEN 'Blocked'
          WHEN (SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) > 0.8 THEN 'On Track'
          ELSE 'Needs Attention'
        END as health_status
      FROM projects_table p
      LEFT JOIN project_tasks_table t ON p.project_id = t.corresponding_project_id
      GROUP BY p.project_id, p.project_name, p.department, p.project_status, p.project_start_date, p.project_end_date
      ORDER BY 
        CASE 
          WHEN p.project_end_date < CURDATE() AND p.project_status != 'Done' THEN 1
          WHEN SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END) > 0 THEN 2
          ELSE 3
        END,
        p.project_end_date
    `;

      db.query(healthQuery, (error, result) => {
        if (error) {
          console.error("Error fetching project health:", error);
          return res
            .status(500)
            .json({ message: "Error fetching project health" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getProjectHealth API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get recent activities
  app.get("/api/getRecentActivities", (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const activitiesQuery = `
      (
        SELECT 
          'task_completed' as activity_type,
          t.title as activity_title,
          u.name as user_name,
          t.task_completed_date as activity_date,
          t.corresponding_project_id as project_id
        FROM project_tasks_table t
        LEFT JOIN labbee_users u ON t.assigned_to = u.id
        WHERE t.status = 'Done' AND t.task_completed_date IS NOT NULL
      )
      UNION ALL
      (
        SELECT 
          'task_created' as activity_type,
          t.title as activity_title,
          u.name as user_name,
          t.task_assigned_date as activity_date,
          t.corresponding_project_id as project_id
        FROM project_tasks_table t
        LEFT JOIN labbee_users u ON t.last_updated_by = u.id
        WHERE t.task_assigned_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      )
      ORDER BY activity_date DESC
      LIMIT ?
    `;

      db.query(activitiesQuery, [parseInt(limit)], (error, result) => {
        if (error) {
          console.error("Error fetching recent activities:", error);
          return res
            .status(500)
            .json({ message: "Error fetching recent activities" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getRecentActivities API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get critical alerts (overdue tasks, blocked projects, etc.)
  app.get("/api/getCriticalAlerts", (req, res) => {
    try {
      const alertsQuery = `
      SELECT 
        'overdue_task' as alert_type,
        'High' as priority,
        CONCAT('Task "', t.title, '" is overdue') as message,
        t.task_due_date as due_date,
        u.name as assigned_to,
        t.corresponding_project_id as project_id
      FROM project_tasks_table t
      LEFT JOIN labbee_users u ON t.assigned_to = u.id
      WHERE t.task_due_date < CURDATE() AND t.status != 'Done'
      
      UNION ALL
      
      SELECT 
        'blocked_task' as alert_type,
        'Medium' as priority,
        CONCAT('Task "', t.title, '" is blocked') as message,
        t.task_due_date as due_date,
        u.name as assigned_to,
        t.corresponding_project_id as project_id
      FROM project_tasks_table t
      LEFT JOIN labbee_users u ON t.assigned_to = u.id
      WHERE t.status = 'Blocked'
      
      UNION ALL
      
      SELECT 
        'project_overdue' as alert_type,
        'High' as priority,
        CONCAT('Project "', p.project_name, '" is overdue') as message,
        p.project_end_date as due_date,
        u.name as assigned_to,
        p.project_id
      FROM projects_table p
      LEFT JOIN labbee_users u ON p.project_manager = u.id
      WHERE p.project_end_date < CURDATE() AND p.project_status != 'Done'
      
      ORDER BY 
        CASE priority 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          ELSE 3 
        END,
        due_date
    `;

      db.query(alertsQuery, (error, result) => {
        if (error) {
          console.error("Error fetching critical alerts:", error);
          return res
            .status(500)
            .json({ message: "Error fetching critical alerts" });
        }
        res.status(200).json(result);
      });
    } catch (error) {
      console.error("Error in getCriticalAlerts API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

module.exports = { projectManagementAPIs };
