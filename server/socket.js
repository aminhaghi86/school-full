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
    const teacherId = socket.handshake.query.teacherId;
    if (teacherId) {
      // Store socket id for the connected teacher
      teacherSockets[teacherId] = socket.id;
      const teacherId = socket.handshake.query.teacherId;

      socket.on("scheduleDeleted", (data) => {
        console.log("data", data);
        socket.broadcast.emit("schedule_delete_server", data);
      });
      socket.on("scheduleReceived", (data) => {
        // Handle the received schedule data here and update the calendar
        console.log("Schedule received:", data);
        // Assuming you have a function to update the calendar in the frontend
        // updateCalendar(data);
      });

      socket.on("disconnect", () => {
        console.log(
          `Teacher ${teacherId} with socket ${socket.id} disconnected`
        );
      });
    }

    // Additional Socket.IO event handling...
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
