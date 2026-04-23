const mongoose = require("mongoose");

const env = require("./env");
const seedDefaultUsers = require("../services/seed.service");

const connectToDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri);
  await seedDefaultUsers();
  console.log("MongoDB connected");
};

module.exports = connectToDatabase;
