const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');

// Create a test server
const createTestServer = () => {
  const app = express();
  
  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  
  return app;
};

// Create a test JWT token for authentication
const generateAuthToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role || 'customer'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test_jwt_secret', {
    expiresIn: '1d'
  });
};

// Create a test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'customer'
  };
  
  const mergedData = { ...defaultUser, ...userData };
  const user = new User(mergedData);
  await user.save();
  
  return user;
};

module.exports = {
  createTestServer,
  generateAuthToken,
  createTestUser,
  request
};
