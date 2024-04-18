const { Server } = require("socket.io");
let io = null;
const teacherSockets = {};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  
  io.on("connection", (socket) => {
    
    console.log(`${socket.id} client connected`);
    socket.on("teacherConnected", (teacherId) => {
      console.log(`Teacher with ID ${teacherId} connected.`);
      teacherSockets[teacherId] = socket.id; // Store teacher's socket ID
    });
  
    socket.on("connect_error", (err) => {
      console.error(`connect_error due to ${err.message}`);
    });


    socket.on("disconnect", () => {
      // Remove teacher's socket ID on disconnection
      const disconnectedTeacherId = Object.keys(teacherSockets).find(
        (key) => teacherSockets[key] === socket.id
      );
      if (disconnectedTeacherId) {
        console.log(`Teacher with ID ${disconnectedTeacherId} disconnected.`);
        delete teacherSockets[disconnectedTeacherId];
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

function getTeacherSocketId(teacherId) {
  return teacherSockets[teacherId];
}

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { getTeacherSocketId, initializeSocket, getIO };
