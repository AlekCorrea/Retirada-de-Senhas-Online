const express = require("express");
const router = express.Router();

const controller = require("../controllers/senhaController");

// middleware cliente logado
const auth = require("../middlewares/authMiddleware");

// middleware admin
const admin = require("../middlewares/adminMiddleware");

// middleware atendente
const atendente = require("../middlewares/atendenteMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Senhas
 *     description: Gerenciamento de senhas
 *
 *   - name: Admin
 *     description: Rotas administrativas
 *
 *   - name: Fila
 *     description: Informações da fila
 */

/* ==========================================
   PÚBLICO - SEM AUTENTICAÇÃO
========================================== */

/**
 * @swagger
 * /api/senha/publica:
 *   post:
 *     summary: Retira uma senha pública sem login
 *     tags: [Senhas]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum:
 *                   - normal
 *                   - prioritario
 *                 example: normal
 *               deviceId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *
 *     responses:
 *       201:
 *         description: Senha criada com sucesso
 *
 *       400:
 *         description: Tipo não informado
 *
 *       500:
 *         description: Erro interno do servidor
 */
// retirar senha pública (sem login)
router.post("/senha/publica", controller.criarPublica);

/**
 * @swagger
 * /api/minha-senha/publica:
 *   get:
 *     summary: Retorna a senha pública atual
 *     tags: [Senhas]
 *
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo do usuário
 *
 *     responses:
 *       200:
 *         description: Dados da senha pública
 *       400:
 *         description: deviceId é obrigatório
 */
router.get("/minha-senha/publica", controller.minhaSenhaPublica);

/**
 * @swagger
 * /api/minha-senha/cancelar/publica:
 *   put:
 *     summary: Cancela a senha pública ativa do dispositivo
 *     tags: [Senhas]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ID do dispositivo do usuário
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *
 *     responses:
 *       200:
 *         description: Senha cancelada
 *       400:
 *         description: deviceId é obrigatório
 *       404:
 *         description: Nenhuma senha ativa encontrada
 */

// cancelar minha senha pública (sem login, por deviceId)
router.put("/minha-senha/cancelar/publica", controller.cancelarMinhaSenhaPublica);

/**
 * @swagger
 * /api/painel:
 *   get:
 *     summary: Retorna dados públicos do painel (TV/display)
 *     tags: [Senhas]
 *
 *     responses:
 *       200:
 *         description: Dados do painel retornados com sucesso
 */

// painel local/TV publico (somente leitura)
router.get("/painel", controller.obterPainelPublico);

/* ==========================================
   CLIENTE
========================================== */

/**
 * @swagger
 * /api/senha:
 *   post:
 *     summary: Retira senha para usuário autenticado
 *     tags: [Senhas]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 example: normal
 *               deviceId:
 *                 type: string
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *
 *     responses:
 *       201:
 *         description: Senha criada com sucesso
 *       401:
 *         description: Não autenticado
 */

// retirar senha (cliente logado Google)
router.post("/senha", auth, controller.criar);

/**
 * @swagger
 * /api/minha-senha:
 *   get:
 *     summary: Retorna a senha atual do usuário
 *     tags: [Senhas]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo do usuário (mesmo usado ao retirar a senha)
 *
 *     responses:
 *       200:
 *         description: Dados da senha atual
 *
 *       400:
 *         description: deviceId é obrigatório
 *
 *       401:
 *         description: Não autenticado
 *
 *       404:
 *         description: Nenhuma senha ativa encontrada
 */

// ver posição na fila
router.get("/minha-senha", auth, controller.minhaSenha);

/**
 * @swagger
 * /api/minha-senha/cancelar:
 *   put:
 *     summary: Cancela a senha do usuário
 *     tags: [Senhas]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ID do dispositivo do usuário (mesmo usado ao retirar a senha)
 *                 example: "123e4567-e89b-12d3-a456-426614174002"
 *
 *     responses:
 *       200:
 *         description: Senha cancelada
 *
 *       400:
 *         description: deviceId é obrigatório
 *
 *       401:
 *         description: Não autenticado
 *
 *       404:
 *         description: Nenhuma senha ativa encontrada
 */

// cancelar minha senha
router.put("/minha-senha/cancelar", auth, controller.cancelarMinhaSenha);

/**
 * @swagger
 * /api/meu-historico:
 *   get:
 *     summary: Retorna histórico de senhas do usuário
 *     tags: [Senhas]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo do usuário (mesmo usado ao retirar a senha)
 *
 *     responses:
 *       200:
 *         description: Histórico retornado
 *
 *       400:
 *         description: deviceId é obrigatório
 */

// histórico de senhas do usuário
router.get("/meu-historico", auth, controller.meuHistorico);

/* ==========================================
   ADMIN
========================================== */

/**
 * @swagger
 * /api/senhas:
 *   get:
 *     summary: Lista todas as senhas
 *     tags: [Admin]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso
 *
 *       403:
 *         description: Acesso negado
 */

// listar todas senhas
router.get("/senhas", admin, controller.listar);

/**
 * @swagger
 * /api/config/atendimento:
 *   get:
 *     summary: Retorna a configuração de atendimento
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração retornada com sucesso
 */

router.get("/config/atendimento", admin, controller.obterConfigAtendimento);

/**
 * @swagger
 * /api/config/atendimento:
 *   put:
 *     summary: Salva a configuração de atendimento
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diasAtendimento
 *             properties:
 *               diasAtendimento:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *               horaInicioEntrega:
 *                 type: string
 *                 example: "08:00"
 *               horaInicioAtendimento:
 *                 type: string
 *                 example: "08:00"
 *               horaFimAtendimento:
 *                 type: string
 *                 example: "18:00"
 *               tempoMedioAtendimentoMinutos:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Configuração salva com sucesso
 *       400:
 *         description: Dados inválidos
 */

router.put("/config/atendimento", admin, controller.salvarConfigAtendimento);

/**
 * @swagger
 * /api/senha/chamar:
 *   put:
 *     summary: Chama a próxima senha da fila
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Próxima senha chamada
 */

// chamar próxima
router.put("/senha/chamar", admin, controller.chamar);

/**
 * @swagger
 * /api/senha/finalizar/{id}:
 *   put:
 *     summary: Finaliza uma senha
 *     tags: [Admin]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Senha finalizada
 */

// finalizar senha
router.put("/senha/finalizar/:id", admin, controller.finalizar);

/**
 * @swagger
 * /api/senha/cancelar/{id}:
 *   put:
 *     summary: Cancela uma senha
 *     tags: [Admin]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Senha cancelada
 */

// cancelar senha
router.put("/senha/cancelar/:id", admin, controller.cancelar);

/* ==========================================
   ATENDENTE
========================================== */

/**
 * @swagger
 * /api/fila:
 *   get:
 *     summary: Retorna fila com estatísticas
 *     tags: [Fila]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Dados da fila
 */

// obter fila com estatísticas
router.get("/fila", atendente, controller.obterFila);

/**
 * @swagger
 * /api/chamar:
 *   put:
 *     summary: Chama próxima senha
 *     tags: [Fila]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Próxima senha chamada
 */

// chamar próxima (atendente também pode)
router.put("/chamar", atendente, controller.chamar);

/**
 * @swagger
 * /api/finalizar/{id}:
 *   put:
 *     summary: Finaliza atendimento
 *     tags: [Fila]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Atendimento finalizado
 */

// finalizar senha (atendente também pode)
router.put("/finalizar/:id", atendente, controller.finalizar);

/**
 * @swagger
 * /api/cancelar/{id}:
 *   put:
 *     summary: Cancela atendimento
 *     tags: [Fila]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Atendimento cancelado
 */

// cancelar senha (atendente também pode)
router.put("/cancelar/:id", atendente, controller.cancelar);

/* ==========================================
   PÚBLICO - STATUS DA FILA
========================================== */

/**
 * @swagger
 * /api/senhas/status:
 *   get:
 *     summary: Retorna status público da fila
 *     tags: [Fila]
 *
 *     responses:
 *       200:
 *         description: Status da fila retornado
 */

// status público da fila (sem autenticação)
router.get("/senhas/status", controller.statusFilaPublica);

module.exports = router;