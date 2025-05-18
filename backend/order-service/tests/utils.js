const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const orderRoutes = require('../routes/orderRoutes');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const nock = require('nock');

// Create a test server
const createTestServer = () => {
  const app = express();
  
  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/orders', orderRoutes);
  
  return app;
};

// Create a test JWT token for authentication
const generateAuthToken = (user) => {
  const payload = {
    id: user.id || user._id.toString(),
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Create a test user
const createTestUser = (overrides = {}) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    role: 'customer',
    ...overrides
  };
};

// Create a test order
const createTestOrder = async (overrides = {}) => {
  const orderData = {
    customerId: new mongoose.Types.ObjectId(),
    restaurantId: new mongoose.Types.ObjectId(),
    items: [
      {
        menuItemId: new mongoose.Types.ObjectId(),
        name: 'Test Item',
        price: 10.99,
        quantity: 1,
        options: []
      }
    ],
    status: 'pending',
    subtotal: 10.99,
    tax: 1.00,
    deliveryFee: 2.99,
    tip: 2.00,
    total: 16.98,
    paymentMethod: 'credit_card',
    deliveryAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      location: {
        type: 'Point',
        coordinates: [-73.97, 40.77]
      },
      coordinates: [-73.97, 40.77] // Add coordinates field for validation
    },
    ...overrides
  };
  
  const order = new Order(orderData);
  await order.save();
  return order;
};

// Create a test payment
const createTestPayment = async (overrides = {}) => {
  const paymentData = {
    orderId: new mongoose.Types.ObjectId(),
    customerId: new mongoose.Types.ObjectId(),
    amount: 16.98,
    method: 'credit_card',
    status: 'completed',
    ...overrides
  };
  
  const payment = new Payment(paymentData);
  await payment.save();
  return payment;
};

// Setup mock for external services
const setupMocks = () => {
  // Mock Restaurant Service
  nock(process.env.RESTAURANT_SERVICE_URL)
    .post(/\/restaurants\/.*\/orders\/notify/)
    .reply(200, { success: true });
  
  // Mock Delivery Service
  nock(process.env.DELIVERY_SERVICE_URL)
    .post(/\/delivery\/assignments/)
    .reply(200, { success: true });
};

// Clear all mocks
const clearMocks = () => {
  nock.cleanAll();
};

module.exports = {
  createTestServer,
  generateAuthToken,
  createTestUser,
  createTestOrder,
  createTestPayment,
  setupMocks,
  clearMocks,
  request
};
