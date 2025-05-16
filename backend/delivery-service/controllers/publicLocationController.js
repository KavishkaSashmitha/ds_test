const { validationResult } = require("express-validator");
const Delivery = require("../models/Delivery");
const DeliveryPersonnel = require("../models/DeliveryPersonnel");
const logger = require("../utils/logger");

// Get delivery location by delivery ID (public endpoint)
exports.getPublicDeliveryLocation = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deliveryId = req.params.id;

    // Get delivery information
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Get delivery personnel
    const deliveryPersonnel = await DeliveryPersonnel.findOne({
      userId: delivery.deliveryPersonnelId,
    });

    if (!deliveryPersonnel || !deliveryPersonnel.currentLocation) {
      return res.status(404).json({ message: "Delivery personnel location not available" });
    }

    // Extract longitude and latitude
    const [longitude, latitude] = deliveryPersonnel.currentLocation.coordinates;

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
      location: {
        latitude,
        longitude,
        lastUpdate: deliveryPersonnel.lastLocationUpdateTime,
      },
      estimatedArrival,
      driverInfo: {
        name: deliveryPersonnel.name,
        phone: deliveryPersonnel.phone,
        rating: deliveryPersonnel.rating,
      },
    });
  } catch (error) {
    logger.error(`Error getting public delivery location: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get delivery location by order ID (public endpoint)
exports.getPublicDeliveryLocationByOrderId = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderId = req.params.orderId;

    // Find delivery by order ID
    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found for this order" });
    }

    // Get delivery personnel
    const deliveryPersonnel = await DeliveryPersonnel.findOne({
      userId: delivery.deliveryPersonnelId,
    });

    if (!deliveryPersonnel || !deliveryPersonnel.currentLocation) {
      return res.status(404).json({ message: "Delivery personnel location not available" });
    }

    // Extract longitude and latitude
    const [longitude, latitude] = deliveryPersonnel.currentLocation.coordinates;

    // Calculate estimated arrival time
    let estimatedArrival = null;
    if (delivery.currentETA) {
      estimatedArrival = {
        estimatedMinutes: delivery.currentETA,
        estimatedTime: new Date(Date.now() + delivery.currentETA * 60000).toISOString(),
      };
    }

    return res.status(200).json({
      deliveryId: delivery._id,
      orderId,
      status: delivery.status,
      location: {
        latitude,
        longitude,
        lastUpdate: deliveryPersonnel.lastLocationUpdateTime,
      },
      estimatedArrival,
      driverInfo: {
        name: deliveryPersonnel.name,
        phone: deliveryPersonnel.phone,
        rating: deliveryPersonnel.rating,
      },
    });
  } catch (error) {
    logger.error(`Error getting public delivery location by order ID: ${error.message}`);
    return res.status(500).json({ message: "Server error" });
  }
};
