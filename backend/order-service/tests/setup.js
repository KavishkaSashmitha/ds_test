const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mongoServer;

// Set test environment variables
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';
process.env.RESTAURANT_SERVICE_URL = 'http://mock-restaurant-service';
process.env.DELIVERY_SERVICE_URL = 'http://mock-delivery-service';

// Connect to the in-memory database before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {});
  console.log('Connected to in-memory MongoDB instance');
});

// Clear all data between tests to ensure test independence
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Disconnect and stop MongoDB instance after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log('Disconnected from in-memory MongoDB instance');
});

// Global test timeout - increase if needed
jest.setTimeout(30000);
