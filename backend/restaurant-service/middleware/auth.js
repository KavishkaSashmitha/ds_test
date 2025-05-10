const jwt = require("jsonwebtoken")
const logger = require("../utils/logger")

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user info to request
    req.user = decoded
    next()
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`)
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}

// Middleware to check user role
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }
    next()
  }
}

// Middleware to check if user is restaurant owner
exports.isRestaurantOwner = async (req, res, next) => {
  try {
    const restaurantId = req.params.id || req.params.restaurantId || req.body.restaurantId

    // If no restaurant ID is provided, skip this check
    if (!restaurantId) {
      return next()
    }

    // Get restaurant from database
    const Restaurant = require("../models/Restaurant")
    const restaurant = await Restaurant.findById(restaurantId)

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role === "admin" || restaurant.ownerId.toString() === req.user.id) {
      req.restaurant = restaurant
      return next()
    }

    return res.status(403).json({ message: "Not authorized to access this restaurant" })
  } catch (error) {
    logger.error(`Restaurant owner check error: ${error.message}`)
    return res.status(500).json({ message: "Server error", error: error.message })
  }
}
