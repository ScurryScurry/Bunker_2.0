// models/GamePlayer.js
const mongoose = require('mongoose');

const gamePlayerSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, index: true }, // index для швидкого пошуку
    userId: { type: String, required: true },
    username: String,
    isHost: { type: Boolean, default: false },
    cards: { type: Object, default: {} },
    revealedCards: { type: Object, default: {} }
});

module.exports = mongoose.model('GamePlayer', gamePlayerSchema);