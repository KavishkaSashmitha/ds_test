const jwt = require("jsonwebtoken")
const logger = require("../utils/logger")

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user info to request
    req.user = decoded
    next()
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`)
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}

// Middleware to check user role
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }
    next()
  }
}
