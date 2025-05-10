const nodemailer = require("nodemailer")
const logger = require("./logger")

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Send email function
const sendEmail = async (options) => {
  try {
    logger.info("Email functionality is disabled.")
    return { success: true } // Simulate success without sending email
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Removed email service functionality as requested
module.exports = null;
