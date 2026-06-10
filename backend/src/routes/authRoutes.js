const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

// Google OAuth
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), authController.callback);

// Admin login
router.post("/login-admin", authController.loginAdmin);

// Atendente login
router.post("/login-atendente", authController.loginAtendente);

module.exports = router;
