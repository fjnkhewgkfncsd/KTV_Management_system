const bcrypt = require("bcryptjs");

const env = require("../config/env");
const { User } = require("../models");

const buildSeedUser = async ({ username, password, name, role }) => ({
  username: username.trim().toLowerCase(),
  passwordHash: await bcrypt.hash(password, 10),
  name,
  role,
  isActive: true
});

const seedDefaultUsers = async () => {
  const userCount = await User.estimatedDocumentCount();

  if (userCount > 0) {
    return;
  }

  const users = await Promise.all([
    buildSeedUser({
      username: env.defaultAdmin.username,
      password: env.defaultAdmin.password,
      name: env.defaultAdmin.name,
      role: "admin"
    }),
    buildSeedUser({
      username: env.defaultReceptionist.username,
      password: env.defaultReceptionist.password,
      name: env.defaultReceptionist.name,
      role: "receptionist"
    })
  ]);

  await User.insertMany(users);
  console.log("Seeded default development users");
};

module.exports = seedDefaultUsers;
