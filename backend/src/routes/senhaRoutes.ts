const express = require("express");
const router = express.Router();

const controller = require("../controllers/senhaController");

// middleware cliente logado
const auth = require("../middlewares/authMiddleware");

// middleware admin
const admin = require("../middlewares/adminMiddleware");

// middleware atendente
const atendente = require("../middlewares/atendenteMiddleware");

/* ==========================================
   PÚBLICO - SEM AUTENTICAÇÃO
========================================== */

// retirar senha pública (sem login)
router.post("/senha/publica", controller.criarPublica);

// ver minha senha pública (sem login)
router.get("/minha-senha/publica", controller.minhaSenhaPublica);

// cancelar minha senha pública (sem login, por deviceId)
router.put("/minha-senha/cancelar/publica", controller.cancelarMinhaSenhaPublica);

// painel local/TV publico (somente leitura)
router.get("/painel", controller.obterPainelPublico);

/* ==========================================
   CLIENTE
========================================== */

// retirar senha (cliente logado Google)
router.post("/senha", auth, controller.criar);

// ver posição na fila
router.get("/minha-senha", auth, controller.minhaSenha);

// cancelar minha senha
router.put("/minha-senha/cancelar", auth, controller.cancelarMinhaSenha);

// histórico de senhas do usuário
router.get("/meu-historico", auth, controller.meuHistorico);

/* ==========================================
   ADMIN
========================================== */

// listar todas senhas
router.get("/senhas", admin, controller.listar);

router.get("/config/atendimento", admin, controller.obterConfigAtendimento);
router.put("/config/atendimento", admin, controller.salvarConfigAtendimento);

// chamar próxima
router.put("/senha/chamar", admin, controller.chamar);

// finalizar senha
router.put("/senha/finalizar/:id", admin, controller.finalizar);

// cancelar senha
router.put("/senha/cancelar/:id", admin, controller.cancelar);

/* ==========================================
   ATENDENTE
========================================== */

// obter fila com estatísticas
router.get("/fila", atendente, controller.obterFila);

// chamar próxima (atendente também pode)
router.put("/chamar", atendente, controller.chamar);

// finalizar senha (atendente também pode)
router.put("/finalizar/:id", atendente, controller.finalizar);

// cancelar senha (atendente também pode)
router.put("/cancelar/:id", atendente, controller.cancelar);

/* ==========================================
   PÚBLICO - STATUS DA FILA
========================================== */

// status público da fila (sem autenticação)
router.get("/senhas/status", controller.statusFilaPublica);

module.exports = router;
