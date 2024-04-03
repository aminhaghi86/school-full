// socket.js
const { Server } = require('socket.io');
let io = null;

exports.initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A client connected");

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });

        // Additional Socket.IO event handling...
    });

    return io;
};

exports.getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
