const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/dashboard', reportController.getDashboardStats);
router.get('/daily', reportController.getDailyRevenue);
router.get('/monthly', reportController.getMonthlyRevenue);
router.get('/top-services', reportController.getTopServices);
router.get('/repeat-customers', reportController.getRepeatCustomers);
router.get('/export', reportController.exportRevenueReport);

module.exports = router;
