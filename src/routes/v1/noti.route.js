const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/noti.controller');

router.get('/', notificationController.listNotifications);
router.post('/send', notificationController.createNotification);

module.exports = router;
