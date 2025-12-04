const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    code: { type: String, default: '', unique: true },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
}, {
    timestamps: true,
  }
);

module.exports = mongoose.model('Apartment', apartmentSchema);
