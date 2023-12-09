const mysql = require("mysql2");                    // In order to interact with the mysql database.

//Create a connection between the backend server and the database:
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "labbee"

  //host : "92.205.7.122",
  //user : "beaLab",
  //password : "FIycjLM5BTF;",
  //database : "i7627920_labbee"
});


module.exports = { db }