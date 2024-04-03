const { Server } = require("socket.io");
let io = null;

exports.initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A client connected");

    // Handle create operation
    socket.on("create", (data) => {
      // Perform create operation (e.g., save to database)
      // Then emit to all clients
      io.emit("scheduleCreated", data); // Updated event name
    });

    // Handle update operation
    socket.on("update", (data) => {
      // Perform update operation (e.g., update database)
      // Then emit to all clients
      io.emit("scheduleUpdated", data); // Updated event name
    });

    // Handle delete operation
    // Inside your backend socket initialization code
    socket.on("delete", async (id) => {
      try {
        // Perform delete operation
        // Emit event to notify other clients about the deletion
       await io.emit("scheduleDeleted", id);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    });

    // Handle accept operation
    socket.on("scheduleAccepted", async (data) => {
      // Emit to all clients
      io.emit("scheduleAccepted", data);
    });

    // Handle deny operation
    socket.on("scheduleDenied", (data) => {
      // Emit to all clients
      io.emit("scheduleDenied", data);
    });

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
