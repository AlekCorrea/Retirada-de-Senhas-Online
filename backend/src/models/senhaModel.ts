const db = require("../config/db");
const crypto = require("crypto");

// Controle simples 3x1 em memória
let contadorPrioritarias = 0;

// Tempo médio de atendimento em minutos (estimativa)
const TEMPO_MEDIO_ATENDIMENTO = 5;

function normalizarAtendenteId(atendenteId) {
  return atendenteId || null;
}

function registrarAtendimento(senha, atendenteId, observacoes) {
  return new Promise((resolve, reject) => {
    if (!senha?.id) return resolve(null);

    const fim = senha.atendido_em || senha.cancelado_em || senha.updated_at;
    const inicioAtendimento =
      senha.status_anterior === "chamando" ? senha.atendimento_inicio : null;

    const sql = `
        INSERT INTO atendimentos
        (senha_id, atendente_id, tempo_espera_minutos, tempo_atendimento_minutos, observacoes)
        SELECT
          $1,
          $2,
          GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamp - $4::timestamp)) / 60))::integer,
          CASE
            WHEN $5::timestamp IS NULL THEN NULL
            ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamp - $5::timestamp)) / 60))::integer
          END,
          $6
        WHERE NOT EXISTS (
          SELECT 1 FROM atendimentos WHERE senha_id = $1
        )
        RETURNING *
    `;

    db.query(
      sql,
      [
        senha.id,
        normalizarAtendenteId(atendenteId),
        fim,
        senha.created_at,
        inicioAtendimento,
        observacoes
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.rows[0] || null);
      }
    );
  });
}

/**
 * Calcula o tempo estimado de atendimento para uma senha na posição da fila.
 * Considera a regra 3x1 (3 prioritárias, 1 normal).
 * 
 * @param {number} senhaId - ID da senha recém-criada
 * @param {string} tipo - 'normal' ou 'prioritario'
 * @returns {Promise<{tempoEstimadoMinutos: number, pessoasNaFrente: number}>}
 */
function calcularTempoEstimado(senhaId, tipo) {
  return new Promise((resolve, reject) => {
    // Buscar todas as senhas esperando, ordenadas por prioridade e ID
    const sqlFila = `
      SELECT id, tipo
      FROM senha
      WHERE status = 'esperando'
      ORDER BY id ASC
    `;

    db.query(sqlFila, (err, result) => {
      if (err) return reject(err);

      const fila = result.rows;

      // Simular a ordem de chamada com a regra 3x1
      const ordemChamada = [];
      let contadorP = 0;

      // Criar uma cópia da fila para simular
      let filaRestante = [...fila];

      while (filaRestante.length > 0) {
        let proxima = null;

        if (contadorP < 3) {
          // Priorizar prioritários
          const idx = filaRestante.findIndex(s => s.tipo === 'prioritario');
          if (idx !== -1) {
            proxima = filaRestante.splice(idx, 1)[0];
            contadorP++;
          } else {
            proxima = filaRestante.shift();
            contadorP = 0;
          }
        } else {
          // Forçar normal
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

      // Encontrar a posição da senha na ordem de chamada
      const posicao = ordemChamada.findIndex(s => s.id === senhaId);
      const pessoasNaFrente = posicao >= 0 ? posicao : 0;
      const tempoEstimadoMinutos = pessoasNaFrente * TEMPO_MEDIO_ATENDIMENTO;

      resolve({
        tempoEstimadoMinutos,
        pessoasNaFrente
      });
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
  return new Promise((resolve, reject) => {

    // Verificar se este dispositivo já possui uma senha ativa
    const sqlVerifica = `
        SELECT * FROM senha
        WHERE dispositivo_id = $1
        AND status IN ('esperando', 'chamando')
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

      const sqlUltima = `
          SELECT numero
          FROM senha
          WHERE tipo = $1
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
            (numero, tipo, status, dispositivo_id, codigo_verificacao)
            VALUES ($1, $2, 'esperando', $3, $4)
            RETURNING *
        `;

        db.query(
          sqlInsert,
          [numeroFormatado, tipo, deviceId, codigoVerificacao],
          (err, insertResult) => {
            if (err) return reject(err);

            const novaSenhaId = insertResult.rows[0].id;

            // Calcular tempo estimado considerando a regra 3x1
            calcularTempoEstimado(novaSenhaId, tipo)
              .then(({ tempoEstimadoMinutos, pessoasNaFrente }) => {
                resolve({
                  id: novaSenhaId,
                  numero: numeroFormatado,
                  tipo,
                  status: "esperando",
                  codigo_verificacao: codigoVerificacao,
                  pessoasNaFrente,
                  tempoEstimadoMinutos
                });
              })
              .catch(err => reject(err));
          }
        );
      });
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
        ORDER BY id ASC
    `;

    db.query(sql, (err, result) => {
      if (err) return reject(err);
      resolve(result.rows);
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
                registrarAtendimento(finalizada, atendenteId, "Atendimento finalizado automaticamente ao chamar proxima senha")
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
            await Promise.all(
              finalizadasResult.rows.map((finalizada) =>
                registrarAtendimento(finalizada, atendenteId, "Atendimento finalizado automaticamente ao chamar proxima senha")
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
        await registrarAtendimento(senha, atendenteId, "Atendimento finalizado");
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
        await registrarAtendimento(senha, atendenteId, "Senha cancelada pelo atendimento");
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
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sql, [deviceId], (err, result) => {

      if (err) return reject(err);

      if (result.rows.length === 0) {
        return resolve({
          mensagem: "Nenhuma senha ativa encontrada"
        });
      }

      const minhaSenha = result.rows[0];

      // Calcular tempo estimado considerando a regra 3x1
      calcularTempoEstimado(minhaSenha.id, minhaSenha.tipo)
        .then(({ tempoEstimadoMinutos, pessoasNaFrente }) => {
          resolve({
            numero: minhaSenha.numero,
            tipo: minhaSenha.tipo,
            status: minhaSenha.status,
            guiche: minhaSenha.guiche,
            codigo_verificacao: minhaSenha.codigo_verificacao,
            pessoasNaFrente,
            tempoEstimadoMinutos
          });
        })
        .catch(err => reject(err));
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
          await registrarAtendimento(senhaCancelada, null, "Senha cancelada pelo cliente");
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
