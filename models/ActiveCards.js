const mongoose = require('mongoose');

const activeCardSchema = new mongoose.Schema({
    pack_id: { type: String, default: 'pack_classic' },
    name: { type: String, required: true },
    description: String,
    type: { type: String, default: 'ACTION' },
    logic: {
        action: { type: String, required: true },   // DESTROY, ADD, REVEAL, SET
        target: { type: String, default: 'SELF' },  // SELF, SELECT
        field: String,
        attribute: String,
        filter: Object,
        item: Object,
        value: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('ActiveCards', activeCardSchema, 'Active_cards');
