const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
const ENV = process.env.NODE_ENV || 'development';
const USE_DOCKER = process.env.USE_DOCKER === 'true';

// Service URLs based on environment
const serviceUrls = {
  auth: USE_DOCKER ? 'http://auth-service:3001' : 'http://localhost:3001',
  restaurant: USE_DOCKER ? 'http://restaurant-service:3002' : 'http://localhost:3002',
  order: USE_DOCKER ? 'http://order-service:3003' : 'http://localhost:3003', // Added order service
  delivery: USE_DOCKER ? 'http://delivery-service:3004' : 'http://localhost:3004'
};

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // During development, allow any localhost origin regardless of port
    if (ENV === 'development' && 
        (origin.startsWith('http://localhost:') || 
         origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    
    // For production, you'd want a more restrictive list
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3001',
      'http://localhost:3004',
      'http://localhost:8000',
      'http://localhost:8080'
      // Add your production domains here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Add request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip authentication for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Configure proxy with error handling
const createProxyConfig = (targetUrl, pathRewrite = {}) => ({
  target: targetUrl,
  changeOrigin: true,
  pathRewrite,
  onProxyReq: (proxyReq, req, res) => {
    // Add user info to the proxied request headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || req.user._id || '');
      proxyReq.setHeader('X-User-Role', req.user.role || '');
    }
    
    // If there's a JSON body, we need to rewrite it
    if (req.body && Object.keys(req.body).length > 0 && 
        req.headers['content-type']?.includes('application/json')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write the body to the proxied request
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ensure CORS headers are preserved
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ 
      message: 'Service unavailable', 
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: ENV,
    services: {
      auth: serviceUrls.auth,
      restaurant: serviceUrls.restaurant,
      order: serviceUrls.order, // Added order service to health check
      delivery: serviceUrls.delivery
    }
  });
});

// Auth service routes (no authentication required)
// Support both /auth/* and /api/auth/* patterns
app.use(
  ["/auth", "/api/auth"],
  createProxyMiddleware({
    target: serviceUrls.auth,
    changeOrigin: true,
    pathRewrite: {
      "^/auth": "/",
      "^/api/auth": "/"
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying request to Auth Service: ${req.method} ${req.originalUrl}`);
      
      // Make sure Content-Type is set correctly for JSON requests
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(`Received response from Auth Service: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error(`Error proxying request to Auth Service: ${err.message}`);
      res.status(500).json({ message: "Error communicating with Auth Service", error: err.message });
    },
    timeout: 30000,
    proxyTimeout: 30000,
  })
);

// Restaurant service routes (auth required)
app.use(['/restaurants', '/menus'], authenticate, createProxyMiddleware({
  ...createProxyConfig(serviceUrls.restaurant),
  pathRewrite: {
    '^/restaurants': '/restaurants',
    '^/menus': '/menus'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to Restaurant Service: ${req.method} ${req.originalUrl}`);
    
    // Add user info to the proxied request headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || req.user._id || '');
      proxyReq.setHeader('X-User-Role', req.user.role || '');
    }
    
    // If there's a JSON body, we need to rewrite it
    if (req.body && Object.keys(req.body).length > 0 && 
        req.headers['content-type']?.includes('application/json')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

// Order and Payment service routes (auth required)
app.use('/orders', authenticate, createProxyMiddleware({
  ...createProxyConfig(serviceUrls.order),
  pathRewrite: {
    '^/orders': '/'  // This removes the /orders prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to Order Service: ${req.method} ${req.originalUrl}`);
    
    // Add user info to the proxied request headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || req.user._id || '');
      proxyReq.setHeader('X-User-Role', req.user.role || '');
    }
    
    // If there's a JSON body, we need to rewrite it
    if (req.body && Object.keys(req.body).length > 0 && 
        req.headers['content-type']?.includes('application/json')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write the body to the proxied request
      proxyReq.write(bodyData);
    }
  }
}));

// Payment routes (routed through the order service)
app.use('/payments', authenticate, createProxyMiddleware({
  ...createProxyConfig(serviceUrls.order),
  pathRewrite: {
    '^/payments': '/payments'  // Keep the /payments prefix when forwarding to order service
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying payment request to Order Service: ${req.method} ${req.originalUrl}`);
    
    // Add user info to the proxied request headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || req.user._id || '');
      proxyReq.setHeader('X-User-Role', req.user.role || '');
    }
    
    // If there's a JSON body, we need to rewrite it
    if (req.body && Object.keys(req.body).length > 0 && 
        req.headers['content-type']?.includes('application/json')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write the body to the proxied request
      proxyReq.write(bodyData);
    }
  }
}));

// Delivery service routes (auth required)
app.use('/delivery', authenticate, createProxyMiddleware({
  ...createProxyConfig(serviceUrls.delivery),
  pathRewrite: {
    '^/delivery': '/'  // This removes the /delivery prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to Delivery Service: ${req.method} ${req.originalUrl}`);
    
    // Add user info to the proxied request headers if authenticated
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id || req.user._id || '');
      proxyReq.setHeader('X-User-Role', req.user.role || '');
    }
    
    // If there's a JSON body, we need to rewrite it
    if (req.body && Object.keys(req.body).length > 0 && 
        req.headers['content-type']?.includes('application/json')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write the body to the proxied request
      proxyReq.write(bodyData);
    }
  }
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT} in ${ENV} mode`);
  logger.info(`Using ${USE_DOCKER ? 'Docker' : 'local'} service URLs`);
  logger.info('Available routes:');
  logger.info(`  /auth -> ${serviceUrls.auth}`);
  logger.info(`  /restaurants -> ${serviceUrls.restaurant}`);
  logger.info(`  /orders -> ${serviceUrls.order}`); // Added order service to logs
  logger.info(`  /payments -> ${serviceUrls.order}`); // Added payment service to logs
  logger.info(`  /delivery -> ${serviceUrls.delivery}`);
  logger.info('  /health - API Gateway health check');
});