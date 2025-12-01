const notificationModel = require('../models/noti.model');
const roomModel = require('../models/room.model');
const customerModel = require('../models/customer.model');
const apartmentModel = require('../models/apartment.model');

// NOTE: Zalo integration is disabled for now
// TODO: Implement Zalo service for actual notification sending
//const { sendTransactionMessage } = require('../services/zalo.service');
//const { notificationTemplate } = require('../consts');

exports.createNotification = async (req, res) => {
    try {
        const {
            apartmentIds = [],
            roomIds = [],
            templateData = {},
        } = req.body;
        const { notification_title, notification_body } = templateData;

        // Validate required fields
        if (!notification_title || !notification_body) {
            return res.status(400).json({
                status: 'fail',
                message: 'notification_title and notification_body are required in templateData'
            });
        }

        // Create notification in database (without sending via Zalo)
        const notification = await notificationModel.create({
            title: notification_title,
            content: notification_body,
            apartment_ids: apartmentIds,
            room_ids: roomIds,
            logs: [] // Empty logs since we're not sending via Zalo yet
        });

        // Populate references
        const populatedNotification = await notificationModel.findById(notification._id)
            .populate('apartment_ids', 'code')
            .populate('room_ids', 'code');

        return res.status(201).json({
            status: 'success',
            message: 'Notification created successfully (Zalo integration pending)',
            data: populatedNotification
        });

    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
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