const { validationResult } = require("express-validator")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")
const logger = require("../utils/logger")

// Create a new menu item
exports.createMenuItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { restaurantId } = req.body

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to add menu items to this restaurant" })
    }

    // Create new menu item
    const menuItem = new MenuItem({
      restaurantId,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.body.image,
      options: req.body.options || [],
      tags: req.body.tags || [],
      nutritionalInfo: req.body.nutritionalInfo || {},
      isVegetarian: req.body.isVegetarian || false,
      isVegan: req.body.isVegan || false,
      isGlutenFree: req.body.isGlutenFree || false,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      preparationTime: req.body.preparationTime || 15,
      featured: req.body.featured || false,
    })

    await menuItem.save()

    res.status(201).json({
      message: "Menu item created successfully",
      menuItem,
    })
  } catch (error) {
    logger.error(`Create menu item error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get menu items by restaurant ID
exports.getMenuItemsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { category, isAvailable, featured, page = 1, limit = 20 } = req.query

    // Build query
    const query = { restaurantId }

    if (category) {
      query.category = category
    }

    if (isAvailable === "true") {
      query.isAvailable = true
    } else if (isAvailable === "false") {
      query.isAvailable = false
    }

    if (featured === "true") {
      query.featured = true
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get menu items
    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 }).skip(skip).limit(Number.parseInt(limit))

    // Get total count
    const total = await MenuItem.countDocuments(query)

    // Get unique categories
    const categories = await MenuItem.distinct("category", { restaurantId })

    res.status(200).json({
      menuItems,
      categories,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Get menu items error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params

    const menuItem = await MenuItem.findById(id)
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }

    res.status(200).json({ menuItem })
  } catch (error) {
    logger.error(`Get menu item error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params

    // Find menu item
    const menuItem = await MenuItem.findById(id)
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(menuItem.restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update menu items for this restaurant" })
    }

    // Update fields
    if (req.body.name) menuItem.name = req.body.name
    if (req.body.description) menuItem.description = req.body.description
    if (req.body.price !== undefined) menuItem.price = req.body.price
    if (req.body.category) menuItem.category = req.body.category
    if (req.body.image) menuItem.image = req.body.image
    if (req.body.options) menuItem.options = req.body.options
    if (req.body.tags) menuItem.tags = req.body.tags
    if (req.body.nutritionalInfo) menuItem.nutritionalInfo = req.body.nutritionalInfo
    if (req.body.isVegetarian !== undefined) menuItem.isVegetarian = req.body.isVegetarian
    if (req.body.isVegan !== undefined) menuItem.isVegan = req.body.isVegan
    if (req.body.isGlutenFree !== undefined) menuItem.isGlutenFree = req.body.isGlutenFree
    if (req.body.isAvailable !== undefined) menuItem.isAvailable = req.body.isAvailable
    if (req.body.preparationTime) menuItem.preparationTime = req.body.preparationTime
    if (req.body.featured !== undefined) menuItem.featured = req.body.featured

    menuItem.updatedAt = Date.now()
    await menuItem.save()

    res.status(200).json({
      message: "Menu item updated successfully",
      menuItem,
    })
  } catch (error) {
    logger.error(`Update menu item error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params

    // Find menu item
    const menuItem = await MenuItem.findById(id)
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" })
    }

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(menuItem.restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete menu items for this restaurant" })
    }

    await MenuItem.findByIdAndDelete(id)

    res.status(200).json({ message: "Menu item deleted successfully" })
  } catch (error) {
    logger.error(`Delete menu item error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Bulk update menu item availability
exports.bulkUpdateAvailability = async (req, res) => {
  try {
    const { restaurantId, items } = req.body

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items array is required" })
    }

    // Check if restaurant exists and user has permission
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or an admin
    if (req.user.role !== "admin" && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update menu items for this restaurant" })
    }

    // Update each item
    const updatePromises = items.map(async (item) => {
      if (!item.id || item.isAvailable === undefined) {
        return { id: item.id, success: false, message: "Invalid item data" }
      }

      try {
        const menuItem = await MenuItem.findOneAndUpdate(
          { _id: item.id, restaurantId },
          { isAvailable: item.isAvailable, updatedAt: Date.now() },
          { new: true },
        )

        if (!menuItem) {
          return { id: item.id, success: false, message: "Menu item not found" }
        }

        return { id: item.id, success: true, isAvailable: menuItem.isAvailable }
      } catch (error) {
        return { id: item.id, success: false, message: error.message }
      }
    })

    const results = await Promise.all(updatePromises)

    res.status(200).json({
      message: "Menu items availability updated",
      results,
    })
  } catch (error) {
    logger.error(`Bulk update availability error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
