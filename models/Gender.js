const mongoose = require('mongoose');
const genderSchema = new mongoose.Schema({
    _id: String, // 'gender_male', 'gender_female'
    label: String,
    orientations: [String]
});
module.exports = mongoose.model('Gender', genderSchema, 'Gender');