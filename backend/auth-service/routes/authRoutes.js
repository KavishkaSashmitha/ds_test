const express = require("express")
const { body } = require("express-validator")
const authController = require("../controllers/authController")

const router = express.Router()

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("role").optional().isIn(["customer", "restaurant", "delivery", "admin"]).withMessage("Invalid role"),
  ],
  authController.register,
)

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  authController.login,
)

module.exports = router
