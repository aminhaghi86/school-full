const { Schedule } = require("../model/task");
const { getIO } = require("../socket");
const { findAllAvailableTeachers } = require("./notifyTeacher");
const { sequelize } = require("../model/task");
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
    const { id } = req.params; // Assuming 'id' is the schedule ID to delete
    const io = getIO();

    // Fetch the event to be deleted
    const scheduleToDelete = await Schedule.findByPk(id);
    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check permission
    if (scheduleToDelete.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this schedule" });
    }

    // Extract relevant fields
    const { start, end, userId: excludedTeacherId } = scheduleToDelete;

    // Find an available teacher before deleting the schedule
    const firstAvailableTeacher = await findAllAvailableTeachers(
      start,
      end,
      excludedTeacherId
    );

    if (!firstAvailableTeacher) {
      return res.status(422).json({ message: "No available teacher found" });
    }
console.log('firstAvailableTeacher',firstAvailableTeacher[0]);
    // Perform the transaction
    await sequelize.transaction(async (t) => {
      // Delete the existing schedule
     

      // Create a new schedule for the first available teacher
      const reassignedSchedule = await Schedule.create(
        {
          start,
          end,
          title: scheduleToDelete.title,
          description: scheduleToDelete.description,
          course: scheduleToDelete.course,
          userId: firstAvailableTeacher[0].id,
        },
        { transaction: t }
      );

      // Notify the first available teacher about the new schedule via sockets
      io.to(firstAvailableTeacher[0].id).emit("scheduleReceived", {
        ...reassignedSchedule.get({ plain: true }),
        userId: firstAvailableTeacher[0].id,
      });
      await scheduleToDelete.destroy({ transaction: t });

      // Respond with success and details of the reassigned schedule
      res.status(200).json({
        message: "Schedule reassigned successfully",
        schedule: reassignedSchedule,
      });
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
