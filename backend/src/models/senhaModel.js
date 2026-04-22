const db = require("../config/db");

// Controle simples 3x1 em memória
let contadorPrioritarias = 0;

/* ===================================================
   CRIAR SENHA
   normal -> N001
   prioritario -> P001
=================================================== */
exports.criarSenha = (tipo, email) => {
    return new Promise((resolve, reject) => {

        // verificar se já existe senha ativa
        const sqlVerifica = `
            SELECT * FROM senha
            WHERE email_usuario = ?
            AND status IN ('esperando', 'chamando')
            LIMIT 1
        `;

        db.query(sqlVerifica, [email], (err, existe) => {
            if (err) return reject(err);

            if (existe.length > 0) {
                return reject(
                    new Error("Você já possui uma senha ativa.")
                );
            }

            const prefixo =
                tipo === "prioritario" ? "P" : "N";

            const sqlUltima = `
                SELECT numero
                FROM senha
                WHERE tipo = ?
                ORDER BY id DESC
                LIMIT 1
            `;

            db.query(sqlUltima, [tipo], (err, result) => {
                if (err) return reject(err);

                let proximoNumero = 1;

                if (
                    result.length > 0 &&
                    result[0].numero
                ) {
                    const ultimo =
                        result[0].numero.substring(1);

                    proximoNumero =
                        parseInt(ultimo) + 1;
                }

                const numeroFormatado =
                    prefixo +
                    String(proximoNumero).padStart(3, "0");

                const sqlInsert = `
                    INSERT INTO senha
                    (numero, tipo, status, email_usuario)
                    VALUES (?, ?, 'esperando', ?)
                `;

                db.query(
                    sqlInsert,
                    [numeroFormatado, tipo, email],
                    (err, insertResult) => {
                        if (err) return reject(err);

                        resolve({
                            id: insertResult.insertId,
                            numero: numeroFormatado,
                            tipo,
                            status: "esperando",
                            email_usuario: email
                        });
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
            resolve(result);
        });
    });
};

/* ===================================================
   CHAMAR PRÓXIMA (REGRA 3x1)
   3 prioritárias e 1 normal
=================================================== */
exports.chamarProxima = () => {
    return new Promise((resolve, reject) => {

        // Finaliza quem estava chamando
        const finalizarAnterior = `
            UPDATE senha
            SET status = 'atendido'
            WHERE status = 'chamando'
        `;

        db.query(finalizarAnterior, (err) => {
            if (err) return reject(err);

            let sqlBusca = "";

            // até 3 prioritárias seguidas
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

                // força chamar normal
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

                if (result.length === 0) {
                    return resolve({
                        mensagem: "Nenhuma senha na fila"
                    });
                }

                const senha = result[0];

                const sqlUpdate = `
                    UPDATE senha
                    SET status = 'chamando'
                    WHERE id = ?
                `;

                db.query(sqlUpdate, [senha.id], (err) => {
                    if (err) return reject(err);

                    senha.status = "chamando";

                    if (senha.tipo === "prioritario") {
                        contadorPrioritarias++;
                    } else {
                        contadorPrioritarias = 0;
                    }

                    resolve(senha);
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
            WHERE id = ?
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
            WHERE id = ?
        `;

        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);

            resolve({
                mensagem: "Senha cancelada"
            });
        });
    });
};