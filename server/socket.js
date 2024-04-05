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


    const userId = socket.handshake.query.userId;
    console.log('userId for socekt', userId);

    // Here, you can use the userId to associate the socket connection with the user
    // For example, you might want to store the socket with the userId in a map
    // Or join a room with the userId

    // Example: Joining a room with the userId
    socket.join(userId);

    socket.emit("connected", "You are connected");

    // Handle delete operation
    // Inside your backend socket initialization code
    socket.on("delete",  (id) => {
      try {
        // Perform delete operation
        // Emit event to notify other clients about the deletion
        io.emit("scheduleDeleted", id);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    });

    // Handle accept operation
    socket.on("scheduleAccepted",  (data) => {
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
