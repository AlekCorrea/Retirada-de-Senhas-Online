const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const auth = req.headers.authorization;

        if (!auth) {
            return res.status(401).json({
                mensagem: "Token obrigatório"
            });
        }

        if (!auth.startsWith("Bearer ")) {
            return res.status(401).json({
                mensagem: "Formato inválido"
            });
        }

        const token = auth.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Aceita tanto "admin" (legacy) quanto "administrador" (novo)
        if (decoded.perfil !== "admin" && decoded.perfil !== "administrador") {
            return res.status(403).json({
                mensagem: "Acesso negado"
            });
        }

        req.usuario = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            mensagem: "Token inválido ou expirado"
        });
    }
};
