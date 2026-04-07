// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, default: 'classic' },
    status: { type: String, default: 'lobby' },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String
    }],
    // ОЦЕЙ РЯДОК ОБОВ'ЯЗКОВИЙ, інакше Mongoose нічого не збереже!
    // ... інші поля ...
    bunkerData: { type: Object },
    disasterData: { type: Object } // <--- ТЕПЕР DISASTER
});

module.exports = mongoose.model('Room', roomSchema);