const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

// Get all parking locations
const getParkingLocations = async (req, res) => {
  try {
    const locations = await ParkingSlot.aggregate([
      {
        $group: {
          _id: '$location.id',
          name: { $first: '$location.name' },
          slots: {
            $push: {
              type: '$type',
              status: '$status'
            }
          }
        }
      }
    ]);

    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get parking slots by location
const getParkingSlots = async (req, res) => {
  try {
    const { locationId } = req.params;
    const slots = await ParkingSlot.find({
      'location.id': locationId
    }).sort('slotNumber');

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available slots by location and vehicle type
const getAvailableSlots = async (req, res) => {
  try {
    const { locationId, vehicleType } = req.params;
    const slots = await ParkingSlot.getAvailableSlots(locationId, vehicleType);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Book a parking slot
const bookSlot = async (req, res) => {
  try {
    const { slotId, startTime, duration } = req.body;
    const endTime = new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000);

    // Check if slot exists and is available
    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available' });
    }

    // Check if slot type matches user's vehicle type
    if (slot.type !== req.user.vehicle.type) {
      return res.status(400).json({ message: 'Invalid vehicle type for this slot' });
    }

    // Check slot availability for the requested time
    const isAvailable = await Booking.checkAvailability(slotId, startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Slot is not available for the selected time' });
    }

    // Calculate total amount (implement your pricing logic here)
    const ratePerHour = 20; // Example rate
    const totalAmount = duration * ratePerHour;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      parkingSlot: slotId,
      vehicle: req.user.vehicle,
      startTime,
      duration,
      endTime,
      totalAmount
    });

    await booking.save();

    // Update slot status
    slot.status = 'reserved';
    slot.currentBooking = booking._id;
    await slot.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user's booking history
const getBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSlot')
      .sort('-createdAt');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: { $in: ['pending', 'active'] }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Update slot status
    const slot = await ParkingSlot.findById(booking.parkingSlot);
    slot.status = 'available';
    slot.currentBooking = null;
    await slot.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get real-time occupancy data
const getRealtimeOccupancy = async (req, res) => {
  try {
    const occupancy = await ParkingSlot.getStatistics();
    res.json(occupancy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getParkingLocations,
  getParkingSlots,
  getAvailableSlots,
  bookSlot,
  getBookingHistory,
  cancelBooking,
  getRealtimeOccupancy
}; 