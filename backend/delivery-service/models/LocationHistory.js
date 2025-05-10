const mongoose = require("mongoose")

const locationHistorySchema = new mongoose.Schema({
  deliveryPersonnelId: {
    type: String,
    required: true,
    ref: "DeliveryPersonnel",
  },
  deliveryId: {
    type: String,
    ref: "Delivery",
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Create indexes for common queries
locationHistorySchema.index({ deliveryPersonnelId: 1, timestamp: -1 })
locationHistorySchema.index({ deliveryId: 1, timestamp: -1 })
locationHistorySchema.index({ location: "2dsphere" })

const LocationHistory = mongoose.model("LocationHistory", locationHistorySchema)

module.exports = LocationHistory
