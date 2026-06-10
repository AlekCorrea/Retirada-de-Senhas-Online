// src/app.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// rota de teste
app.get("/", (req, res) => {
    res.send("API funcionando ");
});

// rota de health check para docker
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// importar rotas
const senhaRoutes = require("./routes/senhaRoutes");
const authRoutes = require("./routes/authRoutes");

// usar rotas
app.use("/auth", authRoutes);
app.use("/api", senhaRoutes);

module.exports = app;
