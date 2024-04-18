const express = require("express");
const {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableTeachers,
  assignnewschedule

} = require("../controller/scheduleController");

const { requireAuth } = require("../middleware/requireAuth");

const setupRoutes = (app, io) => {
  const router = express.Router();

  // Apply authentication middleware to all routes in this router
  router.use(requireAuth);

  // Define routes
  router.get("/", getAllSchedules);
  router.get("/available-teachers", getAvailableTeachers);
  router.get("/:id", getScheduleById);
  router.post("/", createSchedule);
  router.post('/assign-teacher', assignnewschedule);
  router.put("/:id", updateSchedule);
  router.delete("/:id", deleteSchedule);
  // Server-side handler for the '/api/assign-teacher' endpoint



  // Mount the router at /schedule
  app.use("/schedule", router);
};

module.exports = { setupRoutes };
