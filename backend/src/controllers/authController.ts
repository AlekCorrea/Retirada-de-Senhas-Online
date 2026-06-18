const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { hashPassword, isBcryptHash, verifyPassword } = require("../utils/passwordHash");

const JWT_SECRET = process.env.JWT_SECRET || "seu_secret_aqui";

const migratePlainPassword = async (userId, plainPassword, storedPassword) => {
    if (isBcryptHash(storedPassword)) return;

    const hashedPassword = await hashPassword(plainPassword);
    await db.query(
        "UPDATE atendentes SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hashedPassword, userId]
    );
};

const createToken = (usuario) => jwt.sign(
    {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
    },
    JWT_SECRET,
    { expiresIn: "8h" }
);

const loginStaff = async (req, res, allowedProfiles = ["atendente", "administrador"]) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Email e senha sao obrigatorios"
            });
        }

        const result = await db.query(
            `
                SELECT id, nome, email, senha, perfil, ativo
                FROM atendentes
                WHERE email = $1
                AND ativo = true
                LIMIT 1
            `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                mensagem: "Email ou senha invalidos"
            });
        }

        const usuario = result.rows[0];

        if (!allowedProfiles.includes(usuario.perfil)) {
            return res.status(403).json({
                mensagem: "Acesso negado"
            });
        }

        const passwordOk = await verifyPassword(senha, usuario.senha);

        if (!passwordOk) {
            return res.status(401).json({
                mensagem: "Email ou senha invalidos"
            });
        }

        await migratePlainPassword(usuario.id, senha, usuario.senha);

        const safeUser = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        };

        return res.json({
            mensagem: "Login realizado com sucesso",
            token: createToken(safeUser),
            usuario: safeUser
        });
    } catch (err) {
        console.error("Erro ao fazer login:", err);
        return res.status(500).json({
            mensagem: "Erro ao fazer login"
        });
    }
};

exports.callback = (req, res) => {

    const token = jwt.sign(
        req.user,
        JWT_SECRET,
        { expiresIn: "1d" }
    );

    const senha = req.query.senha;
    let redirectUrl = `/client?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`;

    if (senha) {
        redirectUrl += `&senha=${encodeURIComponent(senha)}`;
    }

    res.redirect(redirectUrl);
};

exports.loginAtendente = (req, res) => {
    return loginStaff(req, res, ["atendente", "administrador"]);
};

exports.loginAdmin = (req, res) => {
    return loginStaff(req, res, ["administrador"]);
};
