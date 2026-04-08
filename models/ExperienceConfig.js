// models/ExperienceConfig.js
const mongoose = require('mongoose');

const experienceConfigSchema = new mongoose.Schema({
    _id: String, // 'default'
    levels: [{
        min: Number,
        max: Number,
        label: String
    }]
});

module.exports = mongoose.model('ExperienceConfig', experienceConfigSchema, 'cdf_exp');