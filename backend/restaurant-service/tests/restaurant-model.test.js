const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

describe('Restaurant Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid restaurant', async () => {
      const restaurantData = {
        ownerId: new mongoose.Types.ObjectId(),
        name: 'Test Restaurant',
        description: 'A test restaurant',
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
          email: 'test@restaurant.com',
          website: 'http://testrestaurant.com'
        },
        isActive: true
      };
      
      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();
      
      expect(savedRestaurant._id).toBeDefined();
      expect(savedRestaurant.name).toBe(restaurantData.name);
      expect(savedRestaurant.description).toBe(restaurantData.description);
      expect(savedRestaurant.cuisine).toBe(restaurantData.cuisine);
      expect(savedRestaurant.address.street).toBe(restaurantData.address.street);
      expect(savedRestaurant.address.city).toBe(restaurantData.address.city);
      expect(savedRestaurant.contactInfo.phone).toBe(restaurantData.contactInfo.phone);
      expect(savedRestaurant.contactInfo.email).toBe(restaurantData.contactInfo.email);
      expect(savedRestaurant.isActive).toBe(true);
    });
    
    it('should not create a restaurant without required fields', async () => {
      const restaurantWithoutName = new Restaurant({
        ownerId: new mongoose.Types.ObjectId(),
        description: 'A test restaurant',
        cuisine: 'Test Cuisine',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        contactInfo: {
          phone: '123-456-7890',
          email: 'test@restaurant.com'
        }
      });
      
      const restaurantWithoutOwnerId = new Restaurant({
        name: 'Test Restaurant',
        description: 'A test restaurant',
        cuisine: 'Test Cuisine',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        contactInfo: {
          phone: '123-456-7890',
          email: 'test@restaurant.com'
        }
      });
      
      await expect(restaurantWithoutName.validate()).rejects.toThrow();
      await expect(restaurantWithoutOwnerId.validate()).rejects.toThrow();
    });
    
    it('should not create a restaurant with invalid address', async () => {
      const restaurantWithInvalidAddress = new Restaurant({
        ownerId: new mongoose.Types.ObjectId(),
        name: 'Test Restaurant',
        description: 'A test restaurant',
        cuisine: 'Test Cuisine',
        address: {
          // Missing required fields
          street: '123 Test St'
        },
        contactInfo: {
          phone: '123-456-7890',
          email: 'test@restaurant.com'
        }
      });
      
      await expect(restaurantWithInvalidAddress.validate()).rejects.toThrow();
    });
  });
  
  describe('Geospatial Queries', () => {
    it('should properly store geolocation data', async () => {
      const restaurantData = {
        ownerId: new mongoose.Types.ObjectId(),
        name: 'Geo Test Restaurant',
        description: 'A test restaurant with geolocation',
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
          email: 'test@restaurant.com'
        }
      };
      
      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();
      
      expect(savedRestaurant.address.location.type).toBe('Point');
      expect(savedRestaurant.address.location.coordinates).toEqual([-73.97, 40.77]);
    });
  });
});
