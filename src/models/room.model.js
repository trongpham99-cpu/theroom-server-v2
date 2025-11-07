const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    code: { type: String, required: true },
    apartment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Room', roomSchema);
