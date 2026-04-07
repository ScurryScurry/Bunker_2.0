// models/Room.js
const mongoose = require('mongoose');

// models/Room.js
const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, default: 'classic' },
    status: { type: String, default: 'lobby' },
    bunkerData: { type: Object },
    disasterData: { type: Object }
});

module.exports = mongoose.model('Room', roomSchema);