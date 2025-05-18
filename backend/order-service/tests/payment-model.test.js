const mongoose = require('mongoose');
const Payment = require('../models/Payment');

describe('Payment Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid payment', async () => {
      const paymentData = {
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        amount: 33.97,
        method: 'credit_card',
        status: 'completed',
        transactionId: 'txn_123456789'
      };
      
      const payment = new Payment(paymentData);
      const savedPayment = await payment.save();
      
      expect(savedPayment._id).toBeDefined();
      expect(savedPayment.method).toBe('credit_card');
      expect(savedPayment.status).toBe('completed');
      expect(savedPayment.amount).toBe(33.97);
      expect(savedPayment.currency).toBe('USD'); // Default currency
    });
    
    it('should require orderId, customerId, amount, and method', async () => {
      const payment = new Payment({
        status: 'completed'
      });
      
      let validationError;
      try {
        await payment.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.orderId).toBeDefined();
      expect(validationError.errors.customerId).toBeDefined();
      expect(validationError.errors.amount).toBeDefined();
      expect(validationError.errors.method).toBeDefined();
    });
    
    it('should validate payment method is in the allowed enum values', async () => {
      const paymentData = {
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        amount: 33.97,
        method: 'invalid_method', // Invalid method
        status: 'completed'
      };
      
      const payment = new Payment(paymentData);
      
      let validationError;
      try {
        await payment.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.method).toBeDefined();
    });
    
    it('should validate payment status is in the allowed enum values', async () => {
      const paymentData = {
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        amount: 33.97,
        method: 'credit_card',
        status: 'invalid_status' // Invalid status
      };
      
      const payment = new Payment(paymentData);
      
      let validationError;
      try {
        await payment.validate();
      } catch (error) {
        validationError = error;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    });
    
    it('should set default status to pending and currency to USD', async () => {
      const paymentData = {
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        amount: 33.97,
        method: 'credit_card'
      };
      
      const payment = new Payment(paymentData);
      await payment.save();
      
      expect(payment.status).toBe('pending');
      expect(payment.currency).toBe('USD');
    });
  });
});
