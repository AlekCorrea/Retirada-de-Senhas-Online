const socketIO = require("socket.io");

let io;
const atendentesConectados = new Map();

const contarAtendentesLogados = () => atendentesConectados.size;

const emitirAtendentesLogados = () => {
    if (!io) return;

    io.emit("attendants-online-updated", {
        total: contarAtendentesLogados()
    });
};

const removerSocketAtendente = (socket) => {
    const userId = socket.data?.atendenteUserId;
    if (!userId || !atendentesConectados.has(userId)) return;

    const sockets = atendentesConectados.get(userId);
    sockets.delete(socket.id);

    if (sockets.size === 0) {
        atendentesConectados.delete(userId);
    }

    emitirAtendentesLogados();
};

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);

        socket.on("register-device", (data: { deviceId?: string; role?: string } = {}) => {
            const { deviceId, role } = data;

            if (!deviceId) return;

            socket.join(`device-${deviceId}`);
            socket.deviceId = deviceId;
            socket.role = role || "user";
            console.log(`Device registrado: ${deviceId} (${socket.role})`);
        });

        socket.on("register-attendant", (data: { userId?: number | string; nome?: string } = {}) => {
            const userId = data.userId ? String(data.userId) : null;
            if (!userId) return;

            removerSocketAtendente(socket);

            const sockets = atendentesConectados.get(userId) || new Set();
            sockets.add(socket.id);
            atendentesConectados.set(userId, sockets);
            socket.data.atendenteUserId = userId;
            socket.role = "atendente";
            socket.join("admin");

            emitirAtendentesLogados();
            console.log(`Atendente conectado: ${data.nome || userId} (${socket.id})`);
        });

        socket.on("unregister-attendant", () => {
            removerSocketAtendente(socket);
        });

        socket.on("join-admin", () => {
            socket.join("admin");
            socket.role = "admin";
            console.log(`Painel administrativo conectado: ${socket.id}`);
        });

        socket.on("disconnect", () => {
            removerSocketAtendente(socket);
            console.log(`Cliente desconectado: ${socket.id}`);
        });

        socket.on("error", (error) => {
            console.error(`Erro no socket ${socket.id}:`, error);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO nao foi inicializado");
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO,
    contarAtendentesLogados
};
