// models/Phobia.js
const mongoose = require('mongoose');

const phobiaSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});

module.exports = mongoose.model('Phobia', phobiaSchema, 'Phobia');