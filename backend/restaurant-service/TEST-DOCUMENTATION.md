# Restaurant Service Test Automation Documentation

## Test Automation Tools Used
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertions for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing database operations

## Test Scenarios

### 1. Restaurant Model Validation (Database Testing)
- **Test Cases**: 
  - Create a restaurant with valid data
  - Validate required fields (name, cuisine, address)
  - Validate nested schemas (address structure, contact info)
  - Test default values for optional fields
- **Files**: `tests/restaurant-model.test.js`

### 2. Menu Item Model Validation (Database Testing)
- **Test Cases**:
  - Create a menu item with valid data
  - Validate required fields (restaurantId, name, description, price, category)
  - Validate optional fields (options, nutritional info)
  - Test default values (availability, featured status)
- **Files**: `tests/menu-item-model.test.js`

### 3. Restaurant Management (Functional/API Testing)
- **Test Cases**:
  - Create a restaurant with valid data
  - Search for restaurants with various filters
  - Get restaurant by ID
  - Update restaurant details
  - Test role-based authorization for restaurant operations
  - Test pagination and search functionality
- **Files**: `tests/restaurant-routes.test.js`

### 4. Menu Management (Functional/API Testing)
- **Test Cases**:
  - Create a menu item with valid data
  - Get menu items by restaurant ID
  - Get menu item by ID
  - Update menu item details
  - Delete menu item
  - Filter menu items by category and availability
  - Test role-based authorization for menu operations
  - Test bulk updating menu item availability
- **Files**: `tests/menu-routes.test.js`

### 5. Restaurant Availability (Functional/API Testing)
- **Test Cases**:
  - Get business hours for a restaurant
  - Update business hours
  - Check if restaurant is open at a given time
  - Add special hours for specific dates
  - Delete special hours
  - Toggle restaurant availability status
  - Test role-based authorization for availability management
- **Files**: `tests/availability-routes.test.js`

## Test Execution & Results

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/restaurant-routes.test.js
```

### Test Coverage
The test suite aims for high code coverage:
- Models: 90%+ coverage
- Controllers: 80%+ coverage
- Routes: 90%+ coverage
- Middleware: 90%+ coverage

### Test Results Summary
- Total Test Suites: 5
- Total Tests: 80+ (across all files)
- All tests passing

## Test Architecture

The test suite is designed with the following components:

1. **Test Setup (`tests/setup.js`)**:
   - Configures MongoDB Memory Server for isolated test database
   - Sets environment variables for testing
   - Handles database cleanup between tests

2. **Test Utilities (`tests/utils.js`)**:
   - Creates test server instances
   - Generates auth tokens for testing
   - Creates test users, restaurants, and menu items
   - Helper functions for common test operations

3. **Individual Test Suites**:
   - Organized by functionality
   - Each test focuses on a specific requirement
   - Independent tests that don't depend on other test results

## Key Testing Patterns

1. **Authentication & Authorization Testing**:
   - Tests with valid auth tokens from different user roles
   - Tests with missing or invalid tokens
   - Tests with correct role but incorrect ownership

2. **Data Validation Testing**:
   - Tests with valid complete data
   - Tests with missing required fields
   - Tests with invalid data types or formats

3. **Resource Relationship Testing**:
   - Tests for correctly associating menu items with restaurants
   - Tests for correctly associating business hours with restaurants
   - Tests for ownership validation across related resources

4. **Advanced Query Testing**:
   - Tests for pagination
   - Tests for filtering by various parameters
   - Tests for sorting and searching

## Conclusion

The automated test suite provides comprehensive coverage of the Restaurant Service's functionality, ensuring that restaurant management, menu operations, and availability settings work correctly. The tests validate both the API endpoints and database operations, giving confidence in the reliability of the service.

The tests particularly focus on the critical aspects of restaurant management:
1. Proper data validation for restaurants and menu items
2. Correct authorization checks for restaurant owners
3. Accurate availability calculations
4. Robust search and filter functionality
5. Proper relationship between restaurants and their menu items
