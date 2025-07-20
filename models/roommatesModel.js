const mongoose = require('mongoose');

// Define the schema for a roommate listing
const roommateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  occupation: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  budget: {
    type: Number,
    required: true,
  },
  preferredLocation: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  roommateImage: {
    type: String, // Store image URL or path
    required: false,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
});

const Roommate = mongoose.model('Roommate', roommateSchema);

module.exports = Roommate;