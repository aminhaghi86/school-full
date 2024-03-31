const bcrypt = require("bcrypt");
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
});

Schedule.associate = (models) => {
  Schedule.belongsTo(models.User, { foreignKey: "userId" });

};



User.hasMany(Schedule);
Schedule.hasOne(User);
User.signup = async function (email, password) {
  // Check if the email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Hash the password and create the user
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    email,
    password: hash,
  });

  return newUser;
};

User.login = async function (email, password) {
  // Find the user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("Incorrect email or password.");
  }

  // Compare the provided password with the stored hash
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Incorrect email or password.");
  }

  // Return the user object without the password
  return { id: user.id, email: user.email };
};

module.exports = { sequelize, User, Schedule };
