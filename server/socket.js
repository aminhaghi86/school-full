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
    console.log("A client connected");

    // const userId = socket.handshake.query.userId;
    // console.log("userId for socket", userId);
    // console.log("socket id", socket.id);

    // // Joining a room with the userId might not be required unless you also have functionality that targets individual users.
    // socket.join(userId);

    // socket.emit("connected", socket.id + ":" + "You are connected");
    socket.join('availableTeachers');
    const teacherId = socket.handshake.query.teacherId;
    if (teacherId) {
      socket.join(`availableTeachers:${teacherId}`);
    }
    // socket.on("joinRoom", (room) => {
    //   socket.join(room);
    //   console.log(`Socket ${socket.id} joined room ${room}`);
    // });
    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });
    // When sending a message, it broadcasts to all clients except the sender
    // socket.on("send_message", (data) => {
    //   console.log("data", data);
    //   // To target a specific room, use `io.to(room).emit(...)` instead of broadcasting
    //   if (data.type === "scheduleDeleted") {
    //     io.to(`availableTeachers`).emit("receive_message", data);
    //   } else {
    //     // For other types, determine the appropriate room or emit logic
    //     socket.broadcast.emit("receive_message", data);
    //   }
    // });
    // socket.on("send_message", (data) => {
    //   console.log("Message data", data);
    //   if (data.type === "scheduleDeleted") {
    //     io.to("availableTeachers").emit("receive_message", data);
    //   } else {
    //     socket.broadcast.emit("receive_message", data);
    //   }
    // });
    socket.on("send_message", (data) => {
      console.log("Message data", data);
      switch(data.type){
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
      socket.join('availableTeachers');
      console.log(`Socket ${socket.handshake.query.userId} joined available teachers' room`);
    });
    

    // Handling a teacher joining the room
    // socket.on("joinAvailableTeacherRoom", ({ teacherId }) => {
    //   socket.join(`availableTeachers:${teacherId}`);
    //   // Should probably be just `availableTeachers`
    //   // socket.join(`availableTeachers`);
    // });

    // Handling a teacher leaving the room
    socket.on("leaveAvailableTeacherRoom", ({ teacherId }) => {
      socket.leave(`availableTeachers:${teacherId}`);
      // Should probably be just `availableTeachers`
      // socket.leave(`availableTeachers`);
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
