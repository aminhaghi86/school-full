const { Server } = require("socket.io");
let io = null;

exports.initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(socket.id + "A client connected");
    socket.join("availableTeachers");
    const teacherId = socket.handshake.query.teacherId;
    if (teacherId) {
      socket.join(`availableTeachers:${teacherId}`);
    }

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on("send_message", (data) => {
      console.log("Message data", data);
      switch (data.type) {
        case "scheduleDeleted":
          // Emitting to all clients in 'availableTeachers' except the sender
          io.to("availableTeachers").emit("receive_message", data);
          break;
        default:
          // Broadcasting to all clients except the sender
          socket.broadcast.emit("receive_message", data);
          break;
      }
    });
    socket.on("joinAvailableTeacherRoom", () => {
      socket.join("availableTeachers");
      console.log(
        `Socket ${socket.handshake.query.userId} joined available teachers' room`
      );
    });

    // Handling a teacher leaving the room
    socket.on("leaveAvailableTeacherRoom", ({ teacherId }) => {
      socket.leave(`availableTeachers:${teacherId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected`);
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
