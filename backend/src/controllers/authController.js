const jwt = require("jsonwebtoken");
const db = require("../config/db");

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

exports.loginAdmin = (req, res) => {

    const { email, senha } = req.body;

    const sql = `
        SELECT * FROM admins
        WHERE email = ?
        AND senha = ?
    `;

    db.query(sql, [email, senha], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(401).json({
                mensagem: "Login inválido"
            });
        }

        const admin = result[0];

        const token = jwt.sign(
            {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                perfil: "admin"
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            mensagem: "Login admin realizado",
            token
        });
    });
};