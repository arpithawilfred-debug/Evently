
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const authMiddleware = require("./middleware/authMiddleware");

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/registrations", require("./routes/registrations"));
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Event Management System backend is running!",
  });
});
app.get("/api/auth-test", authMiddleware, (req, res) => {
  res.json({
    message: "Authentication successful!",
    userId: req.user.userId,
    role: req.user.role,
  });
});
// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });