const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer.controller');

router.get('/', customerController.listCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerController.createCustomer);
router.patch('/:id', customerController.updateCustomer);
router.post('/:id/assign-room', customerController.assignRoom);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

