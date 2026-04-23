const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({
            mensagem: "Token obrigatório"
        });
    }

    const token = auth.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.perfil !== "admin") {
            return res.status(403).json({
                mensagem: "Acesso negado"
            });
        }

        req.usuario = decoded;

        next();

    } catch {
        return res.status(401).json({
            mensagem: "Token inválido"
        });
    }
};