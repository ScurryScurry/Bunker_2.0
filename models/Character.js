// models/Character.js
const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});

module.exports = mongoose.model('Character', characterSchema, 'Character');