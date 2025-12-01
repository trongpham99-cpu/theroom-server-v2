const Customer = require('../models/customer.model');
const Room = require('../models/room.model');
const Apartment = require('../models/apartment.model');

/**
 * List all customers
 */
exports.listCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy, sortOrder, search, room_id, apartment_id } = req.query;

        let query = {};

        // Search by name or phone
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { name: regex },
                { phone: regex },
            ];
        }

        // Filter by room
        if (room_id) {
            query.room_id = room_id;
        }

        // Filter by apartment
        if (apartment_id) {
            query.apartment_id = apartment_id;
        }

        // Sort
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        // Pagination
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const customers = await Customer.find(query)
            .populate('room_id', 'code')
            .populate('apartment_id', 'code')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit, 10));

        const total = await Customer.countDocuments(query);

        return res.status(200).json({
            status: 'success',
            message: 'Customers retrieved successfully',
            data: {
                rows: customers,
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            }
        });
    } catch (error) {
        console.error('Error listing customers:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get customer by ID
 */
exports.getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id)
            .populate('room_id', 'code')
            .populate('apartment_id', 'code');

        if (!customer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Customer not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Customer retrieved successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error getting customer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Create customer
 * Note: room_id and apartment_id are optional - customer can be created without room assignment
 */
exports.createCustomer = async (req, res) => {
    try {
        const { uuid, name, phone, dob, room_id, apartment_id } = req.body;

        // Validate required fields (room_id and apartment_id are optional)
        if (!uuid || !name || !phone || !dob) {
            return res.status(400).json({
                status: 'fail',
                message: 'Missing required fields: uuid, name, phone, dob'
            });
        }

        // Check if UUID already exists
        const existingCustomer = await Customer.findOne({ uuid });
        if (existingCustomer) {
            return res.status(400).json({
                status: 'fail',
                message: 'Customer with this UUID already exists'
            });
        }

        // If room_id is provided, validate it exists
        if (room_id) {
            const room = await Room.findById(room_id);
            if (!room) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Room not found'
                });
            }
        }

        // If apartment_id is provided, validate it exists
        if (apartment_id) {
            const apartment = await Apartment.findById(apartment_id);
            if (!apartment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Apartment not found'
                });
            }
        }

        // If both room_id and apartment_id are provided, ensure they match
        if (room_id && apartment_id) {
            const room = await Room.findById(room_id);
            if (room && room.apartment_id.toString() !== apartment_id) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Room does not belong to the specified apartment'
                });
            }
        }

        // If only room_id is provided, get apartment_id from room
        let finalApartmentId = apartment_id;
        if (room_id && !apartment_id) {
            const room = await Room.findById(room_id);
            if (room) {
                finalApartmentId = room.apartment_id;
            }
        }

        // Create customer
        const customer = await Customer.create({
            uuid,
            name,
            phone,
            dob: new Date(dob),
            room_id: room_id || null,
            apartment_id: finalApartmentId || null
        });

        // Populate references
        const populatedCustomer = await Customer.findById(customer._id)
            .populate('room_id', 'code')
            .populate('apartment_id', 'code');

        return res.status(201).json({
            status: 'success',
            message: room_id ? 'Customer created and assigned to room successfully' : 'Customer created successfully (no room assigned yet)',
            data: populatedCustomer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update customer
 */
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, dob, room_id, apartment_id } = req.body;

        // Check if customer exists
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Customer not found'
            });
        }

        // Update fields
        if (name !== undefined) customer.name = name;
        if (phone !== undefined) customer.phone = phone;
        if (dob !== undefined) customer.dob = new Date(dob);
        
        // Update room if provided
        if (room_id) {
            const room = await Room.findById(room_id);
            if (!room) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Room not found'
                });
            }
            customer.room_id = room_id;
        }

        // Update apartment if provided
        if (apartment_id) {
            const apartment = await Apartment.findById(apartment_id);
            if (!apartment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Apartment not found'
                });
            }
            customer.apartment_id = apartment_id;
        }

        await customer.save();

        // Populate references
        const updatedCustomer = await Customer.findById(customer._id)
            .populate('room_id', 'code')
            .populate('apartment_id', 'code');

        return res.status(200).json({
            status: 'success',
            message: 'Customer updated successfully',
            data: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Assign customer to room (or change room)
 * This is a dedicated endpoint for better UX - clearly shows the intent to assign/change room
 */
exports.assignRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_id } = req.body;

        // Validate room_id is provided
        if (!room_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'room_id is required'
            });
        }

        // Check if customer exists
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Customer not found'
            });
        }

        // Check if room exists
        const room = await Room.findById(room_id);
        if (!room) {
            return res.status(404).json({
                status: 'fail',
                message: 'Room not found'
            });
        }

        // Get apartment_id from room
        const apartment_id = room.apartment_id;

        // Check if customer already has a room (for message)
        const previousRoomId = customer.room_id ? customer.room_id.toString() : null;
        const isChangingRoom = previousRoomId && previousRoomId !== room_id;

        // Update customer room assignment
        customer.room_id = room_id;
        customer.apartment_id = apartment_id;
        await customer.save();

        // Populate references
        const updatedCustomer = await Customer.findById(customer._id)
            .populate('room_id', 'code')
            .populate('apartment_id', 'code');

        const roomCode = updatedCustomer.room_id?.code || 'new room';
        const message = isChangingRoom
            ? `Customer moved to room ${roomCode} successfully`
            : `Customer assigned to room ${roomCode} successfully`;

        return res.status(200).json({
            status: 'success',
            message,
            data: updatedCustomer
        });
    } catch (error) {
        console.error('Error assigning room to customer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Delete customer
 */
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer exists
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({
                status: 'fail',
                message: 'Customer not found'
            });
        }

        // Delete customer
        await Customer.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: 'Customer deleted successfully',
            data: {
                deleted_id: id,
                deleted_name: customer.name
            }
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

