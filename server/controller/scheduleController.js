const { User, Schedule } = require("../model/task");
const { Op } = require("sequelize");
const { sequelize } = require("../model/task");
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
    const UserId = req.user.id;
    const { start, end, title, description, course } = req.body;
    const schedule = await Schedule.create({
      start,
      end,
      title,
      description,
      course,
      UserId,
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

const findAvailableTeacher = async (start, end, excludedTeacherId) => {
  const teachers = await User.findAll({
    where: {
      id: {
        [Op.not]: excludedTeacherId, // Exclude the teacher whose schedule is being deleted
      },
    },
  });

  for (const teacher of teachers) {
    const conflictingSchedules = await Schedule.findAll({
      where: {
        userId: teacher.id,
        [Op.or]: [
          {
            start: {
              [Op.lt]: end,
              [Op.gt]: start,
            },
          },
          {
            end: {
              [Op.gt]: start,
              [Op.lt]: end,
            },
          },
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
      return teacher;
    }
  }

  return null;
};

//

// const findAvailableTeacher = async (start, end) => {
//   const teachers = await User.findAll();

//   for (const teacher of teachers) {
//     const conflictingSchedules = await Schedule.findAll({
//       where: {
//         userId: teacher.id,
//         [Op.or]: [
//           {
//             start: {
//               [Op.lt]: end,
//               [Op.gt]: start,
//             },
//           },
//           {
//             end: {
//               [Op.gt]: start,
//               [Op.lt]: end,
//             },
//           },
//           {
//             [Op.and]: [
//               { start: { [Op.lte]: start } },
//               { end: { [Op.gte]: end } },
//             ],
//           },
//         ],
//       },
//     });
//     console.log('conflictingSchedules',conflictingSchedules);
//     if (conflictingSchedules.length === 0) {
//       return teacher;
//     }
//   }

//   return null;
// };
//
// const deleteSchedule = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const scheduleToDelete = await Schedule.findByPk(id);
//     if (!scheduleToDelete) {
//       return res.status(404).json({ message: "Schedule not found" });
//     }

//     const { start, end } = scheduleToDelete;

//     // Find an available teacher before deleting the schedule
//     const availableTeacher = await findAvailableTeacher(start, end);

//     if (!availableTeacher) {
//       return res.status(422).json({ message: "No available teacher found" });
//     }

//     // Start a transaction to ensure data consistency
//     await sequelize.transaction(async (t) => {
//       // Delete the schedule
//       await scheduleToDelete.destroy({ transaction: t });

//       // Create a new schedule for the available teacher
//       const reassignedSchedule = await Schedule.create(
//         {
//           start,
//           end,
//           title: scheduleToDelete.title,
//           description: scheduleToDelete.description,
//           course: scheduleToDelete.course,
//           UserId: availableTeacher.id,
//         },
//         { transaction: t }
//       );

//       // Respond with the reassigned schedule
//       res.status(200).json({
//         message: "Schedule reassigned",
//         schedule: reassignedSchedule,
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleToDelete = await Schedule.findByPk(id);
    if (!scheduleToDelete) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const { start, end, userId: excludedTeacherId } = scheduleToDelete;

    // Find an available teacher before deleting the schedule
    const availableTeacher = await findAvailableTeacher(start, end, excludedTeacherId);

    if (!availableTeacher) {
      return res.status(422).json({ message: "No available teacher found" });
    }

    // Start a transaction to ensure data consistency
    await sequelize.transaction(async (t) => {
      // Delete the schedule
      await scheduleToDelete.destroy({ transaction: t });

      // Create a new schedule for the available teacher
      const reassignedSchedule = await Schedule.create({
        start,
        end,
        title: scheduleToDelete.title,
        description: scheduleToDelete.description,
        course: scheduleToDelete.course,
        UserId: availableTeacher.id
      }, { transaction: t });

      // Respond with the reassigned schedule
      res.status(200).json({
        message: "Schedule reassigned",
        schedule: reassignedSchedule
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
