// New file: socket-manager.js
let io = null;
const teacherSockets = {};

function initializeSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`${socket.id} A client connected`);

    // Handling teacher connections with their ids
    const teacherId = socket.handshake.query.teacherId;
    if (teacherId) {
      teacherSockets[teacherId] = socket.id;
      
      socket.on("disconnect", () => {
        console.log(`Client ${socket.id} disconnected`);
        delete teacherSockets[teacherId];
      });
    }

    // ... rest of your connection handling code ...
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

function getTeacherSocketId(teacherId) {
  return teacherSockets[teacherId];
}

module.exports = {
  initializeSocket,
  getIO,
  getTeacherSocketId
};
