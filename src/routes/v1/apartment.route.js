const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartment.controller');

router.get('/', apartmentController.listApartments);

module.exports = router;
