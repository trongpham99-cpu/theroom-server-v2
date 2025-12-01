const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Apartment', apartmentSchema);
