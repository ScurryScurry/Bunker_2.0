// models/Health.js
const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
    _id: String,           // Наприклад, 'cls_flu'
    pack_id: String,       // 'pack_classic'
    name: String,          // 'Грип'
    type: String,          // 'INFECTIOUS', 'CHRONIC' тощо
    danger_level: String,  // 'minor', 'major', 'fatal'
    description: String
});

module.exports = mongoose.model('Health', healthSchema, 'Health');