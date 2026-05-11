const db = require("../config/db");
const crypto = require("crypto");

// Controle simples 3x1 em memória
let contadorPrioritarias = 0;

// Tempo médio de atendimento em minutos (estimativa)
const TEMPO_MEDIO_ATENDIMENTO = 5;

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
exports.chamarProxima = () => {
  return new Promise((resolve, reject) => {

    const finalizarAnterior = `
        UPDATE senha
        SET status = 'atendido'
        WHERE status = 'chamando'
    `;

    db.query(finalizarAnterior, (err) => {
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

      db.query(sqlBusca, (err, result) => {
        if (err) return reject(err);

        if (result.rows.length === 0) {
          return resolve({
            mensagem: "Nenhuma senha na fila"
          });
        }

        const senha = result.rows[0];

        const sqlUpdate = `
            UPDATE senha
            SET status = 'chamando'
            WHERE id = $1
            RETURNING *
        `;

        db.query(sqlUpdate, [senha.id], (err, updateResult) => {
          if (err) return reject(err);

          if (senha.tipo === "prioritario") {
            contadorPrioritarias++;
          } else {
            contadorPrioritarias = 0;
          }

          resolve(updateResult.rows[0]);
        });
      });
    });
  });
};

/* ===================================================
   FINALIZAR MANUALMENTE
   =================================================== */
exports.finalizarSenha = (id) => {
  return new Promise((resolve, reject) => {

    const sql = `
        UPDATE senha
        SET status = 'atendido'
        WHERE id = $1
        RETURNING *
    `;

    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);

      resolve({
        mensagem: "Senha finalizada"
      });
    });
  });
};

/* ===================================================
   CANCELAR SENHA
   =================================================== */
exports.cancelarSenha = (id) => {
  return new Promise((resolve, reject) => {

    const sql = `
        UPDATE senha
        SET status = 'cancelado'
        WHERE id = $1
        RETURNING *
    `;

    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);

      resolve({
        mensagem: "Senha cancelada"
      });
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

      if (senha.status === "chamando") {
        return resolve({
          mensagem: "Sua senha já está em atendimento e não pode ser cancelada."
        });
      }

      const sqlUpdate = `
          UPDATE senha
          SET status = 'cancelado'
          WHERE id = $1
          RETURNING *
      `;

      db.query(sqlUpdate, [senha.id], (err, updateResult) => {

        if (err) return reject(err);

        resolve({
          mensagem: "Senha cancelada com sucesso"
        });
      });
    });
  });
};