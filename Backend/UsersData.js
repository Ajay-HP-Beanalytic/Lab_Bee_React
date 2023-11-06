
const mysql = require("mysql2");                    // In order to interact with the mysql database.


//Create a connection between the backend server and the database:
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "FRACAS@22",
    database: "labbee"

    //host : "92.205.7.122",
    //user : "beaLab",
    //password : "FIycjLM5BTF;",
    //database : "i7627920_labbee"
});


// Function to handle the operations of the User Registraion and Login process:

function usersDataAPIs(app) {

    //api to add or register the new user: 
    app.post("/api/adduser", (req, res) => {
        const { name, email, password, jobrole } = req.body;
        const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
        const sqlInsertUser = "INSERT INTO labbee_users (name, email, password, role) VALUES (?,?,?,?)";

        db.query(sqlCheckEmail, [email], (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (result.length > 0) {
                //Email already exists:
                return res.status(400).json({ message: "Email already exists" });
            }

            //If email is not exists then continue:
            db.query(sqlInsertUser, [name, email, password, jobrole], (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: "Internal server error" });
                }
                res.status(200).json({ message: "User added successfully" });
            });
        });
    });

    /// To allow an user to access the application on succesfull login:
    app.post("/api/login", (req, res) => {
        const { email, password } = req.body;

        // Perform a database query to find the user with the provided email
        const usersList = "SELECT * FROM labbee_users WHERE email = ?";

        // Execute the query, passing in the email as a parameter
        db.query(usersList, [email], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (results.length === 0) {
                // User not found
                return res.status(401).json({ message: "User not found" });
            }

            const user = results[0];

            if (user.password !== password) {
                // Incorrect password
                return res.status(401).json({ message: "Incorrect password" });
            }

            // Authentication successful
            res.status(200).json({ message: "Login successful", user });
        });
    });


    // Check wheteher connection is established between 
    app.get("/api/get", (req, res) => {
        const usersList = "SELECT * FROM labbee_users";
        db.query(usersList, (error, result) => {
            res.send(result);
        });
    });

}


module.exports = { usersDataAPIs }

