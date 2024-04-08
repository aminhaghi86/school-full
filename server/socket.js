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
    
    socket.on("scheduleDeleted", (data) => {
      console.log('data',data);
      socket.broadcast.emit("schedule_delete_server", data);
    });
    socket.on("scheduleReceived", (data) => {
      // Handle the received schedule data here and update the calendar
      console.log("Schedule received:", data);
      // Assuming you have a function to update the calendar in the frontend
      // updateCalendar(data);
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
