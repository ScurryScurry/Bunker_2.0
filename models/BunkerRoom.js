const mongoose = require('mongoose');

const bunkerRoomSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String,
    tags: [String],
    description: String
});

module.exports = mongoose.model('BunkerRoom', bunkerRoomSchema, 'Bunker_rooms');