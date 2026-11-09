const { db } = require("./db");
const schedule = require("node-schedule");
const moment = require("moment");

// notifications_table keeps, per notification, comma separated lists:
//   users_to_be_notified - the roles that see it (e.g. "Lab Manager,Lab Engineer")
//   isReadBy / isUnReadBy / isDeletedBy - user names
// Roles and names are matched as whole list items (FIND_IN_SET), so "Lab Manager"
// does not match "Lab Manager(EMI)" and "Ajay" does not match "Ajay HP".

const KEEP_DAYS = 90; // shown in the panel
const DELETE_AFTER_DAYS = 180; // removed from the table
const MAX_LIST = 300;

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

// SQL: whether ? is an item of the list column (old rows may have ", " or empty items)
const inList = (col) => `FIND_IN_SET(?, REPLACE(IFNULL(${col}, ''), ', ', ',')) > 0`;
// SQL: the list column with ? added once
const addTo = (col) =>
  `IF(${inList(col)}, ${col}, CONCAT_WS(',', NULLIF(TRIM(BOTH ',' FROM IFNULL(${col}, '')), ''), ?))`;
// SQL: the list column without ?
const removeFrom = (col) =>
  `NULLIF(TRIM(BOTH ',' FROM REPLACE(CONCAT(',', REPLACE(IFNULL(${col}, ''), ', ', ','), ','), CONCAT(',', ?, ','), ',')), '')`;

const SET = {
  read: `isReadBy = ${addTo("isReadBy")}, isUnReadBy = ${removeFrom("isUnReadBy")}`,
  unread: `isUnReadBy = ${addTo("isUnReadBy")}, isReadBy = ${removeFrom("isReadBy")}`,
  delete: `isDeletedBy = ${addTo("isDeletedBy")}`,
};
// parameters for SET[action]
const setParams = (action, name) => (action === "delete" ? [name, name] : [name, name, name]);

const VISIBLE = `${inList("users_to_be_notified")} AND NOT ${inList("isDeletedBy")}
  AND receivedAt >= NOW() - INTERVAL ${KEEP_DAYS} DAY`;

function notificationsAPIs(app, io, labbeeUsers) {
  // Link to the page a notification is about (e.g. /rfq_inbox?open=12)
  query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'notifications_table' AND column_name = 'link'",
  )
    .then((r) => (r.length ? null : query("ALTER TABLE notifications_table ADD COLUMN link VARCHAR(255) DEFAULT NULL")))
    .catch((err) => console.error("Error adding notifications_table.link", err.message));

  // Every night, remove notifications older than DELETE_AFTER_DAYS
  schedule.scheduleJob("0 0 * * *", function () {
    db.query(
      `DELETE FROM notifications_table WHERE receivedAt < NOW() - INTERVAL ${DELETE_AFTER_DAYS} DAY`,
      (error) => {
        if (error) console.error("Error while deleting older notifications", error);
      },
    );
  });

  // The logged-in user (from the session); the name / role sent by the page
  // are only used when there is no session.
  const currentUser = async (req) => {
    const userId = req.session?.user_id;
    if (userId) {
      const [u] = await query("SELECT name, role FROM labbee_users WHERE id = ?", [userId]);
      if (u) return u;
    }
    const name = req.body?.userName || req.query?.userName;
    const role = req.body?.userRole || req.query?.userRole;
    return name || role ? { name, role } : null;
  };

  const handle = (fn) => async (req, res) => {
    try {
      const user = await currentUser(req);
      if (!user) return res.status(401).json({ message: "Not logged in" });
      await fn(req, res, user);
    } catch (err) {
      console.error(`notifications ${req.method} ${req.path}:`, err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // API function to add a new notification:
  app.post("/api/addNotification", async (req, res) => {
    try {
      const { message, receivedAt, usersToBeNotified, sender, link } = req.body;
      if (!message || !Array.isArray(usersToBeNotified)) {
        return res.status(400).json({ error: "message and usersToBeNotified are required" });
      }
      await query(
        `INSERT INTO notifications_table (message, receivedAt, users_to_be_notified, notification_sent_by, link)
         VALUES (?, ?, ?, ?, ?)`,
        [
          message,
          moment(receivedAt || undefined).format("YYYY-MM-DD HH:mm:ss"),
          usersToBeNotified.map((r) => String(r).trim()).filter(Boolean).join(","),
          sender || null,
          link || null,
        ],
      );
      res.status(200).json({ message: "Notification added successfully" });
    } catch (error) {
      console.error("Error while adding notification:", error.message);
      res.status(500).json({ error: "Error while adding notification" });
    }
  });

  // The notifications of the user's role, newest first, with isRead for this user
  app.get(
    "/api/getAllNotifications",
    handle(async (req, res, user) => {
      const rows = await query(
        `SELECT id, message, receivedAt, notification_sent_by AS sender, link, isReadBy, isDeletedBy,
                ${inList("isReadBy")} AS isRead
         FROM notifications_table
         WHERE ${VISIBLE}
         ORDER BY receivedAt DESC, id DESC
         LIMIT ${MAX_LIST}`,
        [user.name, user.role, user.name],
      );
      res.status(200).json(rows.map((r) => ({ ...r, isRead: !!r.isRead })));
    }),
  );

  // Mark one notification as read / unread, or delete it (for this user only)
  const single = (action) =>
    handle(async (req, res, user) => {
      const id = parseInt(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid notification id" });
      await query(`UPDATE notifications_table SET ${SET[action]} WHERE id = ?`, [...setParams(action, user.name), id]);
      res.status(200).json({ message: `Notification ${action === "delete" ? "deleted" : `marked as ${action}`}` });
    });
  app.post("/api/notifications/markAsRead/:id", single("read"));
  app.post("/api/notifications/markAsUnRead/:id", single("unread"));
  app.delete("/api/deleteNotification/:id", single("delete"));

  // Several at once: { action: "read" | "unread" | "delete", ids: [..] | "all" }
  // "all" = every notification this user sees.
  app.post(
    "/api/notifications/bulk",
    handle(async (req, res, user) => {
      const { action, ids } = req.body;
      if (!SET[action]) return res.status(400).json({ message: "Unknown action" });
      let where;
      let params;
      if (ids === "all") {
        where = VISIBLE;
        params = [user.role, user.name];
      } else {
        const list = (Array.isArray(ids) ? ids : []).map((x) => parseInt(x)).filter(Boolean);
        if (!list.length) return res.status(400).json({ message: "No notifications chosen" });
        where = "id IN (?)";
        params = [list];
      }
      const result = await query(`UPDATE notifications_table SET ${SET[action]} WHERE ${where}`, [
        ...setParams(action, user.name),
        ...params,
      ]);
      res.status(200).json({ updated: result.affectedRows });
    }),
  );

  //API to delete all notifications for a user :
  app.delete(
    "/api/deleteAllNotifications",
    handle(async (req, res, user) => {
      await query(`UPDATE notifications_table SET ${SET.delete} WHERE ${VISIBLE}`, [
        ...setParams("delete", user.name),
        user.role,
        user.name,
      ]);
      res.status(200).json({ message: "All notifications deleted for user" });
    }),
  );

  //API to fetch the count of un-read notifications based on logged in user role:
  app.get(
    "/api/getUnreadNotificationsCount",
    handle(async (req, res, user) => {
      const [row] = await query(
        `SELECT COUNT(*) AS count FROM notifications_table WHERE ${VISIBLE} AND NOT ${inList("isReadBy")}`,
        [user.role, user.name, user.name],
      );
      res.status(200).json({ count: row.count });
    }),
  );
}

module.exports = { notificationsAPIs };
