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
        type: Object,
        default: {},
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
