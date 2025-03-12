const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getParkingLocations,
  getParkingSlots,
  getAvailableSlots,
  bookSlot,
  getBookingHistory,
  cancelBooking,
  getRealtimeOccupancy
} = require('../controllers/parkingController');

// Public routes
router.get('/locations', getParkingLocations);
router.get('/slots/:locationId', getParkingSlots);

// Protected routes
router.get('/available/:locationId/:vehicleType', auth, getAvailableSlots);
router.post('/book', auth, bookSlot);
router.get('/bookings/history', auth, getBookingHistory);
router.delete('/bookings/:bookingId', auth, cancelBooking);
router.get('/realtime-occupancy', auth, getRealtimeOccupancy);

module.exports = router; 