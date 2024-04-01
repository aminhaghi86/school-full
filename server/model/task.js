const { DataTypes, Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  `postgres://${process.env.USERNAME1}:${encodeURIComponent(
    process.env.PASSWORD
  )}@${process.env.URL}:${process.env.PORT}/${process.env.DBNAME}`
);

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255],
    },
  },
});

const Schedule = sequelize.define("Schedule", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Untitled Event",
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: "",
  },
  course: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "denied", "active", "cancelled"),
    defaultValue: "accepted",
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: "UserId",
  },
});

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // You can add more fields as needed, such as a 'read' flag to track whether the notification has been seen
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Foreign key to associate the notification with a user
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Foreign key to associate the notification with a schedule (optional)
  scheduleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

Notification.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Notification, { foreignKey: "userId" });

Schedule.associate = (models) => {
  Schedule.belongsTo(User, { foreignKey: "userId" });
};

User.hasMany(Schedule, { foreignKey: "userId" });
Schedule.belongsTo(User, { foreignKey: "userId", field: "UserId" });

//
module.exports = { sequelize, User, Schedule,Notification };
