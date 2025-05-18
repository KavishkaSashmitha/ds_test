# Order Service

The Order Service is responsible for managing the food delivery system's orders, including creation, tracking, and payment processing.

## Features

- Create, read, update, and delete orders
- Process payments
- Track order status and delivery
- Search and filter orders
- Assign delivery personnel
- Aggregate order statistics

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the order-service directory
3. Install dependencies:

```bash
npm install
```

4. Set up environment variables in a `.env` file:

```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/food-delivery-orders
JWT_SECRET=your_jwt_secret
RESTAURANT_SERVICE_URL=http://localhost:3001
DELIVERY_SERVICE_URL=http://localhost:3003
```

5. Start the service:

```bash
npm start
```

For development with hot-reload:

```bash
npm run dev
```

## Testing

The Order Service includes a comprehensive test suite using Jest and other testing tools:

- **Unit Tests**: Testing individual components (models, controllers, etc.)
- **Integration Tests**: Testing the interactions between components
- **API Tests**: Testing the RESTful API endpoints

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

Current test coverage:
- Models: 100%
- Routes: 100%
- Middleware: 89%
- Controllers: ~36% (areas for improvement)

## API Documentation

### Order Endpoints

- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get an order by ID
- `GET /api/orders/customer/:customerId` - Get orders by customer
- `GET /api/orders/restaurant/:restaurantId` - Get orders by restaurant
- `GET /api/orders/ready-for-pickup` - Get orders ready for pickup
- `GET /api/orders/nearby` - Get nearby orders for delivery personnel
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/accept` - Accept an order for delivery

For more details, see the [API Documentation](../docs/api.md) or [Test Documentation](./TEST-DOCUMENTATION.md).

## License

This project is licensed under the MIT License.
