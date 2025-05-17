const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const http = require("http")
const socketIo = require("socket.io")
const logger = require("./utils/logger")
const deliveryRoutes = require("./routes/deliveryRoutes")
const locationRoutes = require("./routes/locationRoutes")
const earningsRoutes = require("./routes/earningsRoutes")
const socketHandler = require("./utils/socketHandler")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3004

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

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

// Pass io to socket handler
socketHandler(io)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Delivery Service is running" })
})

// Routes
app.use("/deliveries", deliveryRoutes)
app.use("/locations", locationRoutes)
app.use("/earnings", earningsRoutes)

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
server.listen(PORT, () => {
  logger.info(`Delivery Service running on port ${PORT}`)
})

module.exports = app
