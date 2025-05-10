const { validationResult } = require("express-validator")
const DeliveryPersonnel = require("../models/DeliveryPersonnel")
const Delivery = require("../models/Delivery")
const logger = require("../utils/logger")

// Register delivery personnel
exports.registerDeliveryPersonnel = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { userId, name, email, phone, vehicleType, licenseNumber } = req.body

    // Check if delivery personnel already exists
    const existingPersonnel = await DeliveryPersonnel.findOne({ userId })
    if (existingPersonnel) {
      return res.status(400).json({ message: "Delivery personnel already registered with this user ID" })
    }

    // Create new delivery personnel
    const deliveryPersonnel = new DeliveryPersonnel({
      userId,
      name,
      email,
      phone,
      vehicleType,
      licenseNumber,
      currentLocation: {
        type: "Point",
        coordinates: [0, 0], // Default coordinates
      },
    })

    await deliveryPersonnel.save()

    res.status(201).json({
      message: "Delivery personnel registered successfully",
      deliveryPersonnel,
    })
  } catch (error) {
    logger.error(`Register delivery personnel error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update delivery personnel availability
exports.updateAvailability = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { isAvailable } = req.body

    // Only delivery personnel can update their availability
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Not authorized to update availability" })
    }

    // Update availability
    const deliveryPersonnel = await DeliveryPersonnel.findOneAndUpdate(
      { userId: req.user.id },
      { isAvailable, updatedAt: new Date() },
      { new: true },
    )

    if (!deliveryPersonnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    res.status(200).json({
      message: "Availability updated successfully",
      isAvailable: deliveryPersonnel.isAvailable,
    })
  } catch (error) {
    logger.error(`Update availability error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get delivery personnel profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to access this profile" })
    }

    const deliveryPersonnel = await DeliveryPersonnel.findOne({ userId })
    if (!deliveryPersonnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    res.status(200).json({ deliveryPersonnel })
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update delivery personnel profile
exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.params.id || req.user.id

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to update this profile" })
    }

    const { name, phone, vehicleType, licenseNumber } = req.body

    // Update profile
    const deliveryPersonnel = await DeliveryPersonnel.findOne({ userId })
    if (!deliveryPersonnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    // Update fields
    if (name) deliveryPersonnel.name = name
    if (phone) deliveryPersonnel.phone = phone
    if (vehicleType) deliveryPersonnel.vehicleType = vehicleType
    if (licenseNumber) deliveryPersonnel.licenseNumber = licenseNumber

    deliveryPersonnel.updatedAt = new Date()
    await deliveryPersonnel.save()

    res.status(200).json({
      message: "Profile updated successfully",
      deliveryPersonnel,
    })
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all delivery personnel (with filters)
exports.getAllDeliveryPersonnel = async (req, res) => {
  try {
    // Only admin can view all delivery personnel
    if (req.user.role !== "admin" && req.user.role !== "restaurant") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    const { isAvailable, isActive, vehicleType, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}
    if (isAvailable !== undefined) query.isAvailable = isAvailable === "true"
    if (isActive !== undefined) query.isActive = isActive === "true"
    if (vehicleType) query.vehicleType = vehicleType

    // Pagination
    const skip = (page - 1) * limit

    // Get delivery personnel
    const personnel = await DeliveryPersonnel.find(query)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    // Get total count
    const total = await DeliveryPersonnel.countDocuments(query)

    res.status(200).json({
      deliveryPersonnel: personnel,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error(`Get all delivery personnel error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get delivery personnel performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to access these metrics" })
    }

    const { startDate, endDate } = req.query

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000)

    // Get delivery personnel
    const deliveryPersonnel = await DeliveryPersonnel.findOne({ userId })
    if (!deliveryPersonnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    // Get deliveries for this personnel in the date range
    const deliveries = await Delivery.find({
      deliveryPersonnelId: userId,
      createdAt: { $gte: start, $lte: end },
    })

    // Calculate metrics
    const totalDeliveries = deliveries.length
    const completedDeliveries = deliveries.filter((d) => d.status === "delivered").length
    const cancelledDeliveries = deliveries.filter((d) => d.status === "cancelled").length

    const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0

    const totalDistance = deliveries.reduce((sum, d) => sum + d.distance, 0)
    const totalEarnings = deliveries
      .filter((d) => d.status === "delivered")
      .reduce((sum, d) => sum + d.driverEarnings, 0)

    // Calculate average delivery time for completed deliveries
    const completedDeliveriesWithTime = deliveries.filter((d) => d.status === "delivered" && d.actualDeliveryTime)

    const avgDeliveryTime =
      completedDeliveriesWithTime.length > 0
        ? completedDeliveriesWithTime.reduce((sum, d) => sum + d.actualDeliveryTime, 0) /
          completedDeliveriesWithTime.length
        : 0

    res.status(200).json({
      metrics: {
        totalDeliveries,
        completedDeliveries,
        cancelledDeliveries,
        completionRate,
        totalDistance,
        totalEarnings,
        avgDeliveryTime,
        rating: deliveryPersonnel.rating,
        totalRatings: deliveryPersonnel.totalRatings,
      },
      period: {
        start,
        end,
      },
    })
  } catch (error) {
    logger.error(`Get performance metrics error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = exports
