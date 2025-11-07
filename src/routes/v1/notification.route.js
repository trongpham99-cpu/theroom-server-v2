const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.listNotifications);
router.post('/send', notificationController.createNotification);

module.exports = router;
