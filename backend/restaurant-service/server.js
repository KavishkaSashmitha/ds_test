const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const logger = require("./utils/logger")
const restaurantRoutes = require("./routes/restaurantRoutes")
const menuRoutes = require("./routes/menuRoutes")
const availabilityRoutes = require("./routes/availabilityRoutes")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB")
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message}`)
    process.exit(1)
  })

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Restaurant Service is running" })
})

// Routes
app.use("/restaurants", restaurantRoutes)
app.use("/menus", menuRoutes)
app.use("/availability", availabilityRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`)
  res.status(500).json({ message: "Internal Server Error", error: err.message })
})

// Handle 404 routes
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`)
  res.status(404).json({ message: "Route not found" })
})

// Start the server
app.listen(PORT, () => {
  logger.info(`Restaurant Service running on port ${PORT}`)
})

module.exports = app
