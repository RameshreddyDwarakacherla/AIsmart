const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update parking slot status
const updateSlotStatus = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { status } = req.body;

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    slot.status = status;
    if (status === 'available') {
      slot.currentBooking = null;
    }

    await slot.save();
    res.json(slot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get booking analytics
const getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await Booking.getStatistics(start, end);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate parking report
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, locationId, vehicleType } = req.body;

    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (locationId) {
      query['parkingSlot.location.id'] = locationId;
    }

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'firstName lastName email vehicle')
      .populate('parkingSlot', 'location slotNumber')
      .sort('-createdAt');

    // Transform data for report
    const report = {
      generatedAt: new Date(),
      period: {
        from: startDate,
        to: endDate
      },
      summary: {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
        vehicleTypeDistribution: bookings.reduce((acc, booking) => {
          acc[booking.vehicle.type] = (acc[booking.vehicle.type] || 0) + 1;
          return acc;
        }, {})
      },
      bookings: bookings.map(booking => ({
        bookingId: booking._id,
        user: `${booking.user.firstName} ${booking.user.lastName}`,
        vehicleNumber: booking.vehicle.number,
        location: booking.parkingSlot.location.name,
        slotNumber: booking.parkingSlot.slotNumber,
        startTime: booking.startTime,
        duration: booking.duration,
        amount: booking.totalAmount,
        status: booking.status
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get real-time monitoring data
const getMonitoringData = async (req, res) => {
  try {
    const [occupancyStats, revenueStats, activeBookings] = await Promise.all([
      ParkingSlot.getStatistics(),
      Booking.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.find({ status: 'active' })
        .populate('user', 'firstName lastName vehicle')
        .populate('parkingSlot', 'location slotNumber')
        .sort('-startTime')
        .limit(10)
    ]);

    res.json({
      occupancy: occupancyStats,
      revenue: revenueStats,
      activeBookings: activeBookings.map(booking => ({
        id: booking._id,
        user: `${booking.user.firstName} ${booking.user.lastName}`,
        vehicleNumber: booking.user.vehicle.number,
        location: booking.parkingSlot.location.name,
        slotNumber: booking.parkingSlot.slotNumber,
        startTime: booking.startTime,
        duration: booking.duration
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateSlotStatus,
  getBookingAnalytics,
  generateReport,
  getMonitoringData
}; 