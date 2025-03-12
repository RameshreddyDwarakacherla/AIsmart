const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parkingSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  vehicle: {
    type: {
      type: String,
      required: true,
      enum: ['two-wheeler', 'four-wheeler', 'bus']
    },
    number: {
      type: String,
      required: true
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in hours
    required: true,
    min: 1
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ parkingSlot: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

// Static method to check slot availability
bookingSchema.statics.checkAvailability = async function(slotId, startTime, endTime) {
  const conflictingBooking = await this.findOne({
    parkingSlot: slotId,
    status: { $in: ['pending', 'active'] },
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  });
  
  return !conflictingBooking;
};

// Static method to get user's active bookings
bookingSchema.statics.getUserActiveBookings = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['pending', 'active'] }
  })
  .populate('parkingSlot')
  .sort({ startTime: 1 });
};

// Static method to get booking statistics
bookingSchema.statics.getStatistics = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          status: "$status"
        },
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        stats: {
          $push: {
            status: "$_id.status",
            count: "$count",
            amount: "$totalAmount"
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 