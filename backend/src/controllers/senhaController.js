const model = require("../models/senhaModel");

/* =====================================
   CRIAR SENHA
===================================== */
exports.criar = async (req, res) => {
    try {
        const { tipo } = req.body;
        const usuario = req.usuario;

        const senha = await model.criarSenha(
            tipo,
            usuario.email
        );

        const io = req.app.get("io");
        io.emit("filaAtualizada");

        return res.status(201).json(senha);

    } catch (err) {
        return res.status(500).json({
            erro: err.message
        });
    }
};

/* =====================================
   LISTAR TODAS
===================================== */
exports.listar = async (req, res) => {
    try {
        const senhas = await model.listarSenhas();
        res.json(senhas);

    } catch (err) {
        res.status(500).json(err);
    }
};

/* =====================================
   CHAMAR PRÓXIMA
===================================== */
exports.chamar = async (req, res) => {
    try {
        const senha = await model.chamarProxima();

        const io = req.app.get("io");

        io.emit("senhaChamada", senha);
        io.emit("filaAtualizada");

        res.json(senha);

    } catch (err) {
        res.status(500).json(err);
    }
};

/* =====================================
   FINALIZAR
===================================== */
exports.finalizar = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado =
            await model.finalizarSenha(id);

        const io = req.app.get("io");
        io.emit("filaAtualizada");

        res.json(resultado);

    } catch (err) {
        res.status(500).json(err);
    }
};

/* =====================================
   CANCELAR (ADMIN)
===================================== */
exports.cancelar = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado =
            await model.cancelarSenha(id);

        const io = req.app.get("io");
        io.emit("filaAtualizada");

        res.json(resultado);

    } catch (err) {
        res.status(500).json(err);
    }
};

/* =====================================
   MINHA SENHA
===================================== */
exports.minhaSenha = async (req, res) => {
    try {
        const email = req.usuario.email;

        const resultado =
            await model.buscarMinhaSenha(email);

        res.json(resultado);

    } catch (err) {
        res.status(500).json({
            erro: err.message
        });
    }
};

/* =====================================
   CANCELAR MINHA SENHA
===================================== */
exports.cancelarMinhaSenha = async (req, res) => {
    try {
        const email = req.usuario.email;

        const resultado =
            await model.cancelarMinhaSenha(email);

        const io = req.app.get("io");
        io.emit("filaAtualizada");

        res.json(resultado);

    } catch (err) {
        res.status(500).json({
            erro: err.message
        });
    }
};