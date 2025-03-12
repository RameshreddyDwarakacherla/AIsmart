const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  location: {
    id: {
      type: String,
      required: true,
      enum: ['girls-hostel', '8th-block', 'admin-block', 'tiffac', '11th-block', 'polytechnic']
    },
    name: {
      type: String,
      required: true
    }
  },
  slotNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['two-wheeler', 'four-wheeler', 'bus']
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  coordinates: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
parkingSlotSchema.index({ 'location.id': 1, type: 1 });
parkingSlotSchema.index({ status: 1 });

// Static method to get available slots by location and type
parkingSlotSchema.statics.getAvailableSlots = function(locationId, vehicleType) {
  return this.find({
    'location.id': locationId,
    type: vehicleType,
    status: 'available'
  });
};

// Static method to get slot statistics
parkingSlotSchema.statics.getStatistics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          location: '$location.id',
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.location',
        types: {
          $push: {
            type: '$_id.type',
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    }
  ]);
};

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

module.exports = ParkingSlot; 