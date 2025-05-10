const { validationResult } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const BusinessHours = require("../models/BusinessHours")
const MenuItem = require("../models/MenuItem")
const logger = require("../utils/logger")

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerId: req.user.id })
    if (existingRestaurant) {
      return res.status(400).json({ message: "You already have a registered restaurant" })
    }

    // Create new restaurant
    const restaurant = new Restaurant({
      ownerId: req.user.id,
      name: req.body.name,
      description: req.body.description,
      cuisine: req.body.cuisine,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        zipCode: req.body.address.zipCode,
        country: req.body.address.country || "USA",
        location: {
          type: "Point",
          coordinates: req.body.address.coordinates || [0, 0], // Default coordinates if not provided
        },
      },
      contactInfo: {
        phone: req.body.contactInfo.phone,
        email: req.body.contactInfo.email,
        website: req.body.contactInfo.website,
      },
      images: {
        logo: req.body.images?.logo,
        cover: req.body.images?.cover,
        gallery: req.body.images?.gallery || [],
      },
      priceRange: req.body.priceRange || "$$",
    })

    await restaurant.save()

    // Create default business hours
    const defaultTimeSlot = { open: "09:00", close: "22:00" }
    const businessHours = new BusinessHours({
      restaurantId: restaurant._id,
      monday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      tuesday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      wednesday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      thursday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      friday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      saturday: { isOpen: true, timeSlots: [defaultTimeSlot] },
      sunday: { isOpen: false, timeSlots: [] },
    })

    await businessHours.save()

    res.status(201).json({
      message: "Restaurant created successfully",
      restaurant,
      businessHours,
    })
  } catch (error) {
    logger.error(`Create restaurant error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params

    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    res.status(200).json({ restaurant })
  } catch (error) {
    logger.error(`Get restaurant error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get restaurant by owner ID
exports.getRestaurantByOwnerId = async (req, res) => {
  try {
    const ownerId = req.params.ownerId || req.user.id

    // Check if user has permission to view this restaurant
    if (req.user.role !== "admin" && req.user.id !== ownerId) {
      return res.status(403).json({ message: "Not authorized to view this restaurant" })
    }

    const restaurant = await Restaurant.findOne({ ownerId })
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found for this owner" })
    }

    // Get business hours
    const businessHours = await BusinessHours.findOne({ restaurantId: restaurant._id })

    res.status(200).json({ restaurant, businessHours })
  } catch (error) {
    logger.error(`Get restaurant by owner error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this restaurant" })
    }

    // Update fields
    if (req.body.name) restaurant.name = req.body.name
    if (req.body.description) restaurant.description = req.body.description
    if (req.body.cuisine) restaurant.cuisine = req.body.cuisine
    if (req.body.priceRange) restaurant.priceRange = req.body.priceRange

    // Update address if provided
    if (req.body.address) {
      if (req.body.address.street) restaurant.address.street = req.body.address.street
      if (req.body.address.city) restaurant.address.city = req.body.address.city
      if (req.body.address.state) restaurant.address.state = req.body.address.state
      if (req.body.address.zipCode) restaurant.address.zipCode = req.body.address.zipCode
      if (req.body.address.country) restaurant.address.country = req.body.address.country
      if (req.body.address.coordinates) {
        restaurant.address.location.coordinates = req.body.address.coordinates
      }
    }

    // Update contact info if provided
    if (req.body.contactInfo) {
      if (req.body.contactInfo.phone) restaurant.contactInfo.phone = req.body.contactInfo.phone
      if (req.body.contactInfo.email) restaurant.contactInfo.email = req.body.contactInfo.email
      if (req.body.contactInfo.website) restaurant.contactInfo.website = req.body.contactInfo.website
    }

    // Update images if provided
    if (req.body.images) {
      if (req.body.images.logo) restaurant.images.logo = req.body.images.logo
      if (req.body.images.cover) restaurant.images.cover = req.body.images.cover
      if (req.body.images.gallery) restaurant.images.gallery = req.body.images.gallery
    }

    restaurant.updatedAt = Date.now()
    await restaurant.save()

    res.status(200).json({
      message: "Restaurant updated successfully",
      restaurant,
    })
  } catch (error) {
    logger.error(`Update restaurant error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Search restaurants
exports.searchRestaurants = async (req, res) => {
  try {
    const {
      name,
      cuisine,
      city,
      priceRange,
      isOpen,
      minRating,
      lat,
      lng,
      distance = 10, // Default 10km radius
      page = 1,
      limit = 10,
      sort = "rating",
    } = req.query

    // Build query
    const query = { isActive: true }

    if (name) {
      query.name = { $regex: name, $options: "i" }
    }

    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: "i" }
    }

    if (city) {
      query["address.city"] = { $regex: city, $options: "i" }
    }

    if (priceRange) {
      query.priceRange = priceRange
    }

    if (minRating) {
      query["rating.average"] = { $gte: Number.parseFloat(minRating) }
    }

    // Geospatial query if coordinates provided
    if (lat && lng) {
      query["address.location"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseInt(distance) * 1000, // Convert km to meters
        },
      }
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sorting
    let sortOption = {}
    switch (sort) {
      case "rating":
        sortOption = { "rating.average": -1 }
        break
      case "price_asc":
        sortOption = { priceRange: 1 }
        break
      case "price_desc":
        sortOption = { priceRange: -1 }
        break
      case "distance":
        // Distance sorting is handled by $near operator
        break
      default:
        sortOption = { "rating.average": -1 }
    }

    // Execute query
    const restaurants = await Restaurant.find(query).sort(sortOption).skip(skip).limit(Number.parseInt(limit))

    // Get total count
    const total = await Restaurant.countDocuments(query)

    // If isOpen filter is applied, we need to check business hours
    let filteredRestaurants = restaurants
    if (isOpen === "true") {
      // Get current day and time
      const now = new Date()
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const currentDay = days[now.getDay()]
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

      // Get business hours for all restaurants
      const restaurantIds = restaurants.map((r) => r._id)
      const allBusinessHours = await BusinessHours.find({ restaurantId: { $in: restaurantIds } })

      // Filter restaurants that are currently open
      filteredRestaurants = restaurants.filter((restaurant) => {
        const businessHours = allBusinessHours.find((bh) => bh.restaurantId.toString() === restaurant._id.toString())
        if (!businessHours) return false

        // Check if restaurant is open today
        const todayHours = businessHours[currentDay]
        if (!todayHours.isOpen) return false

        // Check if current time is within any time slot
        return todayHours.timeSlots.some((slot) => {
          return currentTime >= slot.open && currentTime <= slot.close
        })
      })
    }

    res.status(200).json({
      restaurants: filteredRestaurants,
      pagination: {
        total: isOpen === "true" ? filteredRestaurants.length : total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Search restaurants error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get featured restaurants
exports.getFeaturedRestaurants = async (req, res) => {
  try {
    const { limit = 5 } = req.query

    // Get restaurants with highest ratings
    const restaurants = await Restaurant.find({ isActive: true, isVerified: true })
      .sort({ "rating.average": -1 })
      .limit(Number.parseInt(limit))

    res.status(200).json({ restaurants })
  } catch (error) {
    logger.error(`Get featured restaurants error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Toggle restaurant active status
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(id)
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
    logger.error(`Toggle restaurant status error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Verify restaurant
exports.verifyRestaurant = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to perform this action" })
    }

    const { id } = req.params
    const { isVerified } = req.body

    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    restaurant.isVerified = isVerified
    restaurant.updatedAt = Date.now()
    await restaurant.save()

    res.status(200).json({
      message: `Restaurant ${isVerified ? "verified" : "unverified"} successfully`,
      restaurant,
    })
  } catch (error) {
    logger.error(`Verify restaurant error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get restaurant statistics
exports.getRestaurantStats = async (req, res) => {
  try {
    const { id } = req.params

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this restaurant's statistics" })
    }

    // Get menu items count
    const menuItemsCount = await MenuItem.countDocuments({ restaurantId: id })

    // Get popular menu items
    const popularItems = await MenuItem.find({ restaurantId: id, featured: true }).limit(5)

    // Mock data for statistics (in a real app, this would come from the Order Service)
    const stats = {
      totalOrders: 125,
      totalRevenue: 3245.75,
      averageOrderValue: 25.97,
      menuItemsCount,
      popularItems,
    }

    res.status(200).json({ stats })
  } catch (error) {
    logger.error(`Get restaurant stats error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update restaurant status
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isOpen, acceptingOrders } = req.body

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Update the status fields
    if (isOpen !== undefined) restaurant.isOpen = isOpen
    if (acceptingOrders !== undefined) restaurant.acceptingOrders = acceptingOrders

    await restaurant.save()

    res.status(200).json({ message: "Restaurant status updated successfully", restaurant })
  } catch (error) {
    console.error("Error updating restaurant status:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
