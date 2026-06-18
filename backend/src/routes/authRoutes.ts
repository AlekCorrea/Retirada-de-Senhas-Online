const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Rotas de autenticação
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Login com Google
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Redireciona para autenticação Google
 */

// Google OAuth
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Callback do login Google
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */

// Callback Google
router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), authController.callback);

/**
 * @swagger
 * /auth/login-admin:
 *   post:
 *     summary: Login de administrador
 *     tags: [Auth]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@email.com
 *
 *               senha:
 *                 type: string
 *                 example: 123456
 *
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *
 *       401:
 *         description: Credenciais inválidas
 */

// Admin login
router.post("/login-admin", authController.loginAdmin);

/**
 * @swagger
 * /auth/login-atendente:
 *   post:
 *     summary: Login de atendente
 *     tags: [Auth]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: atendente@email.com
 *
 *               senha:
 *                 type: string
 *                 example: 123456
 *
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *
 *       401:
 *         description: Credenciais inválidas
 */

// Atendente login
router.post("/login-atendente", authController.loginAtendente);

module.exports = router;