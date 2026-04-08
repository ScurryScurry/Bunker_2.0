// models/ExtraInfo.js
const mongoose = require('mongoose');

const extraInfoSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});

module.exports = mongoose.model('ExtraInfo', extraInfoSchema, 'Facts');