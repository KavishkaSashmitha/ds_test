const express = require("express");
const { param, body } = require("express-validator");
const mockLocationController = require("../controllers/mockLocationController");

const router = express.Router();

// Mock routes for testing location tracking

// Get mock delivery data
router.get(
  "/delivery/:id",
  [param("id").notEmpty().withMessage("Delivery ID is required")],
  mockLocationController.getMockDeliveryLocation
);

// Get mock delivery data by order ID
router.get(
  "/order/:orderId",
  [param("orderId").notEmpty().withMessage("Order ID is required")],
  mockLocationController.getMockDeliveryLocationByOrderId
);

// Create a mock delivery with initial location
router.post(
  "/create-delivery",
  [
    body("deliveryId").notEmpty().withMessage("Delivery ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("status").notEmpty().withMessage("Status is required"),
    body("driverName").notEmpty().withMessage("Driver name is required"),
  ],
  mockLocationController.createMockDelivery
);

// Update mock delivery status
router.put(
  "/update-status/:id",
  [
    param("id").notEmpty().withMessage("Delivery ID is required"),
    body("status").notEmpty().withMessage("New status is required"),
  ],
  mockLocationController.updateMockDeliveryStatus
);

module.exports = router;
