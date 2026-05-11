const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.callback = (req, res) => {

    const token = jwt.sign(
        req.user,
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    // Redirecionar para o ClientView com o token
    res.redirect(`/client?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
};

exports.loginAtendente = (req, res) => {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: "Email e senha são obrigatórios"
        });
    }

    const sql = `
        SELECT id, nome, email, perfil, ativo
        FROM atendentes
        WHERE email = $1
        AND senha = $2
        AND ativo = true
    `;

    db.query(sql, [email, senha], (err, result) => {

        if (err) {
            console.error("Erro ao fazer login:", err);
            return res.status(500).json({
                mensagem: "Erro ao fazer login"
            });
        }

        if (result.rows.length === 0) {
            return res.status(401).json({
                mensagem: "Email ou senha inválidos"
            });
        }

        const atendente = result.rows[0];

        const token = jwt.sign(
            {
                id: atendente.id,
                nome: atendente.nome,
                email: atendente.email,
                perfil: atendente.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            mensagem: "Login realizado com sucesso",
            token,
            usuario: {
                id: atendente.id,
                nome: atendente.nome,
                email: atendente.email,
                perfil: atendente.perfil
            }
        });
    });
};

exports.loginAdmin = (req, res) => {

    const { email, senha } = req.body;

    const sql = `
        SELECT * FROM admins
        WHERE email = $1
        AND senha = $2
    `;

    db.query(sql, [email, senha], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.rows.length === 0) {
            return res.status(401).json({
                mensagem: "Login inválido"
            });
        }

        const admin = result.rows[0];

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