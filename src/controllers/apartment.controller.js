const Apartment = require('../models/apartment.model');

exports.listApartments = async (req, res) => {
    const apartments = await Apartment.find().sort({ createdAt: -1 });
    const countDocuments = await Apartment.countDocuments();

    return res.status(200).json({
        status: 'success',
        message: 'Apartments retrieved successfully',
        data: {
            rows: apartments,
            total: countDocuments,
        }
    });
};
