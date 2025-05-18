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

describe('Order Routes Tests', () => {
  beforeEach(() => {
    setupMocks(); // Setup mock responses for external services
  });
  
  afterEach(() => {
    clearMocks(); // Clear all mocks after each test
  });
  
  describe('POST /api/orders (Create Order)', () => {
    it('should create a new order successfully', async () => {
      // Create test user
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const orderData = {
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Test Item',
            price: 10.99,
            quantity: 2,
            options: []
          }
        ],
        subtotal: 21.98,
        tax: 2.00,
        deliveryFee: 2.99,
        tip: 3.00,
        total: 29.97,
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
          coordinates: [-73.97, 40.77] // Required for validation in the route
        },
        deliveryInstructions: 'Leave at door',
        specialInstructions: 'Extra napkins'
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(201);
      
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.order).toBeDefined();
      expect(response.body.payment).toBeDefined();
      expect(response.body.order.customerId.toString()).toBe(user._id.toString());
      expect(response.body.order.status).toBe('pending');
      expect(response.body.payment.method).toBe('credit_card');
      
      // Verify order was actually saved in the database
      const savedOrder = await Order.findById(response.body.order._id);
      expect(savedOrder).toBeDefined();
      expect(savedOrder.total).toBe(29.97);
      
      // Verify payment was created
      const savedPayment = await Payment.findById(response.body.payment._id);
      expect(savedPayment).toBeDefined();
      expect(savedPayment.amount).toBe(29.97);
    });
    
    it('should return validation error when required fields are missing', async () => {
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const incompleteOrderData = {
        // Missing required fields
        restaurantId: new mongoose.Types.ObjectId(),
        items: [] // Empty items array
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteOrderData)
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });
    
    it('should require authentication', async () => {
      const orderData = {
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Test Item',
            price: 10.99,
            quantity: 1
          }
        ],
        subtotal: 10.99,
        tax: 1.00,
        deliveryFee: 2.99,
        total: 14.98,
        paymentMethod: 'credit_card'
      };
      
      await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401); // Unauthorized
    });
  });
  
  describe('GET /api/orders/:id (Get Order by ID)', () => {
    it('should get an order by ID for the customer who placed it', async () => {
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const order = await createTestOrder({ customerId: user._id });
      const payment = await createTestPayment({ orderId: order._id, customerId: user._id });
      
      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.order).toBeDefined();
      expect(response.body.payment).toBeDefined();
      expect(response.body.order._id.toString()).toBe(order._id.toString());
    });
    
    it('should not allow a customer to view another customer\'s order', async () => {
      const customer1 = createTestUser({ role: 'customer', _id: new mongoose.Types.ObjectId() });
      const customer2 = createTestUser({ role: 'customer', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(customer2);
      
      const order = await createTestOrder({ customerId: customer1._id });
      
      await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403); // Forbidden
    });
    
    it('should allow a restaurant to view orders for their restaurant', async () => {
      const restaurant = createTestUser({ role: 'restaurant', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(restaurant);
      
      const order = await createTestOrder({ 
        restaurantId: restaurant._id, 
        customerId: new mongoose.Types.ObjectId() 
      });
      const payment = await createTestPayment({ orderId: order._id, customerId: order.customerId });
      
      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.order).toBeDefined();
      expect(response.body.order._id.toString()).toBe(order._id.toString());
    });
    
    it('should return 404 for non-existent order', async () => {
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
  
  describe('GET /api/orders/customer/:customerId (Get Orders by Customer)', () => {
    it('should get orders for the current customer', async () => {
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      // Create a few orders for this customer
      await createTestOrder({ customerId: user._id });
      await createTestOrder({ customerId: user._id });
      await createTestOrder({ customerId: user._id });
      
      const response = await request(app)
        .get(`/api/orders/customer/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
    });
    
    it('should not allow a customer to view another customer\'s orders', async () => {
      const customer1 = createTestUser({ role: 'customer', _id: new mongoose.Types.ObjectId() });
      const customer2 = createTestUser({ role: 'customer', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(customer2);
      
      await createTestOrder({ customerId: customer1._id });
      
      await request(app)
        .get(`/api/orders/customer/${customer1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403); // Forbidden
    });
    
    it('should allow filtering orders by status', async () => {
      const user = createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      // Create orders with different statuses
      await createTestOrder({ customerId: user._id, status: 'pending' });
      await createTestOrder({ customerId: user._id, status: 'confirmed' });
      await createTestOrder({ customerId: user._id, status: 'delivered' });
      
      const response = await request(app)
        .get(`/api/orders/customer/${user._id}?status=delivered`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBe(1);
      expect(response.body.orders[0].status).toBe('delivered');
    });
  });
  
  describe('PATCH /api/orders/:id/status (Update Order Status)', () => {
    it('should update order status to confirmed', async () => {
      const restaurant = createTestUser({ role: 'restaurant', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(restaurant);
      
      const order = await createTestOrder({ 
        restaurantId: restaurant._id, 
        status: 'pending' 
      });
      
      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' })
        .expect(200);
      
      expect(response.body.message).toBe('Order status updated successfully');
      expect(response.body.order.status).toBe('confirmed');
      
      // Verify order was updated in the database
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe('confirmed');
    });
    
    it('should not allow invalid status transitions', async () => {
      const restaurant = createTestUser({ role: 'restaurant', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(restaurant);
      
      const order = await createTestOrder({ 
        restaurantId: restaurant._id, 
        status: 'pending' 
      });
      
      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'delivered' }) // Cannot jump from pending to delivered
        .expect(400);
      
      expect(response.body.message).toContain('Invalid status transition');
    });
    
    it('should not allow unauthorized users to update status', async () => {
      const restaurant1 = createTestUser({ role: 'restaurant', _id: new mongoose.Types.ObjectId() });
      const restaurant2 = createTestUser({ role: 'restaurant', _id: new mongoose.Types.ObjectId() });
      const token = generateAuthToken(restaurant2);
      
      const order = await createTestOrder({ 
        restaurantId: restaurant1._id, 
        status: 'pending' 
      });
      
      await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' })
        .expect(403); // Forbidden
    });
  });
  
  describe('GET /api/orders/ready-for-pickup (Get Ready for Pickup Orders)', () => {
    it('should get orders that are ready for pickup', async () => {
      const deliveryPerson = createTestUser({ role: 'delivery' });
      const token = generateAuthToken(deliveryPerson);
      
      // Create some orders ready for pickup
      await createTestOrder({ status: 'ready_for_pickup' });
      await createTestOrder({ status: 'ready_for_pickup' });
      await createTestOrder({ status: 'confirmed' }); // Not ready for pickup
      
      const response = await request(app)
        .get('/api/orders/ready-for-pickup')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBe(2);
      expect(response.body.orders[0].status).toBe('ready_for_pickup');
    });
    
    it('should not allow non-delivery users to access ready for pickup orders', async () => {
      const customer = createTestUser({ role: 'customer' });
      const token = generateAuthToken(customer);
      
      await request(app)
        .get('/api/orders/ready-for-pickup')
        .set('Authorization', `Bearer ${token}`)
        .expect(403); // Forbidden
    });
  });
  
  describe('POST /api/orders/:id/accept (Accept Order for Delivery)', () => {
    it('should allow a delivery person to accept an order', async () => {
      const deliveryPerson = createTestUser({ role: 'delivery' });
      const token = generateAuthToken(deliveryPerson);
      
      const order = await createTestOrder({ status: 'ready_for_pickup' });
      
      const response = await request(app)
        .post(`/api/orders/${order._id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Order accepted successfully');
      expect(response.body.order.status).toBe('out_for_delivery');
      expect(response.body.order.deliveryPersonId.toString()).toBe(deliveryPerson._id.toString());
      
      // Verify order was updated in the database
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe('out_for_delivery');
      expect(updatedOrder.deliveryPersonId.toString()).toBe(deliveryPerson._id.toString());
    });
    
    it('should not allow accepting an order that is not ready for pickup', async () => {
      const deliveryPerson = createTestUser({ role: 'delivery' });
      const token = generateAuthToken(deliveryPerson);
      
      const order = await createTestOrder({ status: 'confirmed' });
      
      await request(app)
        .post(`/api/orders/${order._id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
    
    it('should not allow non-delivery users to accept orders', async () => {
      const customer = createTestUser({ role: 'customer' });
      const token = generateAuthToken(customer);
      
      const order = await createTestOrder({ status: 'ready_for_pickup' });
      
      await request(app)
        .post(`/api/orders/${order._id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403); // Forbidden
    });
  });
});
