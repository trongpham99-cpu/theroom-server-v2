const express = require('express');
const router = express.Router();
const apartmentController = require('../../controllers/apartment.controller');

router.get('/', apartmentController.listApartments);
router.post('/', apartmentController.createApartment);
router.delete('/:id', apartmentController.deleteApartment);

module.exports = router;
