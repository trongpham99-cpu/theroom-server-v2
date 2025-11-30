const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    room_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    }],
    apartment_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apartment',
    }],
    logs: [{
        customer_name: { type: String },
        customer_phone: { type: String },
        message: { type: String },
        result: { type: String },
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
