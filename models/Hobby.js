// models/Hobby.js
const mongoose = require('mongoose');

const hobbySchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});

module.exports = mongoose.model('Hobby', hobbySchema, 'Hobby');