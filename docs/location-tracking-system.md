# Real-Time Driver Location Tracking System

This documentation explains how the driver location tracking system works in our restaurant delivery app and how to use it in different contexts.

## System Overview

The real-time driver location tracking system consists of:

1. **WebSocket Service** - Uses Socket.io for real-time location updates
2. **Backend Microservices** - API Gateway and Delivery Service handle location data
3. **Frontend Components** - For both drivers (sending location) and customers (viewing location)

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend  │◄─────►│  API Gateway │◄─────►│   Delivery   │
│  Components │       │   (Socket)   │       │    Service   │
└─────────────┘       └──────────────┘       └──────────────┘
                                                    ▲
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │   MongoDB    │
                                             │  (Location)  │
                                             └──────────────┘
```

## How It Works

1. **Driver Side**:
   - When a driver starts a delivery, the `DriverLocationSender` component activates
   - Browser's Geolocation API tracks driver position in real-time
   - Updates are sent via WebSocket to the server
   - Updates are stored in MongoDB and forwarded to listening customers

2. **Customer Side**:
   - Customer views the `DeliveryTracking` component for their order
   - Component subscribes to location updates for their specific delivery
   - Map automatically updates as driver location changes
   - ETA and delivery status are also updated in real-time

## Frontend Components

### 1. Socket Service (`socketService.ts`)

Handles WebSocket connections and communication:

```typescript
// Key functions:
initializeSocket(token)        // Connect to WebSocket server
subscribeToLocationUpdates()   // Listen for location updates
sendLocationUpdate()           // Send driver location
fetchDriverLocation()          // Fetch initial location via REST
```

### 2. Driver Location Sender (`driver-location-sender.tsx`)

For drivers to share their location:

```typescript
<DriverLocationSender
  deliveryId="delivery_123"  
  isActive={true}              // Controls when tracking is active
  authToken="jwt_token"        // Authentication token
/>
```

### 3. Delivery Tracking (`delivery-tracking.tsx`)

For customers to view driver location as part of the delivery details:

```typescript
<DeliveryTracking
  deliveryId="delivery_123"
  orderId="order_456"
  initialStatus="in_transit"   // Initial delivery status
/>
```

### 4. Realtime Location View (`realtime-location-view.tsx`)

Dedicated view for real-time location tracking with a simple, focused UI:

```typescript
<RealtimeLocationView
  deliveryId="delivery_123"
  orderId="order_456"
/>
```

### 5. Share Tracking Link (`share-tracking-link.tsx`)

Allows customers to share a public tracking link with others:

```typescript
<ShareTrackingLink
  deliveryId="delivery_123"
  orderId="order_456"
/>
```

## Backend Components

### 1. API Gateway

Provides a single entry point for all WebSocket connections:

- Proxies WebSocket connections to appropriate services
- Handles WebSocket authentication
- Routes updates between services and clients

### 2. Delivery Service

Manages delivery location data:

- Stores driver locations in MongoDB
- Calculates ETAs based on driver position
- Provides REST endpoints for initial location data
- Manages WebSocket connections for real-time updates

## Public vs. Authenticated Routes

- **Public Routes**: Accessible without authentication for tracking shared links
  - `/api/delivery/public/locations/order/:orderId`
  - `/api/delivery/public/locations/delivery/:id`

- **Authenticated Routes**: Require authentication
  - Used by drivers to update their location
  - Used by restaurant staff to view all active deliveries

## Shareable Tracking Links

The system supports public shareable tracking links that can be accessed without authentication:

```
https://yourapp.com/track?deliveryId=123&orderId=456
```

This allows customers to:
1. Share their delivery tracking with friends or family
2. Access tracking from different devices without logging in
3. Get a focused view optimized for real-time location updates

The tracking links can be shared via:
- SMS/text messages
- Email
- Social media platforms
- Messaging apps

## WebSocket Events

### Client to Server:
- `location_update`: Sent by drivers with their current location
- `subscribe_to_delivery`: Sent by customers to track a specific delivery
- `unsubscribe_from_delivery`: Sent when customer stops tracking

### Server to Client:
- `location_update`: Sent to clients with new driver location
- `delivery_status_update`: Sent when delivery status changes

## Implementation Tips

1. **Battery Usage**: The location sender uses optimal settings to balance accuracy and battery life:
   ```javascript
   navigator.geolocation.watchPosition(successCallback, errorCallback, {
     enableHighAccuracy: true,
     maximumAge: 10000,
     timeout: 5000
   });
   ```

2. **Disconnection Handling**: The system automatically handles reconnection after network interruptions.

3. **Security**: Location data is only shared with authenticated users with proper permissions or through time-limited public links.

4. **Performance**: The WebSocket connection uses binary data format to minimize bandwidth usage.

## Kubernetes Deployment

The services are deployed with WebSocket-optimized settings:

```yaml
annotations:
  service.kubernetes.io/aws-load-balancer-backend-protocol: "http"
  service.kubernetes.io/aws-load-balancer-connection-idle-timeout: "3600"
```

## Troubleshooting

1. **Location Not Updating**:
   - Check browser permissions for location access
   - Verify active internet connection
   - Ensure WebSocket connection is established

2. **Map Not Showing Driver**:
   - Verify the correct delivery ID is being tracked
   - Check if driver has started sharing their location
   - Confirm WebSocket subscription is active

3. **High Battery Usage**:
   - Reduce location accuracy settings
   - Increase interval between updates
   - Disable tracking when not actively delivering
