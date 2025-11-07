const notificationModel = require('../models/notificationModel');
const roomModel = require('../models/roomModel');
const customerModel = require('../models/customerModel');
const apartmentModel = require('../models/apartmentModel');

const { sendTransactionMessage } = require('../services/zalo');

const { notificationTemplate } = require('../consts');

exports.createNotification = async (req, res) => {
    try {
        const {
            apartmentIds = [],
            roomIds = [],
            templateData = {},
        } = req.body;
        const { notification_title, notification_body } = templateData;

        if (apartmentIds.length) {
            const responseLogs = [];
            for (const apartmentId of apartmentIds) {

                const apartment = await apartmentModel.findById(apartmentId);
                if (!apartment) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Apartment not found'
                    });
                }

                const customers = await customerModel.find({ apartment_id: apartmentId })
                    .populate('room_id')
                    .populate('apartment_id');
                if (customers.length) {
                    for (const customer of customers) {
                        const { uuid, name } = customer;

                        let newPhone = customer.phone;
                        if (newPhone.startsWith('0')) {
                            newPhone = `84${newPhone.slice(1)}`;
                        }

                        const personalizedPayload = JSON.parse(JSON.stringify(notificationTemplate({
                            title: notification_title,
                            content: notification_body,
                            customer: {
                                name: name || 'Quý khách',
                                apartment_code: customer.apartment_id?.code || 'Chưa cập nhật',
                                room_code: customer.room_id?.code || 'Chưa cập nhật',
                                phone: newPhone,
                            },
                        })));

                        const result = await sendTransactionMessage(uuid, personalizedPayload);
                        console.log(`Gửi thông báo đến ${newPhone} - Tiêu đề: ${notification_title} - Nội dung: ${notification_body}`);
                        responseLogs.push({
                            customer_name: name || 'Khách hàng',
                            customer_phone: newPhone,
                            message: `Gửi thông báo thành công đến ${name || 'khách hàng'} ${newPhone}`,
                            result: result.message || 'Gửi thành công',
                        });
                    }
                }
            }

            const notificationLog = new notificationModel({
                title: notification_title,
                content: notification_body,
                apartment_ids: apartmentIds,
                room_ids: roomIds,
                logs: responseLogs,
            });
            const newLog = await notificationLog.save();

            const notification = await notificationModel.findById(newLog._id).populate('apartment_ids', 'name').populate('room_ids', 'code');

            return res.status(200).json({
                status: 'success',
                message: 'Notifications sent successfully to apartments',
                data: notification
            });
        }

        if (roomIds.length) {
            for (const roomId of roomIds) {
                const room = await roomModel.findById(roomId);
                if (!room) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Room not found'
                    });
                }

                const customers = await customerModel.find({ room_id: roomId });
                if (customers.length === 0) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'No customers found for this room'
                    });
                }

                for (const customer of customers) {
                    const { uuid, name } = customer;

                    let newPhone = customer.phone;
                    if (newPhone.startsWith('0')) {
                        newPhone = `84${newPhone.slice(1)}`;
                    }

                    const personalizedPayload = JSON.parse(JSON.stringify(notificationTemplate({
                        title: notification_title,
                        content: notification_body,
                        name: name || 'Quý khách',
                    })));

                    const result = await sendPromotionMessage(uuid, personalizedPayload);
                    console.log(`Gửi thông báo đến ${newPhone} - Tiêu đề: ${notification_title} - Nội dung: ${notification_body}`);
                    responseLogs.push({
                        customer_name: name || 'Khách hàng',
                        customer_phone: newPhone,
                        message: `Gửi thông báo thành công đến ${name || 'khách hàng'} ${newPhone}`,
                        result: result.message || 'Gửi thành công',
                    });
                }
            }

            const notificationLog = new notificationModel({
                title: notification_title,
                content: notification_body,
                room_ids: roomIds,
                apartment_ids: apartmentIds,
                logs: responseLogs,
            });
            const newLog = await notificationLog.save();

            const notification = await notificationModel.findById(newLog._id).populate('apartment_ids', 'name').populate('room_ids', 'code');

            return res.status(200).json({
                status: 'success',
                message: 'Notifications sent successfully to rooms',
                data: notification
            });
        }
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

exports.listNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel
            .find()
            .populate('apartment_ids')
            .populate('room_ids')
            .sort({ createdAt: -1 });
        const countDocuments = await notificationModel.countDocuments();

        return res.status(200).json({
            status: 'success',
            message: 'Notifications retrieved successfully',
            data: {
                rows: notifications,
                total: countDocuments,
            }
        });
    } catch (error) {
        console.error('Error listing notifications:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};