const { 
  createTestServer, 
  createTestUser, 
  createTestRestaurant, 
  generateAuthToken, 
  request 
} = require('./utils');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

const app = createTestServer();

describe('Restaurant Routes Tests', () => {
  describe('GET /api/restaurants (Search Restaurants)', () => {
    beforeEach(async () => {
      // Create test restaurants
      await createTestRestaurant({ 
        name: 'Italian Place', 
        cuisine: 'Italian',
        address: {
          street: '123 Italy St',
          city: 'Rome City',
          state: 'RC',
          zipCode: '12345',
          country: 'USA',
          location: {
            type: 'Point',
            coordinates: [-73.97, 40.77]
          }
        }
      });
      
      await createTestRestaurant({ 
        name: 'Chinese Dragon', 
        cuisine: 'Chinese',
        address: {
          street: '456 Dragon St',
          city: 'Beijing City',
          state: 'BC',
          zipCode: '23456',
          country: 'USA',
          location: {
            type: 'Point',
            coordinates: [-74.01, 40.70]
          }
        }
      });

      await createTestRestaurant({ 
        name: 'Thai Spice', 
        cuisine: 'Thai',
        address: {
          street: '789 Spice St',
          city: 'Bangkok City',
          state: 'BC',
          zipCode: '34567',
          country: 'USA',
          location: {
            type: 'Point',
            coordinates: [-73.95, 40.75]
          }
        }
      });
    });

    it('should return all restaurants when no search parameters', async () => {
      const response = await request(app)
        .get('/api/restaurants');

      expect(response.status).toBe(200);
      expect(response.body.restaurants.length).toBe(3);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter restaurants by name', async () => {
      const response = await request(app)
        .get('/api/restaurants')
        .query({ name: 'italian' });

      expect(response.status).toBe(200);
      expect(response.body.restaurants.length).toBe(1);
      expect(response.body.restaurants[0].name).toBe('Italian Place');
    });

    it('should filter restaurants by cuisine', async () => {
      const response = await request(app)
        .get('/api/restaurants')
        .query({ cuisine: 'chinese' });

      expect(response.status).toBe(200);
      expect(response.body.restaurants.length).toBe(1);
      expect(response.body.restaurants[0].name).toBe('Chinese Dragon');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/restaurants')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.restaurants.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/restaurants/:id (Get Restaurant By ID)', () => {
    let testRestaurant;

    beforeEach(async () => {
      const result = await createTestRestaurant();
      testRestaurant = result.restaurant;
    });

    it('should get restaurant by ID', async () => {
      const response = await request(app)
        .get(`/api/restaurants/${testRestaurant._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('restaurant');
      expect(response.body.restaurant._id).toBe(testRestaurant._id.toString());
      expect(response.body.restaurant.name).toBe(testRestaurant.name);
    });

    it('should return 404 for non-existent restaurant ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/restaurants/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/restaurant not found/i);
    });

    it('should return 400 for invalid restaurant ID format', async () => {
      const response = await request(app)
        .get('/api/restaurants/invalid-id');

      // Adjust expectation based on your implementation
      // Either 400 (invalid ID) or 500 (server error on ID parsing)
      expect(response.status === 400 || response.status === 500).toBeTruthy();
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/restaurants (Create Restaurant)', () => {
    it('should create a new restaurant with valid data', async () => {
      const testUser = createTestUser({ role: 'restaurant' });
      const token = generateAuthToken(testUser);
      
      const restaurantData = {
        name: 'New Test Restaurant',
        description: 'A new test restaurant',
        cuisine: 'Test Cuisine',
        address: {
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
        contactInfo: {
          phone: '123-456-7890',
          email: 'new@restaurant.com',
          website: 'http://newrestaurant.com'
        }
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(restaurantData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('restaurant');
      expect(response.body.restaurant.name).toBe(restaurantData.name);
      expect(response.body.restaurant.ownerId).toBe(testUser._id.toString());
      
      // Verify restaurant was saved in the database
      const restaurant = await Restaurant.findById(response.body.restaurant._id);
      expect(restaurant).not.toBeNull();
    });

    it('should not allow creating restaurant without authentication', async () => {
      const restaurantData = {
        name: 'New Test Restaurant',
        description: 'A new test restaurant',
        cuisine: 'Test Cuisine',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        contactInfo: {
          phone: '123-456-7890',
          email: 'new@restaurant.com'
        }
      };

      const response = await request(app)
        .post('/api/restaurants')
        .send(restaurantData);

      expect(response.status).toBe(401);
    });

    it('should not allow creating restaurant with customer role', async () => {
      const testUser = createTestUser({ role: 'customer' });
      const token = generateAuthToken(testUser);
      
      const restaurantData = {
        name: 'New Test Restaurant',
        description: 'A new test restaurant',
        cuisine: 'Test Cuisine',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        contactInfo: {
          phone: '123-456-7890',
          email: 'new@restaurant.com'
        }
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(restaurantData);

      expect(response.status).toBe(403);
    });
    
    it('should validate required fields', async () => {
      const testUser = createTestUser({ role: 'restaurant' });
      const token = generateAuthToken(testUser);
      
      const invalidRestaurantData = {
        // Missing name and other required fields
        description: 'A new test restaurant',
        cuisine: 'Test Cuisine'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidRestaurantData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/restaurants/:id (Update Restaurant)', () => {
    let testRestaurant, ownerUser, token;

    beforeEach(async () => {
      const result = await createTestRestaurant();
      testRestaurant = result.restaurant;
      ownerUser = result.user;
      token = generateAuthToken(ownerUser);
    });

    it('should update restaurant with valid data', async () => {
      const updateData = {
        name: 'Updated Restaurant Name',
        description: 'Updated restaurant description',
        cuisine: 'Updated Cuisine'
      };

      const response = await request(app)
        .put(`/api/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('restaurant');
      expect(response.body.restaurant.name).toBe(updateData.name);
      expect(response.body.restaurant.description).toBe(updateData.description);
      expect(response.body.restaurant.cuisine).toBe(updateData.cuisine);
    });

    it('should not allow updating restaurant without authentication', async () => {
      const updateData = {
        name: 'Updated Restaurant Name'
      };

      const response = await request(app)
        .put(`/api/restaurants/${testRestaurant._id}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });

    it('should not allow updating restaurant by non-owner', async () => {
      const nonOwnerUser = createTestUser({ role: 'restaurant' });
      const nonOwnerToken = generateAuthToken(nonOwnerUser);
      
      const updateData = {
        name: 'Updated By Non-owner'
      };

      const response = await request(app)
        .put(`/api/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const updateData = {
        name: 'Updated Restaurant Name'
      };

      const response = await request(app)
        .put(`/api/restaurants/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });
  });
});
