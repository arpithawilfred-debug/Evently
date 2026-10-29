
const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Anyone can view all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "name email").sort({ date: 1 }).lean();
    const counts = await Registration.aggregate([
      { $group: { _id: "$event", count: { $sum: 1 } } },
    ]);
    const countByEvent = new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
    res.json(events.map((event) => ({ ...event, registered: countByEvent.get(event._id.toString()) || 0 })));
  } catch (error) {
    console.error("Fetch events error:", error.message);
    res.status(500).json({ message: "Could not fetch events." });
  }
});

// GET: Anyone can view one event
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.json(event);
  } catch (error) {
    console.error("Fetch event error:", error.message);
    res.status(500).json({ message: "Could not fetch event." });
  }
});

// POST: Any logged-in user can create an event
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      capacity,
      image,
      category,
      location,
      deadline,
      googleForm,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !date ||
      !time?.trim() ||
      !venue?.trim() ||
      capacity == null
    ) {
      return res.status(400).json({
        message: "Please provide all required event details.",
      });
    }

    if (
      typeof capacity !== "number" ||
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      return res.status(400).json({
        message: "Capacity must be a positive whole number.",
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time.trim(),
      venue: venue.trim(),
      capacity,
      image: typeof image === "string" ? image.trim() : "",
      category: typeof category === "string" ? category.trim() : "Technology",
      location: typeof location === "string" ? location.trim() : "Main Campus",
      deadline: deadline || null,
      googleForm: typeof googleForm === "string" ? googleForm.trim() : "",
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: "Event created successfully.",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error.message);
    res.status(400).json({ message: "Could not create event." });
  }
});

// PUT: Only the creator or an admin can edit an event
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const isCreator =
      event.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "You can only edit your own events.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "date",
      "time",
      "venue",
      "capacity",
      "image",
      "category",
      "location",
      "deadline",
      "googleForm",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    }

    await event.save();

    res.json({
      message: "Event updated successfully.",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error.message);
    res.status(400).json({ message: "Could not update event." });
  }
});

// DELETE: Only the creator or an admin can delete an event
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const isCreator =
      event.createdBy.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own events.",
      });
    }

    await event.deleteOne();
    await Registration.deleteMany({ event: event._id });

    res.json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("Delete event error:", error.message);
    res.status(400).json({ message: "Could not delete event." });
  }
});

module.exports = router;
