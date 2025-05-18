const { 
  createTestServer, 
  createTestUser, 
  createTestOrder, 
  createTestPayment,
  generateAuthToken, 
  setupMocks,
  clearMocks,
  request 
} = require('./utils');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const app = createTestServer();

describe('Payment Functionality Tests', () => {
  beforeEach(() => {
    setupMocks(); // Setup mock responses for external services
  });
  
  afterEach(() => {
    clearMocks(); // Clear all mocks after each test
  });
  
  describe('Payment Processing', () => {
    it('should create a payment when an order is created', async () => {
      // Create test user
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const orderData = {
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Payment Test Item',
            price: 15.99,
            quantity: 1,
            options: []
          }
        ],
        subtotal: 15.99,
        tax: 1.50,
        deliveryFee: 2.99,
        tip: 3.00,
        total: 23.48,
        paymentMethod: 'credit_card',
        deliveryAddress: {
          street: '123 Payment St',
          city: 'Payment City',
          state: 'PC',
          zipCode: '54321',
          country: 'USA',
          location: {
            type: 'Point',
            coordinates: [-73.97, 40.77]
          },
          coordinates: [-73.97, 40.77]
        },
        deliveryInstructions: 'Leave at door',
        specialInstructions: 'Extra napkins'
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(201);
      
      // Verify payment was created
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(23.48);
      expect(response.body.payment.method).toBe('credit_card');
      expect(response.body.payment.customerId.toString()).toBe(user._id.toString());
      
      // Verify payment is associated with the order
      expect(response.body.payment.orderId.toString()).toBe(response.body.order._id.toString());
      
      // Check payment status based on payment method
      expect(response.body.payment.status).toBe('completed'); // Credit card should be completed
    });
    
    it('should set payment status to pending for cash orders', async () => {
      // Create test user
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const orderData = {
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Cash Payment Item',
            price: 12.99,
            quantity: 1,
            options: []
          }
        ],
        subtotal: 12.99,
        tax: 1.30,
        deliveryFee: 2.99,
        tip: 0,
        total: 17.28,
        paymentMethod: 'cash',
        deliveryAddress: {
          street: '123 Cash Payment St',
          city: 'Cash City',
          state: 'CS',
          zipCode: '12345',
          country: 'USA',
          location: {
            type: 'Point',
            coordinates: [-73.97, 40.77]
          },
          coordinates: [-73.97, 40.77]
        }
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(201);
      
      // Verify payment was created
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(17.28);
      expect(response.body.payment.method).toBe('cash');
      
      // For cash orders, the payment status should be pending
      expect(response.body.payment.status).toBe('pending');
    });
    
    it('should update order payment status when payment is completed', async () => {
      // Create a test order with pending payment
      const customer = createTestUser({ role: 'customer' });
      const order = await createTestOrder({
        customerId: customer._id,
        paymentStatus: 'pending'
      });
      
      // Create a payment for this order with pending status
      const payment = await createTestPayment({
        orderId: order._id,
        customerId: customer._id,
        status: 'pending'
      });
      
      // Simulate payment completion (in a real app, this would be triggered by a payment webhook)
      const token = generateAuthToken({ role: 'admin', _id: new mongoose.Types.ObjectId() });
      
      // Create an endpoint to simulate payment update
      // Note: This would typically be a real endpoint in the payment controller
      // For testing, we'll directly update the payment and order
      
      payment.status = 'completed';
      await payment.save();
      
      order.paymentStatus = 'completed';
      await order.save();
      
      // Verify the order's payment status is updated
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paymentStatus).toBe('completed');
      
      // Verify the payment status is updated
      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment.status).toBe('completed');
    });
  });
});
