const { db } = require("./db");
const schedule = require("node-schedule");

function notificationsAPIs(app, io, labbeeUsers) {
  //Function to auto delete the notifications after 30 days of receiving them:
  // const deleteOlderNotifications = schedule.scheduleJob(
  //   "2 * * * *",
  //   function () {
  //     const sqlQuery = `
  //         DELETE FROM notifications_table
  //         WHERE isDeletedBy IS NOT NULL
  //         AND DATEDIFF(NOW(), receivedAt) > 30;
  //       `;
  //     db.query(sqlQuery, (error, result) => {
  //       if (error) {
  //         console.error("Error while deleting older notifications", error);
  //       } else {
  //         console.log("Old notifications cleaned up:", result.affectedRows);
  //       }
  //     });
  //     console.log("Deleting older notifications for every 2 hours");
  //   }
  // );

  // Function to auto delete the notifications after 30 days of receiving them:
  // schedule.scheduleJob("*/2 * * * *", function () { // To run the function every minutes.
  schedule.scheduleJob("0 0 * * *", function () {
    const sqlQuery = `
      DELETE FROM notifications_table
      WHERE DATEDIFF(NOW(), receivedAt) > 30
      AND (
        LENGTH(users_to_be_notified) - LENGTH(REPLACE(users_to_be_notified, ',', '')) + 1 =
        LENGTH(isDeletedBy) - LENGTH(REPLACE(isDeletedBy, ',', '')) + 1
      );
    `;

    db.query(sqlQuery, (error, result) => {
      if (error) {
        console.error("Error while deleting older notifications", error);
      } else {
        // console.log("result is-->", result);
      }
    });
  });

  // To fetch the count and ID:
  // schedule.scheduleJob("*/2 * * * *", function () {

  //   const sqlSelectQuery = `
  //   SELECT id,
  //     LENGTH(users_to_be_notified) - LENGTH(REPLACE(users_to_be_notified, ',', '')) + 1 AS users_count,
  //     LENGTH(isDeletedBy) - LENGTH(REPLACE(isDeletedBy, ',', '')) + 1 AS deleted_by_count
  //   FROM notifications_table
  //   WHERE DATEDIFF(NOW(), receivedAt) > 30
  //   AND (
  //     LENGTH(users_to_be_notified) - LENGTH(REPLACE(users_to_be_notified, ',', '')) + 1 =
  //     LENGTH(isDeletedBy) - LENGTH(REPLACE(isDeletedBy, ',', '')) + 1
  //   );
  // `;
  //   db.query(sqlSelectQuery, (error, result) => {
  //     if (error) {
  //       console.error("Error while deleting older notifications", error);
  //     } else {
  //       result.forEach((row) => {
  //         console.log(`Notification ID: ${row.id}`);
  //         console.log(`Users Count: ${row.users_count}`);
  //         console.log(`Deleted By Count: ${row.deleted_by_count}`);
  //         console.log("------------------------");
  //       });
  //     }
  //   });
  // });

  // API function to fetch all the notifications:
  app.get("/api/getAllNotifications", (req, res) => {
    const { userRole } = req.query;

    const sqlQuery = `
        SELECT id, message, receivedAt, isReadBy, isDeletedBy
        FROM notifications_table
        WHERE users_to_be_notified LIKE ?
        AND (isDeletedBy IS NULL OR NOT FIND_IN_SET(?, isDeletedBy))
        ORDER BY receivedAt DESC;
      `;

    db.query(sqlQuery, [`%${userRole}%`, userRole], (error, result) => {
      if (error) {
        console.error("Error while fetching notifications", error.message);
        return res
          .status(500)
          .json({ error: "Error while fetching notifications" });
      }
      res.status(200).json(result);
    });
  });

  //API endpoint mark the notification as read :(Working Fine)
  app.post("/api/notifications/markAsRead", (req, res) => {
    const { id, userName } = req.body;

    const sqlQuery = `
        UPDATE notifications_table 
        SET isReadBy = 
            CASE 
                WHEN isReadBy IS NULL THEN ?
                ELSE CONCAT_WS(',', isReadBy, ?)
            END,
            isUnReadBy = REPLACE(isUnReadBy, ?, ''),
            isDeletedBy = REPLACE(isDeletedBy, ?, '')
        WHERE id = ?;
    `;

    db.query(
      sqlQuery,
      [userName, userName, userName, userName, id],
      (error, result) => {
        if (error) {
          console.error("Error marking notification as read:", error.message);
          return res.status(500).json({
            message: "Internal server error",
            error: error.message,
          });
        }

        res.status(200).json({
          message: "Notification marked as read",
        });
      }
    );
  });

  //API endpoint mark the notification as unread: (working fine)
  app.post("/api/notifications/markAsUnRead", (req, res) => {
    const { id, userName } = req.body;

    const sqlQuery = `
        UPDATE notifications_table 
        SET isUnReadBy = 
            CASE 
                WHEN isUnReadBy IS NULL THEN ?
                ELSE CONCAT_WS(',', isUnReadBy, ?)
            END,
            isReadBy = REPLACE(isReadBy, ?, ''),
            isDeletedBy = REPLACE(isDeletedBy, ?, '')
        WHERE id = ?;
    `;

    db.query(
      sqlQuery,
      [userName, userName, userName, userName, id],
      (error, result) => {
        if (error) {
          console.error("Error marking notification as unread:", error.message);
          return res.status(500).json({
            message: "Internal server error",
            error: error.message,
          });
        }

        res.status(200).json({
          message: "Notification marked as unread",
        });
      }
    );
  });

  //API endpoint to delete the notification:

  app.delete("/api/deleteNotification/:id", (req, res) => {
    const { id } = req.params;
    const { userName } = req.body;

    if (!id || !userName) {
      return res
        .status(400)
        .json({ message: "Invalid request: id or userName is missing" });
    }

    const sqlQuery = `
        UPDATE notifications_table 
        SET isDeletedBy = 
            CASE 
                WHEN isDeletedBy IS NULL THEN ?
                ELSE CONCAT_WS(',', isDeletedBy, ?)
            END,
            isReadBy = REPLACE(isReadBy, ?, ''),
            isUnReadBy = REPLACE(isUnReadBy, ?, '')
        WHERE id = ?;
    `;

    db.query(
      sqlQuery,
      [userName, userName, userName, userName, id],
      (error, result) => {
        if (error) {
          console.error("Error deleting notification:", error.message);
          return res.status(500).json({
            message: "Internal server error",
            error: error.message,
          });
        }

        res.status(200).json({
          message: "Notification deleted",
        });
      }
    );
  });
}

module.exports = { notificationsAPIs };
