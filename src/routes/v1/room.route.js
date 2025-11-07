const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/', roomController.listRooms);
router.post('/check', roomController.checkRoom);
router.post('/register', roomController.registerRoom);

module.exports = router;
