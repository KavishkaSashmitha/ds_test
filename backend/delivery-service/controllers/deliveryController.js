const { validationResult } = require("express-validator")
const mongoose = require("mongoose")
const geolib = require("geolib")
const axios = require("axios")
const Delivery = require("../models/Delivery")
const DeliveryPersonnel = require("../models/DeliveryPersonnel")
const LocationHistory = require("../models/LocationHistory")
const Earnings = require("../models/Earnings")
const logger = require("../utils/logger")

// Helper function to calculate delivery fee and driver earnings
const calculateDeliveryFeeAndEarnings = (distance) => {
  // Base fee is $2.00
  const baseFee = 2.0

  // Add $1.00 per kilometer
  const distanceFee = distance * 1.0

  // Total delivery fee
  let deliveryFee = baseFee + distanceFee

  // Round to 2 decimal places
  deliveryFee = Math.round(deliveryFee * 100) / 100

  // Driver gets 80% of the delivery fee
  const driverEarnings = Math.round(deliveryFee * 0.8 * 100) / 100

  return { deliveryFee, driverEarnings }
}

// Helper function to estimate delivery time
const estimateDeliveryTime = (distance) => {
  // Assume average speed of 20 km/h
  const averageSpeed = 20

  // Calculate time in minutes
  // Add 10 minutes for pickup and dropoff
  return Math.ceil((distance / averageSpeed) * 60) + 10
}

