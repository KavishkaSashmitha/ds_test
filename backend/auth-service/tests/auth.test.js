const { createTestServer, request } = require('./utils');
const User = require('../models/User');

const app = createTestServer();

describe('Auth Controller Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'test customer',
        email: 'testcustomer@example.com',
        password: 'testtest',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      
      // Password should not be returned
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify user is in the database
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
    });

    it('should not register a user with an existing email', async () => {
      const userData = {
        name: 'John Doe 2',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'customer'
      };

      // First create a user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create another user with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/user already exists with this email/i);
    });

    it('should not register a user with invalid data', async () => {
      const invalidUserData = {
        name: '',
        email: 'not-an-email',
        password: 'pass',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should register different user roles', async () => {
      const roles = ['customer', 'restaurant', 'delivery', 'admin'];
      
      for (const role of roles) {
        const userData = {
          name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          email: `${role}${Date.now()}@example.com`,
          password: 'password123',
          role
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.user.role).toBe(role);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      name: 'test customer',
      email: 'testcustomer@example.com',
      password: 'testtest',
      role: 'customer'
    };

    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not login with an invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/invalid email or password/i);
    });

    it('should not login with an invalid password', async () => {
      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/invalid email or password/i);
    });
  });
});
