const mongoose = require('mongoose');

const bunkerRoomStateSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    status: String,
    label: String,
    description: String
});

module.exports = mongoose.model('BunkerRoomState', bunkerRoomStateSchema, 'Bunker_room_state');