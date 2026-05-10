const model = require("../models/senhaModel");
const crypto = require("crypto");

// Criar senha pública (sem autenticação) - sem nome e email
exports.criarPublica = async (req, res) => {
  try {
    const { tipo, deviceId } = req.body;

    if (!tipo) {
      return res.status(400).json({
        erro: "Tipo é obrigatório"
      });
    }

    // Se não veio deviceId, gerar um novo
    const idDispositivo = deviceId || crypto.randomUUID();

    const senha = await model.criarSenha(tipo, idDispositivo);

    return res.status(201).json(senha);

  } catch (err) {
    console.error("Erro ao criar senha pública:", err);
    return res.status(500).json({
      erro: err.message || "Erro ao retirar senha"
    });
  }
};

exports.criar = async (req, res) => {
  try {
    const { tipo, deviceId } = req.body;

    const idDispositivo = deviceId || crypto.randomUUID();

    const senha = await model.criarSenha(tipo, idDispositivo);

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
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        erro: "deviceId é obrigatório"
      });
    }

    const resultado = await model.buscarMinhaSenha(deviceId);

    res.json(resultado);

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};

exports.cancelarMinhaSenha = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        erro: "deviceId é obrigatório"
      });
    }

    const resultado =
      await model.cancelarMinhaSenha(deviceId);

    res.json(resultado);

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};

exports.obterFila = async (req, res) => {
  try {
    const senhas = await model.listarSenhas();

    const stats = {
      esperando: senhas.filter(s => s.status === 'esperando').length,
      chamando: senhas.filter(s => s.status === 'chamando').length,
      atendido: senhas.filter(s => s.status === 'atendido').length,
      cancelado: senhas.filter(s => s.status === 'cancelado').length,
      normais: senhas.filter(s => s.tipo === 'normal').length,
      prioritarias: senhas.filter(s => s.tipo === 'prioritario').length,
      total: senhas.length
    };

    res.json({
      senhas: senhas,
      stats: stats
    });

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};

// Endpoint público para status da fila (sem autenticação)
exports.statusFilaPublica = async (req, res) => {
  try {
    const senhas = await model.listarSenhas();

    const stats = {
      esperando: senhas.filter(s => s.status === 'esperando').length,
      chamando: senhas.filter(s => s.status === 'chamando').length,
      atendido: senhas.filter(s => s.status === 'atendido').length,
      normais: senhas.filter(s => s.tipo === 'normal').length,
      prioritarias: senhas.filter(s => s.tipo === 'prioritario').length,
      total: senhas.length
    };

    res.json(stats);

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};
