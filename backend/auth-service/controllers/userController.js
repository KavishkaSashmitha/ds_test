const { validationResult } = require("express-validator")
const User = require("../models/User")
const logger = require("../utils/logger")

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id

    // Check if the requesting user has permission to view this profile
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to view this profile" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user: user.toJSON() })
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.params.id || req.user.id

    // Check if the requesting user has permission to update this profile
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to update this profile" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Fields that can be updated
    const { name, phone, profileImage } = req.body

    // Update basic fields
    if (name) user.name = name
    if (phone) user.phone = phone
    if (profileImage) user.profileImage = profileImage

    // Role-specific updates
    if (req.user.role === "restaurant" && req.body.restaurantInfo) {
      user.restaurantInfo = {
        ...user.restaurantInfo,
        ...req.body.restaurantInfo,
      }
    } else if (req.user.role === "delivery" && req.body.deliveryInfo) {
      user.deliveryInfo = {
        ...user.deliveryInfo,
        ...req.body.deliveryInfo,
      }
    }

    // Update addresses
    if (req.body.addresses) {
      user.addresses = req.body.addresses
    }

    user.updatedAt = Date.now()
    await user.save()

    res.status(200).json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    })
  } catch (error) {
    logger.error(`Update user profile error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Change password
exports.changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    user.updatedAt = Date.now()
    await user.save()

    res.status(200).json({ message: "Password changed successfully" })
  } catch (error) {
    logger.error(`Change password error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Add address
exports.addAddress = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { name, address, city, state, zipCode, isDefault } = req.body

    // If this address is set as default, unset any existing default
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false
      })
    }

    // Add new address
    user.addresses.push({
      name,
      address,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
    })

    user.updatedAt = Date.now()
    await user.save()

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    })
  } catch (error) {
    logger.error(`Add address error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Find address index
    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId)
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" })
    }

    // Remove address
    user.addresses.splice(addressIndex, 1)
    user.updatedAt = Date.now()
    await user.save()

    res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    })
  } catch (error) {
    logger.error(`Delete address error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    const { role, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}
    if (role) {
      query.role = role
    }

    // Pagination
    const skip = (page - 1) * limit

    // Get users
    const users = await User.find(query)
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    // Get total count
    const total = await User.countDocuments(query)

    res.status(200).json({
      users,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    const { userId } = req.params
    const { isActive } = req.body

    if (isActive === undefined) {
      return res.status(400).json({ message: "isActive field is required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.isActive = isActive
    user.updatedAt = Date.now()
    await user.save()

    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: user.toJSON(),
    })
  } catch (error) {
    logger.error(`Update user status error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
