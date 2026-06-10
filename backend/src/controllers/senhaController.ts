const model = require("../models/senhaModel");
const crypto = require("crypto");
const { getIO } = require("../websocket/socket");

const montarStats = (senhas) => ({
  esperando: senhas.filter(s => s.status === 'esperando').length,
  chamando: senhas.filter(s => s.status === 'chamando').length,
  atendido: senhas.filter(s => s.status === 'atendido').length,
  cancelado: senhas.filter(s => s.status === 'cancelado').length,
  normais: senhas.filter(s => s.tipo === 'normal').length,
  prioritarias: senhas.filter(s => s.tipo === 'prioritario').length,
  total: senhas.length
});

const emitQueueEvent = async (event, senha, extra: Record<string, any> = {}) => {
  try {
    const io = getIO();
    const publicPayload = {
      event,
      acao: extra.acao,
      numero: senha?.numero,
      status: senha?.status,
      tipo: senha?.tipo,
      guiche: senha?.guiche,
      timestamp: new Date()
    };
    const payload = {
      event,
      senha,
      numero: senha?.numero,
      deviceId: senha?.dispositivo_id,
      guiche: senha?.guiche,
      timestamp: new Date(),
      ...extra
    };

    io.to("admin").emit(event, payload);
    io.emit("queue-updated", publicPayload);

    if (senha?.dispositivo_id) {
      io.to(`device-${senha.dispositivo_id}`).emit(event, payload);
    }

    const senhas = await model.listarSenhas();
    io.emit("queue-stats-updated", montarStats(senhas));
  } catch (err) {
    console.error("Erro ao emitir evento Socket.IO:", err.message);
  }
};

const emitDeviceEvent = (event, senha, extra: Record<string, any> = {}) => {
  try {
    if (!senha?.dispositivo_id) return;

    getIO().to(`device-${senha.dispositivo_id}`).emit(event, {
      event,
      senha,
      numero: senha.numero,
      deviceId: senha.dispositivo_id,
      timestamp: new Date(),
      ...extra
    });
  } catch (err) {
    console.error("Erro ao emitir evento Socket.IO para dispositivo:", err.message);
  }
};

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

    await emitQueueEvent("ticket-created", senha, { acao: "criada" });

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

    await emitQueueEvent("ticket-created", senha, { acao: "criada" });

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
    const { guiche } = req.body || {};
    const senha = await model.chamarProxima(req.usuario?.id, guiche);
    if (senha.finalizadas) {
      senha.finalizadas.forEach((finalizada) => {
        emitDeviceEvent("attendance-finished", finalizada, { acao: "finalizado" });
      });
    }

    if (senha.numero) {
      await emitQueueEvent("ticket-called", senha, { acao: "chamada" });
      emitDeviceEvent("your-turn", senha, {
        acao: "chamada",
        mensagem: `Sua senha ${senha.numero} foi chamada!`
      });
    } else {
      await emitQueueEvent("queue-updated", null, { acao: "sem_senha" });
    }

    res.json(senha);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.finalizar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await model.finalizarSenha(id, req.usuario?.id);
    if (resultado) {
      await emitQueueEvent("attendance-finished", resultado, { acao: "finalizado" });
    }
    res.json(resultado);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await model.cancelarSenha(id, req.usuario?.id);
    if (resultado?.id) {
      await emitQueueEvent("ticket-cancelled", resultado, { acao: "cancelado" });
    }
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

// Versão pública (sem autenticação) para o TicketView
exports.minhaSenhaPublica = async (req, res) => {
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

    if (resultado?.id) {
      await emitQueueEvent("ticket-cancelled", resultado, { acao: "cancelado" });
    }

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

    const stats = montarStats(senhas);

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

// Endpoint publico para o painel local/TV (somente leitura)
exports.obterPainelPublico = async (req, res) => {
  try {
    const senhas = await model.listarSenhas();
    const stats = montarStats(senhas);
    const chamadaAtual = [...senhas].reverse().find(s => s.status === "chamando") || null;
    const ultimasChamadas = senhas
      .filter(s => s.status === "chamando" || s.status === "atendido")
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        numero: s.numero,
        tipo: s.tipo,
        status: s.status,
        guiche: s.guiche,
        updated_at: s.updated_at
      }));

    res.json({
      chamadaAtual: chamadaAtual
        ? {
            id: chamadaAtual.id,
            numero: chamadaAtual.numero,
            tipo: chamadaAtual.tipo,
            status: chamadaAtual.status,
            guiche: chamadaAtual.guiche,
            updated_at: chamadaAtual.updated_at
          }
        : null,
      ultimasChamadas,
      stats
    });

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};

exports.cancelarMinhaSenhaPublica = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        erro: "deviceId é obrigatório"
      });
    }

    const resultado = await model.cancelarMinhaSenha(deviceId);

    if (resultado) {
      await emitQueueEvent("ticket-cancelled", resultado, { acao: "cancelado" });
    }

    res.json(resultado);

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

    const stats = montarStats(senhas);

    res.json(stats);

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};

// Endpoint para buscar histórico de senhas do usuário
exports.meuHistorico = async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        erro: "deviceId é obrigatório"
      });
    }

    const historico = await model.buscarHistoricoSenhas(deviceId);
    res.json(historico);

  } catch (err) {
    res.status(500).json({
      erro: err.message
    });
  }
};
