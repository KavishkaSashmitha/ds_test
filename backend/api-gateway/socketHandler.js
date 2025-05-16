const jwt = require('jsonwebtoken');
const socketIO = require('socket.io-client');
const logger = require('./utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const USE_DOCKER = process.env.USE_DOCKER === 'true';
const DELIVERY_SERVICE_URL = USE_DOCKER 
  ? 'http://delivery-service:3004' 
  : 'http://localhost:3004';

let deliveryServiceSocket = null;

// Initialize socket connection to the delivery service
const connectToDeliveryService = () => {
  try {
    deliveryServiceSocket = socketIO(DELIVERY_SERVICE_URL);
    
    deliveryServiceSocket.on('connect', () => {
      logger.info('Connected to delivery service socket');
    });
    
    deliveryServiceSocket.on('disconnect', (reason) => {
      logger.warn(`Disconnected from delivery service socket: ${reason}`);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!deliveryServiceSocket.connected) {
          logger.info('Attempting to reconnect to delivery service...');
          deliveryServiceSocket.connect();
        }
      }, 5000);
    });
    
    deliveryServiceSocket.on('connect_error', (error) => {
      logger.error(`Connection error to delivery service: ${error.message}`);
    });
    
    return deliveryServiceSocket;
  } catch (error) {
    logger.error(`Failed to connect to delivery service: ${error.message}`);
    return null;
  }
};

// Setup socket connections and proxy events between clients and services
module.exports = (io) => {
  // Authentication middleware for client sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      // Allow anonymous connections for public tracking
      if (!token) {
        socket.user = { role: 'anonymous' };
        return next();
      }
      
      // Verify token for authenticated users
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          logger.error(`Socket authentication error: ${err.message}`);
          return next(new Error('Authentication failed'));
        }
        
        socket.user = decoded;
        logger.info(`Socket authenticated for user: ${decoded.id}, role: ${decoded.role}`);
        next();
      });
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });
  
  // Ensure connection to delivery service
  if (!deliveryServiceSocket || !deliveryServiceSocket.connected) {
    connectToDeliveryService();
  }
  
  // Handle client connections
  io.on('connection', (socket) => {
    const userRole = socket.user?.role || 'anonymous';
    const userId = socket.user?.id || 'anonymous';
    
    logger.info(`Socket client connected: ${userId} (${userRole})`);
    
    // Handle location updates from delivery personnel
    if (userRole === 'delivery') {
      socket.on('location_update', (data) => {
        logger.info(`Location update from driver ${userId}: ${JSON.stringify(data)}`);
        
        // Forward the update to the delivery service
        if (deliveryServiceSocket && deliveryServiceSocket.connected) {
          deliveryServiceSocket.emit('location_update', {
            ...data,
            driverId: userId
          });
        }
        
        // Also broadcast directly to any clients tracking this delivery
        if (data.deliveryId) {
          io.to(`delivery_${data.deliveryId}`).emit('location_update', {
            deliveryId: data.deliveryId,
            driverId: userId,
            location: {
              latitude: data.latitude,
              longitude: data.longitude
            },
            timestamp: new Date()
          });
        }
      });
    }
    
    // Handle delivery tracking subscriptions from customers
    if (userRole === 'customer' || userRole === 'anonymous') {
      socket.on('subscribe_to_delivery', (deliveryId) => {
        logger.info(`User ${userId} subscribed to delivery ${deliveryId}`);
        socket.join(`delivery_${deliveryId}`);
      });
      
      socket.on('unsubscribe_from_delivery', (deliveryId) => {
        logger.info(`User ${userId} unsubscribed from delivery ${deliveryId}`);
        socket.leave(`delivery_${deliveryId}`);
      });
    }
    
    // Forward relevant events from delivery service to clients
    if (deliveryServiceSocket) {
      deliveryServiceSocket.on('location_update', (data) => {
        // Forward only to clients who are subscribed to this delivery
        io.to(`delivery_${data.deliveryId}`).emit('location_update', data);
      });
      
      deliveryServiceSocket.on('delivery_status_update', (data) => {
        // Forward status updates to subscribed clients
        io.to(`delivery_${data.deliveryId}`).emit('delivery_status_update', data);
      });
    }
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${userId} (${userRole})`);
    });
  });
};
