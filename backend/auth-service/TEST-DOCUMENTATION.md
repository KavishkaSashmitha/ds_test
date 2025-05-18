# Auth Service Test Automation Documentation

## Test Automation Tools Used
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertions for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing database operations

## Test Scenarios

### 1. User Authentication & Registration (Functional/API Testing)
- **Test Cases**: 
  - Register a new user with valid data
  - Prevent registration with existing email
  - Prevent registration with invalid data
  - Register different user roles (customer, restaurant, delivery, admin)
  - Login with valid credentials
  - Prevent login with invalid email/password
- **Files**: `tests/auth.test.js`

### 2. User Profile Management (Functional/API Testing)
- **Test Cases**:
  - Get user profile with valid token
  - Update user profile with valid data
  - Prevent profile update with invalid data
  - Change password with valid current password
  - Prevent password change with incorrect current password
  - Add address to user profile
  - Delete address from user profile
- **Files**: `tests/user.test.js`

### 3. Role-Based Authorization (Functional/API Testing)
- **Test Cases**:
  - Grant access to appropriate roles for specific endpoints
  - Deny access to unauthorized roles
  - Test multi-role authorization
- **Files**: `tests/role-authorization.test.js`

### 4. Database Validation & Integrity (Database Testing)
- **Test Cases**:
  - Schema validation for required fields
  - Email format validation
  - Password hashing
  - Uniqueness constraints (email)
- **Files**: `tests/user-model.test.js`

### 5. Authentication Middleware (API Testing)
- **Test Cases**:
  - Allow access with valid token
  - Deny access with no token
  - Deny access with expired token
  - Deny access with malformed token
- **Files**: `tests/auth-middleware.test.js`

## Test Execution & Results

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/auth.test.js
```

### Test Coverage
The latest test run shows high code coverage:
- Models: 95% coverage
- Controllers: ~59% coverage
- Routes: 100% coverage
- Middleware: 100% coverage

### Test Results Summary
- Total Test Suites: 5
- Total Tests: 40
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
   - Creates test users

3. **Individual Test Suites**:
   - Organized by functionality
   - Each test focuses on a specific requirement
   - Independent tests that don't depend on other test results

## Conclusion

The automated test suite provides comprehensive coverage of the Authentication Service's functionality, ensuring that user registration, authentication, profile management, and authorization work correctly. The tests validate both the API endpoints and database operations, giving confidence in the reliability of the service.
