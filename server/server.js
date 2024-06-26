const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./model/task");
const users = require("./routes/users");
const schedules = require("./routes/schedules"); 
const http = require("http");
const { initializeSocket } = require("./socket"); 

const main = async () => {
  dotenv.config();
  const app = express();
  const port = process.env.SERVERPORT;

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.sync();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  app.use(cors());
  app.use(morgan("tiny"));
  app.use(bodyParser.json());

  // CRUD operations setup
  users.setupRoutes(app);

  const server = http.createServer(app);

  // Initialize the Socket.IO server and get the "io" instance
  const io = initializeSocket(server);

  // Pass io instance to schedules setupRoutes
  schedules.setupRoutes(app, io);

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

main();
