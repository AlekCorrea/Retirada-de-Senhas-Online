const db = require("../config/db");
const crypto = require("crypto");
const { contarAtendentesLogados } = require("../websocket/socket");

// Controle simples 3x1 em memória
let contadorPrioritarias = 0;

// Tempo médio de atendimento em minutos (estimativa)
const TEMPO_MEDIO_ATENDIMENTO_PADRAO = 5;
const DIAS_ATENDIMENTO_PADRAO = [0, 1, 2, 3, 4, 5, 6];
const HORA_INICIO_ENTREGA_PADRAO = "08:00";
const HORA_INICIO_ATENDIMENTO_PADRAO = "08:00";
const HORA_FIM_ATENDIMENTO_PADRAO = "18:00";

function normalizarHora(hora, padrao) {
  if (typeof hora !== "string") return padrao;
  const horaLimpa = hora.trim();
  if (!/^\d{2}:\d{2}$/.test(horaLimpa)) return padrao;

  const [horas, minutos] = horaLimpa.split(":").map(Number);
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return padrao;

  return horaLimpa;
}

function minutosDoDia(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function montarDataComHora(dataBase, hora) {
  const data = new Date(dataBase);
  const [horas, minutos] = hora.split(":").map(Number);
  data.setHours(horas, minutos, 0, 0);
  return data;
}

function normalizarDiasAtendimento(dias) {
  if (!Array.isArray(dias)) return DIAS_ATENDIMENTO_PADRAO;

  return [...new Set(
    dias
      .map((dia) => Number(dia))
      .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
  )].sort((a, b) => a - b);
}

function normalizarTempoMedioAtendimento(tempo) {
  const minutos = Number(tempo);
  if (!Number.isFinite(minutos) || minutos <= 0) return TEMPO_MEDIO_ATENDIMENTO_PADRAO;

  return Math.round(minutos * 100) / 100;
}

function obterQuantidadeAtendentesLogados() {
  try {
    return Math.max(0, contarAtendentesLogados());
  } catch (err) {
    return 0;
  }
}

function calcularTempoMedioEfetivo(tempoMedioAtendimentoMinutos, atendentesLogados) {
  const quantidadeAtendentes = Math.max(1, Number(atendentesLogados) || 0);
  const tempoMedio = normalizarTempoMedioAtendimento(tempoMedioAtendimentoMinutos);

  return Math.round((tempoMedio / quantidadeAtendentes) * 100) / 100;
}

function obterConfigAtendimento() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        (
          SELECT valor
          FROM sistema_config
          WHERE chave = 'dias_atendimento'
          LIMIT 1
        ) AS valor,
        EXTRACT(DOW FROM CURRENT_DATE)::integer AS dia_atual
    `;

    db.query(sql, (err, result) => {
      if (err) return reject(err);

      const valor = result.rows[0]?.valor;
      const diaAtual = Number(result.rows[0]?.dia_atual);
      const diasAtendimento = normalizarDiasAtendimento(valor?.diasAtendimento);
      const horaInicioEntrega = normalizarHora(valor?.horaInicioEntrega, HORA_INICIO_ENTREGA_PADRAO);
      const horaInicioAtendimento = normalizarHora(valor?.horaInicioAtendimento, HORA_INICIO_ATENDIMENTO_PADRAO);
      const horaFimAtendimento = normalizarHora(valor?.horaFimAtendimento, HORA_FIM_ATENDIMENTO_PADRAO);
      const tempoMedioAtendimentoMinutos = normalizarTempoMedioAtendimento(valor?.tempoMedioAtendimentoMinutos);
      const atendentesLogados = obterQuantidadeAtendentesLogados();
      const tempoMedioEfetivoMinutos = calcularTempoMedioEfetivo(
        tempoMedioAtendimentoMinutos,
        atendentesLogados
      );
      resolve({
        diasAtendimento,
        horaInicioEntrega,
        horaInicioAtendimento,
        horaFimAtendimento,
        tempoMedioAtendimentoMinutos,
        atendentesLogados,
        tempoMedioEfetivoMinutos,
        diaAtual,
        atendimentoHoje: diasAtendimento.includes(diaAtual)
      });
    });
  });
}

async function verificarDiaAtendimento() {
  const config: any = await obterConfigAtendimento();

  return config;
}

function normalizarAtendenteId(atendenteId) {
  return atendenteId || null;
}

function registrarInicioAtendimento(senha, atendenteId) {
  return new Promise((resolve, reject) => {
    if (!senha?.id) return resolve(null);

    const inicioAtendimento = senha.updated_at || new Date();

    const sql = `
        WITH dados AS (
          SELECT
            $1::integer AS senha_id,
            $2::integer AS atendente_id,
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamp - $4::timestamp)) / 60))::integer AS tempo_espera_minutos
        ),
        atualizado AS (
          UPDATE atendimentos a
          SET atendente_id = COALESCE(d.atendente_id, a.atendente_id),
              tempo_espera_minutos = d.tempo_espera_minutos,
              observacoes = COALESCE(a.observacoes, 'Atendimento iniciado'),
              updated_at = CURRENT_TIMESTAMP
          FROM dados d
          WHERE a.senha_id = d.senha_id
          RETURNING a.*
        ),
        inserido AS (
          INSERT INTO atendimentos
          (senha_id, atendente_id, tempo_espera_minutos, observacoes)
          SELECT senha_id, atendente_id, tempo_espera_minutos, 'Atendimento iniciado'
          FROM dados
          WHERE NOT EXISTS (
            SELECT 1 FROM atendimentos WHERE senha_id = dados.senha_id
          )
          RETURNING *
        )
        SELECT * FROM atualizado
        UNION ALL
        SELECT * FROM inserido
        LIMIT 1
    `;

    db.query(
      sql,
      [
        senha.id,
        normalizarAtendenteId(atendenteId),
        inicioAtendimento,
        senha.created_at
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.rows[0] || null);
      }
    );
  });
}

function registrarConclusaoAtendimento(senha, atendenteId, observacoes) {
  return new Promise((resolve, reject) => {
    if (!senha?.id) return resolve(null);

    const fim = senha.atendido_em || senha.cancelado_em || senha.updated_at || new Date();
    const inicioAtendimento =
      senha.status_anterior === "chamando" ? senha.atendimento_inicio : null;
    const fimEspera = inicioAtendimento || fim;

    const sql = `
        WITH dados AS (
          SELECT
            $1::integer AS senha_id,
            $2::integer AS atendente_id,
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamp - $4::timestamp)) / 60))::integer AS tempo_espera_minutos,
            CASE
              WHEN $5::timestamp IS NULL THEN NULL
              ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($6::timestamp - $5::timestamp)) / 60))::integer
            END AS tempo_atendimento_minutos,
            $7::text AS observacoes
        ),
        atualizado AS (
          UPDATE atendimentos a
          SET atendente_id = COALESCE(d.atendente_id, a.atendente_id),
              tempo_espera_minutos = d.tempo_espera_minutos,
              tempo_atendimento_minutos = d.tempo_atendimento_minutos,
              observacoes = d.observacoes,
              updated_at = CURRENT_TIMESTAMP
          FROM dados d
          WHERE a.senha_id = d.senha_id
          RETURNING a.*
        ),
        inserido AS (
          INSERT INTO atendimentos
          (senha_id, atendente_id, tempo_espera_minutos, tempo_atendimento_minutos, observacoes)
          SELECT senha_id, atendente_id, tempo_espera_minutos, tempo_atendimento_minutos, observacoes
          FROM dados
          WHERE NOT EXISTS (
            SELECT 1 FROM atendimentos WHERE senha_id = dados.senha_id
          )
          RETURNING *
        )
        SELECT * FROM atualizado
        UNION ALL
        SELECT * FROM inserido
        LIMIT 1
    `;

    db.query(
      sql,
      [
        senha.id,
        normalizarAtendenteId(atendenteId),
        fimEspera,
        senha.created_at,
        inicioAtendimento,
        fim,
        observacoes
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.rows[0] || null);
      }
    );
  });
}

function simularOrdemChamada(fila) {
  const senhasChamando = fila.filter(s => s.status === 'chamando');
  const ordemChamada = [];
  let contadorP = 0;
  let filaRestante = fila.filter(s => s.status !== 'chamando');

  while (filaRestante.length > 0) {
    let proxima = null;

    if (contadorP < 3) {
      const idx = filaRestante.findIndex(s => s.tipo === 'prioritario');
      if (idx !== -1) {
        proxima = filaRestante.splice(idx, 1)[0];
        contadorP++;
      } else {
        proxima = filaRestante.shift();
        contadorP = 0;
      }
    } else {
      const idx = filaRestante.findIndex(s => s.tipo === 'normal');
      if (idx !== -1) {
        proxima = filaRestante.splice(idx, 1)[0];
        contadorP = 0;
      } else {
        proxima = filaRestante.shift();
        contadorP++;
      }
    }

    if (proxima) {
      ordemChamada.push(proxima);
    }
  }

  return [...senhasChamando, ...ordemChamada];
}

function obterTempoMedioEstimativa(configAtendimento) {
  return normalizarTempoMedioAtendimento(
    configAtendimento?.tempoMedioEfetivoMinutos || configAtendimento?.tempoMedioAtendimentoMinutos
  );
}

function calcularPrevisaoAtendimento(pessoasNaFrente, configAtendimento, agora = new Date()) {
  const inicioAtendimento = montarDataComHora(agora, configAtendimento.horaInicioAtendimento);
  const fimAtendimento = montarDataComHora(agora, configAtendimento.horaFimAtendimento);
  const basePrevisao = agora > inicioAtendimento ? agora : inicioAtendimento;
  const tempoMedioEstimativa = obterTempoMedioEstimativa(configAtendimento);
  const previsaoAtendimento = new Date(basePrevisao.getTime() + pessoasNaFrente * tempoMedioEstimativa * 60000);

  return {
    previsaoAtendimento,
    previsaoAtendimentoISO: previsaoAtendimento.toISOString(),
    excedeHorarioFinal: previsaoAtendimento > fimAtendimento
  };
}

function calcularEstimativaDaFila(fila, senhaId, configAtendimento) {
  const ordemChamada = simularOrdemChamada(fila);
  const posicao = ordemChamada.findIndex(s => s.id === senhaId);
  const pessoasNaFrente = posicao >= 0 ? posicao : 0;
  const tempoMedioEstimativa = obterTempoMedioEstimativa(configAtendimento);
  const tempoEstimadoMinutos = Math.round((pessoasNaFrente * tempoMedioEstimativa) * 100) / 100;
  const previsao = configAtendimento
    ? calcularPrevisaoAtendimento(pessoasNaFrente, configAtendimento)
    : {};

  return {
    tempoEstimadoMinutos,
    pessoasNaFrente,
    tempoMedioAtendimentoMinutos: configAtendimento?.tempoMedioAtendimentoMinutos || TEMPO_MEDIO_ATENDIMENTO_PADRAO,
    tempoMedioEfetivoMinutos: tempoMedioEstimativa,
    atendentesLogados: configAtendimento?.atendentesLogados || 0,
    ...previsao
  };
}

/**
 * Calcula o tempo estimado de atendimento para uma senha na posição da fila.
 * Considera a regra 3x1 (3 prioritárias, 1 normal).
 * 
 * @param {number} senhaId - ID da senha recém-criada
 * @param {string} tipo - 'normal' ou 'prioritario'
 * @returns {Promise<{tempoEstimadoMinutos: number, pessoasNaFrente: number}>}
 */
function calcularTempoEstimado(senhaId, tipo, configAtendimento = null) {
  return new Promise((resolve, reject) => {
    // Buscar todas as senhas esperando, ordenadas por prioridade e ID
    const sqlFila = `
      SELECT id, tipo, status
      FROM senha
      WHERE status IN ('esperando', 'chamando')
      AND data_atendimento = CURRENT_DATE
      ORDER BY id ASC
    `;

    db.query(sqlFila, (err, result) => {
      if (err) return reject(err);

      resolve(calcularEstimativaDaFila(result.rows, senhaId, configAtendimento));
    });
  });
}

function calcularEstimativaNovaSenha(tipo, configAtendimento) {
  return new Promise((resolve, reject) => {
    const sqlFila = `
      SELECT id, tipo, status
      FROM senha
      WHERE status IN ('esperando', 'chamando')
      AND data_atendimento = CURRENT_DATE
      ORDER BY id ASC
    `;

    db.query(sqlFila, (err, result) => {
      if (err) return reject(err);

      const senhaVirtual = { id: "nova", tipo, status: "esperando" };
      const fila = [...result.rows, senhaVirtual];
      resolve(calcularEstimativaDaFila(fila, senhaVirtual.id, configAtendimento));
    });
  });
}

// Gerar código de verificação aleatório de 8 caracteres (letras e números)
function gerarCodigoVerificacao() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

/* ===================================================
   CRIAR SENHA
   normal -> N001
   prioritario -> P001
   =================================================== */
exports.criarSenha = (tipo, deviceId) => {
  return new Promise(async (resolve, reject) => {
    let configAtendimento: any = null;
    try {
      configAtendimento = await verificarDiaAtendimento();

      if (!configAtendimento.atendimentoHoje) {
        return reject(
          new Error("Nao ha entrega de senhas no dia de hoje.")
        );
      }

      const agora = new Date();
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
      if (minutosAgora < minutosDoDia(configAtendimento.horaInicioEntrega)) {
        return reject(
          new Error("A entrega de senhas ainda nao comecou hoje.")
        );
      }
    } catch (err) {
      return reject(err);
    }

    // Verificar se este dispositivo já possui uma senha ativa
    const sqlVerifica = `
        SELECT * FROM senha
        WHERE dispositivo_id = $1
        AND status IN ('esperando', 'chamando')
        AND data_atendimento = CURRENT_DATE
        LIMIT 1
    `;

    db.query(sqlVerifica, [deviceId], (err, result) => {
      if (err) return reject(err);

      if (result.rows.length > 0) {
        return reject(
          new Error("Este computador já possui uma senha ativa.")
        );
      }

      const prefixo =
        tipo === "prioritario" ? "P" : "N";

      calcularEstimativaNovaSenha(tipo, configAtendimento)
        .then((estimativa: any) => {
          if (estimativa.excedeHorarioFinal) {
            return reject(
              new Error("Nao ha mais disponibilidade de atendimento para hoje.")
            );
          }

      const sqlUltima = `
          SELECT numero
          FROM senha
          WHERE tipo = $1
          AND data_atendimento = CURRENT_DATE
          ORDER BY id DESC
          LIMIT 1
      `;

      db.query(sqlUltima, [tipo], (err, result) => {
        if (err) return reject(err);

        let proximoNumero = 1;

        if (
          result.rows.length > 0 &&
          result.rows[0].numero
        ) {
          const ultimo =
            result.rows[0].numero.substring(1);

          proximoNumero =
            parseInt(ultimo) + 1;
        }

        const numeroFormatado =
          prefixo +
          String(proximoNumero).padStart(3, "0");

        const codigoVerificacao = gerarCodigoVerificacao();

        const sqlInsert = `
            INSERT INTO senha
            (numero, tipo, status, dispositivo_id, codigo_verificacao, data_atendimento)
            VALUES ($1, $2, 'esperando', $3, $4, CURRENT_DATE)
            RETURNING *
        `;

        db.query(
          sqlInsert,
          [numeroFormatado, tipo, deviceId, codigoVerificacao],
          (err, insertResult) => {
            if (err) return reject(err);

            const novaSenhaId = insertResult.rows[0].id;

            calcularTempoEstimado(novaSenhaId, tipo, configAtendimento)
              .then(({ tempoEstimadoMinutos, pessoasNaFrente, tempoMedioAtendimentoMinutos, tempoMedioEfetivoMinutos, atendentesLogados }) => {
                resolve({
                  id: novaSenhaId,
                  numero: numeroFormatado,
                  tipo,
                  status: "esperando",
                  codigo_verificacao: codigoVerificacao,
                  pessoasNaFrente,
                  tempoEstimadoMinutos,
                  tempoMedioAtendimentoMinutos,
                  tempoMedioEfetivoMinutos,
                  atendentesLogados,
                  previsaoAtendimento: estimativa.previsaoAtendimentoISO
                });
              })
              .catch(err => reject(err));
          }
        );
      });
        })
        .catch(err => reject(err));
    });
  });
};

/* ===================================================
   LISTAR TODAS
   =================================================== */
exports.listarSenhas = () => {
  return new Promise((resolve, reject) => {

    const sql = `
        SELECT *
        FROM senha
        WHERE data_atendimento = CURRENT_DATE
        ORDER BY id ASC
    `;

    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result.rows);
    });
  });
};

/* ===================================================
   METRICAS DE ATENDIMENTO
   =================================================== */
exports.obterMetricasAtendimento = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT
          COUNT(*)::integer AS total_atendimentos_metricas,
          COALESCE(ROUND(AVG(tempo_espera_minutos) FILTER (WHERE tempo_espera_minutos IS NOT NULL), 2), 0)::float AS tempo_medio_espera_minutos,
          COALESCE(MAX(tempo_espera_minutos), 0)::integer AS tempo_maximo_espera_minutos,
          COALESCE(MIN(tempo_espera_minutos), 0)::integer AS tempo_minimo_espera_minutos,
          COALESCE(ROUND(AVG(tempo_atendimento_minutos) FILTER (WHERE tempo_atendimento_minutos IS NOT NULL), 2), 0)::float AS tempo_medio_atendimento_minutos,
          COALESCE(MAX(tempo_atendimento_minutos), 0)::integer AS tempo_maximo_atendimento_minutos,
          COALESCE(MIN(tempo_atendimento_minutos), 0)::integer AS tempo_minimo_atendimento_minutos
        FROM atendimentos
        WHERE created_at >= NOW() - INTERVAL '1 day'
    `;

    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result.rows[0]);
    });
  });
};

