const Roommate = require('../models/roommatesModel');

// Get all roommates
exports.getAllRoommates = async (req, res) => {
  try {
    const roommates = await Roommate.find();
    res.json(roommates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new roommate
exports.addRoommate = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.roommateImage = req.file.path;
    }
    const roommate = new Roommate(data);
    await roommate.save();
    res.status(201).json(roommate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a single roommate by ID
exports.getRoommateById = async (req, res) => {
  try {
    const roommate = await Roommate.findById(req.params.id);
    if (!roommate) {
      return res.status(404).json({ error: 'Roommate not found' });
    }
    res.json(roommate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
