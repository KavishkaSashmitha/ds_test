const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

describe('MenuItem Model Tests', () => {
  let testRestaurantId;
  
  beforeEach(async () => {
    // Create a test restaurant for menu items
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
        email: 'test@restaurant.com'
      }
    };
    
    const restaurant = new Restaurant(restaurantData);
    const savedRestaurant = await restaurant.save();
    testRestaurantId = savedRestaurant._id;
  });
  
  describe('Schema Validation', () => {
    it('should create a valid menu item', async () => {
      const menuItemData = {
        restaurantId: testRestaurantId,
        name: 'Test Item',
        description: 'A test menu item',
        price: 9.99,
        category: 'Test Category',
        image: 'http://example.com/test-image.jpg',
        isAvailable: true
      };
      
      const menuItem = new MenuItem(menuItemData);
      const savedMenuItem = await menuItem.save();
      
      expect(savedMenuItem._id).toBeDefined();
      expect(savedMenuItem.name).toBe(menuItemData.name);
      expect(savedMenuItem.description).toBe(menuItemData.description);
      expect(savedMenuItem.price).toBe(menuItemData.price);
      expect(savedMenuItem.category).toBe(menuItemData.category);
      expect(savedMenuItem.image).toBe(menuItemData.image);
      expect(savedMenuItem.isAvailable).toBe(true);
    });
    
    it('should not create a menu item without required fields', async () => {
      const menuItemWithoutName = new MenuItem({
        restaurantId: testRestaurantId,
        description: 'A test menu item',
        price: 9.99,
        category: 'Test Category'
      });
      
      const menuItemWithoutPrice = new MenuItem({
        restaurantId: testRestaurantId,
        name: 'Test Item',
        description: 'A test menu item',
        category: 'Test Category'
      });
      
      const menuItemWithoutRestaurantId = new MenuItem({
        name: 'Test Item',
        description: 'A test menu item',
        price: 9.99,
        category: 'Test Category'
      });
      
      await expect(menuItemWithoutName.validate()).rejects.toThrow();
      await expect(menuItemWithoutPrice.validate()).rejects.toThrow();
      await expect(menuItemWithoutRestaurantId.validate()).rejects.toThrow();
    });
    
    it('should validate price is a positive number', async () => {
      const menuItemWithNegativePrice = new MenuItem({
        restaurantId: testRestaurantId,
        name: 'Test Item',
        description: 'A test menu item',
        price: -9.99,
        category: 'Test Category'
      });
      
      // This depends on whether the schema has a validator for positive numbers
      // If your schema doesn't validate this, remove or modify this test
      await expect(menuItemWithNegativePrice.validate()).rejects.toThrow();
    });
  });
  
  describe('Menu Item Options', () => {
    it('should create a menu item with options', async () => {
      const menuItemData = {
        restaurantId: testRestaurantId,
        name: 'Test Item with Options',
        description: 'A test menu item with customization options',
        price: 9.99,
        category: 'Test Category',
        options: [
          {
            name: 'Size',
            choices: [
              { name: 'Small', price: 0 },
              { name: 'Medium', price: 1.5 },
              { name: 'Large', price: 3 }
            ],
            required: true,
            multiSelect: false
          },
          {
            name: 'Toppings',
            choices: [
              { name: 'Cheese', price: 1 },
              { name: 'Pepperoni', price: 1.5 },
              { name: 'Mushrooms', price: 1 }
            ],
            required: false,
            multiSelect: true
          }
        ]
      };
      
      const menuItem = new MenuItem(menuItemData);
      const savedMenuItem = await menuItem.save();
      
      expect(savedMenuItem.options.length).toBe(2);
      expect(savedMenuItem.options[0].name).toBe('Size');
      expect(savedMenuItem.options[0].choices.length).toBe(3);
      expect(savedMenuItem.options[0].required).toBe(true);
      expect(savedMenuItem.options[0].multiSelect).toBe(false);
      
      expect(savedMenuItem.options[1].name).toBe('Toppings');
      expect(savedMenuItem.options[1].choices.length).toBe(3);
      expect(savedMenuItem.options[1].required).toBe(false);
      expect(savedMenuItem.options[1].multiSelect).toBe(true);
    });
  });
});
