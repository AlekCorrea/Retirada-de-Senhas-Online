// src/routes/senhaRoutes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/senhaController");

router.post("/senha", controller.criar);
router.get("/senhas", controller.listar);
router.put("/senha/chamar", controller.chamar);

module.exports = router;