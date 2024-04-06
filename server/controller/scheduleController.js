const { User, Schedule, Notification, sequelize } = require("../model/task");
const { Op } = require("sequelize");
const { getIO } = require("../socket");
const setupSocketIO = (io) => {
  // Listen for socket connections on the passed io instance
  io.on("connection", (socket) => {
    console.log("A client connected");
  });

  // No need to return io, it's already external to this function
};

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

    // Check if title is missing or null
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

// New function to find all available teachers

// Function to accept a schedule
const acceptSchedule = async (req, res) => {
  const { scheduleId } = req.body;
  const teacherId = req.user.id;

  let t;
  try {
    const io = getIO();
    // Start a transaction
    t = await sequelize.transaction();

    const schedule = await Schedule.findByPk(scheduleId, { transaction: t });

    if (!schedule || schedule.status === "active") {
      throw new Error(
        "Schedule not found or already accepted by another teacher"
      );
    }

    // Update the schedule to be accepted by the teacher
    await schedule.update(
      { status: "active", userId: teacherId },
      { transaction: t }
    );

    // Cancel all other pending schedules for the same event except for the accepted one
    await Schedule.update(
      { status: "cancelled", userId: null },
      {
        where: {
          title: schedule.title,
          start: schedule.start,
          end: schedule.end,
          status: "pending",
          id: { [Op.ne]: scheduleId }, // Exclude the accepted schedule
        },
        transaction: t,
      }
    );

    // Destroy all notifications related to the pending schedules that are now cancelled
    await Notification.destroy({
      where: {
        scheduleId: { [Op.ne]: scheduleId },
        message: { [Op.like]: `%${schedule.title}%` },
      },
      transaction: t,
    });

    // Emit event to notify the frontend that the schedule has been accepted

    // Commit the transaction
    await t.commit();
    //  io.emit("scheduleAccepted", { scheduleId, teacherId });
    // io.in(`availableTeachers:${teacherId}`).emit('receive_message', {
    //   type: 'scheduleAccepted',
    //   scheduleId,
    //   teacherId
    // });
    io.to(`availableTeachers:${teacherId}`).emit('scheduleAccepted', {
      scheduleId,
      teacherId
    });

    res.status(200).json({ message: "Schedule accepted", schedule });
  } catch (error) {
    // If an error occurs, roll back the transaction
    if (t) {
      await t.rollback();
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Function to deny a schedule
// Inside your server-side logic where you handle denying a schedule
const denySchedule = async (req, res) => {
  const { scheduleId } = req.body;
  const teacherId = req.user.id;

  try {
    const schedule = await Schedule.findByPk(scheduleId);

    if (!schedule || schedule.status !== "pending") {
      return res.status(404).json({
        message: "Schedule not found or not available for denial",
      });
    }

    await schedule.update({ status: "denied", userId: teacherId });
    const io = getIO();
    // Emit the "scheduleDenied" event to the client
    io.emit("receive_message", {
      type: 'scheduleDenied',
      scheduleId,
    });

    res.status(200).json({ message: "Schedule denied" });
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

const sendNotification = async (teacher, notificationDetails) => {
  console.log(`Sending notification to teacher with ID: ${teacher.id}`);
  console.log(
    `Sending notification notificationDetails: ${notificationDetails}`
  );
  try {
    const notification = await Notification.create({
      userId: teacher.id,
      message: notificationDetails.message,
      scheduleId: notificationDetails.scheduleId,
    });

    console.log(
      `Notification created with ID: ${notification.id} for teacher with ID: ${teacher.id}`
    );
  } catch (error) {
    console.error(
      `Failed to send notification to teacher with ID: ${teacher.id}`,
      error
    );
  }
};

const notifyAvailableTeachers = async (teachers, pendingSchedules) => {
  for (const teacher of teachers) {
    for (const pendingSchedule of pendingSchedules) {
      if (pendingSchedule.userId === teacher.id) {
        await sendNotification(teacher, {
          message: `New available schedule from ${pendingSchedule.start} to ${pendingSchedule.end}. Do you want to accept?`,
          scheduleId: pendingSchedule.id,
        });
      }
    }
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
      return res.status(403).json({ message: "Not authorized to delete this schedule" });
    }
    
    // Find all available teachers for this schedule
    const availableTeachers = await findAllAvailableTeachers(scheduleToDelete.start, scheduleToDelete.end);

    // Here we can call notifyAvailableTeachers to send out notifications as well
    const pendingSchedules = [scheduleToDelete];
    await notifyAvailableTeachers(availableTeachers, pendingSchedules);

    // Delete the schedule now that we've found the available teachers and notified them
    await scheduleToDelete.destroy();

    // Emit a socket event to each available teacher to update their UI in real-time
    // availableTeachers.forEach((teacher) => {
    //   io.to(`availableTeachers:${teacher.id}`).emit('receive_message', {
    //     type: 'scheduleDeleted',
    //     scheduleId: id,
    //   });
    // });
    io.to('availableTeachers').emit('scheduleDeleted', {
      scheduleId: id,
    });
    availableTeachers.forEach((teacher) => {
      io.to(`availableTeachers:${teacher.id}`).emit('scheduleDeleted', {
        scheduleId: id,
      });
    });

    res.status(200).json({ message: "Schedule successfully deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Export all functions
module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  acceptSchedule,
  denySchedule,
  setupSocketIO,
};
