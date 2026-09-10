const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/', customerController.addCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomer);
router.get('/birthdays', customerController.getBirthdayReminders);
router.get('/:id', customerController.getCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/:id/history', customerController.getCustomerHistory);

module.exports = router;
