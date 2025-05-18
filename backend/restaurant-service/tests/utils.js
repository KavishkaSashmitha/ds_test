const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const restaurantRoutes = require('../routes/restaurantRoutes');
const menuRoutes = require('../routes/menuRoutes');
const availabilityRoutes = require('../routes/availabilityRoutes');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Create a test server
const createTestServer = () => {
  const app = express();
  
  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menus', menuRoutes);
  app.use('/api/availability', availabilityRoutes);
  
  return app;
};

// Create a test JWT token for authentication
const generateAuthToken = (user) => {
  const payload = {
    id: user.id || user._id.toString(),
    email: user.email,
    role: user.role || 'customer'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test_jwt_secret', {
    expiresIn: '1d'
  });
};

// Create a test user object (for token generation, not stored in DB)
const createTestUser = (userData = {}) => {
  const defaultUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    role: 'restaurant'
  };
  
  return { ...defaultUser, ...userData };
};

// Create a test restaurant
const createTestRestaurant = async (restaurantData = {}) => {
  const testUser = createTestUser();
  
  const defaultRestaurant = {
    ownerId: testUser._id,
    name: 'Test Restaurant',
    description: 'A test restaurant',
    cuisine: 'Test Cuisine',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      location: {
        type: 'Point',
        coordinates: [-73.97, 40.77]  // Example: New York City
      }
    },
    contactInfo: {
      phone: '123-456-7890',
      email: 'test@restaurant.com',
      website: 'http://testrestaurant.com'
    },
    businessHours: [],
    isActive: true
  };
  
  const mergedData = { ...defaultRestaurant, ...restaurantData };
  const restaurant = new Restaurant(mergedData);
  await restaurant.save();
  
  return { restaurant, user: testUser };
};

// Create a test menu item
const createTestMenuItem = async (menuItemData = {}) => {
  const { restaurant } = await createTestRestaurant();
  
  const defaultMenuItem = {
    restaurantId: restaurant._id,
    name: 'Test Item',
    description: 'A test menu item',
    price: 9.99,
    category: 'Test Category',
    options: [],
    image: 'http://example.com/test-image.jpg',
    isAvailable: true
  };
  
  const mergedData = { ...defaultMenuItem, ...menuItemData };
  const menuItem = new MenuItem(mergedData);
  await menuItem.save();
  
  return { menuItem, restaurant };
};

module.exports = {
  createTestServer,
  generateAuthToken,
  createTestUser,
  createTestRestaurant,
  createTestMenuItem,
  request
};
