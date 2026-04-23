const router = require("express").Router();
const passport = require("passport");
const controller = require("../controllers/authController");

router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get("/google/callback",
    passport.authenticate("google", {
        session: false
    }),
    controller.callback
);

module.exports = router;