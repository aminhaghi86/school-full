const { User, Schedule } = require("../model/task");
const { Op } = require("sequelize");
// const { sequelize } = require("../model/task");
// Get all schedules for a user
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
    res.status(201).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a schedule
const updateSchedule = async (req, res) => {
  try {
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

    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//

// New function to find all available teachers
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
        availableTeachers.push(teacher.toJSON()); // Convert Sequelize instance to plain JSON object
      }
    }

    return availableTeachers;
  } catch (error) {
    console.error("Error finding available teachers:", error);
    throw error;
  }
};
//
const sendNotification = async (teacher, notificationDetails) => {
  console.log(`Sending notification to teacher with ID: ${teacher.id}`);
  console.log(
    `Sending notification notificationDetails: ${notificationDetails}`
  );
  // Here you would implement the logic to create a notification record in your database
  // For example:
  // await Notification.create({
  //   userId: teacher.id,
  //   message: notificationDetails.message,
  //   scheduleId: notificationDetails.scheduleId,
  //   // ... other fields you might need
  // });
};
//

// const sendNotification = async (teacher, notificationDetails) => {
//   console.log(`Sending notification to teacher with ID: ${teacher.id}`);
//   // Implement the logic to create a notification record in your database
//   await Notification.create({
//     userId: teacher.id,
//     message: notificationDetails.message,
//     scheduleId: notificationDetails.scheduleId,
//     // ... other fields you might need
//   });
// };

//

// Function to notify all available teachers (pseudo-code, implement according to your notification system)
const notifyAvailableTeachers = async (teachers, schedule) => {
  // Loop through all teachers and send a notification
  for (const teacher of teachers) {
    // Send notification to teacher
    // This is pseudo-code, replace with your actual notification logic
    await sendNotification(teacher, {
      message: `New available schedule from ${schedule.start} to ${schedule.end}. Do you want to accept?`,
      scheduleId: schedule.id,
      // Include any other relevant information for the notification
    });
  }
};

//

const acceptSchedule = async (req, res) => {
  const { scheduleId } = req.body;
  const teacherId = req.user.id;

  try {
    const schedule = await Schedule.findByPk(scheduleId);

    // Check if the schedule is pending and available to be accepted
    if (!schedule || schedule.status !== "pending") {
      return res.status(404).json({
        message: "Schedule not found or not available for acceptance",
      });
    }

    // Update the schedule to be accepted by the teacher
    await schedule.update({ status: "accepted", userId: teacherId });

    res.status(200).json({ message: "Schedule accepted", schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//
const denySchedule = async (req, res) => {
  const { scheduleId } = req.body; // The ID of the schedule to deny
  const teacherId = req.user.id; // The ID of the teacher denying the schedule

  try {
    const schedule = await Schedule.findByPk(scheduleId);

    // Check if the schedule is pending and available to be denied
    if (!schedule || schedule.status !== "pending") {
      return res
        .status(404)
        .json({ message: "Schedule not found or not available for denial" });
    }

    // Update the schedule to reflect the denial and record the teacher who denied it
    schedule.status = "denied"; // Assuming 'denied' is a valid status
    schedule.deniedBy = teacherId; // Assuming there is a 'deniedBy' field to record who denied the schedule

    await schedule.save(); // Save the changes to the schedule

    res.status(200).json({ message: "Schedule successfully denied" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//
// Updated deleteSchedule function
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleToDelete = await Schedule.findByPk(id);

    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if the user requesting the delete is the owner of the schedule
    if (scheduleToDelete.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this schedule" });
    }

    const { start, end, title, description, course } = scheduleToDelete;

    // Find all available teachers
    const availableTeachers = await findAllAvailableTeachers(start, end);

    // Create pending schedules for each available teacher
    const pendingSchedules = await Promise.all(
      availableTeachers.map((teacher) =>
        Schedule.create({
          start,
          end,
          title,
          description,
          course,
          userId: teacher.id,
          status: "pending",
        })
      )
    );

    // Now that we have created pending schedules, we can safely delete the original schedule
    await scheduleToDelete.destroy();

    // Notify all available teachers about the new pending schedules
    for (const teacher of availableTeachers) {
      const pendingSchedule = pendingSchedules.find(
        (ps) => ps.userId === teacher.id
      );
      if (pendingSchedule) {
        await notifyAvailableTeachers([teacher], pendingSchedule);
      }
    }

    // Respond with success message
    res.status(200).json({
      message:
        "Original schedule deleted and new pending schedules created and notified",
      pendingSchedules: pendingSchedules.map((schedule) => schedule.id), // Send back only the IDs or necessary info
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// module.exports = { sequelize, User, Schedule };
//

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  acceptSchedule,
  denySchedule,
};
