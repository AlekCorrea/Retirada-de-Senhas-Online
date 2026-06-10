const db = require('../config/db');

// List all users (attendants and admins)
exports.listar = (req, res) => {
  const sql = `
    SELECT id, nome, email, perfil, ativo, created_at, updated_at
    FROM atendentes
    ORDER BY id ASC
  `;
  db.query(sql, [], (err, result) => {
    if (err) {
      console.error('Erro ao listar usuários:', err);
      return res.status(500).json({ mensagem: 'Erro ao listar usuários' });
    }
    return res.json(result.rows);
  });
};

// Create a new user (attendant or admin)
exports.criar = (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ mensagem: 'Campos obrigatórios ausentes' });
  }
  const sql = `
    INSERT INTO atendentes (nome, email, senha, perfil, ativo)
    VALUES ($1, $2, $3, $4, true)
    RETURNING id, nome, email, perfil, ativo, created_at, updated_at
  `;
  db.query(sql, [nome, email, senha, perfil], (err, result) => {
    if (err) {
      console.error('Erro ao criar usuário:', err);
      return res.status(500).json({ mensagem: 'Erro ao criar usuário' });
    }
    return res.status(201).json(result.rows[0]);
  });
};

// Update user data (nome, email, senha, perfil)
exports.atualizar = (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, perfil } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  if (nome) { fields.push(`nome = $${idx++}`); values.push(nome); }
  if (email) { fields.push(`email = $${idx++}`); values.push(email); }
  if (senha) { fields.push(`senha = $${idx++}`); values.push(senha); }
  if (perfil) { fields.push(`perfil = $${idx++}`); values.push(perfil); }
  if (fields.length === 0) {
    return res.status(400).json({ mensagem: 'Nenhum campo para atualizar' });
  }
  const sql = `
    UPDATE atendentes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING id, nome, email, perfil, ativo, created_at, updated_at
  `;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.status(500).json({ mensagem: 'Erro ao atualizar usuário' });
    }
    return res.json(result.rows[0]);
  });
};

// Deactivate (soft delete) a user
exports.desativar = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE atendentes SET ativo = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, nome, email, perfil, ativo, created_at, updated_at
  `;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erro ao desativar usuário:', err);
      return res.status(500).json({ mensagem: 'Erro ao desativar usuário' });
    }
    return res.json(result.rows[0]);
  });
};
