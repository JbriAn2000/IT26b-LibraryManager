const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Connection sa database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.log("DB ERROR:", err);
    } else {
        console.log("MySQL Connected");
    }
});


//  REGISTER 
app.post("/register", (req, res) => {

    const { firstname, middlename, lastname, username, password } = req.body;

    const sql = `
        INSERT INTO users 
        (firstname, middlename, lastname, username, password, role)
        VALUES (?,?,?,?,?,?)
    `;

    db.query(sql,
        [firstname, middlename, lastname, username, password, "student"],
        (err) => {

            if (err) {
                console.log("REGISTER ERROR:", err);
                return res.json({ success: false });
            }

            res.json({ success: true });
        }
    );
});


//  LOGIN  
app.post("/login", (req, res) => {

    const { username, password } = req.body;

    const sql = `
        SELECT 
            id,
            firstname,
            middlename,
            lastname,
            username,
            role
        FROM users
        WHERE username=? AND password=?
    `;

    db.query(sql, [username, password], (err, result) => {

        if (err) {
            console.log("LOGIN ERROR:", err);
            return res.json({ success: false });
        }

        if (result.length > 0) {

            const user = result[0];

            // i usa ang first name , middle ug last
            const fullname = `${user.firstname || ""} ${user.middlename || ""} ${user.lastname || ""}`.trim();

            res.json({
                success: true,
                user_id: user.id,
                fullname: fullname,
                role: user.role
            });

        } else {
            res.json({ success: false });
        }
    });
});


//  BORROW BOOK 
app.post("/books", (req, res) => {

    const { user_id, student_id, book_name, date } = req.body;

    db.query(
        "INSERT INTO books (user_id, student_id, book_name, date, status) VALUES (?,?,?,?,?)",
        [user_id, student_id, book_name, date, "Borrowed"],
        (err) => {

            if (err) {
                console.log("BORROW ERROR:", err);
                return res.json({ success: false });
            }

            res.json({ success: true });
        }
    );
});


//  inner join 
app.get("/books", (req, res) => {

    const user_id = req.query.user_id;

    let sql = `
        SELECT 
            books.id,
            books.student_id,
            books.book_name,
            books.date,
            books.status,
            CONCAT(users.firstname,' ',users.middlename,' ',users.lastname) AS fullname
        FROM books
        JOIN users ON books.user_id = users.id
    `;

    let values = [];

    if (user_id) {
        sql += " WHERE books.user_id = ?";
        values.push(user_id);
    }

    db.query(sql, values, (err, result) => {

        if (err) {
            console.log(err);
            return res.json([]);
        }

        res.json(result);
    });
});


// UPDATE 
app.put("/books/:id", (req, res) => {

    const { status } = req.body;

    db.query(
        "UPDATE books SET status=? WHERE id=?",
        [status, req.params.id],
        (err) => {

            if (err) {
                console.log("UPDATE ERROR:", err);
                return res.json({ success: false });
            }

            res.json({ success: true });
        }
    );
});


//  DELETE 
app.delete("/books/:id", (req, res) => {

    db.query(
        "DELETE FROM books WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                console.log("DELETE ERROR:", err);
                return res.json({ success: false });
            }

            res.json({ success: true });
        }
    );
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});