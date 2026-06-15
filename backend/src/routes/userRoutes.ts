const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const admin = require('../middlewares/adminMiddleware');

// Todas as rotas abaixo são protegidas: apenas administradores podem gerenciar usuários

// Listar usuários
router.get('/', admin, userController.listar);

// Criar novo usuário (atendente ou admin)
router.post('/', admin, userController.criar);

// Atualizar usuário existente
router.put('/:id', admin, userController.atualizar);

// Desativar (soft delete) usuário
router.delete('/:id', admin, userController.desativar);

module.exports = router;
