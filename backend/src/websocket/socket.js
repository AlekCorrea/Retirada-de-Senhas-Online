// src/websocket/socket.js
const { Server } = require("socket.io");

module.exports = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.on("connection", (socket) => {
        console.log("Cliente conectado:", socket.id);

        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
        });
    });

    return io;
};

