const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function seedAdmin() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env first.");
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (!email) throw new Error("ADMIN_EMAIL cannot be blank.");

  await mongoose.connect(MONGODB_URI);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.role = "admin";
    existingUser.password = hashedPassword;
    await existingUser.save();
    console.log("Existing account promoted and admin credentials synchronized.");
  } else {
    await User.create({
      name: "Administrator",
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin account created.");
  }
}

seedAdmin()
  .catch(() => {
    console.error("Admin setup failed. Check MongoDB connectivity and backend environment configuration.");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
