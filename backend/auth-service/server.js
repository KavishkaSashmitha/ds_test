const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const logger = require("./utils/logger")
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost origins
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000', // Frontend
      'http://localhost:8080', // API Gateway
      'http://localhost:8000',
      'http://localhost:8080',
      // Add production domains here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'X-User-Id', 'X-User-Role']
};

// Middleware
app.use(cors(corsOptions))
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
  res.status(200).json({ status: "OK", message: "Auth Service is running" })
})

// Routes
app.use("/", authRoutes)
app.use("/users", userRoutes)

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
  logger.info(`Auth Service running on port ${PORT}`)
})

module.exports = app
