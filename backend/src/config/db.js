const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "celia",
    database: "bdsenha"
});

db.connect((err) => {
    if (err) {
        console.log("Erro ao conectar:", err);
    } else {
        console.log("MySQL conectado!");
    }
});

module.exports = db;