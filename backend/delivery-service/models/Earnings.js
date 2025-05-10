const mongoose = require("mongoose")

const earningsSchema = new mongoose.Schema({
  deliveryPersonnelId: {
    type: String,
    required: true,
    ref: "DeliveryPersonnel",
  },
  date: {
    type: Date,
    required: true,
  },
  deliveries: [
    {
      deliveryId: {
        type: String,
        required: true,
      },
      orderId: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      distance: {
        type: Number,
        required: true,
      },
      completedAt: {
        type: Date,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalDeliveries: {
    type: Number,
    required: true,
    default: 0,
  },
  totalDistance: {
    type: Number,
    required: true,
    default: 0,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
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

// Create compound index for unique earnings per day per delivery personnel
earningsSchema.index({ deliveryPersonnelId: 1, date: 1 }, { unique: true })

const Earnings = mongoose.model("Earnings", earningsSchema)

module.exports = Earnings
