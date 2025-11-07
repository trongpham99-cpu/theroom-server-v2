const Room = require('../models/roomModel');
const Customer = require('../models/customerModel');

exports.listRooms = async (req, res) => {
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
}