const express = require("express")
const { body, param, query } = require("express-validator")
const earningsController = require("../controllers/earningsController")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get earnings for a delivery personnel
router.get("/", authorizeRoles("delivery", "admin"), earningsController.getEarnings)

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Delivery personnel ID is required")],
  authorizeRoles("admin"),
  earningsController.getEarnings,
)

// Get earnings summary
router.get("/summary", authorizeRoles("delivery", "admin"), earningsController.getEarningsSummary)

router.get(
  "/summary/:id",
  [param("id").notEmpty().withMessage("Delivery personnel ID is required")],
  authorizeRoles("admin"),
  earningsController.getEarningsSummary,
)

// Mark earnings as paid
router.post(
  "/mark-paid",
  [
    body("earningsIds").isArray().withMessage("Earnings IDs array is required"),
    body("earningsIds.*").isMongoId().withMessage("Valid earnings IDs are required"),
  ],
  authorizeRoles("admin"),
  earningsController.markEarningsAsPaid,
)

// Get unpaid earnings
router.get("/unpaid", authorizeRoles("admin"), earningsController.getUnpaidEarnings)

module.exports = router
