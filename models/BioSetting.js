const mongoose = require('mongoose');
const bioSettingSchema = new mongoose.Schema({
    _id: String,
    age: { min: Number, max: Number },
    weight: { min: Number, max: Number },
    height: { min: Number, max: Number }
});
module.exports = mongoose.model('BioSetting', bioSettingSchema, 'cfg_bio');