require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const db = require("./config/db");
const { hashPassword, isBcryptHash } = require("./utils/passwordHash");

const app = express();
const server = http.createServer(app);

// Importar Socket.IO
const { initializeSocket } = require("./websocket/socket");


// Importar configurações
require("./config/passport");

const migrateLegacyStaffPasswords = async () => {
    try {
        const result = await db.query("SELECT id, senha FROM atendentes");
        const legacyUsers = result.rows.filter((user) => !isBcryptHash(user.senha));

        await Promise.all(legacyUsers.map(async (user) => {
            const senhaHash = await hashPassword(user.senha);
            return db.query(
                "UPDATE atendentes SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                [senhaHash, user.id]
            );
        }));

        if (legacyUsers.length > 0) {
            console.log(`Senhas legadas migradas para bcrypt: ${legacyUsers.length}`);
        }
    } catch (err) {
        console.error("Erro ao migrar senhas legadas:", err.message);
    }
};

const ensureGuicheColumn = async () => {
    try {
        await db.query("ALTER TABLE senha ADD COLUMN IF NOT EXISTS guiche VARCHAR(50)");
    } catch (err) {
        console.error("Erro ao garantir coluna guiche:", err.message);
    }
};

const ensureAttendanceConfigSchema = async () => {
    try {
        await db.query("ALTER TABLE senha ADD COLUMN IF NOT EXISTS data_atendimento DATE DEFAULT CURRENT_DATE");
        await db.query("UPDATE senha SET data_atendimento = COALESCE(data_atendimento, created_at::date)");
        await db.query("ALTER TABLE senha ALTER COLUMN data_atendimento SET NOT NULL");
        await db.query("ALTER TABLE senha DROP CONSTRAINT IF EXISTS senha_numero_key");
        await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_senha_numero_data ON senha(numero, data_atendimento)");
        await db.query("CREATE INDEX IF NOT EXISTS idx_senha_data_atendimento ON senha(data_atendimento)");
        await db.query(`
            CREATE TABLE IF NOT EXISTS sistema_config (
                chave VARCHAR(100) PRIMARY KEY,
                valor JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            INSERT INTO sistema_config (chave, valor)
            VALUES ('dias_atendimento', '{"diasAtendimento":[0,1,2,3,4,5,6],"horaInicioEntrega":"08:00","horaInicioAtendimento":"08:00","horaFimAtendimento":"18:00","tempoMedioAtendimentoMinutos":5}'::jsonb)
            ON CONFLICT (chave) DO NOTHING
        `);
    } catch (err) {
        console.error("Erro ao garantir schema de configuracoes:", err.message);
    }
};

// Importar rotas
const authRoutes = require("./routes/authRoutes");
const senhaRoutes = require("./routes/senhaRoutes");
const userRoutes = require("./routes/userRoutes");


const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger").default;

// ============================================
// MIDDLEWARES DE SEGURANÇA
// ============================================

// Helmet para segurança HTTP
app.use(helmet());


app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));

// Morgan para logging
app.use(morgan("combined"));

// Rate limiting - desabilitado para evitar 429 com polling
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100
// });
// app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session
const session = require("express-session");
app.use(session({
    secret: process.env.JWT_SECRET || "seu_secret_aqui",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mudar para true em produção com HTTPS
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// INICIALIZAR SOCKET.IO
// ============================================
initializeSocket(server);

// ============================================
// ROTAS
// ============================================

// Rota de teste
app.get("/", (req, res) => {
    res.json({
        mensagem: "API de Senhas Online funcionando ✅",
        versao: "1.0.0",
        status: "online"
    });
});

// Rota de health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date()
    });
});

// Rotas de autenticação
app.use("/auth", authRoutes);

// Rotas de senhas
app.use("/api", senhaRoutes);
// Rotas de gerenciamento de usuários (apenas admins)
app.use("/api/users", userRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// 404 - Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada",
        path: req.path,
        method: req.method
    });
});

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error("❌ Erro:", err);
    res.status(err.status || 500).json({
        erro: err.message || "Erro interno do servidor",
        status: err.status || 500
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;

Promise.all([migrateLegacyStaffPasswords(), ensureGuicheColumn(), ensureAttendanceConfigSchema()]).finally(() => {
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎫 SISTEMA DE SENHAS ONLINE PARA ATENDIMENTO           ║
║                                                            ║
║   ✅ Servidor rodando em http://localhost:${PORT}         ║
║   ✅ Socket.IO ativo em ws://localhost:${PORT}            ║
║   ✅ Ambiente: ${process.env.NODE_ENV || "development"}   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Promise rejeitada não tratada:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Exceção não capturada:", error);
    process.exit(1);
});

module.exports = server;