// Create a new delivery request
exports.createDelivery = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      orderId,
      restaurantId,
      restaurantName,
      restaurantLocation,
      restaurantAddress,
      customerId,
      customerName,
      customerLocation,
      customerAddress,
      customerPhone,
    } = req.body

    // Calculate distance between restaurant and customer
    const distance =
      geolib.getDistance(
        { latitude: restaurantLocation.coordinates[1], longitude: restaurantLocation.coordinates[0] },
        { latitude: customerLocation.coordinates[1], longitude: customerLocation.coordinates[0] },
      ) / 1000 // Convert meters to kilometers

    // Calculate delivery fee and driver earnings
    const { deliveryFee, driverEarnings } = calculateDeliveryFeeAndEarnings(distance)

    // Estimate delivery time
    const estimatedDeliveryTime = estimateDeliveryTime(distance)

    // Create new delivery
    const delivery = new Delivery({
      orderId,
      restaurantId,
      restaurantName,
      restaurantLocation,
      restaurantAddress,
      customerId,
      customerName,
      customerLocation,
      customerAddress,
      customerPhone,
      status: "pending",
      distance,
      estimatedDeliveryTime,
      deliveryFee,
      driverEarnings,
    })

    await delivery.save()

    // Find available delivery personnel
    await findAndAssignDeliveryPersonnel(delivery._id)

    res.status(201).json({
      message: "Delivery request created successfully",
      delivery,
    })
  } catch (error) {
    logger.error(`Create delivery error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Find and assign delivery personnel to a delivery
const findAndAssignDeliveryPersonnel = async (deliveryId) => {
  try {
    const delivery = await Delivery.findById(deliveryId)
    if (!delivery) {
      throw new Error("Delivery not found")
    }

    // Find available delivery personnel within 10km of the restaurant
    const availablePersonnel = await DeliveryPersonnel.find({
      isAvailable: true,
      isActive: true,
      currentLocation: {
        $near: {
          $geometry: delivery.restaurantLocation,
          $maxDistance: 10000, // 10km in meters
        },
      },
    }).sort({ lastLocationUpdateTime: -1 })

    if (availablePersonnel.length === 0) {
      logger.info(`No available delivery personnel found for delivery ${deliveryId}`)
      return null
    }

    // Score each available delivery person based on multiple factors
    const scoredPersonnel = availablePersonnel.map(person => {
      // Calculate distance from restaurant in kilometers
      const distanceToRestaurant = 
        geolib.getDistance(
          { 
            latitude: person.currentLocation.coordinates[1], 
            longitude: person.currentLocation.coordinates[0] 
          },
          { 
            latitude: delivery.restaurantLocation.coordinates[1], 
            longitude: delivery.restaurantLocation.coordinates[0] 
          }
        ) / 1000;

      // Calculate score based on multiple factors:
      // 1. Distance (closer is better)
      // 2. Driver rating (higher is better)
      // 3. Recent activity (more recent location update is better)

      // Distance score - max 50 points (lower distance = higher score)
      const distanceScore = Math.max(0, 50 - (distanceToRestaurant * 5));
      
      // Rating score - max 30 points
      const ratingScore = person.rating * 6; // 5-star rating gives 30 points
      
      // Recency score - max 20 points
      const minutesAgo = (new Date() - person.lastLocationUpdateTime) / (60 * 1000);
      const recencyScore = Math.max(0, 20 - minutesAgo);
      
      // Calculate total score
      const totalScore = distanceScore + ratingScore + recencyScore;
      
      return {
        personnel: person,
        score: totalScore,
        distanceToRestaurant
      };
    });

    // Sort by score (highest first)
    scoredPersonnel.sort((a, b) => b.score - a.score);
    
    // Get the highest scoring delivery person
    const bestMatch = scoredPersonnel[0];
    logger.info(`Selected delivery personnel ${bestMatch.personnel.userId} with score ${bestMatch.score.toFixed(2)} at ${bestMatch.distanceToRestaurant.toFixed(2)}km distance`);

    // Assign to the selected personnel
    const assignedPersonnel = bestMatch.personnel;
    delivery.deliveryPersonnelId = assignedPersonnel.userId;
    delivery.status = "assigned";
    delivery.assignedAt = new Date();
    delivery.updatedAt = new Date();

    await delivery.save();

    // Update delivery personnel status
    assignedPersonnel.isAvailable = false;
    await assignedPersonnel.save();

    logger.info(`Delivery ${deliveryId} assigned to personnel ${assignedPersonnel.userId}`);

    // Notify the delivery personnel through WebSockets (if available)
    try {
      const io = require("../utils/socketHandler").getIO();
      if (io) {
        io.to(`driver_${assignedPersonnel.userId}`).emit("new_delivery_assignment", {
          deliveryId: delivery._id,
          orderId: delivery.orderId,
          restaurantName: delivery.restaurantName,
          restaurantAddress: delivery.restaurantAddress,
          customerName: delivery.customerName,
          customerAddress: delivery.customerAddress
        });
        logger.info(`WebSocket notification sent to delivery personnel ${assignedPersonnel.userId}`);
      }
    } catch (error) {
      logger.error(`WebSocket notification error: ${error.message}`);
    }

    return delivery;
  } catch (error) {
    logger.error(`Find and assign delivery personnel error: ${error.message}`);
    throw error;
  }
}

// Accept a delivery assignment API endpoint
exports.acceptDeliveryAssignment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { orderId } = req.body
    
    // Only delivery personnel can accept assignments
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Not authorized to accept delivery assignments" })
    }
    
    // Find the delivery for this order
    const delivery = await Delivery.findOne({ orderId })
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" })
    }
    
    // Check if delivery is already assigned
    if (delivery.status !== "pending") {
      return res.status(400).json({ message: `Delivery already in ${delivery.status} status` })
    }
    
    // Assign to this delivery personnel
    delivery.deliveryPersonnelId = req.user.id
    delivery.status = "assigned"
    delivery.assignedAt = new Date()
    delivery.updatedAt = new Date()
    await delivery.save()
    
    // Update delivery personnel status
    await DeliveryPersonnel.findOneAndUpdate(
      { userId: req.user.id }, 
      { isAvailable: false, updatedAt: new Date() }
    )

    res.status(200).json({
      message: "Delivery assignment accepted successfully",
      delivery
    })
  } catch (error) {
    logger.error(`Accept delivery assignment error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all deliveries (with filters)
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status, restaurantId, customerId, deliveryPersonnelId, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}
    if (status) query.status = status
    if (restaurantId) query.restaurantId = restaurantId
    if (customerId) query.customerId = customerId
    if (deliveryPersonnelId) query.deliveryPersonnelId = deliveryPersonnelId

    // Pagination
    const skip = (page - 1) * limit

    // Get deliveries
    const deliveries = await Delivery.find(query).skip(skip).limit(Number.parseInt(limit)).sort({ createdAt: -1 })

    // Get total count
    const total = await Delivery.countDocuments(query)

    res.status(200).json({
      deliveries,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error(`Get all deliveries error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get delivery by ID
exports.getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params

    const delivery = await Delivery.findById(id)
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" })
    }

    res.status(200).json({ delivery })
  } catch (error) {
    logger.error(`Get delivery by ID error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { status, notes } = req.body

    const delivery = await Delivery.findById(id)
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" })
    }

    // Check if the delivery is assigned to the requesting delivery personnel
    if (req.user.role === "delivery" && delivery.deliveryPersonnelId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this delivery" })
    }

    // Update status and related fields
    delivery.status = status
    delivery.updatedAt = new Date()
    if (notes) delivery.notes = notes

    // Update status-specific timestamps
    switch (status) {
      case "picked_up":
        delivery.pickedUpAt = new Date()
        break
      case "delivered":
        delivery.deliveredAt = new Date()

        // Calculate actual delivery time in minutes
        const deliveryTimeMinutes = Math.round((delivery.deliveredAt - delivery.assignedAt) / (1000 * 60))
        delivery.actualDeliveryTime = deliveryTimeMinutes

        // Update earnings record
        await updateEarningsRecord(delivery)

        // Update delivery personnel status to available
        await DeliveryPersonnel.findOneAndUpdate({ userId: delivery.deliveryPersonnelId }, { isAvailable: true })
        break
      case "cancelled":
        delivery.cancelledAt = new Date()
        delivery.cancellationReason = notes || "No reason provided"

        // Update delivery personnel status to available if it was assigned
        if (delivery.deliveryPersonnelId) {
          await DeliveryPersonnel.findOneAndUpdate({ userId: delivery.deliveryPersonnelId }, { isAvailable: true })
        }
        break
    }

    await delivery.save()

    // Notify relevant parties about the status update
    // In a real app, this would use WebSockets or push notifications
    logger.info(`Delivery ${id} status updated to ${status}`)

    res.status(200).json({
      message: "Delivery status updated successfully",
      delivery,
    })
  } catch (error) {
    logger.error(`Update delivery status error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update earnings record when delivery is completed
const updateEarningsRecord = async (delivery) => {
  try {
    const deliveryDate = new Date(delivery.deliveredAt)
    deliveryDate.setHours(0, 0, 0, 0) // Set to start of day

    // Find or create earnings record for this day
    let earnings = await Earnings.findOne({
      deliveryPersonnelId: delivery.deliveryPersonnelId,
      date: deliveryDate,
    })

    if (!earnings) {
      earnings = new Earnings({
        deliveryPersonnelId: delivery.deliveryPersonnelId,
        date: deliveryDate,
        deliveries: [],
        totalAmount: 0,
        totalDeliveries: 0,
        totalDistance: 0,
      })
    }

    // Add this delivery to the earnings record
    earnings.deliveries.push({
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      amount: delivery.driverEarnings,
      distance: delivery.distance,
      completedAt: delivery.deliveredAt,
    })

    // Update totals
    earnings.totalAmount += delivery.driverEarnings
    earnings.totalDeliveries += 1
    earnings.totalDistance += delivery.distance
    earnings.updatedAt = new Date()

    await earnings.save()

    logger.info(`Earnings updated for delivery personnel ${delivery.deliveryPersonnelId}`)
  } catch (error) {
    logger.error(`Update earnings record error: ${error.message}`)
    throw error
  }
}

// Rate delivery
exports.rateDelivery = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { rating, feedback } = req.body

    const delivery = await Delivery.findById(id)
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" })
    }

    // Only customers can rate deliveries
    if (req.user.role !== "customer" || delivery.customerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to rate this delivery" })
    }

    // Ensure delivery is completed
    if (delivery.status !== "delivered") {
      return res.status(400).json({ message: "Can only rate completed deliveries" })
    }

    // Update delivery personnel rating
    const deliveryPersonnel = await DeliveryPersonnel.findOne({ userId: delivery.deliveryPersonnelId })
    if (!deliveryPersonnel) {
      return res.status(404).json({ message: "Delivery personnel not found" })
    }

    // Calculate new average rating
    const totalRatingPoints = deliveryPersonnel.rating * deliveryPersonnel.totalRatings + rating
    const newTotalRatings = deliveryPersonnel.totalRatings + 1
    const newAverageRating = totalRatingPoints / newTotalRatings

    // Update delivery personnel
    deliveryPersonnel.rating = newAverageRating
    deliveryPersonnel.totalRatings = newTotalRatings
    await deliveryPersonnel.save()

    // Add feedback to delivery if provided
    if (feedback) {
      delivery.feedback = feedback
      await delivery.save()
    }

    res.status(200).json({
      message: "Delivery rated successfully",
      rating: newAverageRating,
    })
  } catch (error) {
    logger.error(`Rate delivery error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get delivery statistics
exports.getDeliveryStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000)

    // Build match stage for aggregation
    const matchStage = {
      createdAt: { $gte: start, $lte: end },
    }

    // Add role-specific filters
    if (req.user.role === "restaurant") {
      matchStage.restaurantId = req.user.id
    } else if (req.user.role === "delivery") {
      matchStage.deliveryPersonnelId = req.user.id
    } else if (req.user.role === "customer") {
      matchStage.customerId = req.user.id
    }

    // Run aggregation
    const statistics = await Delivery.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledDeliveries: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalDistance: { $sum: "$distance" },
          totalDeliveryFees: { $sum: "$deliveryFee" },
          totalDriverEarnings: { $sum: "$driverEarnings" },
          avgDeliveryTime: { $avg: "$actualDeliveryTime" },
        },
      },
    ])

    // Calculate completion rate
    const stats =
      statistics.length > 0
        ? statistics[0]
        : {
            totalDeliveries: 0,
            completedDeliveries: 0,
            cancelledDeliveries: 0,
            totalDistance: 0,
            totalDeliveryFees: 0,
            totalDriverEarnings: 0,
            avgDeliveryTime: 0,
          }

    stats.completionRate = stats.totalDeliveries > 0 ? (stats.completedDeliveries / stats.totalDeliveries) * 100 : 0

    delete stats._id

    res.status(200).json({ statistics: stats })
  } catch (error) {
    logger.error(`Get delivery statistics error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = exports
