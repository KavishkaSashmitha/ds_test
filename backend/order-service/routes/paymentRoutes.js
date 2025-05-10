const express = require("express");
const { body, param, query } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Process payment for an order
router.post(
  "/process",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("paymentMethod")
      .isIn(["credit_card", "debit_card", "cash", "wallet"])
      .withMessage("Valid payment method is required"),
    body("paymentDetails").optional().isObject().withMessage("Valid payment details are required"),
  ],
  authorizeRoles("customer", "admin"),
  paymentController.processPayment
);

// Get payment by ID
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Payment ID is required")],
  paymentController.getPaymentById
);

// Get payments by customer ID (or current user)
router.get(
  "/customer/:customerId?",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Valid page number is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Valid limit is required"),
  ],
  paymentController.getPaymentsByCustomer
);

// Process refund (admin only)
router.post(
  "/:paymentId/refund",
  [
    param("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Valid amount is required"),
    body("reason").notEmpty().withMessage("Refund reason is required"),
  ],
  authorizeRoles("admin"),
  paymentController.processRefund
);

// Get payment statistics (admin only)
router.get("/statistics", authorizeRoles("admin"), paymentController.getPaymentStatistics);

module.exports = router;