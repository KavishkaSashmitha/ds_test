const logger = require("./logger")
const jwt = require("jsonwebtoken")
const DeliveryPersonnel = require("../models/DeliveryPersonnel")
const Delivery = require("../models/Delivery")
const LocationHistory = require("../models/LocationHistory")
const geolib = require("geolib")

// Socket.IO instance
let ioInstance;

module.exports = (io) => {
  // Store reference to io instance
  ioInstance = io;
  
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        logger.error("Socket authentication failed: No token provided");
        return next(new Error("Authentication token is required"))
      }

      // Verify the token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          logger.error(`Socket authentication error: ${err.message}`);
          return next(new Error("Invalid or expired token"));
        }
        
        // Store user info in socket object for use in event handlers
        socket.user = decoded;
        logger.info(`Socket authenticated for user: ${decoded.id}, role: ${decoded.role}`);
        next();
      });
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`)
      next(new Error("Authentication failed"))
    }
  })

  // Handle socket connections
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.user.id}, role: ${socket.user.role}`)

    // Join room based on user role and ID
    socket.join(`${socket.user.role}_${socket.user.id}`)

    // Handle location updates from delivery personnel
    socket.on("location_update", async (data) => {
      try {
        if (socket.user.role !== "delivery") {
          throw new Error("Only delivery personnel can update location")
        }

        const { latitude, longitude, deliveryId } = data

        // Update location in database
        await DeliveryPersonnel.findOneAndUpdate(
          { userId: socket.user.id },
          {
            currentLocation: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            lastLocationUpdateTime: new Date(),
          },
        )

        // Save location history
        const locationHistory = new LocationHistory({
          deliveryPersonnelId: socket.user.id,
          deliveryId: deliveryId || null,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        })

        await locationHistory.save()

        // If this is for a specific delivery, get and update information
        if (deliveryId) {
          const delivery = await Delivery.findById(deliveryId);
          if (delivery) {
            // Also update the last location in the delivery document
            delivery.lastLocationUpdate = {
              coordinates: [longitude, latitude],
              timestamp: new Date()
            };
            await delivery.save();
            
            // Calculate estimated arrival information
            const estimatedArrival = await calculateEstimatedArrival(delivery, [longitude, latitude]);
            
            // Broadcast to everyone tracking this delivery
            io.to(`delivery_${deliveryId}`).emit("location_update", {
              deliveryId,
              location: { latitude, longitude },
              timestamp: new Date(),
              status: delivery.status,
              estimatedArrival
            })
            
            // Also broadcast to customer specifically
            io.to(`customer_${delivery.customerId}`).emit("delivery_tracking_update", {
              deliveryId,
              orderId: delivery.orderId,
              location: { latitude, longitude },
              status: delivery.status,
              estimatedArrival
            })
            
            // Update the delivery ETA in the database if needed
            if (delivery.status === "picked_up" || delivery.status === "in_transit") {
              delivery.currentETA = estimatedArrival.estimatedMinutes;
              await delivery.save();
            }
          }
        }

        logger.info(`Location updated for delivery personnel ${socket.user.id}`)
      } catch (error) {
        logger.error(`Location update error: ${error.message}`)
        socket.emit("error", { message: error.message })
      }
    })

    // Handle delivery status updates
    socket.on("delivery_status_update", async (data) => {
      try {
        if (socket.user.role !== "delivery") {
          throw new Error("Only delivery personnel can update delivery status")
        }

        const { deliveryId, status, notes } = data

        // Update the delivery status in the database
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
          throw new Error("Delivery not found");
        }

        if (delivery.deliveryPersonnelId !== socket.user.id) {
          throw new Error("Not authorized to update this delivery status");
        }

        // Update status and related fields
        delivery.status = status;
        delivery.updatedAt = new Date();
        if (notes) delivery.notes = notes;

        // Update status-specific timestamps
        switch (status) {
          case "picked_up":
            delivery.pickedUpAt = new Date();
            break;
          case "in_transit":
            // Status when driver has picked up and is headed to customer
            break;
          case "delivered":
            delivery.deliveredAt = new Date();
            
            // Calculate actual delivery time in minutes
            const deliveryTimeMinutes = Math.round((delivery.deliveredAt - delivery.assignedAt) / (1000 * 60));
            delivery.actualDeliveryTime = deliveryTimeMinutes;
            
            // Update delivery personnel availability
            await DeliveryPersonnel.findOneAndUpdate(
              { userId: socket.user.id },
              { isAvailable: true }
            );
            break;
          case "cancelled":
            delivery.cancelledAt = new Date();
            delivery.cancellationReason = notes || "No reason provided";
            
            // Make delivery personnel available again
            await DeliveryPersonnel.findOneAndUpdate(
              { userId: socket.user.id },
              { isAvailable: true }
            );
            break;
        }

        await delivery.save();

        // Broadcast to relevant parties
        io.to(`delivery_${deliveryId}`).emit("delivery_status_update", {
          deliveryId,
          orderId: delivery.orderId,
          status,
          timestamp: new Date(),
        })
        
        // Also notify customer directly
        io.to(`customer_${delivery.customerId}`).emit("delivery_status_update", {
          deliveryId,
          orderId: delivery.orderId,
          status,
          timestamp: new Date(),
        })

        // Notify restaurant as well
        io.to(`restaurant_${delivery.restaurantId}`).emit("delivery_status_update", {
          deliveryId,
          orderId: delivery.orderId,
          status,
          timestamp: new Date(),
        })

        logger.info(`Delivery status updated for delivery ${deliveryId}: ${status}`)
      } catch (error) {
        logger.error(`Delivery status update error: ${error.message}`)
        socket.emit("error", { message: error.message })
      }
    })

    // Join delivery tracking room (for customers, restaurants, or admin tracking specific deliveries)
    socket.on("track_delivery", async (deliveryId) => {
      try {
        if (!deliveryId) {
          throw new Error("Delivery ID is required");
        }
        
        const delivery = await Delivery.findById(deliveryId);
        
        if (!delivery) {
          throw new Error("Delivery not found");
        }
        
        // Verify permission to track this delivery
        const canTrack = 
          socket.user.role === "admin" || 
          (socket.user.role === "customer" && socket.user.id === delivery.customerId) ||
          (socket.user.role === "restaurant" && socket.user.id === delivery.restaurantId) ||
          (socket.user.role === "delivery" && socket.user.id === delivery.deliveryPersonnelId);
          
        if (!canTrack) {
          throw new Error("Not authorized to track this delivery");
        }
        
        socket.join(`delivery_${deliveryId}`);
        logger.info(`User ${socket.user.id} (${socket.user.role}) joined delivery tracking: ${deliveryId}`);
        
        // Send initial tracking data if the delivery has been assigned
        if (delivery.deliveryPersonnelId) {
          // Get current location of the delivery person
          const deliveryPersonnel = await DeliveryPersonnel.findOne({ userId: delivery.deliveryPersonnelId });
          
          if (deliveryPersonnel && deliveryPersonnel.currentLocation && deliveryPersonnel.currentLocation.coordinates) {
            const latitude = deliveryPersonnel.currentLocation.coordinates[1];
            const longitude = deliveryPersonnel.currentLocation.coordinates[0];
            
            // Calculate estimated arrival
            const estimatedArrival = await calculateEstimatedArrival(delivery, [longitude, latitude]);
            
            // Send current location to the client that just joined
            socket.emit("location_update", {
              deliveryId,
              location: { latitude, longitude },
              timestamp: deliveryPersonnel.lastLocationUpdateTime || new Date(),
              status: delivery.status,
              estimatedArrival
            });
          } else {
            // If we don't have a location yet, send a message with delivery status only
            socket.emit("delivery_status_update", {
              deliveryId,
              orderId: delivery.orderId,
              status: delivery.status,
              timestamp: new Date()
            });
          }
        }
        
      } catch (error) {
        logger.error(`Track delivery error: ${error.message}`);
        socket.emit("error", { message: error.message });
      }
    })

    // Stop tracking a delivery
    socket.on("stop_tracking", (deliveryId) => {
      if (!deliveryId) return;
      
      socket.leave(`delivery_${deliveryId}`);
      logger.info(`User ${socket.user.id} stopped tracking delivery: ${deliveryId}`);
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.user.id}`);
    })
    
    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for user ${socket.user?.id || 'unknown'}: ${error.message}`);
    });
  })
}

