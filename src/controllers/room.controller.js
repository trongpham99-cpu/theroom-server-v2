const Room = require('../models/room.model');
const Customer = require('../models/customer.model');
const Apartment = require('../models/apartment.model');

exports.listRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        const countDocuments = await Room.countDocuments();

        return res.status(200).json({
            status: 'success',
            message: 'Rooms retrieved successfully',
            data: {
                rows: rooms,
                total: countDocuments,
            }
        });
    } catch (error) {
        console.error('Error listing rooms:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { code, apartment_id } = req.body;

        // Validate required fields
        if (!code || !apartment_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'Room code and apartment_id are required'
            });
        }

        // Check if apartment exists
        const apartment = await Apartment.findById(apartment_id);
        if (!apartment) {
            return res.status(404).json({
                status: 'fail',
                message: 'Apartment not found'
            });
        }

        // Check if room code already exists in this apartment
        const existingRoom = await Room.findOne({ code, apartment_id });
        if (existingRoom) {
            return res.status(400).json({
                status: 'fail',
                message: 'Room code already exists in this apartment'
            });
        }

        // Create room
        const room = await Room.create({ code, apartment_id });

        return res.status(201).json({
            status: 'success',
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

const normalizeString = (str) => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
};

exports.checkRoom = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(200).json({
                version: "chatbot",
                content: {
                    messages: [
                        {
                            type: "text",
                            text: "Vui lòng nhập mã phòng để kiểm tra."
                        }
                    ]
                }
            });
        }

        const inputText = normalizeString(message);

        const allRooms = await Room.find({}, { code: 1 });

        const matchedRoom = allRooms.find(room => {
            const roomCode = normalizeString(room.code);
            return inputText.includes(roomCode);
        });

        if (matchedRoom) {
            return res.status(200).json({
                version: "chatbot",
                content: {
                    messages: [
                        {
                            type: "text",
                            text: `Xin chào! Mã phòng ${matchedRoom.code} đã được xác nhận. Bạn cần hỗ trợ gì?`
                        }
                    ]
                }
            });
        } else {
            return res.status(200).json({
                version: "chatbot",
                content: {
                    messages: [
                        {
                            type: "text",
                            text: "Không tìm thấy mã phòng hợp lệ trong tin nhắn của bạn. Vui lòng thử lại."
                        }
                    ]
                }
            });
        }

    } catch (error) {
        console.error("Lỗi kiểm tra phòng:", error.message);
        return res.status(200).json({
            version: "chatbot",
            content: {
                messages: [
                    {
                        type: "text",
                        text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít phút."
                    }
                ]
            }
        });
    }
};

exports.registerRoom = async (req, res) => {
    try {
        const { uuid, name, phone, dob, room_id, apartment_id } = req.body;
        if (!uuid || !name || !phone || !dob || !room_id || !apartment_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields',
            });
        }

        const isExits = await Customer.exists({ uuid });
        if (isExits) {
            return res.status(400).json({
                status: 'error',
                message: 'Customer with this UUID already exists',
            });
        }

        const newCustomer = new Customer({
            uuid,
            name,
            phone,
            dob: new Date(dob),
            room_id,
            apartment_id
        });

        await newCustomer.save();
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request.',
            error: error.message
        });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, apartment_id } = req.body;

        // Check if room exists
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({
                status: 'fail',
                message: 'Room not found'
            });
        }

        // Validate required fields
        if (!code) {
            return res.status(400).json({
                status: 'fail',
                message: 'Room code is required'
            });
        }

        // If apartment_id is provided, check if it exists
        if (apartment_id) {
            const apartment = await Apartment.findById(apartment_id);
            if (!apartment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Apartment not found'
                });
            }
        }

        // Check if new code already exists in the same apartment
        const targetApartmentId = apartment_id || room.apartment_id;
        const existingRoom = await Room.findOne({ 
            code, 
            apartment_id: targetApartmentId,
            _id: { $ne: id }
        });
        if (existingRoom) {
            return res.status(400).json({
                status: 'fail',
                message: 'Room code already exists in this apartment'
            });
        }

        // Update room
        room.code = code;
        if (apartment_id) {
            room.apartment_id = apartment_id;
        }
        await room.save();

        return res.status(200).json({
            status: 'success',
            message: 'Room updated successfully',
            data: room
        });
    } catch (error) {
        console.error('Error updating room:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if room exists
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({
                status: 'fail',
                message: 'Room not found'
            });
        }

        // Check if room has customers
        const customerCount = await Customer.countDocuments({ room_id: id });
        if (customerCount > 0) {
            return res.status(400).json({
                status: 'fail',
                message: `Cannot delete room. It has ${customerCount} customer(s). Please remove customers first.`
            });
        }

        // Delete room
        await Room.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: 'Room deleted successfully',
            data: {
                deleted_id: id,
                deleted_code: room.code
            }
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};