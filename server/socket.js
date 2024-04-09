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

    // Register teacher with socket
    socket.on("registerTeacher", (teacherId) => {
      console.log(
        `Registering teacher with id: ${teacherId.teacherId} and socket id: ${socket.id}`
      );
      // Associate the socket with the teacher ID
      teacherSockets[teacherId] = socket.id;

      // You can also attach it directly to the socket object if that's more convenient
      socket.teacherId = teacherId;
    });
    socket.on("joinRoom", (data) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    socket.on("leaveRoom", (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });
    socket.on("connect_error", (err) => {
      console.error(`connect_error due to ${err.message}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on("scheduleDeleted", (data) => {
      console.log("data", data);
      socket.broadcast.emit("schedule_delete_server", data);
    });

    socket.on("scheduleReceived", (data) => {
      console.log("Schedule received:", data);
      // Update calendar logic...
    });
    socket.on("identify", function (teacherId) {
      teacherSockets[teacherId] = socket.id;
    });
    // When the teacher disconnects, remove them from the registry
    socket.on("disconnect", () => {
      Object.keys(teacherSockets).forEach((teacherId) => {
        if (teacherSockets[teacherId] === socket.id) {
          delete teacherSockets[teacherId];
          console.log(
            `Teacher ${teacherId} with socket ${socket.id} disconnected`
          );
        }
      });
    });

    // Additional Socket.IO event handling...
  });

  return io;
};
function sendToTeacher(teacherId, message) {
  const teacherSocketId = getTeacherSocketId(teacherId);
  if (teacherSocketId) {
    io.to(teacherSocketId).emit("message", message);
  } else {
    console.log(`No connected socket found for teacher ID: ${teacherId}`);
    // Handle the teacher being offline (e.g., queue the message, notify sender, etc.)
  }
}

function getTeacherSocketId(teacherId) {
  return teacherSockets[teacherId];
}

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { getTeacherSocketId, initializeSocket, getIO, sendToTeacher };
