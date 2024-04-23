const { Schedule, User, sequelize } = require("../model/task");
const { getIO, getTeacherSocketId } = require("../socket");
const { Op } = require("sequelize");
const getAllSchedules = async (req, res) => {
  try {
    const io = getIO();
    const userId = req.user.id; // Extracting the user ID from request object

    // Retrieve the specific user's schedules from the database
    const schedules = await Schedule.findAll({ where: { UserId: userId } });

    // Send a success response with the schedules to the HTTP client
    res.status(200).json(schedules);
    const teacherSocketId = getTeacherSocketId(userId);

    if (teacherSocketId) {
      io.to(teacherSocketId).emit("message-from-server", schedules);
    } else {
      console.log(`Socket ID for user ${userId} not found.`);
    }
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
    const { start, end, title, description, course, status } = req.body;
    console.log("Received user ID:", userId);
    const schedule = await Schedule.create({
      start,
      end,
      title,
      description,
      course,
      userId,
      status,
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
    const io = getIO();
    // const userId = req.user.id;

    const scheduleToDelete = await Schedule.findByPk(id);
    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Find all available teachers for this schedule time
    const start = scheduleToDelete.start;
    const end = scheduleToDelete.end;
    const availableTeachers = await findAllAvailableTeachers(start, end);

    if (availableTeachers.length === 0) {
      // No available teachers found, delete the schedule
      await scheduleToDelete.destroy();
      const teacherSocketId = getTeacherSocketId(userId);
      console.log("Retrieved teacher socket ID:", teacherSocketId);
      if (teacherSocketId) {
        io.to(teacherSocketId).emit("event-not-founded", scheduleToDelete);
      } else {
        console.log("No teacher socket ID found for user ID:", userId);
      }
      return res.status(200).json({ message: "Schedule deleted." });
    } else {
      // If there are available teachers, let the client know so they can choose one
      return res.status(200).json({
        message:
          "Available teachers found. Please assign a teacher before deleting.",
        availableTeachers: availableTeachers,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAvailableTeachers = async (req, res) => {
  try {
    console.log("reqreq", req);
    console.log("resres", res);
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

const assignnewschedule = async (req, res) => {
  const { eventId, teacherIds } = req.body;

  if (!eventId || !teacherIds || !Array.isArray(teacherIds)) {
    return res.status(400).json({ message: "Invalid parameters" });
  }

  let transaction;

  try {
    transaction = await Schedule.sequelize.transaction();

    for (const teacherId of teacherIds) {
      await assignTeacherToSchedule(req, teacherId, transaction);
    }

    await deleteScheduleById(eventId, transaction);

    await transaction.commit(); // Commit the transaction if all assignments succeed

    res.status(200).json({
      message: "All teachers assigned and schedule deleted successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const assignTeacherToSchedule = async (req, teacherId, transaction) => {
  const io = getIO();
  const { eventId } = req.body;

  const schedule = await Schedule.findByPk(eventId);
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const newSchedule = await Schedule.create(
    {
      start: schedule.start,
      end: schedule.end,
      title: schedule.title,
      description: schedule.description,
      course: schedule.course,
      status: "pending",
      userId: teacherId,
    },
    { transaction }
  );

  // Emitting event should be outside of the transaction
  const teacherSocketId = getTeacherSocketId(teacherId);
  if (teacherSocketId) {
    // Emit event to the teacher's socket
    io.to(teacherSocketId).emit("eventAssigned", {
      event: newSchedule.toJSON(),
      sendUser: req.body.email,
    });
  }
};

const acceptEvent = async (req, res) => {
  const io = getIO();
  const { eventId, userId } = req.body;

  try {
    const event = await Schedule.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (event.userId !== userId || event.status !== "pending") {
      return res.status(400).json({ message: "Event cannot be accepted." });
    }

    // Start the transaction
    const result = await sequelize.transaction(async (transaction) => {
      // Update the event status to 'accepted'
      event.status = "accepted";
      await event.save({ transaction });

      // Find other pending events in the same timeslot across all users
      const conflictingEvents = await Schedule.findAll({
        where: {
          id: { [Op.ne]: eventId },
          start: event.start,
          end: event.end,
          status: "pending",
        },
      });

      // Collect IDs of the conflicting events
      const eventIdsToRemove = conflictingEvents.map((e) => e.id);

      // Remove those events from the database
      await Schedule.destroy({
        where: { id: { [Op.in]: eventIdsToRemove } },
        transaction: transaction,
      });

      // Emit event for each removed pending event so clients can update accordingly
      eventIdsToRemove.forEach((removedEventId) => {
        io.emit("eventRemoved", { removedEventId });
      });

      return { message: "Event accepted successfully." };
    });

    res.json(result);

    io.emit("eventAccepted", { eventId, acceptedBy: userId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//
const deleteScheduleById = async (id, transaction) => {
  const scheduleToDelete = await Schedule.findByPk(id);
  if (!scheduleToDelete) {
    throw new Error("Schedule to delete not found");
  }
  await scheduleToDelete.destroy({ transaction });
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableTeachers,
  assignnewschedule,
  acceptEvent,
};
