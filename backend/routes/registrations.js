const express = require("express");
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST: Register the logged-in user for an event
router.post("/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const registrationCount = await Registration.countDocuments({ event: eventId });
    if (registrationCount >= event.capacity || (event.deadline && event.deadline <= new Date()) || event.date <= new Date()) {
      return res.status(400).json({ message: "Registration is closed for this event." });
    }

    const registration = await Registration.create({
      user: req.user.userId,
      event: eventId,
    });

    res.status(201).json({
      message: "Successfully registered for the event!",
      registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already registered for this event.",
      });
    }

    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Could not register for the event.",
    });
  }
});

// GET: View the logged-in user's registrations
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user.userId,
    })
      .populate("event")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error("Fetch registrations error:", error.message);
    res.status(500).json({
      message: "Could not fetch your registrations.",
    });
  }
});
// DELETE: Cancel your own event registration
router.delete("/:registrationId", authMiddleware, async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        message: "Invalid registration ID.",
      });
    }

    const registration = await Registration.findOne({
      _id: registrationId,
      user: req.user.userId,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found.",
      });
    }

    await registration.deleteOne();

    res.json({
      message: "Registration cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel registration error:", error.message);
    res.status(500).json({
      message: "Could not cancel registration.",
    });
  }
});
module.exports = router;
