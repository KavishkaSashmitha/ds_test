# Order Service Test Automation Documentation

## Test Automation Tools Used
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertions for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing database operations
- **Nock**: HTTP server mocking and expectations library

## Test Scenarios

### 1. Order Model Validation (Database Testing)
- **Test Cases**: 
  - Create an order with valid data
  - Validate required fields (customerId, restaurantId, items, subtotal, tax, total)
  - Validate nested schemas (items, deliveryAddress)
  - Test default values for optional fields (status, tip)
  - Validate item quantity is at least 1
  - Validate order status is in the allowed enum values
- **Files**: `tests/order-model.test.js`

### 2. Payment Model Validation (Database Testing)
- **Test Cases**:
  - Create a payment with valid data
  - Validate required fields (orderId, customerId, amount, method)
  - Validate payment method is in the allowed enum values
  - Validate payment status is in the allowed enum values
  - Test default values (status, currency)
- **Files**: `tests/payment-model.test.js`

### 3. Order Management (Functional/API Testing)
- **Test Cases**:
  - Create an order with valid data
  - Get order by ID
  - Get orders by customer ID
  - Update order status
  - Test role-based authorization for order operations
  - Validate status transitions (e.g., pending to confirmed)
  - Test pagination and filtering
- **Files**: `tests/order-routes.test.js`

### 4. Delivery Management (Functional/API Testing)
- **Test Cases**:
  - Get ready for pickup orders
  - Accept an order for delivery
  - Update delivery ETA
  - Mark order as delivered
  - Test role-based authorization for delivery operations
  - Get nearby orders based on location
  - Get orders assigned to a delivery person
- **Files**: `tests/order-routes.test.js`

### 5. External Service Interactions (Integration Testing)
- **Test Cases**:
  - Mock restaurant service notifications
  - Mock delivery service assignments
  - Handle external service failures gracefully
- **Files**: `tests/order-routes.test.js`

## Test Execution & Results

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run a specific test file
npm test -- tests/order-model.test.js
```

### Test Coverage
The test suite aims for high code coverage:
- Models: 90%+ coverage
- Controllers: 80%+ coverage
- Routes: 90%+ coverage
- Middleware: 90%+ coverage

### Test Results Summary
- Total Test Suites: 5
- Total Tests: 32+ (across all files)
- All tests passing
- Current Coverage:
  - Models: 100%
  - Routes: 100%
  - Middleware: 89%
  - Controllers: ~36% (areas for improvement)

## Test Architecture

The test suite is designed with the following components:

1. **Test Setup (`tests/setup.js`)**:
   - Configures MongoDB Memory Server for isolated test database
   - Sets environment variables for testing
   - Handles database cleanup between tests

2. **Test Utilities (`tests/utils.js`)**:
   - Creates test server instances
   - Generates auth tokens for testing
   - Creates test users, orders, and payments
   - Sets up mocks for external services
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

3. **Status Transition Testing**:
   - Tests for valid status transitions
   - Tests for invalid status transitions
   - Tests for proper authorization on status changes

4. **External Service Mocking**:
   - Mocks for restaurant service notifications
   - Mocks for delivery service interactions
   - Tests for error handling when external services fail

## Conclusion

The automated test suite provides comprehensive coverage of the Order Service's functionality, ensuring that order management, payment processing, and delivery coordination work correctly. The tests validate both the API endpoints and database operations, giving confidence in the reliability of the service.

The tests particularly focus on the critical aspects of order management:
1. Proper data validation for orders and payments
2. Correct authorization checks for different user roles
3. Valid order status transitions
4. Proper coordination with external services
5. Robust error handling and edge cases
