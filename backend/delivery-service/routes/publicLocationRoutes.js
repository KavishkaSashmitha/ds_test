const express = require("express");
const { param, query } = require("express-validator");
const publicLocationController = require("../controllers/publicLocationController");

const router = express.Router();

// Public routes for location tracking (no authentication required)

// Get driver location by delivery ID
router.get(
  "/delivery/:id",
  [param("id").notEmpty().withMessage("Delivery ID is required")],
  publicLocationController.getPublicDeliveryLocation
);

// Get driver location by order ID
router.get(
  "/order/:orderId",
  [param("orderId").notEmpty().withMessage("Order ID is required")],
  publicLocationController.getPublicDeliveryLocationByOrderId
);

module.exports = router;
