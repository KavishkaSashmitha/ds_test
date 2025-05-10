const express = require("express")
const { body } = require("express-validator")
const userController = require("../controllers/userController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get user profile
router.get("/profile", userController.getUserProfile)
router.get("/profile/:id", userController.getUserProfile)

// Update user profile
router.put(
  "/profile",
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
    body("profileImage").optional().isURL().withMessage("Profile image must be a valid URL"),
  ],
  userController.updateUserProfile,
)

// Change password
router.put(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  ],
  userController.changePassword,
)

// Address management
router.post(
  "/addresses",
  [
    body("name").notEmpty().withMessage("Address name is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("state").notEmpty().withMessage("State is required"),
    body("zipCode").notEmpty().withMessage("Zip code is required"),
  ],
  userController.addAddress,
)

router.delete("/addresses/:addressId", userController.deleteAddress)

// Admin routes
router.get("/all", userController.getAllUsers)
router.patch("/:userId/status", userController.updateUserStatus)

module.exports = router
