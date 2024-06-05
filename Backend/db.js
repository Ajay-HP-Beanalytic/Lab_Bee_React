const mysql = require("mysql2"); // In order to interact with the mysql database.
const dotenv = require("dotenv").config();

//Create a connection between the backend server and the database:
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // host: "localhost",
  // user: "root",
  // password: "Labbee@2024",
  // database: "labbee"

  //host : "92.205.7.122",
  //user : "beaLab",
  //password : "FIycjLM5BTF;",
  //database : "i7627920_labbee"
});

module.exports = { db };
