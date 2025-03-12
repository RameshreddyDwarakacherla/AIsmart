const tf = require('@tensorflow/tfjs-node');
const mqtt = require('mqtt');
const { ParkingSlot } = require('../models/parkingSlot');

class VehicleDetectionService {
  constructor() {
    this.model = null;
    this.client = mqtt.connect('mqtt://localhost:1883');
    this.initialize();
  }

  async initialize() {
    try {
      // Load pre-trained model for vehicle detection
      this.model = await tf.loadLayersModel('file://./models/vehicle-detection-model/model.json');
      
      // Subscribe to MQTT topics for each parking location
      this.client.on('connect', () => {
        this.client.subscribe('parking/+/sensors');
        console.log('Connected to MQTT broker');
      });

      // Handle incoming sensor data
      this.client.on('message', async (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.processData(topic, data);
        } catch (error) {
          console.error('Error processing sensor data:', error);
        }
      });
    } catch (error) {
      console.error('Error initializing vehicle detection service:', error);
    }
  }

  async processData(topic, data) {
    const locationId = topic.split('/')[1];
    
    // Process image data using TensorFlow.js
    const imageBuffer = Buffer.from(data.image, 'base64');
    const imageTensor = tf.node.decodeImage(imageBuffer);
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const expanded = resized.expandDims(0);
    const normalized = expanded.div(255.0);

    // Perform vehicle detection
    const predictions = await this.model.predict(normalized).data();
    const vehicleType = this.classifyVehicle(predictions);

    // Update slot status in database
    if (data.slotId && vehicleType) {
      await this.updateSlotStatus(data.slotId, vehicleType);
    }

    // Cleanup tensors
    tf.dispose([imageTensor, resized, expanded, normalized]);
  }

  classifyVehicle(predictions) {
    const classes = ['two-wheeler', 'four-wheeler', 'bus'];
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return classes[maxIndex];
  }

  async updateSlotStatus(slotId, vehicleType) {
    try {
      const slot = await ParkingSlot.findById(slotId);
      if (slot) {
        slot.detectedVehicleType = vehicleType;
        slot.lastDetectionTime = new Date();
        await slot.save();

        // Emit real-time update
        this.client.publish('parking/updates', JSON.stringify({
          type: 'vehicle_detected',
          slotId,
          vehicleType,
          timestamp: new Date()
        }));
      }
    } catch (error) {
      console.error('Error updating slot status:', error);
    }
  }
}

module.exports = new VehicleDetectionService(); 