const express = require("express");
const {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableTeachers,
  assignnewschedule,
} = require("../controller/scheduleController");

const { requireAuth } = require("../middleware/requireAuth");

const setupRoutes = (app) => {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", getAllSchedules);
  router.get("/available-teachers", getAvailableTeachers);
  router.get("/:id", getScheduleById);
  router.post("/", createSchedule);
  router.post("/assign-teacher", assignnewschedule);
  router.put("/:id", updateSchedule);
  router.delete("/:id", deleteSchedule);

  // Mount the router at /schedule
  app.use("/schedule", router);
};

module.exports = { setupRoutes };
