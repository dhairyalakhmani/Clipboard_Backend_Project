const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
  text: String,
  deviceId: String,
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  clips: [clipSchema]
});

module.exports = mongoose.model('Room', roomSchema);