const Apartment = require('../models/apartment.model');

exports.listApartments = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error listing apartments:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.createApartment = async (req, res) => {
    try {
        const { code } = req.body;

        // Validate
        if (!code) {
            return res.status(400).json({
                status: 'fail',
                message: 'Apartment code is required'
            });
        }

        // Check if code already exists
        const existingApartment = await Apartment.findOne({ code });
        if (existingApartment) {
            return res.status(400).json({
                status: 'fail',
                message: 'Apartment code already exists'
            });
        }

        // Create apartment
        const apartment = await Apartment.create({ code });

        return res.status(201).json({
            status: 'success',
            message: 'Apartment created successfully',
            data: apartment
        });
    } catch (error) {
        console.error('Error creating apartment:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.updateApartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { code } = req.body;

        // Check if apartment exists
        const apartment = await Apartment.findById(id);
        if (!apartment) {
            return res.status(404).json({
                status: 'fail',
                message: 'Apartment not found'
            });
        }

        // Validate
        if (!code) {
            return res.status(400).json({
                status: 'fail',
                message: 'Apartment code is required'
            });
        }

        // Check if new code already exists (and not the same apartment)
        const existingApartment = await Apartment.findOne({ code, _id: { $ne: id } });
        if (existingApartment) {
            return res.status(400).json({
                status: 'fail',
                message: 'Apartment code already exists'
            });
        }

        // Update apartment
        apartment.code = code;
        await apartment.save();

        return res.status(200).json({
            status: 'success',
            message: 'Apartment updated successfully',
            data: apartment
        });
    } catch (error) {
        console.error('Error updating apartment:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.deleteApartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if apartment exists
        const apartment = await Apartment.findById(id);
        if (!apartment) {
            return res.status(404).json({
                status: 'fail',
                message: 'Apartment not found'
            });
        }

        // Check if apartment has rooms
        const Room = require('../models/room.model');
        const roomCount = await Room.countDocuments({ apartment_id: id });
        if (roomCount > 0) {
            return res.status(400).json({
                status: 'fail',
                message: `Cannot delete apartment. It has ${roomCount} room(s). Please delete rooms first.`
            });
        }

        // Delete apartment
        await Apartment.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: 'Apartment deleted successfully',
            data: {
                deleted_id: id,
                deleted_code: apartment.code
            }
        });
    } catch (error) {
        console.error('Error deleting apartment:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};
