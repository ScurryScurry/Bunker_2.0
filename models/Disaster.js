// models/Disaster.js
const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String,
    description: String,
    duration: Number,
    destruction_level: Number
});

// Заміни 'Disasters' на точну назву твоєї колекції (можливо, в тебе це 'Disaster' чи 'Cards_disaster')
module.exports = mongoose.model('Disaster', disasterSchema, 'Disaster');