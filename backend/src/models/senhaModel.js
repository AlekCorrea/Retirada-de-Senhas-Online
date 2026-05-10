const db = require("../config/db");
const crypto = require("crypto");

// Controle simples 3x1 em memória
let contadorPrioritarias = 0;

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
exports.criarSenha = (tipo, email, nome, deviceId) => {
  return new Promise((resolve, reject) => {

    // verificar se já existe senha ativa
    const sqlVerifica = `
        SELECT * FROM senha
        WHERE email_usuario = $1
        AND status IN ('esperando', 'chamando')
        LIMIT 1
    `;

    db.query(sqlVerifica, [email], (err, result) => {
      if (err) return reject(err);

      if (result.rows.length > 0) {
        return reject(
          new Error("Você já possui uma senha ativa.")
        );
      }

      // Verificar se a mesma pessoa já retirou uma senha hoje
      const hoje = new Date().toISOString().split('T')[0];
      const sqlVerificaHoje = `
          SELECT * FROM senha
          WHERE (email_usuario = $1 OR dispositivo_id = $2)
          AND DATE(created_at) = $3
          AND status IN ('esperando', 'chamando')
          LIMIT 1
      `;

      db.query(sqlVerificaHoje, [email, deviceId, hoje], (err, resultHoje) => {
        if (err) return reject(err);

        if (resultHoje.rows.length > 0) {
          return reject(
            new Error("Você já retirou uma senha hoje. Volte amanhã para retirar outra.")
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
              (numero, tipo, status, email_usuario, nome_usuario, dispositivo_id, codigo_verificacao)
              VALUES ($1, $2, 'esperando', $3, $4, $5, $6)
              RETURNING *
          `;

          db.query(
            sqlInsert,
            [numeroFormatado, tipo, email, nome, deviceId, codigoVerificacao],
            (err, insertResult) => {
              if (err) return reject(err);

              const novaSenhaId = insertResult.rows[0].id;

              // Contar pessoas na frente
              const sqlFila = `
                  SELECT COUNT(*) AS total
                  FROM senha
                  WHERE status = 'esperando'
                  AND id < $1
              `;

              db.query(sqlFila, [novaSenhaId], (err, fila) => {
                if (err) return reject(err);

                resolve({
                  id: novaSenhaId,
                  numero: numeroFormatado,
                  tipo,
                  status: "esperando",
                  email_usuario: email,
                  nome_usuario: nome,
                  codigo_verificacao: codigoVerificacao,
                  pessoasNaFrente: parseInt(fila.rows[0].total)
                });
              });
            }
          );
        });
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

exports.buscarMinhaSenha = (email) => {
  return new Promise((resolve, reject) => {

    const sql = `
        SELECT *
        FROM senha
        WHERE email_usuario = $1
        AND status IN ('esperando', 'chamando')
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sql, [email], (err, result) => {

      if (err) return reject(err);

      if (result.rows.length === 0) {
        return resolve({
          mensagem: "Você não possui senha ativa"
        });
      }

      const minhaSenha = result.rows[0];

      const sqlFila = `
          SELECT COUNT(*) AS total
          FROM senha
          WHERE status = 'esperando'
          AND id < $1
      `;

      db.query(sqlFila, [minhaSenha.id], (err, fila) => {

        if (err) return reject(err);

        resolve({
          numero: minhaSenha.numero,
          tipo: minhaSenha.tipo,
          status: minhaSenha.status,
          codigo_verificacao: minhaSenha.codigo_verificacao,
          pessoasNaFrente: parseInt(fila.rows[0].total)
        });
      });
    });
  });
};

exports.cancelarMinhaSenha = (email) => {
  return new Promise((resolve, reject) => {

    const sqlBusca = `
        SELECT *
        FROM senha
        WHERE email_usuario = $1
        AND status IN ('esperando', 'chamando')
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(sqlBusca, [email], (err, result) => {

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
