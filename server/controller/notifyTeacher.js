// const { User, Notification, sequelize, Schedule } = require("../model/task");
// const { getIO } = require("../socket");
// const { Op } = require("sequelize");
// const acceptSchedule = async (req, res) => {
//   const { scheduleId } = req.body;
//   const teacherId = req.user.id;

//   let t;
//   try {
//     const io = getIO();
//     t = await sequelize.transaction();

//     const schedule = await Schedule.findByPk(scheduleId, { transaction: t });

//     if (!schedule || schedule.status === "active") {
//       throw new Error(
//         "Schedule not found or already accepted by another teacher"
//       );
//     }

//     await schedule.update(
//       { status: "active", userId: teacherId },
//       { transaction: t }
//     );
//     await Schedule.update(
//       { status: "cancelled", userId: null },
//       {
//         where: {
//           title: schedule.title,
//           start: schedule.start,
//           end: schedule.end,
//           status: "pending",
//           id: { [Op.ne]: scheduleId },
//         },
//         transaction: t,
//       }
//     );

//     await Notification.destroy({
//       where: {
//         scheduleId: { [Op.ne]: scheduleId },
//         message: { [Op.like]: `%${schedule.title}%` },
//       },
//       transaction: t,
//     });

//     await t.commit();

//     io.to(`availableTeachers:${teacherId}`).emit("scheduleAccepted", {
//       scheduleId,
//       teacherId,
//     });

//     res.status(200).json({ message: "Schedule accepted", schedule });
//   } catch (error) {
//     // If an error occurs, roll back the transaction
//     if (t) {
//       await t.rollback();
//     }
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// const denySchedule = async (req, res) => {
//   const { scheduleId } = req.body;
//   const teacherId = req.user.id;

//   try {
//     const schedule = await Schedule.findByPk(scheduleId);

//     if (!schedule || schedule.status !== "pending") {
//       return res.status(404).json({
//         message: "Schedule not found or not available for denial",
//       });
//     }

//     await schedule.update({ status: "denied", userId: teacherId });
//     const io = getIO();
//     // Emit the "scheduleDenied" event to the client
//     io.emit("receive_message", {
//       type: "scheduleDenied",
//       scheduleId,
//     });

//     res.status(200).json({ message: "Schedule denied" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// const findAllAvailableTeachers = async (start, end) => {
//   try {
//     const teachers = await User.findAll();
//     const availableTeachers = [];

//     for (const teacher of teachers) {
//       const conflictingSchedules = await Schedule.findAll({
//         where: {
//           userId: teacher.id,
//           [Op.or]: [
//             { start: { [Op.lt]: end, [Op.gt]: start } },
//             { end: { [Op.gt]: start, [Op.lt]: end } },
//             {
//               [Op.and]: [
//                 { start: { [Op.lte]: start } },
//                 { end: { [Op.gte]: end } },
//               ],
//             },
//           ],
//         },
//       });

//       if (conflictingSchedules.length === 0) {
//         availableTeachers.push(teacher);
//       }
//     }

//     return availableTeachers;
//   } catch (error) {
//     console.error("Error finding available teachers:", error);
//     throw error;
//   }
// };


// module.exports = {
//   // notifyAvailableTeachers,
//   findAllAvailableTeachers,
//   denySchedule,
//   acceptSchedule,
// };
