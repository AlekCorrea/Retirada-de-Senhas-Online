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
        console.log(`Cliente conectado: ${socket.id}`);

        socket.on("register-device", (data: { deviceId?: string; role?: string } = {}) => {
            const { deviceId, role } = data;

            if (!deviceId) return;

            socket.join(`device-${deviceId}`);
            socket.deviceId = deviceId;
            socket.role = role || "user";
            console.log(`Device registrado: ${deviceId} (${socket.role})`);
        });

        socket.on("join-admin", () => {
            socket.join("admin");
            socket.role = "admin";
            console.log(`Painel administrativo conectado: ${socket.id}`);
        });

        socket.on("disconnect", () => {
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
    getIO
};
