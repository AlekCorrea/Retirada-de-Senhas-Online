// src/routes/senhaRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/senhaController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

router.post("/senha", auth, controller.criar);
router.get("/senhas", controller.listar);
router.put("/senha/chamar", controller.chamar);
router.put("/senha/chamar", admin, controller.chamar);

module.exports = router;