const schedule = require("node-schedule");
const path = require("path");
const fs = require("fs");
const { db } = require("./db");
const { exec } = require("child_process");

// Database credentials
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_DATABASE;

// Define backup directory
const BACKUP_DIR = path.join(__dirname, "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Function to create a backup
const createBackup = () => {
  const DATE = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const BACKUP_FILE = path.join(BACKUP_DIR, `${DB_NAME}-${DATE}.sql`);

  //   const command = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}`;
  // Specify full path to mysqldump executable
  const command = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump" -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}`;

  console.log("Executing command:", command); // Debugging statement

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating backup: ${error.message}`);
      console.error("stderr:", stderr); // Debugging statement
      return;
    }
    console.log(`Backup created: ${BACKUP_FILE}`);
  });
};

// Function to initialize the backup job
const initializeBackupJob = () => {
  // Schedule the task to run every day at 2 AM
  schedule.scheduleJob("30 16 * * *", createBackup);
  console.log("Backup job scheduled to run every day at 15:50 PM");
  console.log("Backup started");
};

// Export the initialize function
module.exports = initializeBackupJob;
