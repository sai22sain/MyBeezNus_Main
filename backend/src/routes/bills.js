const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.post('/', billController.createBill);
router.get('/', billController.getAllBills);
router.get('/:id', billController.getBill);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);
router.get('/:id/download', billController.downloadBillPDF);
router.post('/:id/whatsapp', billController.sendBillWhatsApp);

module.exports = router;
