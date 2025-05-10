const { validationResult } = require("express-validator")
const BusinessHours = require("../models/BusinessHours")
const Restaurant = require("../models/Restaurant")
const logger = require("../utils/logger")

// Get business hours by restaurant ID
exports.getBusinessHours = async (req, res) => {
  try {
    const { restaurantId } = req.params

    const businessHours = await BusinessHours.findOne({ restaurantId })
    if (!businessHours) {
      return res.status(404).json({ message: "Business hours not found for this restaurant" })
    }

    res.status(200).json({ businessHours })
  } catch (error) {
    logger.error(`Get business hours error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update business hours
exports.updateBusinessHours = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { restaurantId } = req.params

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update business hours for this restaurant" })
    }

    // Find business hours
    let businessHours = await BusinessHours.findOne({ restaurantId })
    if (!businessHours) {
      // Create new business hours if not found
      businessHours = new BusinessHours({ restaurantId })
    }

    // Update days
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    days.forEach((day) => {
      if (req.body[day]) {
        businessHours[day] = req.body[day]
      }
    })

    // Update special hours if provided
    if (req.body.specialHours) {
      businessHours.specialHours = req.body.specialHours
    }

    businessHours.updatedAt = Date.now()
    await businessHours.save()

    res.status(200).json({
      message: "Business hours updated successfully",
      businessHours,
    })
  } catch (error) {
    logger.error(`Update business hours error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Check if restaurant is open
exports.checkRestaurantOpen = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { date, time } = req.query

    // Get business hours
    const businessHours = await BusinessHours.findOne({ restaurantId })
    if (!businessHours) {
      return res.status(404).json({ message: "Business hours not found for this restaurant" })
    }

    // Get date to check
    let checkDate
    if (date) {
      checkDate = new Date(date)
    } else {
      checkDate = new Date()
    }

    // Get time to check
    let checkTime
    if (time) {
      checkTime = time
    } else {
      checkTime = `${checkDate.getHours().toString().padStart(2, "0")}:${checkDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    }

    // Check if there's a special hour for this date
    const dateString = checkDate.toISOString().split("T")[0]
    const specialHour = businessHours.specialHours.find((sh) => {
      const shDate = new Date(sh.date).toISOString().split("T")[0]
      return shDate === dateString
    })

    if (specialHour) {
      // If special hour exists and restaurant is closed
      if (!specialHour.isOpen) {
        return res.status(200).json({ isOpen: false, message: "Restaurant is closed on this special day" })
      }

      // Check if current time is within any time slot
      const isOpen = specialHour.timeSlots.some((slot) => {
        return checkTime >= slot.open && checkTime <= slot.close
      })

      return res.status(200).json({
        isOpen,
        message: isOpen ? "Restaurant is open (special hours)" : "Restaurant is closed (outside special hours)",
      })
    }

    // Get day of week
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayOfWeek = days[checkDate.getDay()]

    // Check if restaurant is open on this day
    const dayHours = businessHours[dayOfWeek]
    if (!dayHours.isOpen) {
      return res.status(200).json({ isOpen: false, message: `Restaurant is closed on ${dayOfWeek}` })
    }

    // Check if current time is within any time slot
    const isOpen = dayHours.timeSlots.some((slot) => {
      return checkTime >= slot.open && checkTime <= slot.close
    })

    res.status(200).json({
      isOpen,
      message: isOpen ? "Restaurant is open" : "Restaurant is closed (outside business hours)",
    })
  } catch (error) {
    logger.error(`Check restaurant open error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Add special hours
exports.addSpecialHours = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { restaurantId } = req.params
    const { date, isOpen, timeSlots } = req.body

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update business hours for this restaurant" })
    }

    // Find business hours
    const businessHours = await BusinessHours.findOne({ restaurantId })
    if (!businessHours) {
      return res.status(404).json({ message: "Business hours not found for this restaurant" })
    }

    // Check if special hours already exist for this date
    const specialDate = new Date(date)
    const dateString = specialDate.toISOString().split("T")[0]
    const existingIndex = businessHours.specialHours.findIndex((sh) => {
      const shDate = new Date(sh.date).toISOString().split("T")[0]
      return shDate === dateString
    })

    if (existingIndex !== -1) {
      // Update existing special hours
      businessHours.specialHours[existingIndex] = {
        date: specialDate,
        isOpen,
        timeSlots: isOpen ? timeSlots : [],
      }
    } else {
      // Add new special hours
      businessHours.specialHours.push({
        date: specialDate,
        isOpen,
        timeSlots: isOpen ? timeSlots : [],
      })
    }

    businessHours.updatedAt = Date.now()
    await businessHours.save()

    res.status(200).json({
      message: "Special hours added successfully",
      businessHours,
    })
  } catch (error) {
    logger.error(`Add special hours error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete special hours
exports.deleteSpecialHours = async (req, res) => {
  try {
    const { restaurantId, specialHoursId } = req.params

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update business hours for this restaurant" })
    }

    // Find business hours
    const businessHours = await BusinessHours.findOne({ restaurantId })
    if (!businessHours) {
      return res.status(404).json({ message: "Business hours not found for this restaurant" })
    }

    // Remove special hours
    businessHours.specialHours = businessHours.specialHours.filter((sh) => sh._id.toString() !== specialHoursId)

    businessHours.updatedAt = Date.now()
    await businessHours.save()

    res.status(200).json({
      message: "Special hours deleted successfully",
      businessHours,
    })
  } catch (error) {
    logger.error(`Delete special hours error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Toggle restaurant availability
exports.toggleRestaurantAvailability = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { isActive } = req.body

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this restaurant" })
    }

    restaurant.isActive = isActive
    restaurant.updatedAt = Date.now()
    await restaurant.save()

    res.status(200).json({
      message: `Restaurant ${isActive ? "activated" : "deactivated"} successfully`,
      restaurant,
    })
  } catch (error) {
    logger.error(`Toggle restaurant availability error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
