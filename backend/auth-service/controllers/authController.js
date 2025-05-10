const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const User = require("../models/User")
const logger = require("../utils/logger")
const axios = require("axios") // Add axios for making HTTP requests

// Get service URLs from environment variables or use defaults
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://restaurant-service:3002"
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3004"

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  )
}

// Register a new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, phone, role, username } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Generate a username if not provided
    const generatedUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Check if the username already exists
    if (generatedUsername) {
      const existingUsername = await User.findOne({ username: generatedUsername })
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken. Please try another one." })
      }
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      username: generatedUsername, // Set the username field
      role: role || "customer",
    })

    await user.save()

    const token = generateToken(user)
    
    let additionalData = null;
    
    // If user is a restaurant owner or delivery personnel, register with respective service
    try {
      if (user.role === "restaurant") {
        // Extract restaurant-specific data from request
        const { 
          restaurantName, 
          description, 
          cuisine, 
          address, 
          contactInfo = {}, 
          priceRange 
        } = req.body;
        
        // Make API call to restaurant service to register the restaurant
        const restaurantResponse = await axios.post(
          `${RESTAURANT_SERVICE_URL}/restaurants`, 
          {
            name: restaurantName || name,
            description: description || `${name}'s Restaurant`,
            cuisine: cuisine || "Various",
            address: address || {},
            contactInfo: {
              phone: contactInfo.phone || phone,
              email: contactInfo.email || email,
              website: contactInfo.website
            },
            priceRange: priceRange || "$$"
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        additionalData = {
          restaurant: restaurantResponse.data.restaurant
        };
        
        logger.info(`Restaurant registered for user ${user._id}`);
      } 
      else if (user.role === "delivery") {
        // Extract delivery personnel specific data
        const { 
          vehicleType = "motorcycle", 
          licenseNumber 
        } = req.body;
        
        // Make API call to delivery service to register the delivery personnel
        const deliveryResponse = await axios.post(
          `${DELIVERY_SERVICE_URL}/deliveries/personnel/register`,
          {
            userId: user._id,
            name,
            email,
            phone,
            vehicleType,
            licenseNumber: licenseNumber || "TBD"
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        additionalData = {
          deliveryPersonnel: deliveryResponse.data.deliveryPersonnel
        };
        
        logger.info(`Delivery personnel registered for user ${user._id}`);
      }
    } catch (serviceError) {
      // Log the error but don't fail the registration
      logger.error(`Error registering with service: ${serviceError.message}`);
      // We can still proceed since the user was created successfully
    }

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: user.toJSON(),
      ...additionalData
    })
  } catch (error) {
    logger.error(`Registration error: ${error.message}`)
    res.status(500).json({ message: "Server error during registration", error: error.message })
  }
}

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated. Please contact support." })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = generateToken(user)

    res.status(200).json({
      message: "Login successful",
      token,
      user: user.toJSON(),
    })
  } catch (error) {
    logger.error(`Login error: ${error.message}`)
    res.status(500).json({ message: "Server error during login", error: error.message })
  }
}

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" })
    }

    res.status(200).json({ message: "Password reset email sent" })
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`)
    res.status(500).json({ message: "Server error during password reset request", error: error.message })
  }
}

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({ message: "Password reset successful" })
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`)
    res.status(500).json({ message: "Server error during password reset", error: error.message })
  }
}

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json({ user: user.toJSON() })
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
