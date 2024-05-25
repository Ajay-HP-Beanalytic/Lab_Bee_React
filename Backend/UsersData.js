
const mysql = require("mysql2");                    // In order to interact with the mysql database.
const bcrypt = require("bcrypt")                    // Import bcrypt package in order to encrypt the password
const saltRounds = 10                               // Let saltRoulds be '10' for hasing purpose
const jwt = require("jsonwebtoken")                 // Import jsonwebtoken package in order to create tokens

const session = require("express-session")          // Import 'express-session' module to create user session
const cookieParser = require("cookie-parser");       // Import 'cookie-parser' module to create cookies for a logge in user 
const { db } = require("./db");

const jwtSecret = "RANDOM-TOKEN";                   // To create a random token

// Function to handle the operations of the User Registraion and Login process:

function usersDataAPIs(app) {

    //api to add or register the new user: 
    app.post("/api/addUser", (req, res) => {
        //const { name, email, password } = req.body;
        const { name, email, password, department, role, user_status } = req.body;


        console.log('1', name, email, password, department, role, user_status)

        const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
        const sqlInsertUser = "INSERT INTO labbee_users (name, email, password, department, role, user_status) VALUES (?,?,?,?,?,?)";

        db.query(sqlCheckEmail, [email], (error, result) => {
            if (error) {
                console.error("Error checking email:", error);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (result.length > 0) {
                //Email already exists:
                return res.status(400).json({ message: "Email already exists" });
            }

            //If email is not exists then continue and encrypt the password:
            bcrypt
                .genSalt(saltRounds)
                .then(salt => {
                    return bcrypt.hash(password, salt)
                })
                .then(hash => {
                    //db.query(sqlInsertUser, [name, email, hash], (error) => {
                    console.log('2', name, email, hash, department, role, user_status)

                    db.query(sqlInsertUser, [name, email, hash, department, role, user_status], (error) => {
                        if (error) {
                            console.error("Error inserting user:", error);
                            return res.status(500).json({ message: "Internal server error" });
                        }
                        return res.status(200).json({ message: "Registration Success" });
                    })
                })
                .catch(err => {
                    console.error("Error hashing password:", err);
                    return res.status(500).json({ message: "Internal server error" });
                })
        });
    });




    //api to update the data of a registered user:
    // app.post("/api/addUser/:id", (req, res) => {
    //     //const { name, email, password } = req.body;
    //     const { name, email, password, role, allowedComponents } = req.body;
    //     const id = req.params.id;
    //     const sqlUpdateUser = `UPDATE labbee_users SET name='${name}', email='${email}', password='${password}', role='${role}', allowed_components='${allowedComponents}' WHERE id=${id}`;

    //     db.query(sqlUpdateUser, (error, result) => {
    //         if (error) {
    //             console.error(error);
    //             return res.status(500).json({ message: "Internal server error" });
    //         } else {
    //             res.status(200).json({ message: "User data updated successfully" });
    //         }

    //     });
    // });


    app.post("/api/addUser/:id", (req, res) => {
        //const { name, email, password } = req.body;
        const { name, email, department, role, user_status } = req.body;

        console.log('update values', name, email, department, role, user_status)

        const id = req.params.id;

        console.log('updating id', id)

        const sqlUpdateUser = `
                UPDATE labbee_users 
                SET name='${name}', email='${email}', department='${department}', role='${role}', user_status='${user_status}'
                WHERE id=${id}
                `;

        db.query(sqlUpdateUser, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            } else {
                res.status(200).json({ message: "User data updated successfully" });
            }
        });
    });




    /// To allow an user to access the application on succesfull login:
    app.post("/api/login", (req, res) => {
        const { email, password } = req.body;

        // Perform a database query to find the user with the provided email
        const usersList = "SELECT * FROM labbee_users WHERE email = ?";

        // Execute the query, passing in the email as a parameter
        db.query(usersList, [email], async (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (result.length === 0) {
                // User not found
                return res.status(401).json({ message: "User not found" });
            }

            const user = result[0];

            try {
                const matched = await bcrypt.compare(password, user.password);

                if (!matched) {
                    // Incorrect password
                    return res.status(401).json({ message: "Incorrect password" });
                }

                // Password is correct; generate and send JWT token
                const token = jwt.sign(
                    { userID: user.id, email: user.email },
                    jwtSecret,
                    { expiresIn: '30d' }
                );

                req.session.username = user.name
                req.session.role = user.role
                req.session.department = user.department

                res.status(200).json({ username: req.session.username, token: token });


            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    });



    //Function to delete the user data from the table and database :
    app.delete("/api/deleteUser/:id", (req, res) => {
        const id = req.params.id;
        const deleteQuery = "DELETE FROM labbee_users WHERE id = ?";

        db.query(deleteQuery, [id], (error, result) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred while deleting the user" });
            }
            res.status(200).json({ message: "User removed successfully" });
        });
    });




    // api to fetch the logged in user name:
    app.get("/api/getLoggedInUser", (req, res) => {
        if (req.session.username) {
            // return res.json({ valid: true, user_name: req.session.username, user_role: req.session.role })
            return res.json({ valid: true, user_name: req.session.username, user_role: req.session.role, user_department: req.session.department })
        } else {
            return res.json({ valid: false })
        }
    });

    // API to fetch the user status:
    app.post("/api/getUserStatus", (req, res) => {
        const { email } = req.body;

        // Fetch user status from the database
        const user = 'SELECT user_status FROM labbee_users WHERE email=? '

        db.query(user, [email], (error, results) => {
            if (error) {
                // Handle database error
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length > 0) {
                // User found, send the user_status
                const userStatus = results[0].user_status;
                return res.status(200).json({ status: userStatus });
            } else {
                // User not found
                return res.status(404).json({ error: 'User not found' });
            }
        });

    })



    // api to logout from the application:
    app.get("/api/logout", (req, res) => {

        // Clear cookie
        res.clearCookie('connect.sid')

        //req.session.destroy();


        // Set a header indicating session expiration time
        //res.setHeader("Session-Expired", "true");

        return res.json({ Status: "Logged out successfully " })
    });


    // Fetch all the users
    app.get("/api/getAllUsers", (req, res) => {
        const usersList = "SELECT * FROM labbee_users";
        db.query(usersList, (error, result) => {
            res.send(result);
        });
    });


    // Fetch the users who will operate the testings 
    app.get("/api/getTestingUsers", (req, res) => {
        const usersList = "SELECT name FROM labbee_users WHERE department LIKE '%Testing%' ";
        db.query(usersList, (error, result) => {
            res.send(result);
        });
    });

}


