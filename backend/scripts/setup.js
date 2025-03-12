const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
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

const setupDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      ParkingSlot.deleteMany({}),
      User.deleteMany({ isAdmin: true })
    ]);

    // Create parking slots
    console.log('Creating parking slots...');
    const slots = generateSlots();
    await ParkingSlot.insertMany(slots);
    console.log(`Created ${slots.length} parking slots`);

    // Create admin user
    console.log('Creating admin user...');
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@parking.com',
      password: 'admin123',
      isAdmin: true,
      vehicle: {
        type: 'four-wheeler',
        number: 'ADMIN-001'
      }
    };

    const admin = new User(adminData);
    await admin.save();
    console.log('Admin user created successfully');
    console.log('\nSetup completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);

    process.exit(0);
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
};

setupDatabase(); 