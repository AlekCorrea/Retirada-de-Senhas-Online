const socketIO = require("socket.io");

let io;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`✅ Cliente conectado: ${socket.id}`);

        // Evento: Cliente entra na sala de fila
        socket.on("join-queue", (data) => {
            const { email, numero } = data;
            socket.join(`queue-${email}`);
            console.log(`📍 ${email} entrou na fila com senha ${numero}`);
        });

        // Evento: Sair da fila
        socket.on("leave-queue", (data) => {
            const { email } = data;
            socket.leave(`queue-${email}`);
            console.log(`📍 ${email} saiu da fila`);
        });

        // Evento: Atualizar posição na fila
        socket.on("update-queue-position", (data) => {
            const { email, posicao, tempoEstimado } = data;
            io.to(`queue-${email}`).emit("queue-position-updated", {
                posicao,
                tempoEstimado,
                timestamp: new Date()
            });
        });

        // Evento: Chamar próxima senha
        socket.on("call-next", (data) => {
            const { numero, email } = data;
            // Notificar o usuário que foi chamado
            io.to(`queue-${email}`).emit("your-turn", {
                numero,
                mensagem: `Sua senha ${numero} foi chamada!`,
                timestamp: new Date()
            });
            // Broadcast para todos os admins
            io.emit("queue-updated", {
                numero,
                acao: "chamada",
                timestamp: new Date()
            });
        });

        // Evento: Finalizar atendimento
        socket.on("finish-attendance", (data) => {
            const { numero, email } = data;
            io.to(`queue-${email}`).emit("attendance-finished", {
                numero,
                mensagem: "Seu atendimento foi finalizado",
                timestamp: new Date()
            });
            io.emit("queue-updated", {
                numero,
                acao: "finalizado",
                timestamp: new Date()
            });
        });

        // Evento: Cancelar senha
        socket.on("cancel-ticket", (data) => {
            const { numero, email } = data;
            io.to(`queue-${email}`).emit("ticket-cancelled", {
                numero,
                mensagem: "Sua senha foi cancelada",
                timestamp: new Date()
            });
            io.emit("queue-updated", {
                numero,
                acao: "cancelado",
                timestamp: new Date()
            });
        });

        // Evento: Atualizar estatísticas da fila
        socket.on("update-queue-stats", (data) => {
            io.emit("queue-stats-updated", {
                ...data,
                timestamp: new Date()
            });
        });

        // Evento: Desconexão
        socket.on("disconnect", () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
        });

        // Evento: Erro
        socket.on("error", (error) => {
            console.error(`⚠️  Erro no socket ${socket.id}:`, error);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO não foi inicializado");
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO
};
