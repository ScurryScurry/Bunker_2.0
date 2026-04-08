const mongoose = require('mongoose');
const itemSmallSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});
module.exports = mongoose.model('ItemSmall', itemSmallSchema, 'Item_small');