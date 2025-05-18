const express = require('express');
const { createTestUser, generateAuthToken, request } = require('./utils');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create a test server with role-specific endpoints
const createRoleTestServer = () => {
  const app = express();
  
  // Apply middleware
  app.use(express.json());
  
  // Protected routes with role authorization
  app.get('/customer-only', 
    authenticateToken, 
    authorizeRoles('customer'), 
    (req, res) => res.json({ message: 'Customer access granted' })
  );
  
  app.get('/restaurant-only', 
    authenticateToken, 
    authorizeRoles('restaurant'), 
    (req, res) => res.json({ message: 'Restaurant access granted' })
  );
  
  app.get('/delivery-only', 
    authenticateToken, 
    authorizeRoles('delivery'), 
    (req, res) => res.json({ message: 'Delivery access granted' })
  );
  
  app.get('/admin-only', 
    authenticateToken, 
    authorizeRoles('admin'), 
    (req, res) => res.json({ message: 'Admin access granted' })
  );
  
  app.get('/multi-role', 
    authenticateToken, 
    authorizeRoles('customer', 'admin'), 
    (req, res) => res.json({ message: 'Multi-role access granted' })
  );
  
  return app;
};

describe('Role Authorization Middleware Tests', () => {
  const app = createRoleTestServer();
  
  describe('Single role authorization', () => {
    it('should grant access to customer role for customer endpoints', async () => {
      const user = await createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/customer-only')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Customer access granted');
    });
    
    it('should deny access to customer role for admin endpoints', async () => {
      const user = await createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/not authorized/i);
    });
    
    it('should grant access to restaurant role for restaurant endpoints', async () => {
      const user = await createTestUser({ role: 'restaurant' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/restaurant-only')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Restaurant access granted');
    });
    
    it('should grant access to delivery role for delivery endpoints', async () => {
      const user = await createTestUser({ role: 'delivery' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/delivery-only')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Delivery access granted');
    });
    
    it('should grant access to admin role for admin endpoints', async () => {
      const user = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin access granted');
    });
  });
  
  describe('Multi-role authorization', () => {
    it('should grant access to customer role for multi-role endpoints', async () => {
      const user = await createTestUser({ role: 'customer' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Multi-role access granted');
    });
    
    it('should grant access to admin role for multi-role endpoints', async () => {
      const user = await createTestUser({ role: 'admin' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Multi-role access granted');
    });
    
    it('should deny access to restaurant role for multi-role endpoints', async () => {
      const user = await createTestUser({ role: 'restaurant' });
      const token = generateAuthToken(user);
      
      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/not authorized/i);
    });
  });
});
