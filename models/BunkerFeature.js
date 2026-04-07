const mongoose = require('mongoose');

const bunkerFeatureSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String,
    effect: String
});

module.exports = mongoose.model('BunkerFeature', bunkerFeatureSchema, 'Bunker_feature');