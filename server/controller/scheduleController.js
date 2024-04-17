const { Schedule, User } = require("../model/task");
const { getIO, getTeacherSocketId } = require("../socket");
const { Op } = require("sequelize");
const sequelize = require('sequelize'); 
const getAllSchedules = async (req, res) => {
  try {
    const io = getIO();
    const userId = req.user.id;
    const schedules = await Schedule.findAll({ where: { UserId: userId } });
    res.status(200).json(schedules);
    io.emit("message-from-server", schedules);
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

// Update a schedule
const createSchedule = async (req, res) => {
  try {
    const io = getIO();
    const userId = req.user.id;
    console.log(userId);
    const { start, end, title, description, course } = req.body;
    console.log("Received user ID:", userId);
    const schedule = await Schedule.create({
      start,
      end,
      title,
      description,
      course,
      userId,
    });
    res.status(201).json(schedule);

    const teacherSocketId = getTeacherSocketId(userId);
    console.log("Retrieved teacher socket ID:", teacherSocketId);
    if (teacherSocketId) {
      io.to(teacherSocketId).emit("scheduleCreated", schedule);
    } else {
      console.log("No teacher socket ID found for user ID:", userId);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const io = getIO();
    const { id } = req.params;
    const userId = req.user.id;
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
    // io.emit("scheduleUpdated", schedule);

    const teacherSocketId = getTeacherSocketId(userId);
    console.log("Retrieved teacher socket ID:", teacherSocketId);
    if (teacherSocketId) {
      io.to(teacherSocketId).emit("scheduleUpdated", schedule);
    } else {
      console.log("No teacher socket ID found for user ID:", userId);
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const findAllAvailableTeachers = async (start, end) => {
  try {
    const teachers = await User.findAll();
    const availableTeachers = [];

    for (const teacher of teachers) {
      const conflictingSchedules = await Schedule.findAll({
        where: {
          userId: teacher.id,
          [Op.or]: [
            { start: { [Op.lt]: end, [Op.gt]: start } },
            { end: { [Op.gt]: start, [Op.lt]: end } },
            {
              [Op.and]: [
                { start: { [Op.lte]: start } },
                { end: { [Op.gte]: end } },
              ],
            },
          ],
        },
      });

      if (conflictingSchedules.length === 0) {
        availableTeachers.push(teacher);
      }
    }

    return availableTeachers;
  } catch (error) {
    console.error("Error finding available teachers:", error);
    throw error;
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const scheduleToDelete = await Schedule.findByPk(id);
    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Find all available teachers for this schedule time
    const start = scheduleToDelete.start;
    const end = scheduleToDelete.end;
    const availableTeachers = await findAllAvailableTeachers(start, end);

    if (availableTeachers.length === 0) {
      // No available teachers found, can't proceed with delete
      return res.status(409).json({
        message: "No available teachers to assign, canceling deletion.",
      });
    }

    // If there are available teachers, let the client know so they can choose one
    return res.status(200).json({
      message:
        "Available teachers found. Please assign a teacher before deleting.",
      availableTeachers: availableTeachers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAvailableTeachers = async (req, res) => {
  try {
    const { eventId } = req.query;
    console.log("eventId", eventId);
    // Check if eventId is not provided or null.
    if (!eventId || eventId === "null") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // Fetch the event to get its start and end times
    const event = await Schedule.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const availableTeachers = await findAllAvailableTeachers(
      event.start,
      event.end
    );

    res.json(availableTeachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const assignTeacherToSchedule = async (req, teacherId) => {
  try {
    console.log('req req req after deleteing and the assing!',req.body);
    const eventId = req.body.eventId;
    console.log(`Assigning teacher to schedule with event ID: ${eventId}`);
    const schedule = await Schedule.findByPk(eventId);
    if (!schedule) {
      return { success: false, message: "Schedule not found" };
    }
    console.log("schedule schedule schedule", schedule);

    // Check if the selected teacher is available for this schedule
    const isAvailable = await findAllAvailableTeachers(
      schedule.start,
      schedule.end
    ).then((teachers) => teachers.some((teacher) => teacher.id === teacherId));

    if (!isAvailable) {
      throw new Error("Selected teacher is not available");
    }

    // Assign the teacher to the schedule
    console.log('schedule.userId',schedule.userId);
    schedule.userId = req.body.teacherId;

    // Save the changes
    await schedule.save();

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};

const assignnewschedule = async (req, res) => {
  try {
    console.log("Request dataaaaa req body:", req.body);
    const { eventId, teacherId } = req.body;
    if (eventId === null || teacherId === null) {
      // Respond with a bad request error if validation fails.
      return res.status(400).json({ message: "eventID or teacherID is null" });
    }

    const result = await assignTeacherToSchedule(req, teacherId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const deletedSchedule = await deleteScheduleById(eventId);

    if (!deletedSchedule) {
      return res
        .status(400)
        .json({ message: "Failed to delete schedule after assigning teacher" });
    }

    res.status(200).json({
      message: "Teacher assigned and schedule deleted",
      schedule: deletedSchedule,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to delete a schedule by its ID
const deleteScheduleById = async (id) => {
  const scheduleToDelete = await Schedule.findByPk(id);
  if (scheduleToDelete) {
    await scheduleToDelete.destroy();
    return scheduleToDelete;
  } else {
    return null; // or throw an error indicating the schedule was not found
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableTeachers,
  assignnewschedule,
};
