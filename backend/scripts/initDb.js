const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');
require('dotenv').config();

const parkingLocations = [
  {
    id: 'girls-hostel',
    name: "Girls' Hostel Frontside",
    capacity: { bus: 50 }
  },
  {
    id: '8th-block',
    name: "8th Block Frontside",
    capacity: { 'two-wheeler': 30, 'four-wheeler': 10 }
  },
  {
    id: 'admin-block',
    name: "Admin Block",
    capacity: { 'two-wheeler': 30, 'four-wheeler': 10 }
  },
  {
    id: 'tiffac',
    name: "TIFFAC Core",
    capacity: { 'two-wheeler': 20, 'four-wheeler': 5 }
  },
  {
    id: '11th-block',
    name: "11th Block",
    capacity: { bus: 10 }
  },
  {
    id: 'polytechnic',
    name: "Polytechnic Block",
    capacity: { 'two-wheeler': 20, 'four-wheeler': 10 }
  }
];

const generateSlots = () => {
  const slots = [];
  let x = 0, y = 0;

  parkingLocations.forEach(location => {
    Object.entries(location.capacity).forEach(([type, count]) => {
      for (let i = 1; i <= count; i++) {
        slots.push({
          location: {
            id: location.id,
            name: location.name
          },
          slotNumber: `${location.id}-${type}-${i}`,
          type,
          status: 'available',
          coordinates: { x, y: y + i }
        });
      }
    });
    x++;
    if (x > 1) {
      x = 0;
      y += Math.max(...Object.values(location.capacity)) + 1;
    }
  });

  return slots;
};

const initializeDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing slots
    await ParkingSlot.deleteMany({});
    console.log('Cleared existing parking slots');

    // Create new slots
    const slots = generateSlots();
    await ParkingSlot.insertMany(slots);
    console.log(`Created ${slots.length} parking slots`);

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDb(); 