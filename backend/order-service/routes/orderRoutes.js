const express = require("express");
const { body, param, query } = require("express-validator");
const orderController = require("../controllers/orderController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all ready for pickup orders (for delivery personnel)
router.get(
  "/ready-for-pickup",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
  ],
  authorizeRoles("delivery"),
  orderController.getReadyForPickupOrders
);

// Get nearby orders (for delivery personnel)
router.get(
  "/nearby",
  [
    query("latitude").notEmpty().isFloat().withMessage("Valid latitude is required"),
    query("longitude").notEmpty().isFloat().withMessage("Valid longitude is required"),
    query("maxDistance").optional().isFloat({ min: 0.1 }).withMessage("Valid max distance is required"),
  ],
  authorizeRoles("delivery"),
  orderController.getNearbyOrders
);

// Get order statistics (admin only)
router.get("/statistics", authorizeRoles("admin"), orderController.getOrderStatistics);

// Search orders (admin only)
router.get(
  "/search",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
  ],
  authorizeRoles("admin"),
  orderController.searchOrders
);

// Create a new order
router.post(
  "/",
  [
    body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.menuItemId").notEmpty().withMessage("Menu item ID is required"),
    body("items.*.name").notEmpty().withMessage("Item name is required"),
    body("items.*.price").isFloat({ min: 0 }).withMessage("Valid price is required"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Valid quantity is required"),
    body("subtotal").isFloat({ min: 0 }).withMessage("Valid subtotal is required"),
    body("tax").isFloat({ min: 0 }).withMessage("Valid tax is required"),
    body("deliveryFee").isFloat({ min: 0 }).withMessage("Valid delivery fee is required"),
    body("total").isFloat({ min: 0 }).withMessage("Valid total is required"),
    body("paymentMethod")
      .isIn(["credit_card", "debit_card", "cash", "wallet"])
      .withMessage("Valid payment method is required"),
    body("deliveryAddress").isObject().withMessage("Valid delivery address is required"),
    body("deliveryAddress.street").notEmpty().withMessage("Street is required"),
    body("deliveryAddress.city").notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").notEmpty().withMessage("State is required"),
    body("deliveryAddress.zipCode").notEmpty().withMessage("Zip code is required"),
    body("deliveryAddress.coordinates").isArray().withMessage("Coordinates are required"),
  ],
  authorizeRoles("customer"),
  orderController.createOrder
);

// Get order by ID
router.get("/:id", [param("id").notEmpty().withMessage("Order ID is required")], orderController.getOrderById);

// Get orders by customer ID (or current user)
router.get(
  "/customer/:customerId?",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
    query("status").optional().isString().withMessage("Valid status is required"),
  ],
  orderController.getOrdersByCustomer
);

// Get orders by restaurant ID
router.get(
  "/restaurant/:restaurantId",
  [
    param("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
    query("status").optional().isString().withMessage("Valid status is required"),
  ],
  authorizeRoles("restaurant", "admin"),
  orderController.getOrdersByRestaurant
);

// Get orders by delivery person ID (or current user)
router.get(
  "/delivery/:deliveryPersonId?",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
    query("status").optional().isString().withMessage("Valid status is required"),
  ],
  authorizeRoles("delivery", "admin"),
  orderController.getOrdersByDeliveryPerson
);

// Update order status
router.patch(
  "/:id/status",
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("status")
      .isIn(["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"])
      .withMessage("Valid status is required"),
  ],
  orderController.updateOrderStatus
);

// Assign delivery person to order
router.patch(
  "/:id/assign",
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("deliveryPersonId").notEmpty().withMessage("Delivery person ID is required"),
  ],
  authorizeRoles("restaurant", "admin"),
  orderController.assignDeliveryPerson
);

// Update delivery ETA
router.patch(
  "/:id/eta",
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("estimatedDeliveryTime").notEmpty().withMessage("Estimated delivery time is required"),
  ],
  orderController.updateDeliveryETA
);

// Cancel order
router.patch(
  "/:id/cancel",
  [param("id").notEmpty().withMessage("Order ID is required"), body("reason").optional()],
  orderController.cancelOrder
);

// Accept an order (for delivery personnel)
router.post(
  "/:id/accept",
  [param("id").notEmpty().withMessage("Order ID is required")],
  authorizeRoles("delivery"),
  orderController.acceptOrder
);

module.exports = router;