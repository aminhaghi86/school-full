const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./model/task");
const users = require("./routes/users");
const schedules = require('./routes/schedules')
const main = async () => {
	const app = express();
	const port = process.env.SERVERPORT || 8001;

	try {
		await sequelize.authenticate();
		console.log("Connection has been established successfully.");
		await sequelize.sync();
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}

	app.use(cors());
	app.use(morgan("tiny"));
	app.use(bodyParser.json());
	// CRUD
	users.setupRoutes(app);
	schedules.setupRoutes(app)
	//
	app.listen(port, () => {
		console.log(`Example app listening on port ${port}`);
	});
};

main();
