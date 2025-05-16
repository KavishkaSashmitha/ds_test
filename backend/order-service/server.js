const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const logger = require("./utils/logger");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// Middleware

// Increase payload size limit
app.use(bodyParser.json({ limit: "100mb" })); // Increase the limit to handle large payloads
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  
  // Extract user information from headers (set by API gateway)
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];
  
  if (userId && userRole) {
    req.user = { id: userId, role: userRole };
  }
  
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Order Service" });
});

// Routes
app.use("/", orderRoutes);          // Order routes
app.use("/payments", paymentRoutes); // Payment routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Order service running on port ${PORT}`);
});

module.exports = app;
