import api from './api';
import type { Order, OrderStatus, Payment, PaymentMethod } from './api';

// Interface for creating a new order
export interface CreateOrderRequest {
  restaurantId: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    options?: {
      name: string;
      value: string;
      price: number;
    }[];
  }[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  deliveryInstructions?: string;
  specialInstructions?: string;
}

// Interface for order response with pagination
export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface for detailed order response
export interface OrderDetailResponse {
  order: Order;
  payment?: Payment;
}

// Interface for updating order ETA
export interface UpdateETARequest {
  estimatedDeliveryTime: Date | string;
}

// Interface for assigning delivery person
export interface AssignDeliveryRequest {
  deliveryPersonId: string;
}

// Interface for cancelling an order
export interface CancelOrderRequest {
  reason: string;
}

// Order endpoints
export const orderRoutes = {
  // Create a new order
  createOrder: (orderData: CreateOrderRequest) => 
    api.post<OrderDetailResponse>('/orders', orderData),
  
  // Get all customer orders with optional filters
  getCustomerOrders: (params?: { 
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) => api.get<OrdersResponse>('/orders/customer', { params }),
  
  // Get all restaurant orders with optional filters
  getRestaurantOrders: (restaurantId: string, params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) => api.get<OrdersResponse>(`/orders/restaurant/${restaurantId}`, { params }),
  
  // Get all delivery person orders with optional filters
  getDeliveryPersonOrders: (deliveryPersonId?: string, params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) => {
    const url = deliveryPersonId 
      ? `/orders/delivery/${deliveryPersonId}` 
      : '/orders/delivery';
    return api.get<OrdersResponse>(url, { params });
  },
  
  // Get order details by ID
  getOrderById: (orderId: string) => 
    api.get<OrderDetailResponse>(`/orders/${orderId}`),
  
  // Update order status
  updateOrderStatus: (orderId: string, status: OrderStatus) => 
    api.patch<Order>(`/orders/${orderId}/status`, { status }),
  
  // Assign delivery person to order
  assignDeliveryPerson: (orderId: string, data: AssignDeliveryRequest) => 
    api.patch<Order>(`/orders/${orderId}/assign`, data),
  
  // Update estimated delivery time
  updateDeliveryETA: (orderId: string, data: UpdateETARequest) => 
    api.patch<Order>(`/orders/${orderId}/eta`, data),
  
  // Cancel an order
  cancelOrder: (orderId: string, data: CancelOrderRequest) => 
    api.patch<Order>(`/orders/${orderId}/cancel`, data),
  
  // Get order statistics (admin only)
  getOrderStatistics: () => 
    api.get('/orders/statistics'),
  
  // Search orders by various parameters
  searchOrders: (params: {
    customerId?: string;
    restaurantId?: string;
    deliveryPersonId?: string;
    status?: OrderStatus;
    fromDate?: string;
    toDate?: string;
    minTotal?: number;
    maxTotal?: number;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get<OrdersResponse>('/orders/search', { params }),

  // Get nearby orders for delivery personnel
  getNearbyOrders: (params: {
    latitude: number;
    longitude: number;
    maxDistance?: number;
  }) => api.get<Order[]>('/orders/nearby', { params }),
  
  // Get all ready for pickup orders
  getReadyForPickupOrders: (params?: {
    page?: number;
    limit?: number;
  }) => api.get<OrdersResponse>('/orders/ready-for-pickup', { params }),
  
  // Accept an order for delivery (delivery personnel)
  acceptOrder: (orderId: string) => 
    api.post<{ message: string; order: Order }>(`/orders/${orderId}/accept`),
};

// Payment endpoints
export const paymentRoutes = {
  // Process payment for an order
  processPayment: (data: {
    orderId: string;
    paymentMethod: PaymentMethod;
    paymentDetails?: {
      cardLast4?: string;
      cardBrand?: string;
    };
  }) => api.post<{message: string; payment: Payment}>('/payments/process', data),
  
  // Get payment by ID
  getPaymentById: (id: string) => api.get<{payment: Payment}>(`/payments/${id}`),
  
  // Get payments for current customer
  getCustomerPayments: (params?: {
    page?: number;
    limit?: number;
  }) => api.get<{
    payments: Payment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>('/payments/customer', { params }),
  
  // Process refund (admin only)
  processRefund: (paymentId: string, data: {
    amount: number;
    reason: string;
  }) => api.post<{message: string; payment: Payment}>(`/payments/${paymentId}/refund`, data),
  
  // Get payment statistics (admin only)
  getPaymentStatistics: () => api.get<{
    totalPayments: number;
    paymentsByStatus: Record<string, {count: number; total: number}>;
    paymentsByMethod: Record<string, {count: number; total: number}>;
    paymentsByDay: Array<{
      _id: string;
      count: number;
      total: number;
    }>;
  }>('/payments/statistics'),
};

export default orderRoutes;