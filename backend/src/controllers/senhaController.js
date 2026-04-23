const model = require("../models/senhaModel");

exports.criar = async (req, res) => {
    try {

        const { tipo } = req.body;
        const usuario = req.usuario;

        const senha = await model.criarSenha(
            tipo,
            usuario.email
        );

        return res.status(201).json(senha);

    } catch (err) {
        return res.status(500).json({
            erro: err.message
        });
    }
};

exports.listar = async (req, res) => {
    try {
        const senhas = await model.listarSenhas();
        res.json(senhas);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.chamar = async (req, res) => {
    try {
        const senha = await model.chamarProxima();
        res.json(senha);
    } catch (err) {
        res.status(500).json(err);
    }
};