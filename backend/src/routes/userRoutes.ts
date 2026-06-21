const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const admin = require('../middlewares/adminMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Usuários
 *     description: Gerenciamento de atendentes e administradores (tabela "atendentes")
 */

/* ==========================================
   USUÁRIOS - ADMIN
========================================== */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuários]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Lista de usuários retornada
 *
 *       403:
 *         description: Acesso negado
 */

// Listar usuários
router.get('/', admin, userController.listar);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Cria novo usuário
 *     tags: [Usuários]
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
 *               - nome
 *               - email
 *               - senha
 *               - perfil
 *
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João Silva
 *
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *
 *               senha:
 *                 type: string
 *                 example: 123456
 *
 *               perfil:
 *                 type: string
 *                 enum:
 *                   - atendente
 *                   - administrador
 *                 example: atendente
 *
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *
 *       400:
 *         description: Dados inválidos
 */

// Criar novo usuário (atendente ou admin)
router.post('/', admin, userController.criar);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza usuário existente
 *     tags: [Usuários]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João Silva
 *
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *
 *               senha:
 *                 type: string
 *                 description: Se informada, redefine a senha do usuário
 *                 example: novaSenha123
 *
 *               perfil:
 *                 type: string
 *                 enum:
 *                   - atendente
 *                   - administrador
 *                 example: atendente
 *
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *
 *       400:
 *         description: Dados inválidos ou nenhum campo informado
 *
 *       404:
 *         description: Usuário não encontrado
 */

// Atualizar usuário existente
router.put('/:id', admin, userController.atualizar);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Desativa usuário
 *     tags: [Usuários]
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
 *         description: Usuário desativado
 *
 *       404:
 *         description: Usuário não encontrado
 */

// Desativar (soft delete) usuário
router.delete('/:id', admin, userController.desativar);

module.exports = router;