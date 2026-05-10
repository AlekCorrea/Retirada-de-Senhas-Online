-- Create tables for the password management system

-- Table: atendentes (attendants/staff)
CREATE TABLE IF NOT EXISTS atendentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('atendente', 'administrador')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: admins (legacy - kept for compatibility)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: senha (passwords/tickets)
CREATE TABLE IF NOT EXISTS senha (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('normal', 'prioritario')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('esperando', 'chamando', 'atendido', 'cancelado')),
    email_usuario VARCHAR(255) NOT NULL,
    nome_usuario VARCHAR(255),
    dispositivo_id VARCHAR(255),
    codigo_verificacao VARCHAR(10),
    atendente_id INTEGER REFERENCES atendentes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atendido_em TIMESTAMP,
    cancelado_em TIMESTAMP
);

-- Table: atendimentos (attendance history)
CREATE TABLE IF NOT EXISTS atendimentos (
    id SERIAL PRIMARY KEY,
    senha_id INTEGER NOT NULL REFERENCES senha(id),
    atendente_id INTEGER REFERENCES atendentes(id),
    tempo_espera_minutos INTEGER,
    tempo_atendimento_minutos INTEGER,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: usuarios (users - clients)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    foto_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_senha_status ON senha(status);
CREATE INDEX IF NOT EXISTS idx_senha_tipo ON senha(tipo);
CREATE INDEX IF NOT EXISTS idx_senha_email ON senha(email_usuario);
CREATE INDEX IF NOT EXISTS idx_senha_dispositivo ON senha(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_senha_numero ON senha(numero);
CREATE INDEX IF NOT EXISTS idx_senha_codigo ON senha(codigo_verificacao);
CREATE INDEX IF NOT EXISTS idx_atendimentos_senha_id ON atendimentos(senha_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_atendente_id ON atendimentos(atendente_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX IF NOT EXISTS idx_atendentes_email ON atendentes(email);
CREATE INDEX IF NOT EXISTS idx_atendentes_perfil ON atendentes(perfil);

-- Insert default users
-- Atendente: atendente@senhas.com / senha123
-- Administrador: admin@senhas.com / admin123
INSERT INTO atendentes (nome, email, senha, perfil, ativo) VALUES 
('Atendente Padrão', 'atendente@senhas.com', 'senha123', 'atendente', true),
('Administrador Padrão', 'admin@senhas.com', 'admin123', 'administrador', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default admin user (legacy - for compatibility)
INSERT INTO admins (nome, email, senha) VALUES 
('Administrador', 'admin@senhas.com', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- Create view for queue statistics
CREATE OR REPLACE VIEW vw_fila_status AS
SELECT 
    COUNT(*) as total_senhas,
    SUM(CASE WHEN status = 'esperando' THEN 1 ELSE 0 END) as esperando,
    SUM(CASE WHEN status = 'chamando' THEN 1 ELSE 0 END) as chamando,
    SUM(CASE WHEN status = 'atendido' THEN 1 ELSE 0 END) as atendido,
    SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelado,
    SUM(CASE WHEN tipo = 'prioritario' THEN 1 ELSE 0 END) as prioritarias,
    SUM(CASE WHEN tipo = 'normal' THEN 1 ELSE 0 END) as normais
FROM senha;

-- Create view for average waiting time
CREATE OR REPLACE VIEW vw_tempo_medio_espera AS
SELECT 
    AVG(tempo_espera_minutos) as tempo_medio_minutos,
    MAX(tempo_espera_minutos) as tempo_maximo_minutos,
    MIN(tempo_espera_minutos) as tempo_minimo_minutos,
    COUNT(*) as total_atendimentos
FROM atendimentos
WHERE created_at >= NOW() - INTERVAL '1 day';
