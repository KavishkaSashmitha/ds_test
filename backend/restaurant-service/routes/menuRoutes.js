const express = require("express")
const { body } = require("express-validator")
const menuController = require("../controllers/menuController")
const { authenticateToken, authorizeRoles, isRestaurantOwner } = require("../middleware/auth")

const router = express.Router()

// Public routes for menu items that don't require authentication

// Get menu item by ID (public)
// This specific route needs to come first to avoid conflict with the /:restaurantId route
router.get("/item/:id", menuController.getMenuItemById)

// Get menu items by restaurant ID (public for customers)
router.get("/restaurant/:restaurantId", menuController.getMenuItemsByRestaurant)

// Get menu items directly by restaurant ID (alternate URL pattern for frontend)
router.get("/:restaurantId", menuController.getMenuItemsByRestaurant)

// All routes below require authentication
router.use(authenticateToken)

// Create menu item (restaurant owner or admin only)
router.post(
  "/",
  authorizeRoles("restaurant", "admin"),
  [
    body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    body("name").notEmpty().withMessage("Item name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  menuController.createMenuItem,
)

// Update menu item (restaurant owner or admin only)
router.put(
  "/item/:id",
  authorizeRoles("restaurant", "admin"),
  [
    body("name").optional().notEmpty().withMessage("Item name cannot be empty"),
    body("description").optional().notEmpty().withMessage("Description cannot be empty"),
    body("price").optional().isNumeric().withMessage("Price must be a number"),
    body("category").optional().notEmpty().withMessage("Category cannot be empty"),
  ],
  menuController.updateMenuItem,
)

// Delete menu item (restaurant owner or admin only)
router.delete("/item/:id", authorizeRoles("restaurant", "admin"), menuController.deleteMenuItem)

// Bulk update menu item availability (restaurant owner or admin only)
router.patch(
  "/availability",
  authorizeRoles("restaurant", "admin"),
  [
    body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    body("items").isArray().withMessage("Items must be an array"),
  ],
  menuController.bulkUpdateAvailability,
)

module.exports = router
