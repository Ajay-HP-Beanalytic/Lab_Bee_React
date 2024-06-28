const schedule = require("node-schedule");
const path = require("path");
const fs = require("fs");
const { db } = require("./db");
const { exec } = require("child_process");
const archiver = require("archiver");

// Database credentials
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_DATABASE;

// Path to mysqldump executable
// const MYSQLDUMP_PATH =
//   process.env.MYSQL_DUMP_FOLDER_PATH || "/usr/bin/mysqldump"; // Default to Ubuntu path

// Define backup directory
const BACKUP_DIR = path.join(__dirname, "backups");
const ATTACHMENTS_DIR = path.join(__dirname, "FilesUploaded");

const MYSQLDUMP_PATH = process.env.MYSQL_DUMP_FOLDER_PATH || "/usr/bin/mysqldump"; // Default to Ubuntu path

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Function to create a backup
const createBackup = (callback) => {
  /// Code to get backup of only database in .sql format:

  // const DATE = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  // const BACKUP_FILE = path.join(BACKUP_DIR, `${DB_NAME}-backup.sql`);

  // //   const command = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}`;
  // // Specify full path to mysqldump executable
  // const command = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump" -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}`;

  // exec(command, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Error creating backup: ${error.message}`);
  //     console.error("stderr:", stderr); // Debugging statement
  //     return callback(error);
  //   }
  //   callback(null, BACKUP_FILE);
  // });

  /// Code to get backup of database in .sql format and attachments in .zip format:
  const DATE = new Date().toISOString().slice(0, 10);
  const SQL_BACKUP_FILE = path.join(
    BACKUP_DIR,
    `${DB_NAME}-backup-${DATE}.sql`
  );
  const ZIP_BACKUP_FILE = path.join(
    BACKUP_DIR,
    `${DB_NAME}-backup-${DATE}.zip`
  );

  // Command to dump the database
  // const command = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump" -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${SQL_BACKUP_FILE}`;
  // const command = `${MYSQLDUMP_PATH} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${SQL_BACKUP_FILE}`;
  const command = `${MYSQLDUMP_PATH} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${SQL_BACKUP_FILE}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating SQL backup: ${error.message}`);
      return callback(error);
    }

    // Create a zip file including the SQL backup and attachments
    const output = fs.createWriteStream(ZIP_BACKUP_FILE);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    output.on("close", () => {
      console.log(`Backup created: ${ZIP_BACKUP_FILE}`);
      fs.unlinkSync(SQL_BACKUP_FILE); // Optionally, remove the temporary SQL backup file
      callback(null, ZIP_BACKUP_FILE);
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Append the SQL backup file
    archive.file(SQL_BACKUP_FILE, { name: path.basename(SQL_BACKUP_FILE) });

    // Append the FilesUploaded folder
    if (fs.existsSync(ATTACHMENTS_DIR)) {
      archive.directory(ATTACHMENTS_DIR, "FilesUploaded");
    }

    archive.finalize();
  });
};

// Export the initialize function
module.exports = createBackup;
