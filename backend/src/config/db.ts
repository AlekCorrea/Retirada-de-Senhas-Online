require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "bdsenha"
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL conectado com sucesso!");
});

pool.on("error", (err) => {
    console.error("❌ Erro na conexão com PostgreSQL:", err);
});

module.exports = pool;
