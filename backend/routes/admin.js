const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getUsers,
  updateSlotStatus,
  getBookingAnalytics,
  generateReport,
  getMonitoringData
} = require('../controllers/adminController');

// All routes require admin authentication
router.get('/users', adminAuth, getUsers);
router.put('/parking/slots/:slotId', adminAuth, updateSlotStatus);
router.get('/parking/analytics', adminAuth, getBookingAnalytics);
router.post('/parking/reports', adminAuth, generateReport);
router.get('/parking/monitoring', adminAuth, getMonitoringData);

module.exports = router; 