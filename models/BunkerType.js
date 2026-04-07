const mongoose = require('mongoose');

const bunkerTypeSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String,
    short_description: String,
    room_tags: [String],
    capacity: {
        min: Number,
        max: Number
    },
    rooms_count: {
        min: Number,
        max: Number
    }
});

module.exports = mongoose.model('BunkerType', bunkerTypeSchema, 'Bunker');