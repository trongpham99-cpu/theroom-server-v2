const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    uuid: { type: String },
    name: { type: String, required: true },
    phone: { type: String },
    dob: { type: Date },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // Optional - can be assigned later
    apartment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' }, // Optional - auto-set from room
}, {
    timestamps: true,
});

module.exports = mongoose.model('Customer', customerSchema);
