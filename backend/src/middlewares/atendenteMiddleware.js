const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                mensagem: "Token não fornecido"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar se é atendente ou administrador
        if (decoded.perfil !== "atendente" && decoded.perfil !== "administrador") {
            return res.status(403).json({
                mensagem: "Acesso negado. Apenas atendentes podem acessar."
            });
        }

        req.usuario = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            mensagem: "Token inválido"
        });
    }
};
