const express = require("express")
const { body, param, query } = require("express-validator")
const deliveryController = require("../controllers/deliveryController")
const deliveryPersonnelController = require("../controllers/deliveryPersonnelController")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Delivery personnel registration and management
router.post(
  "/personnel/register",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("vehicleType")
      .isIn(["bicycle", "motorcycle", "car", "scooter", "van"])
      .withMessage("Valid vehicle type is required"),
    body("licenseNumber").notEmpty().withMessage("License number is required"),
  ],
  authorizeRoles("admin"),
  deliveryPersonnelController.registerDeliveryPersonnel,
)

router.put(
  "/personnel/availability",
  [body("isAvailable").isBoolean().withMessage("isAvailable must be a boolean")],
  authorizeRoles("delivery"),
  deliveryPersonnelController.updateAvailability,
)

router.get("/personnel/profile", authorizeRoles("delivery", "admin"), deliveryPersonnelController.getProfile)

router.get(
  "/personnel/profile/:id",
  [param("id").notEmpty().withMessage("Delivery personnel ID is required")],
  authorizeRoles("admin"),
  deliveryPersonnelController.getProfile,
)

router.put(
  "/personnel/profile",
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
    body("vehicleType")
      .optional()
      .isIn(["bicycle", "motorcycle", "car", "scooter", "van"])
      .withMessage("Valid vehicle type is required"),
    body("licenseNumber").optional().notEmpty().withMessage("License number cannot be empty"),
  ],
  authorizeRoles("delivery", "admin"),
  deliveryPersonnelController.updateProfile,
)

router.put(
  "/personnel/profile/:id",
  [
    param("id").notEmpty().withMessage("Delivery personnel ID is required"),
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
    body("vehicleType")
      .optional()
      .isIn(["bicycle", "motorcycle", "car", "scooter", "van"])
      .withMessage("Valid vehicle type is required"),
    body("licenseNumber").optional().notEmpty().withMessage("License number cannot be empty"),
  ],
  authorizeRoles("admin"),
  deliveryPersonnelController.updateProfile,
)

router.get("/personnel", authorizeRoles("admin", "restaurant"), deliveryPersonnelController.getAllDeliveryPersonnel)

router.get("/personnel/metrics", authorizeRoles("delivery", "admin"), deliveryPersonnelController.getPerformanceMetrics)

router.get(
  "/personnel/metrics/:id",
  [param("id").notEmpty().withMessage("Delivery personnel ID is required")],
  authorizeRoles("admin"),
  deliveryPersonnelController.getPerformanceMetrics,
)

// Delivery management
router.post(
  "/",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    body("restaurantName").notEmpty().withMessage("Restaurant name is required"),
    body("restaurantLocation").isObject().withMessage("Restaurant location is required"),
    body("restaurantLocation.coordinates").isArray().withMessage("Restaurant coordinates are required"),
    body("restaurantAddress").notEmpty().withMessage("Restaurant address is required"),
    body("customerId").notEmpty().withMessage("Customer ID is required"),
    body("customerName").notEmpty().withMessage("Customer name is required"),
    body("customerLocation").isObject().withMessage("Customer location is required"),
    body("customerLocation.coordinates").isArray().withMessage("Customer coordinates are required"),
    body("customerAddress").notEmpty().withMessage("Customer address is required"),
    body("customerPhone").notEmpty().withMessage("Customer phone is required"),
  ],
  authorizeRoles("restaurant", "admin"),
  deliveryController.createDelivery,
)

router.get("/", deliveryController.getAllDeliveries)

router.get("/:id", [param("id").notEmpty().withMessage("Delivery ID is required")], deliveryController.getDeliveryById)

router.put(
  "/:id/status",
  [
    param("id").notEmpty().withMessage("Delivery ID is required"),
    body("status")
      .isIn(["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"])
      .withMessage("Valid status is required"),
    body("notes").optional(),
  ],
  authorizeRoles("delivery", "admin"),
  deliveryController.updateDeliveryStatus,
)

router.post(
  "/:id/rate",
  [
    param("id").notEmpty().withMessage("Delivery ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("feedback").optional(),
  ],
  authorizeRoles("customer"),
  deliveryController.rateDelivery,
)

router.get("/statistics", authorizeRoles("admin", "restaurant", "delivery"), deliveryController.getDeliveryStatistics)

module.exports = router
