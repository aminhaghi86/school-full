const { Schedule } = require("../model/task");
const { getIO } = require("../socket");
const {
  notifyAvailableTeachers,
  findAllAvailableTeachers,
  denySchedule,
  acceptSchedule,
} = require("./notifyTeacher");
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
    const scheduleToDelete = await Schedule.findByPk(id);
    const io = getIO();

    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (scheduleToDelete.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this schedule" });
    }

    const availableTeachers = await findAllAvailableTeachers(
      scheduleToDelete.start,
      scheduleToDelete.end
    );

    const pendingSchedules = [scheduleToDelete];
    await notifyAvailableTeachers(availableTeachers, pendingSchedules);

    await scheduleToDelete.destroy();
    io.to("availableTeachers").emit("scheduleDeleted", {
      scheduleId: id,
    });
    availableTeachers.forEach((teacher) => {
      io.to(`availableTeachers:${teacher.id}`).emit("scheduleDeleted", {
        scheduleId: id,
      });
    });

    res.status(200).json({ message: "Schedule successfully deleted" });
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
