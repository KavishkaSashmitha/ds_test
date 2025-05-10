const mongoose = require("mongoose")

const timeSlotSchema = new mongoose.Schema({
  open: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  close: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
})

const businessHoursSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  monday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  tuesday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  wednesday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  thursday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  friday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  saturday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  sunday: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
  },
  specialHours: [
    {
      date: {
        type: Date,
        required: true,
      },
      isOpen: {
        type: Boolean,
        default: true,
      },
      timeSlots: [timeSlotSchema],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

const BusinessHours = mongoose.model("BusinessHours", businessHoursSchema)

module.exports = BusinessHours