/* ===================================================
   CHAMAR PRÓXIMA (REGRA 3x1)
   3 prioritárias e 1 normal
   =================================================== */
exports.chamarProxima = (atendenteId, guiche) => {
  return new Promise((resolve, reject) => {

    const finalizarAnterior = `
        WITH anteriores AS (
          SELECT *, updated_at AS atendimento_inicio
          FROM senha
          WHERE status = 'chamando'
          AND data_atendimento = CURRENT_DATE
        ),
        atualizadas AS (
          UPDATE senha s
          SET status = 'atendido',
              atendente_id = COALESCE($1, s.atendente_id),
              updated_at = CURRENT_TIMESTAMP,
              atendido_em = CURRENT_TIMESTAMP
          FROM anteriores a
          WHERE s.id = a.id
          RETURNING s.*, a.status AS status_anterior, a.atendimento_inicio
        )
        SELECT * FROM atualizadas
    `;

    db.query(finalizarAnterior, [normalizarAtendenteId(atendenteId)], (err, finalizadasResult) => {
      if (err) return reject(err);

      let sqlBusca = "";

      if (contadorPrioritarias < 3) {
        sqlBusca = `
            SELECT *
            FROM senha
            WHERE status = 'esperando'
            AND data_atendimento = CURRENT_DATE
            ORDER BY
                CASE
                    WHEN tipo = 'prioritario' THEN 1
                    ELSE 2
                END,
                id ASC
            LIMIT 1
        `;
      } else {
        sqlBusca = `
            SELECT *
            FROM senha
            WHERE status = 'esperando'
            AND data_atendimento = CURRENT_DATE
            ORDER BY
                CASE
                    WHEN tipo = 'normal' THEN 1
                    ELSE 2
                END,
                id ASC
            LIMIT 1
        `;
      }

      db.query(sqlBusca, async (err, result) => {
        if (err) return reject(err);

        if (result.rows.length === 0) {
          try {
            await Promise.all(
              finalizadasResult.rows.map((finalizada) =>
                registrarConclusaoAtendimento(finalizada, atendenteId, "Atendimento finalizado automaticamente ao chamar proxima senha")
              )
            );
          } catch (err) {
            return reject(err);
          }

          return resolve({
            mensagem: "Nenhuma senha na fila",
            finalizadas: finalizadasResult.rows
          });
        }

        const senha = result.rows[0];
        const guicheNormalizado = guiche ? String(guiche).trim().slice(0, 50) : null;

        const sqlUpdate = `
            UPDATE senha
            SET status = 'chamando',
                guiche = COALESCE($2, guiche),
                atendente_id = COALESCE($3, atendente_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        db.query(sqlUpdate, [senha.id, guicheNormalizado, normalizarAtendenteId(atendenteId)], async (err, updateResult) => {
          if (err) return reject(err);

          if (senha.tipo === "prioritario") {
            contadorPrioritarias++;
          } else {
            contadorPrioritarias = 0;
          }

          try {
            await registrarInicioAtendimento(updateResult.rows[0], atendenteId);
            await Promise.all(
              finalizadasResult.rows.map((finalizada) =>
                registrarConclusaoAtendimento(finalizada, atendenteId, "Atendimento finalizado automaticamente ao chamar proxima senha")
              )
            );
          } catch (err) {
            return reject(err);
          }

          resolve({
            ...updateResult.rows[0],
            finalizadas: finalizadasResult.rows
          });
        });
      });
    });
  });
};

/* ===================================================
   FINALIZAR MANUALMENTE
   =================================================== */
exports.finalizarSenha = (id, atendenteId) => {
  return new Promise((resolve, reject) => {

    const sql = `
        WITH anterior AS (
          SELECT *, updated_at AS atendimento_inicio
          FROM senha
          WHERE id = $1
        ),
        atualizada AS (
          UPDATE senha s
          SET status = 'atendido',
              atendente_id = COALESCE($2, s.atendente_id),
              updated_at = CURRENT_TIMESTAMP,
              atendido_em = CURRENT_TIMESTAMP
          FROM anterior a
          WHERE s.id = a.id
          RETURNING s.*, a.status AS status_anterior, a.atendimento_inicio
        )
        SELECT * FROM atualizada
    `;

    db.query(sql, [id, normalizarAtendenteId(atendenteId)], async (err, result) => {
      if (err) return reject(err);

      const senha = result.rows[0] || null;
      if (!senha) return resolve(null);

      try {
        await registrarConclusaoAtendimento(senha, atendenteId, "Atendimento finalizado");
        resolve(senha);
      } catch (err) {
        reject(err);
      }
    });
  });
};

/* ===================================================
   CANCELAR SENHA
   =================================================== */
exports.cancelarSenha = (id, atendenteId) => {
  return new Promise((resolve, reject) => {

    const sql = `
        WITH anterior AS (
          SELECT *, updated_at AS atendimento_inicio
          FROM senha
          WHERE id = $1
        ),
        atualizada AS (
          UPDATE senha s
          SET status = 'cancelado',
              atendente_id = COALESCE($2, s.atendente_id),
              updated_at = CURRENT_TIMESTAMP,
              cancelado_em = CURRENT_TIMESTAMP
          FROM anterior a
          WHERE s.id = a.id
          RETURNING s.*, a.status AS status_anterior, a.atendimento_inicio
        )
        SELECT * FROM atualizada
    `;

    db.query(sql, [id, normalizarAtendenteId(atendenteId)], async (err, result) => {
      if (err) return reject(err);

      const senha = result.rows[0] || null;
      if (!senha) return resolve(null);

      try {
        await registrarConclusaoAtendimento(senha, atendenteId, "Senha cancelada pelo atendimento");
        resolve(senha);
      } catch (err) {
        reject(err);
      }
    });
  });
};

/* ===================================================
   BUSCAR MINHA SENHA POR DEVICE ID
   =================================================== */
exports.buscarMinhaSenha = (deviceId) => {
  return new Promise((resolve, reject) => {

    const sql = `
        SELECT *
        FROM senha
        WHERE dispositivo_id = $1
        AND status IN ('esperando', 'chamando')
        AND data_atendimento = CURRENT_DATE
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sql, [deviceId], async (err, result) => {

      if (err) return reject(err);

      if (result.rows.length === 0) {
        return resolve({
          mensagem: "Nenhuma senha ativa encontrada"
        });
      }

      const minhaSenha = result.rows[0];

      try {
        const configAtendimento = await obterConfigAtendimento();
        const {
          tempoEstimadoMinutos,
          pessoasNaFrente,
          previsaoAtendimentoISO,
          tempoMedioAtendimentoMinutos,
          tempoMedioEfetivoMinutos,
          atendentesLogados
        }: any =
          await calcularTempoEstimado(minhaSenha.id, minhaSenha.tipo, configAtendimento);

          resolve({
            numero: minhaSenha.numero,
            tipo: minhaSenha.tipo,
            status: minhaSenha.status,
            guiche: minhaSenha.guiche,
            codigo_verificacao: minhaSenha.codigo_verificacao,
            pessoasNaFrente,
            tempoEstimadoMinutos,
            tempoMedioAtendimentoMinutos,
            tempoMedioEfetivoMinutos,
            atendentesLogados,
            previsaoAtendimento: previsaoAtendimentoISO
          });
      } catch (err) {
        reject(err);
      }
    });
  });
};

/* ===================================================
   CANCELAR MINHA SENHA POR DEVICE ID
   =================================================== */
exports.cancelarMinhaSenha = (deviceId) => {
  return new Promise((resolve, reject) => {

    const sqlBusca = `
        SELECT *
        FROM senha
        WHERE dispositivo_id = $1
        AND status IN ('esperando', 'chamando')
        AND data_atendimento = CURRENT_DATE
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sqlBusca, [deviceId], (err, result) => {

      if (err) return reject(err);

      if (result.rows.length === 0) {
        return resolve({
          mensagem: "Nenhuma senha ativa encontrada"
        });
      }

      const senha = result.rows[0];

      const sqlUpdate = `
          WITH anterior AS (
            SELECT *, updated_at AS atendimento_inicio
            FROM senha
            WHERE id = $1
          ),
          atualizada AS (
            UPDATE senha s
            SET status = 'cancelado',
                updated_at = CURRENT_TIMESTAMP,
                cancelado_em = CURRENT_TIMESTAMP
            FROM anterior a
            WHERE s.id = a.id
            RETURNING s.*, a.status AS status_anterior, a.atendimento_inicio
          )
          SELECT * FROM atualizada
      `;

      db.query(sqlUpdate, [senha.id], async (err, updateResult) => {

        if (err) return reject(err);

        const senhaCancelada = updateResult.rows[0] || null;
        if (!senhaCancelada) return resolve(null);

        try {
          await registrarConclusaoAtendimento(senhaCancelada, null, "Senha cancelada pelo cliente");
          resolve(senhaCancelada);
        } catch (err) {
          reject(err);
        }
      });
    });
  });
};

/* ===================================================
   BUSCAR HISTÓRICO DE SENHAS POR DEVICE ID
   =================================================== */
exports.buscarHistoricoSenhas = (deviceId) => {
  return new Promise((resolve, reject) => {

    const sql = `
        SELECT *
        FROM senha
        WHERE dispositivo_id = $1
        ORDER BY id DESC
    `;

    db.query(sql, [deviceId], (err, result) => {

      if (err) return reject(err);

      resolve(result.rows);
    });
  });
};

/* ===================================================
   CONFIGURACOES DE ATENDIMENTO
   =================================================== */
exports.obterConfigAtendimento = obterConfigAtendimento;

exports.salvarConfigAtendimento = (config) => {
  return new Promise((resolve, reject) => {
    const diasNormalizados = normalizarDiasAtendimento(config?.diasAtendimento);
    const horaInicioEntrega = normalizarHora(config?.horaInicioEntrega, HORA_INICIO_ENTREGA_PADRAO);
    const horaInicioAtendimento = normalizarHora(config?.horaInicioAtendimento, HORA_INICIO_ATENDIMENTO_PADRAO);
    const horaFimAtendimento = normalizarHora(config?.horaFimAtendimento, HORA_FIM_ATENDIMENTO_PADRAO);
    const tempoMedioAtendimentoMinutos = normalizarTempoMedioAtendimento(config?.tempoMedioAtendimentoMinutos);

    if (minutosDoDia(horaInicioAtendimento) >= minutosDoDia(horaFimAtendimento)) {
      return reject(new Error("A hora de inicio do atendimento deve ser anterior a hora de fim."));
    }

    const sql = `
      INSERT INTO sistema_config (chave, valor)
      VALUES ('dias_atendimento', $1::jsonb)
      ON CONFLICT (chave)
      DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP
      RETURNING valor
    `;

    db.query(
      sql,
      [JSON.stringify({
        diasAtendimento: diasNormalizados,
        horaInicioEntrega,
        horaInicioAtendimento,
        horaFimAtendimento,
        tempoMedioAtendimentoMinutos
      })],
      (err, result) => {
        if (err) return reject(err);

        obterConfigAtendimento()
          .then(resolve)
          .catch(reject);
      }
    );
  });
};
