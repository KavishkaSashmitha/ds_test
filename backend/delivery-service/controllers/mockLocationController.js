const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

// In-memory storage for mock deliveries
const mockDeliveries = new Map();
const mockLocations = new Map();

// Initialize with a default mockup delivery
const defaultDeliveryId = "delivery_12345";
const defaultOrderId = "order_67890";

// Initialize the default delivery if not already present
const initializeDefaultDelivery = () => {
  if (!mockDeliveries.has(defaultDeliveryId)) {
    mockDeliveries.set(defaultDeliveryId, {
      _id: defaultDeliveryId,
      orderId: defaultOrderId,
      status: "assigned",
      deliveryPersonnelId: "driver_123",
      restaurantId: "restaurant_456",
      customerId: "customer_789",
      currentETA: 15, // 15 minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockLocations.set(defaultDeliveryId, {
      deliveryId: defaultDeliveryId,
      location: {
        latitude: 40.7128, // Default to NYC coordinates for testing
        longitude: -74.0060,
        lastUpdate: new Date().toISOString(),
      },
      driverInfo: {
        name: "Test Driver",
        phone: "+1 555-1234",
        rating: 4.8,
      }
    });
  }
};

// Initialize default data
initializeDefaultDelivery();

// Get mock delivery location by delivery ID
exports.getMockDeliveryLocation = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deliveryId = req.params.id;
    
    // Get delivery from mock storage
    const delivery = mockDeliveries.get(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Get location info
    const locationInfo = mockLocations.get(deliveryId);
    if (!locationInfo) {
      return res.status(404).json({ message: "Delivery location not available" });
    }

    // Calculate estimated arrival time
    let estimatedArrival = null;
    if (delivery.currentETA) {
      estimatedArrival = {
        estimatedMinutes: delivery.currentETA,
        estimatedTime: new Date(Date.now() + delivery.currentETA * 60000).toISOString(),
      };
    }

    return res.status(200).json({
      deliveryId,
      orderId: delivery.orderId,
      status: delivery.status,
      location: locationInfo.location,
      estimatedArrival,
      driverInfo: locationInfo.driverInfo,
    });
  } catch (error) {
    logger.error(`Error getting mock delivery location: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get mock delivery location by order ID
exports.getMockDeliveryLocationByOrderId = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderId = req.params.orderId;
    
    // Find delivery by order ID in mock storage
    let deliveryId = null;
    for (const [id, delivery] of mockDeliveries.entries()) {
      if (delivery.orderId === orderId) {
        deliveryId = id;
        break;
      }
    }

    if (!deliveryId) {
      return res.status(404).json({ message: "Delivery not found for this order" });
    }

    // Get delivery from mock storage
    const delivery = mockDeliveries.get(deliveryId);

    // Get location info
    const locationInfo = mockLocations.get(deliveryId);
    if (!locationInfo) {
      return res.status(404).json({ message: "Delivery location not available" });
    }

    // Calculate estimated arrival time
    let estimatedArrival = null;
    if (delivery.currentETA) {
      estimatedArrival = {
        estimatedMinutes: delivery.currentETA,
        estimatedTime: new Date(Date.now() + delivery.currentETA * 60000).toISOString(),
      };
    }

    return res.status(200).json({
      deliveryId,
      orderId,
      status: delivery.status,
      location: locationInfo.location,
      estimatedArrival,
      driverInfo: locationInfo.driverInfo,
    });
  } catch (error) {
    logger.error(`Error getting mock delivery location by order ID: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a mock delivery with initial location
exports.createMockDelivery = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deliveryId, orderId, status, driverName, initialLatitude, initialLongitude } = req.body;

    // Create mock delivery
    const newDelivery = {
      _id: deliveryId,
      orderId,
      status,
      deliveryPersonnelId: `driver_${Math.floor(Math.random() * 1000)}`,
      restaurantId: `restaurant_${Math.floor(Math.random() * 1000)}`,
      customerId: `customer_${Math.floor(Math.random() * 1000)}`,
      currentETA: 20, // default 20 minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Set default location or use provided coordinates
    const lat = initialLatitude || 40.7128; // Default to NYC
    const lng = initialLongitude || -74.0060;

    // Create location data
    const locationData = {
      deliveryId,
      location: {
        latitude: lat,
        longitude: lng,
        lastUpdate: new Date().toISOString(),
      },
      driverInfo: {
        name: driverName || "Test Driver",
        phone: "+1 555-1234",
        rating: 4.8,
      }
    };

    // Save to mock storage
    mockDeliveries.set(deliveryId, newDelivery);
    mockLocations.set(deliveryId, locationData);

    return res.status(201).json({
      message: "Mock delivery created successfully",
      delivery: newDelivery,
      locationData,
    });
  } catch (error) {
    logger.error(`Error creating mock delivery: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update mock delivery status
exports.updateMockDeliveryStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deliveryId = req.params.id;
    const { status } = req.body;
    
    // Get delivery from mock storage
    const delivery = mockDeliveries.get(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Update status and ETA based on new status
    delivery.status = status;
    
    // Update ETA based on status
    switch(status) {
      case "assigned":
        delivery.currentETA = 20;
        break;
      case "picked_up":
        delivery.currentETA = 15;
        break;
      case "in_transit":
        delivery.currentETA = 10;
        break;
      case "nearby":
        delivery.currentETA = 3;
        break;
      case "delivered":
        delivery.currentETA = 0;
        break;
      default:
        delivery.currentETA = 15;
    }

    delivery.updatedAt = new Date().toISOString();
    
    // Update in mock storage
    mockDeliveries.set(deliveryId, delivery);

    return res.status(200).json({
      message: "Delivery status updated successfully",
      delivery,
    });
  } catch (error) {
    logger.error(`Error updating mock delivery status: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};

// Socket event handler for updating mock location
exports.updateMockLocation = (io, deliveryId, locationData) => {
  try {
    // Get location info from mock storage
    const locationInfo = mockLocations.get(deliveryId);
    if (!locationInfo) {
      logger.error(`Location data not found for delivery: ${deliveryId}`);
      return false;
    }

    // Update location
    locationInfo.location = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      lastUpdate: new Date().toISOString(),
    };

    // Save to mock storage
    mockLocations.set(deliveryId, locationInfo);

    // Emit updated location to all subscribers
    io.to(`delivery:${deliveryId}`).emit("location:update", {
      deliveryId,
      location: locationInfo.location,
    });

    logger.info(`Updated mock location for delivery: ${deliveryId}`);
    return true;
  } catch (error) {
    logger.error(`Error updating mock location: ${error.message}`);
    return false;
  }
};
