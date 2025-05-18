const jwt = require('jsonwebtoken');
const { createTestServer, createTestUser, generateAuthToken, request } = require('./utils');

const app = createTestServer();

describe('Auth Middleware Tests', () => {
  let testUser;
  let validToken;
  
  beforeEach(async () => {
    testUser = await createTestUser();
    validToken = generateAuthToken(testUser);
  });
  
  it('should allow access with a valid token', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });
  
  it('should deny access with no token', async () => {
    const response = await request(app)
      .get('/api/users/profile');
    
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authentication token is required/i);
  });
  
  it('should deny access with an expired token', async () => {
    // Create an expired token (backdate by 2 days)
    const payload = {
      id: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    };
    
    const expiredToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test_jwt_secret',
      { expiresIn: '-2d' }
    );
    
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/invalid or expired token/i);
  });
  
  it('should deny access with a malformed token', async () => {
    const malformedToken = 'not.a.valid.token';
    
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${malformedToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/invalid or expired token/i);
  });
  
  it('should allow access with different roles', async () => {
    const roles = ['customer', 'restaurant', 'delivery', 'admin'];
    
    for (const role of roles) {
      const roleUser = await createTestUser({ role });
      const roleToken = generateAuthToken(roleUser);
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${roleToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe(role);
    }
  });
});
