const express = require('express');
const router = express.Router();
const apartmentController = require('../../controllers/apartment.controller');

router.get('/', apartmentController.listApartments);
router.get('/:id', apartmentController.getApartment);
router.post('/', apartmentController.createApartment);
router.patch('/:id', apartmentController.updateApartment);
router.put('/:id', apartmentController.updateApartment);
router.delete('/:id', apartmentController.deleteApartment);

module.exports = router;
