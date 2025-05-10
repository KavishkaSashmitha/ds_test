const { validationResult } = require("express-validator")
const axios = require("axios")
const Order = require("../models/Order")
const Payment = require("../models/Payment")
const logger = require("../utils/logger")

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      restaurantId,
      items,
      subtotal,
      tax,
      deliveryFee,
      tip,
      total,
      paymentMethod,
      deliveryAddress,
      deliveryInstructions,
      specialInstructions,
    } = req.body

    // Clean and validate menu item IDs
    const sanitizedItems = items.map(item => {
      // Remove any non-alphanumeric characters from menuItemId to prevent issues with "[]" or other invalid characters
      const sanitizedMenuItemId = item.menuItemId.replace(/[^a-zA-Z0-9]/g, "");
      
      return {
        ...item,
        menuItemId: sanitizedMenuItemId
      };
    });

    // Create new order
    const order = new Order({
      customerId: req.user.id,
      restaurantId,
      items: sanitizedItems,
      subtotal,
      tax,
      deliveryFee,
      tip: tip || 0,
      total,
      paymentMethod,
      deliveryAddress,
      deliveryInstructions,
      specialInstructions,
    })

    await order.save()

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      customerId: req.user.id,
      amount: total,
      method: paymentMethod,
      status: paymentMethod === "cash" ? "pending" : "completed",
    })

    await payment.save()

    // If payment is completed, update order payment status
    if (payment.status === "completed") {
      order.paymentStatus = "completed"
      await order.save()
    }

    // Notify restaurant service about new order
    try {
      await axios.post(
        `${process.env.RESTAURANT_SERVICE_URL}/restaurants/${restaurantId}/orders/notify`,
        { orderId: order._id },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      )
    } catch (error) {
      logger.error(`Failed to notify restaurant service: ${error.message}`)
      // Continue processing even if notification fails
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
      payment,
    })
  } catch (error) {
    logger.error(`Create order error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user has permission to view this order
    if (
      req.user.role !== "admin" &&
      req.user.id !== order.customerId.toString() &&
      req.user.role !== "restaurant" &&
      req.user.id !== order.restaurantId.toString() &&
      req.user.role !== "delivery" &&
      req.user.id !== order.deliveryPersonId?.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    // Get payment information
    const payment = await Payment.findOne({ orderId: id })

    res.status(200).json({ order, payment })
  } catch (error) {
    logger.error(`Get order error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get orders by customer ID
exports.getOrdersByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.user.id
    const { status, page = 1, limit = 10 } = req.query

    // Check if user has permission to view these orders
    if (req.user.role !== "admin" && req.user.id !== customerId) {
      return res.status(403).json({ message: "Not authorized to view these orders" })
    }

    // Build query
    const query = { customerId }
    if (status) {
      query.status = status
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get orders
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number.parseInt(limit))

    // Get total count
    const total = await Order.countDocuments(query)

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Get customer orders error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get orders by restaurant ID
exports.getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { status, page = 1, limit = 100 } = req.query

    // Check if user has permission to view these orders
    if (req.user.role !== "admin" && req.user.role !== "restaurant") {
      return res.status(403).json({ message: "Not authorized to view these orders" })
    }

    // If restaurant user, check if they own this restaurant
    if (req.user.role === "restaurant") {
      // In a real app, we would check against the restaurant service
      // For now, we'll assume the restaurantId in the URL matches the user's restaurant
    }

    // Build query
    const query = { restaurantId }
    if (status) {
      query.status = status
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get orders
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number.parseInt(limit))

    // Get total count
    const total = await Order.countDocuments(query)

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Get restaurant orders error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get orders by delivery person ID
exports.getOrdersByDeliveryPerson = async (req, res) => {
  try {
    const deliveryPersonId = req.params.deliveryPersonId || req.user.id
    const { status, page = 1, limit = 10 } = req.query

    // Check if user has permission to view these orders
    if (req.user.role !== "admin" && req.user.role !== "delivery") {
      return res.status(403).json({ message: "Not authorized to view these orders" })
    }

    // If delivery personnel user, check if they are accessing their own orders
    if (req.user.role === "delivery" && req.user.id !== deliveryPersonId) {
      return res.status(403).json({ message: "Not authorized to view other delivery personnel orders" })
    }

    // Build query
    const query = { deliveryPersonId }
    
    // Filter by status if provided, otherwise include all valid delivery statuses
    if (status) {
      query.status = status
    } else {
      // Include orders that are in delivery-related statuses
      query.status = { 
        $in: ["out_for_delivery", "picked_up", "delivered", "ready_for_pickup"] 
      }
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count
    const total = await Order.countDocuments(query)

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    logger.error(`Get delivery person orders error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user has permission to update this order
    if (req.user.role === "customer" && req.user.id !== order.customerId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    if (req.user.role === "restaurant" && req.user.id !== order.restaurantId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    if (req.user.role === "delivery" && req.user.id !== order.deliveryPersonId?.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready_for_pickup", "cancelled"],
      ready_for_pickup: ["out_for_delivery", "cancelled"],
      out_for_delivery: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    }

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`,
        validTransitions: validTransitions[order.status],
      })
    }

    // Update order status
    order.status = status
    order.updatedAt = Date.now()

    // If order is delivered, set actual delivery time
    if (status === "delivered") {
      order.actualDeliveryTime = Date.now()
    }

    await order.save()

    // If order is cancelled, process refund if payment was made
    if (status === "cancelled") {
      const payment = await Payment.findOne({ orderId: id })
      if (payment && payment.status === "completed") {
        // In a real app, we would process the refund through a payment gateway
        payment.status = "refunded"
        payment.refundAmount = payment.amount
        payment.refundReason = "Order cancelled"
        payment.updatedAt = Date.now()
        await payment.save()

        // Update order payment status
        order.paymentStatus = "refunded"
        order.refundAmount = order.total
        order.refundReason = "Order cancelled"
        await order.save()
      }
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    logger.error(`Update order status error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Assign delivery person to order
exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params
    const { deliveryPersonId } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user has permission to assign delivery person
    if (req.user.role !== "admin" && req.user.role !== "restaurant") {
      return res.status(403).json({ message: "Not authorized to assign delivery person" })
    }

    // Update order
    order.deliveryPersonId = deliveryPersonId
    order.updatedAt = Date.now()
    await order.save()

    // Notify delivery service about assignment
    try {
      await axios.post(
        `${process.env.DELIVERY_SERVICE_URL}/delivery/assignments`,
        { orderId: order._id, deliveryPersonId },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      )
    } catch (error) {
      logger.error(`Failed to notify delivery service: ${error.message}`)
      // Continue processing even if notification fails
    }

    res.status(200).json({
      message: "Delivery person assigned successfully",
      order,
    })
  } catch (error) {
    logger.error(`Assign delivery person error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update delivery ETA
exports.updateDeliveryETA = async (req, res) => {
  try {
    const { id } = req.params
    const { estimatedDeliveryTime } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user has permission to update ETA
    if (
      req.user.role !== "admin" &&
      req.user.role !== "restaurant" &&
      req.user.role !== "delivery" &&
      req.user.id !== order.deliveryPersonId?.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update delivery ETA" })
    }

    // Update order
    order.estimatedDeliveryTime = new Date(estimatedDeliveryTime)
    order.updatedAt = Date.now()
    await order.save()

    res.status(200).json({
      message: "Delivery ETA updated successfully",
      order,
    })
  } catch (error) {
    logger.error(`Update delivery ETA error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed", "preparing"]
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled in ${order.status} status`,
        cancellableStatuses,
      })
    }

    // Check if user has permission to cancel this order
    if (
      req.user.role !== "admin" &&
      req.user.id !== order.customerId.toString() &&
      req.user.id !== order.restaurantId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to cancel this order" })
    }

    // Update order status
    order.status = "cancelled"
    order.refundReason = reason || "Customer requested cancellation"
    order.updatedAt = Date.now()
    await order.save()

    // Process refund if payment was made
    const payment = await Payment.findOne({ orderId: id })
    if (payment && payment.status === "completed") {
      // In a real app, we would process the refund through a payment gateway
      payment.status = "refunded"
      payment.refundAmount = payment.amount
      payment.refundReason = order.refundReason
      payment.updatedAt = Date.now()
      await payment.save()

      // Update order payment status
      order.paymentStatus = "refunded"
      order.refundAmount = order.total
      await order.save()
    }

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    })
  } catch (error) {
    logger.error(`Cancel order error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get order statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this resource" })
    }

    // Get total orders
    const totalOrders = await Order.countDocuments()

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get total revenue
    const revenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ["delivered", "out_for_delivery"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ])

    // Get orders by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const ordersByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    res.status(200).json({
      totalOrders,
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count
        return acc
      }, {}),
      totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      ordersByDay,
    })
  } catch (error) {
    logger.error(`Get order statistics error: ${error.message}`)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get nearby orders (for delivery personnel)
exports.getNearbyOrders = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5 } = req.query;

    // Validate if user is a delivery person
    if (req.user.role !== "delivery" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only delivery personnel can access nearby orders" });
    }

    // Convert to numbers
    const lat = Number(latitude);
    const lng = Number(longitude);
    const distance = Number(maxDistance);

    // Find orders that are ready for pickup and waiting for delivery assignment
    const orders = await Order.find({
      status: "ready_for_pickup", // Only ready_for_pickup status
      deliveryPersonId: { $exists: false }, // No delivery person assigned yet
      "deliveryAddress.location": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [longitude, latitude]
          },
          $maxDistance: distance * 1000, // Convert km to meters
        },
      },
    })
    .select("_id customerId restaurantId items status subtotal tax deliveryFee tip total deliveryAddress estimatedDeliveryTime createdAt updatedAt")
    .sort({ createdAt: 1 }); // Oldest first

    // If we have restaurant IDs, we could enhance this by fetching restaurant details
    // For now, we'll return the basic order information
    
    res.status(200).json({
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    logger.error(`Get nearby orders error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Search orders with filters (admin only)
exports.searchOrders = async (req, res) => {
  try {
    const {
      customerId,
      restaurantId,
      deliveryPersonId,
      status,
      fromDate,
      toDate,
      minTotal,
      maxTotal,
      page = 1,
      limit = 10,
      sort = "createdAt:-1",
    } = req.query;

    // Build query
    const query = {};
    if (customerId) query.customerId = customerId;
    if (restaurantId) query.restaurantId = restaurantId;
    if (deliveryPersonId) query.deliveryPersonId = deliveryPersonId;
    if (status) query.status = status;

    // Date range
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // Price range
    if (minTotal || maxTotal) {
      query.total = {};
      if (minTotal) query.total.$gte = Number(minTotal);
      if (maxTotal) query.total.$lte = Number(maxTotal);
    }

    // Parse sort
    const [sortField, sortDirection] = sort.split(":");
    const sortOptions = { [sortField]: sortDirection === "-1" ? -1 : 1 };

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    // Get orders
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit));

    // Get total count
    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Search orders error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Accept order for delivery (for delivery personnel)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if user is a delivery person
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Only delivery personnel can accept orders" });
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the order is in ready_for_pickup status
    if (order.status !== "ready_for_pickup") {
      return res.status(400).json({ 
        message: `Order cannot be accepted in ${order.status} status, it must be in ready_for_pickup status`,
      });
    }
    
    // Check if order is already assigned to a delivery person
    if (order.deliveryPersonId) {
      return res.status(400).json({ message: "Order is already assigned to a delivery person" });
    }
    
    // Update order - assign to this delivery person and update status
    order.deliveryPersonId = req.user.id;
    order.status = "out_for_delivery";
    order.updatedAt = Date.now();
    await order.save();
    
    // Notify delivery service about the acceptance
    try {
      await axios.post(
        `${process.env.DELIVERY_SERVICE_URL}/delivery/assignments/accept`,
        { 
          orderId: order._id, 
          deliveryPersonId: req.user.id 
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      logger.error(`Failed to notify delivery service: ${error.message}`);
      // Continue processing even if notification fails
    }
    
    res.status(200).json({
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    logger.error(`Accept order error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all ready for pickup orders (for delivery personnel)
exports.getReadyForPickupOrders = async (req, res) => {
  try {
    // Validate if user is a delivery person
    if (req.user.role !== "delivery" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only delivery personnel can access ready for pickup orders" });
    }

    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    // Find all orders that are ready for pickup and don't have a delivery person assigned
    const query = {
      status: "ready_for_pickup",
      deliveryPersonId: { $exists: false } // No delivery person assigned yet
    };

    const orders = await Order.find(query)
      .select("_id customerId restaurantId items status subtotal tax deliveryFee tip total deliveryAddress estimatedDeliveryTime createdAt updatedAt")
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(Number.parseInt(limit));
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Get ready for pickup orders error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
