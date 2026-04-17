const db = require("../config/db");

exports.criarSenha = (tipo) => {
    return new Promise((resolve, reject) => {

        const prefixo = tipo === "prioritario" ? "P" : "N";

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

            if (result.length > 0 && result[0].numero != null) {
                const ultimo = result[0].numero.substring(1);
                proximoNumero = parseInt(ultimo) + 1;
            } else {
                proximoNumero = 1;
            }

            const numeroFormatado =
                prefixo + String(proximoNumero).padStart(3, "0");

            const sqlInsert = `
                INSERT INTO senha (numero, tipo, status)
                VALUES (?, ?, 'esperando')
            `;

            db.query(sqlInsert, [numeroFormatado, tipo], (err, insertResult) => {
                if (err) return reject(err);

                resolve({
                    id: insertResult.insertId,
                    numero: numeroFormatado,
                    tipo,
                    status: "esperando"
                });
            });

            
        });


    });
};

exports.listarSenhas = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM senha ORDER BY id ASC";

        db.query(sql, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

exports.chamarProxima = () => {
    return new Promise((resolve, reject) => {

        const sql = `
            SELECT * FROM senha
            WHERE status = 'esperando'
            ORDER BY 
                CASE 
                    WHEN tipo = 'prioritario' THEN 1
                    ELSE 2
                END,
                id ASC
            LIMIT 1
        `;

        db.query(sql, (err, result) => {
            if (err) return reject(err);

            if (result.length === 0) {
                return resolve({ mensagem: "Nenhuma senha na fila" });
            }

            const senha = result[0];

            const update = `
                UPDATE senha 
                SET status = 'chamando' 
                WHERE id = ?
            `;

                db.query(update, [senha.id], (err) => {
                    if (err) return reject(err);

                    senha.status = "chamando";

                    resolve(senha);
            });
        });
    });
};