const { Schedule } = require("../model/task");
const { getIO, sendToTeacher } = require("../socket");
// const { findAllAvailableTeachers } = require("./notifyTeacher");
// const { sequelize } = require("../model/task");
const getAllSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const schedules = await Schedule.findAll({ where: { UserId: userId } });
    res.status(200).json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findOne({ where: { id } });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end, title, description, course } = req.body;
    const schedule = await Schedule.create({
      start,
      end,
      title,
      description,
      course,
      userId,
    });
    const io = getIO();
    io.emit("scheduleCreated", schedule);
    res.status(201).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a schedule
const updateSchedule = async (req, res) => {
  try {
    const io = getIO();
    const { id } = req.params;
    const { start, end, title, description, course } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.start = start;
    schedule.end = end;
    schedule.title = title;
    schedule.description = description;
    schedule.course = course;

    await schedule.save();
    io.emit("scheduleUpdated", schedule);
    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the event to be deleted
    const scheduleToDelete = await Schedule.findByPk(id);
    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    await scheduleToDelete.destroy();

    // Send a response indicating successful deletion
    res
      .status(200)
      .json({
        message: "Schedule deleted successfully",
        event: scheduleToDelete,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
