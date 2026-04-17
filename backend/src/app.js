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

// importar rotas
const senhaRoutes = require("./routes/senhaRoutes");

// usar rotas
app.use("/api", senhaRoutes);

module.exports = app;