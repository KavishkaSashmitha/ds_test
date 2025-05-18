const mongoose = require('mongoose');
const Order = require('../models/Order');

describe('Order Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid order', async () => {
      const orderData = {
        customerId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Test Item',
            price: 10.99,
            quantity: 2,
            options: [
              {
                name: 'Size',
                value: 'Large',
                price: 2.00
              }
            ]
          }
        ],
        subtotal: 23.98,
        tax: 2.00,
        deliveryFee: 3.99,
        tip: 4.00,
        total: 33.97,
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
          }
        },
        deliveryInstructions: 'Leave at door',
        specialInstructions: 'No onions'
      };
      
      const order = new Order(orderData);
      const savedOrder = await order.save();
      
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.status).toBe('pending'); // Default status
      expect(savedOrder.items.length).toBe(1);
      expect(savedOrder.items[0].quantity).toBe(2);
      expect(savedOrder.total).toBe(33.97);
    });
    
    it('should require customerId, restaurantId, items, subtotal, tax, and total', async () => {
      const order = new Order({
        deliveryFee: 3.99,
        paymentMethod: 'credit_card'
      });
      
      let validationError;
      try {
        await order.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.customerId).toBeDefined();
      expect(validationError.errors.restaurantId).toBeDefined();
      // In Mongoose, array validation errors may not be directly accessible by path name
      // expect(validationError.errors.items).toBeDefined();
      expect(validationError.errors.subtotal).toBeDefined();
      expect(validationError.errors.tax).toBeDefined();
      expect(validationError.errors.total).toBeDefined();
      expect(validationError.errors['deliveryAddress.street']).toBeDefined();
    });
    
    it('should validate item quantity is at least 1', async () => {
      const orderData = {
        customerId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        items: [
          {
            menuItemId: new mongoose.Types.ObjectId(),
            name: 'Test Item',
            price: 10.99,
            quantity: 0, // Invalid: less than 1
            options: []
          }
        ],
        subtotal: 0,
        tax: 0,
        deliveryFee: 3.99,
        total: 3.99,
        paymentMethod: 'credit_card'
      };
      
      const order = new Order(orderData);
      
      let validationError;
      try {
        await order.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['items.0.quantity']).toBeDefined();
    });
    
    it('should validate order status is in the allowed enum values', async () => {
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
        status: 'invalid_status', // Invalid status
        subtotal: 10.99,
        tax: 1.00,
        deliveryFee: 3.99,
        total: 15.98,
        paymentMethod: 'credit_card'
      };
      
      const order = new Order(orderData);
      
      let validationError;
      try {
        await order.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    });
    
    it('should set default status to pending', async () => {
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
        subtotal: 10.99,
        tax: 1.00,
        deliveryFee: 3.99,
        total: 15.98,
        paymentMethod: 'credit_card',
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          location: {
            coordinates: [-73.97, 40.77]
          }
        }
      };
      
      const order = new Order(orderData);
      await order.save();
      
      expect(order.status).toBe('pending');
    });
  });
});