// Calculate estimated arrival time based on current location
async function calculateEstimatedArrival(delivery, currentCoordinates) {
  try {
    // Determine the destination based on delivery status
    let destinationCoordinates;
    if (delivery.status === "assigned") {
      // Driver heading to restaurant
      destinationCoordinates = delivery.restaurantLocation.coordinates;
    } else {
      // Driver heading to customer
      destinationCoordinates = delivery.customerLocation.coordinates;
    }
    
    // Calculate distance in kilometers
    const distance = geolib.getDistance(
      { latitude: currentCoordinates[1], longitude: currentCoordinates[0] },
      { latitude: destinationCoordinates[1], longitude: destinationCoordinates[0] }
    ) / 1000;
    
    // Estimate time based on average speed (20 km/h)
    const averageSpeed = 20;
    const timeInMinutes = Math.ceil((distance / averageSpeed) * 60);
    
    // Calculate arrival time
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + timeInMinutes * 60000);
    
    return {
      estimatedMinutes: timeInMinutes,
      estimatedArrivalTime: arrivalTime,
      remainingDistance: distance.toFixed(1)
    };
  } catch (error) {
    logger.error(`Error calculating estimated arrival: ${error.message}`);
    return {
      estimatedMinutes: null,
      estimatedArrivalTime: null,
      remainingDistance: null
    };
  }
}

// Export function to get the io instance
module.exports.getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};
