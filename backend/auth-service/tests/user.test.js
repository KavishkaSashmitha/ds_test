const { createTestServer, createTestUser, generateAuthToken, request } = require('./utils');
const User = require('../models/User');

const app = createTestServer();

describe('User Controller Tests', () => {
  let testUser;
  let token;

  beforeEach(async () => {
    // Create a test user and get token for each test
    testUser = await createTestUser();
    token = generateAuthToken(testUser);
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user._id).toBe(testUser._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
      // Password should not be returned
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/authentication token is required/i);
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/invalid or expired token/i);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '123-456-7890'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.phone).toBe(updateData.phone);

      // Verify changes in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    it('should not update with invalid data', async () => {
      const invalidData = {
        name: '',
        profileImage: 'not-a-url'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password with valid current password', async () => {
      const originalPassword = 'password123';
      const newPassword = 'newpassword456';
      
      // Create user with known password
      const user = await createTestUser({ password: originalPassword });
      const userToken = generateAuthToken(user);

      const passwordData = {
        currentPassword: originalPassword,
        newPassword: newPassword
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/password changed successfully/i);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should not change password with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/current password is incorrect/i);
    });

    it('should not change password with invalid new password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'short'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/users/addresses', () => {
    it('should add a new address to user profile', async () => {
      const addressData = {
        name: 'Home',
        address: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zipCode: '12345',
        isDefault: true
      };

      const response = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('addresses');
      
      // Check if address was added
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.addresses.length).toBeGreaterThan(0);
      
      const addedAddress = updatedUser.addresses[0];
      expect(addedAddress.name).toBe(addressData.name);
      expect(addedAddress.address).toBe(addressData.address);
      expect(addedAddress.city).toBe(addressData.city);
    });

    it('should not add address with invalid data', async () => {
      const invalidAddressData = {
        name: 'Home',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAddressData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/users/addresses/:addressId', () => {
    it('should delete an existing address', async () => {
      // First add an address
      const addressData = {
        name: 'Home',
        address: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zipCode: '12345'
      };

      // Add address directly to the user in database
      const user = await User.findById(testUser._id);
      user.addresses.push(addressData);
      await user.save();
      
      const addressId = user.addresses[0]._id.toString();

      // Now delete the address
      const deleteResponse = await request(app)
        .delete(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message');
      expect(deleteResponse.body.message).toMatch(/address deleted successfully/i);

      // Verify address was removed
      const updatedUser = await User.findById(testUser._id);
      const addressExists = updatedUser.addresses.some(addr => addr._id.toString() === addressId);
      expect(addressExists).toBe(false);
    });

    it('should return 404 for non-existent address', async () => {
      const nonExistentId = '60a5d5c0c8a48b1234567890'; // Valid ObjectId that doesn't exist

      const response = await request(app)
        .delete(`/api/users/addresses/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/address not found/i);
    });
  });
});
