const express = require("express")
const { body } = require("express-validator")
const restaurantController = require("../controllers/restaurantController")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Public routes that don't require authentication
router.get("/featured", restaurantController.getFeaturedRestaurants)
router.get("/:id", restaurantController.getRestaurantById)
router.get("/", restaurantController.searchRestaurants)

// All routes below require authentication
router.use(authenticateToken)

// Create restaurant (restaurant owners only)
router.post(
  "/",
  authorizeRoles("restaurant", "admin"),
  [
    body("name").notEmpty().withMessage("Restaurant name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("cuisine").notEmpty().withMessage("Cuisine type is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("address.zipCode").notEmpty().withMessage("Zip code is required"),
    body("contactInfo.phone").notEmpty().withMessage("Phone number is required"),
    body("contactInfo.email").isEmail().withMessage("Valid email is required"),
  ],
  restaurantController.createRestaurant,
)

// Get restaurant by owner ID (owner or admin only)
router.get("/owner/me", restaurantController.getRestaurantByOwnerId)
router.get("/owner/:ownerId", restaurantController.getRestaurantByOwnerId)

// Update restaurant (owner or admin only)
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().withMessage("Restaurant name cannot be empty"),
    body("description").optional().notEmpty().withMessage("Description cannot be empty"),
    body("cuisine").optional().notEmpty().withMessage("Cuisine type cannot be empty"),
  ],
  restaurantController.updateRestaurant,
)

// Toggle restaurant active status (owner or admin only)
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("restaurant", "admin"),
  restaurantController.updateRestaurantStatus
)

// Verify restaurant (admin only)
router.patch("/:id/verify", authorizeRoles("admin"), restaurantController.verifyRestaurant)

// Get restaurant statistics (owner or admin only)
router.get("/:id/stats", restaurantController.getRestaurantStats)

module.exports = router
