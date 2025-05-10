const mongoose = require("mongoose")

const deliveryPersonnelSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ["bicycle", "motorcycle", "car", "scooter", "van"],
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  lastLocationUpdateTime: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Create a geospatial index on the location field
deliveryPersonnelSchema.index({ currentLocation: "2dsphere" })

const DeliveryPersonnel = mongoose.model("DeliveryPersonnel", deliveryPersonnelSchema)

module.exports = DeliveryPersonnel
