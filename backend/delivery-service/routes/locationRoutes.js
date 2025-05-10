const express = require("express")
const { body, param, query } = require("express-validator")
const locationController = require("../controllers/locationController")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Update delivery personnel location
router.post(
  "/update",
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
    body("deliveryId").optional(),
  ],
  authorizeRoles("delivery"),
  locationController.updateLocation,
)

// Get delivery personnel current location
router.get(
  "/personnel/:id",
  [param("id").notEmpty().withMessage("Delivery personnel ID is required")],
  authorizeRoles("admin", "restaurant", "customer", "delivery"),
  locationController.getDeliveryPersonnelLocation,
)

// Get location history for a delivery
router.get(
  "/history/:deliveryId",
  [param("deliveryId").notEmpty().withMessage("Delivery ID is required")],
  authorizeRoles("admin", "restaurant", "customer", "delivery"),
  locationController.getLocationHistory,
)

// Get nearby delivery personnel
router.post(
  "/nearby",
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
    body("maxDistance").optional().isFloat({ min: 0.1 }).withMessage("Max distance must be positive"),
  ],
  authorizeRoles("admin", "restaurant"),
  locationController.getNearbyDeliveryPersonnel,
)

module.exports = router
