import { NextResponse } from 'next/server';

// Mock delivery data
const mockDelivery = {
  _id: "delivery_12345",
  orderId: "order_67890",
  status: "assigned", // Will be overridden by client status
  deliveryPersonnelId: "driver_123",
  restaurantName: "Pizza Paradise",
  restaurantLocation: {
    coordinates: [-122.4194, 37.7749], // San Francisco
  },
  restaurantAddress: "123 Main St, San Francisco, CA",
  customerLocation: {
    coordinates: [-122.4342, 37.7946], // Few blocks away
  },
  customerAddress: "456 Pine St, San Francisco, CA",
  deliveryPersonnel: {
    name: "John Driver",
    phone: "555-123-4567",
    vehicleType: "motorcycle",
    rating: 4.8,
  },
  estimatedDeliveryTime: 25,
  assignedAt: new Date().toISOString(),
};

// GET handler for delivery info
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    success: true,
    message: "Delivery details retrieved successfully",
    delivery: {
      ...mockDelivery,
      _id: id,
    },
  });
}
