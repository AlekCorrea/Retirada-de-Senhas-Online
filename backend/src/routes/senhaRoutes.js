const express = require("express");
const router = express.Router();

const controller = require("../controllers/senhaController");

// middleware cliente logado
const auth = require("../middlewares/authMiddleware");

// middleware admin
const admin = require("../middlewares/adminMiddleware");

/* ==========================================
   CLIENTE
========================================== */

// retirar senha (cliente logado Google)
router.post("/senha", auth, controller.criar);


/* ==========================================
   ADMIN
========================================== */

// listar todas senhas
router.get("/senhas", admin, controller.listar);

// chamar próxima
router.put("/senha/chamar", admin, controller.chamar);

// finalizar senha
router.put("/senha/finalizar/:id", admin, controller.finalizar);

// cancelar senha
router.put("/senha/cancelar/:id", admin, controller.cancelar);

// ver posição na fila
router.get("/minha-senha", auth, controller.minhaSenha);

// cancelar minha senha
router.put("/minha-senha/cancelar", auth, controller.cancelarMinhaSenha);

module.exports = router;