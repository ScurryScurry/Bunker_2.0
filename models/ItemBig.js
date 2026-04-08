const mongoose = require('mongoose');
const itemBigSchema = new mongoose.Schema({
    _id: String,
    pack_id: String,
    name: String
});
module.exports = mongoose.model('ItemBig', itemBigSchema, 'Item_big');