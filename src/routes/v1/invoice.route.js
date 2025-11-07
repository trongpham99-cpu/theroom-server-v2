const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoice);
router.post('/', invoiceController.createInvoice);
router.post('/:id/send', invoiceController.sendOne);
router.post('/send-many', invoiceController.sendMany);
router.get('/report', invoiceController.getReport);

router.post('/sync-file-sheet', invoiceController.syncFromSheet);

module.exports = router;
