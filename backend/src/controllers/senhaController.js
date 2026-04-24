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

exports.finalizar = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await model.finalizarSenha(id);
        res.json(resultado);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.cancelar = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await model.cancelarSenha(id);
        res.json(resultado);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.minhaSenha = async (req, res) => {
    try {

        const email = req.usuario.email;

        const resultado = await model.buscarMinhaSenha(email);

        res.json(resultado);

    } catch (err) {
        res.status(500).json({
            erro: err.message
        });
    }
};


exports.cancelarMinhaSenha = async (req, res) => {
    try {
        const email = req.usuario.email;

        const resultado =
            await model.cancelarMinhaSenha(email);

        res.json(resultado);

    } catch (err) {
        res.status(500).json({
            erro: err.message
        });
    }
};