const jwt = require("jsonwebtoken");

exports.callback = (req, res) => {

    const token = jwt.sign(
        req.user,
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        mensagem: "Login realizado",
        token,
        usuario: req.user
    });
};