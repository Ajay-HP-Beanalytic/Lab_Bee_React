// Enquiry notifications: saved in notifications_table (the bell) and pushed
// live over socket.io as "rfq_notification".
//
// notifications_table is shown by role, so a message for a department is saved
// for the roles of that department's active users, and a message for a person
// for that person's role (other people with the same role see it too).

const moment = require("moment");
const { db } = require("../../db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

let io = null;
let connectedUsers = {};

// Called once from index.js with the socket server and its connected users
const initEnquiryNotifications = (socketServer, labbeeUsers) => {
  io = socketServer;
  connectedUsers = labbeeUsers;
};

// { departments?: string[], userIds?: number[], message, sender, requestId }
const notify = async ({ departments = [], userIds = [], message, sender = "Lab Bee", requestId = null }) => {
  if (!departments.length && !userIds.length) return;
  const users = await query(
    `SELECT id, name, department, role FROM labbee_users
     WHERE user_status = 'Enable' AND (department IN (?) OR id IN (?))`,
    [departments.length ? departments : [""], userIds.length ? userIds : [0]],
  );
  if (!users.length) return;

  const roles = [...new Set(users.map((u) => u.role).filter(Boolean))];
  const now = new Date();
  const link = requestId ? `/rfq_inbox?open=${requestId}` : null;
  const saved = await query(
    "INSERT INTO notifications_table (message, receivedAt, users_to_be_notified, notification_sent_by, link) VALUES (?, ?, ?, ?, ?)",
    [message, moment(now).format("YYYY-MM-DD HH:mm:ss"), roles.join(","), sender, link],
  );

  if (!io) return;
  const names = new Set(users.map((u) => u.name));
  for (const [socketId, u] of Object.entries(connectedUsers)) {
    if (names.has(u.name) && u.name !== sender) {
      io.to(socketId).emit("rfq_notification", { id: saved.insertId, message, sender, receivedAt: now.toISOString(), requestId, link });
    }
  }
};

module.exports = { initEnquiryNotifications, notify };
