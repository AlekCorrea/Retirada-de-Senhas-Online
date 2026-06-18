const db = require('../config/db');
const { hashPassword } = require('../utils/passwordHash');

const PERFIS_VALIDOS = ['atendente', 'administrador'];

const perfilValido = (perfil) => PERFIS_VALIDOS.includes(perfil);

// List all staff users.
exports.listar = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, nome, email, perfil, ativo, created_at, updated_at
      FROM atendentes
      ORDER BY id ASC
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar usuarios:', err);
    return res.status(500).json({ mensagem: 'Erro ao listar usuarios' });
  }
};

// Create a new attendant or administrator.
exports.criar = async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ mensagem: 'Campos obrigatorios ausentes' });
    }

    if (!perfilValido(perfil)) {
      return res.status(400).json({ mensagem: 'Perfil invalido' });
    }

    const senhaHash = await hashPassword(senha);
    const result = await db.query(
      `
        INSERT INTO atendentes (nome, email, senha, perfil, ativo)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, nome, email, perfil, ativo, created_at, updated_at
      `,
      [nome, email, senhaHash, perfil]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar usuario:', err);
    return res.status(500).json({ mensagem: 'Erro ao criar usuario' });
  }
};

// Update staff user data.
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, perfil } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (nome) {
      fields.push(`nome = $${idx++}`);
      values.push(nome);
    }

    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (senha) {
      fields.push(`senha = $${idx++}`);
      values.push(await hashPassword(senha));
    }

    if (perfil) {
      if (!perfilValido(perfil)) {
        return res.status(400).json({ mensagem: 'Perfil invalido' });
      }

      fields.push(`perfil = $${idx++}`);
      values.push(perfil);
    }

    if (fields.length === 0) {
      return res.status(400).json({ mensagem: 'Nenhum campo para atualizar' });
    }

    const result = await db.query(
      `
        UPDATE atendentes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${idx}
        RETURNING id, nome, email, perfil, ativo, created_at, updated_at
      `,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuario nao encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar usuario:', err);
    return res.status(500).json({ mensagem: 'Erro ao atualizar usuario' });
  }
};

// Deactivate (soft delete) a staff user.
exports.desativar = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
        UPDATE atendentes SET ativo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, nome, email, perfil, ativo, created_at, updated_at
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuario nao encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao desativar usuario:', err);
    return res.status(500).json({ mensagem: 'Erro ao desativar usuario' });
  }
};
