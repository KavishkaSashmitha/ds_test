const express = require("express");
const { param, query } = require("express-validator");

const router = express.Router();

// In-memory mock data storage
const mockOrders = [
  {
    id: "order_12345",
    deliveryId: "delivery_12345",
    orderId: "order_12345",
    restaurantId: "restaurant_123",
    restaurantName: "Burger Palace",
    status: "ready_for_pickup",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
    items: [
      { name: "Cheeseburger", quantity: 2, price: 350 },
      { name: "French Fries", quantity: 1, price: 150 },
      { name: "Cola", quantity: 2, price: 100 }
    ],
    total: 1050,
    subtotal: 950,
    tax: 50,
    deliveryFee: 50,
    customerName: "John Doe",
    customerPhone: "+94771234567",
    deliveryAddress: {
      street: "123 Main St",
      city: "Colombo",
      state: "Western",
      zipCode: "10500",
      location: {
        type: "Point",
        coordinates: [79.861244, 6.927079] // Colombo coordinates
      }
    }
  },
  {
    id: "order_67890",
    deliveryId: "delivery_67890",
    orderId: "order_67890",
    restaurantId: "restaurant_456",
    restaurantName: "Pizza Heaven",
    status: "ready_for_pickup",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    items: [
      { name: "Large Pepperoni Pizza", quantity: 1, price: 1200 },
      { name: "Garlic Bread", quantity: 1, price: 400 },
      { name: "Iced Tea", quantity: 2, price: 150 }
    ],
    total: 1950,
    subtotal: 1750,
    tax: 100,
    deliveryFee: 100,
    customerName: "Jane Smith",
    customerPhone: "+94777654321",
    deliveryAddress: {
      street: "456 Park Avenue",
      city: "Kandy",
      state: "Central",
      zipCode: "20000",
      location: {
        type: "Point",
        coordinates: [80.636696, 7.291418] // Kandy coordinates
      }
    }
  },
  {
    id: "order_24680",
    deliveryId: "delivery_24680",
    orderId: "order_24680",
    restaurantId: "restaurant_789",
    restaurantName: "Curry House",
    status: "ready_for_pickup",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
    items: [
      { name: "Chicken Biryani", quantity: 2, price: 800 },
      { name: "Naan", quantity: 4, price: 100 },
      { name: "Mango Lassi", quantity: 2, price: 250 }
    ],
    total: 2300,
    subtotal: 2100,
    tax: 100,
    deliveryFee: 100,
    customerName: "Amal Perera",
    customerPhone: "+94761234567",
    deliveryAddress: {
      street: "789 Beach Road",
      city: "Galle",
      state: "Southern",
      zipCode: "80000",
      location: {
        type: "Point",
        coordinates: [80.217010, 6.033499] // Galle coordinates
      }
    }
  }
];

// Get all orders ready for pickup
router.get("/ready-for-pickup", (req, res) => {
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Filter orders with status "ready_for_pickup"
  const readyOrders = mockOrders.filter(order => order.status === "ready_for_pickup");

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedOrders = readyOrders.slice(startIndex, endIndex);

  res.status(200).json({
    orders: paginatedOrders,
    pagination: {
      total: readyOrders.length,
      page: page,
      limit: limit,
      pages: Math.ceil(readyOrders.length / limit)
    }
  });
});

// Accept an order for delivery
router.post("/:orderId/accept", (req, res) => {
  const { orderId } = req.params;
  
  // Find the order
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  // Update the order status
  mockOrders[orderIndex].status = "in_transit";
  
  res.status(200).json({
    message: "Order accepted for delivery",
    order: mockOrders[orderIndex]
  });
});

// Get order by ID
router.get("/:orderId", (req, res) => {
  const { orderId } = req.params;
  
  // Find the order
  const order = mockOrders.find(order => order.id === orderId);
  
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  res.status(200).json({
    order,
    payment: {
      id: `payment_${orderId.split('_')[1]}`,
      orderId: order.id,
      amount: order.total,
      status: "completed",
      method: "card",
      createdAt: order.createdAt
    }
  });
});

// Get nearby orders
router.get("/nearby", (req, res) => {
  const { latitude, longitude, maxDistance } = req.query;
  
  // In a real app, this would do a geospatial query
  // For mock purposes, just return all orders
  res.status(200).json(mockOrders);
});

module.exports = router;
