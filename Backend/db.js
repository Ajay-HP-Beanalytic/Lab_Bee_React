const mysql = require("mysql2"); // In order to interact with the mysql database.
const dotenv = require("dotenv").config();

//Create a connection between the backend server and the database:
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true, // Queue new queries if all connections are busy, instead of failing with an error
  connectionLimit: 10, // Max 10 simultaneous DB queries (each query uses a connection for ~20-50ms, so 10 is enough for 50+ users)
  idleTimeout: 60000, // Close unused connections after 60s of inactivity (prevents stale connections at night)
  enableKeepAlive: true, // Send TCP pings to MySQL server to prevent it from killing idle connections
  keepAliveInitialDelay: 10000, // Start sending keep-alive pings 10s after a connection becomes idle
});

module.exports = { db };
