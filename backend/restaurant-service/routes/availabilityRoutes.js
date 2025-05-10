const express = require("express")
const { body } = require("express-validator")
const availabilityController = require("../controllers/availabilityController")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Get business hours by restaurant ID (public)
router.get("/hours/:restaurantId", availabilityController.getBusinessHours)

// Update business hours (restaurant owner or admin only)
router.put(
  "/hours/:restaurantId",
  authenticateToken,
  authorizeRoles("restaurant", "admin"),
  availabilityController.updateBusinessHours,
)

// Check if restaurant is open (public)
router.get("/check/:restaurantId", availabilityController.checkRestaurantOpen)

// Add special hours (restaurant owner or admin only)
router.post(
  "/special/:restaurantId",
  authenticateToken,
  authorizeRoles("restaurant", "admin"),
  [
    body("date").isISO8601().withMessage("Valid date is required"),
    body("isOpen").isBoolean().withMessage("isOpen must be a boolean"),
    body("timeSlots").optional().isArray().withMessage("timeSlots must be an array"),
  ],
  availabilityController.addSpecialHours,
)

// Delete special hours (restaurant owner or admin only)
router.delete(
  "/special/:restaurantId/:specialHoursId",
  authenticateToken,
  authorizeRoles("restaurant", "admin"),
  availabilityController.deleteSpecialHours,
)

// Toggle restaurant availability (restaurant owner or admin only)
router.patch(
  "/:restaurantId",
  authenticateToken,
  authorizeRoles("restaurant", "admin"),
  [body("isActive").isBoolean().withMessage("isActive must be a boolean")],
  availabilityController.toggleRestaurantAvailability,
)

module.exports = router
