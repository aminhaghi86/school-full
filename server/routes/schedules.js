const express = require("express");
const {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  acceptSchedule,
  denySchedule,
} = require("../controller/scheduleController");
const { requireAuth } = require("../middleware/requireAuth");

const setupRoutes = (app, io) => {
  const router = express.Router();

  // Apply authentication middleware to all routes in this router
  router.use(requireAuth);

  // Define routes
  router.get("/", getAllSchedules);
  router.get("/:id", getScheduleById);
  router.post("/", createSchedule);
  router.put("/:id", updateSchedule);
  router.delete("/:id", deleteSchedule);
  router.post("/:id/accept", acceptSchedule);
  router.post("/:id/deny", denySchedule);

  // Mount the router at /schedule
  app.use("/schedule", router);
};

module.exports = { setupRoutes };