module.exports = { usersDataAPIs }



// //api to add or register the new user:
// app.post("/api/adduser", (req, res) => {
//     const { name, email, password, jobrole } = req.body;
//     const sqlCheckEmail = "SELECT * FROM labbee_users WHERE email=?";
//     const sqlInsertUser = "INSERT INTO labbee_users (name, email, password, role) VALUES (?,?,?,?)";

//     db.query(sqlCheckEmail, [email], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }

//         if (result.length > 0) {
//             //Email already exists:
//             return res.status(400).json({ message: "Email already exists" });
//         }

//         //If email is not exists then continue:
//         db.query(sqlInsertUser, [name, email, password, jobrole], (error, result) => {
//             if (error) {
//                 console.log(error);
//                 return res.status(500).json({ message: "Internal server error" });
//             }
//             res.status(200).json({ message: "User added successfully" });
//         });
//     });
// });








/// To allow an user to access the application on succesfull login:
// app.post("/api/login", (req, res) => {
//     const { email, password } = req.body;

//     // Perform a database query to find the user with the provided email
//     const usersList = "SELECT * FROM labbee_users WHERE email = ?";

//     // Execute the query, passing in the email as a parameter
//     db.query(usersList, [email], (error, results) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }

//         if (results.length === 0) {
//             // User not found
//             return res.status(401).json({ message: "User not found" });
//         }

//         const user = results[0];

//         if (user.password !== password) {
//             // Incorrect password
//             return res.status(401).json({ message: "Incorrect password" });
//         }

//         // Authentication successful
//         res.status(200).json({ message: "Login successful", user });
//     });
// });