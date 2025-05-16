import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import orderRoutes, { OrdersResponse, paymentRoutes } from "./orderRoutes";

// Define types based on backend schemas
// User
export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = "customer" | "restaurant" | "delivery" | "admin";

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Restaurant
export interface Restaurant {
  _id?: string;
  ownerId: string;
  name: string;
  description: string;
  cuisine: string;
  address: Address;
  contactInfo: ContactInfo;
  images: RestaurantImages;
  rating: Rating;
  priceRange: PriceRange;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export interface RestaurantImages {
  logo?: string;
  cover?: string;
  gallery?: string[];
}

export interface Rating {
  average: number;
  count: number;
}

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

// Menu Item
export interface MenuItem {
  _id?: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  options?: MenuItemOption[];
  tags?: string[];
  nutritionalInfo?: NutritionalInfo;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  preparationTime: number;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuItemOption {
  name: string;
  choices: {
    name: string;
    price: number;
  }[];
  required: boolean;
  multiSelect: boolean;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
}

// Business Hours
export interface BusinessHours {
  _id?: string;
  restaurantId: string;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  specialHours?: SpecialHours[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DaySchedule {
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  open: string; // "HH:MM" in 24-hour format
  close: string; // "HH:MM" in 24-hour format
}

export interface SpecialHours {
  date: Date;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

// Order
export interface Order {
  _id?: string;
  customerId: string;
  customerName?: string; // Add this property to represent the customer's name
  restaurantId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryPersonId?: string;
  specialInstructions?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options?: {
    name: string;
    value: string;
    price: number;
  }[];
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentMethod = "credit_card" | "debit_card" | "cash" | "wallet";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// Payment
export interface Payment {
  _id?: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentGateway?: string;
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
  };
  refundAmount?: number;
  refundReason?: string;
  refundTransactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Delivery
export interface Delivery {
  _id?: string;
  orderId: string;
  deliveryPersonnelId?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation: GeoLocation;
  restaurantAddress: string;
  customerId: string;
  customerName: string;
  customerLocation: GeoLocation;
  customerAddress: string;
  customerPhone: string;
  status: DeliveryStatus;
  distance: number;
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  deliveryFee: number;
  driverEarnings: number;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";

// Delivery Personnel
export interface DeliveryPersonnel {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: VehicleType;
  licenseNumber: string;
  currentLocation: GeoLocation;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  lastLocationUpdateTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VehicleType = "bicycle" | "motorcycle" | "car" | "scooter" | "van";

// Location Update
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  orderId?: string;
}

// Base API URL - use environment variable or default to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout and withCredentials for better request handling
  timeout: 30000,
  withCredentials: true,
});

// Ensure Axios interceptor handles authentication and remove explicit token usage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`, config.data);

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // If token exists, add it to the request headers
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Log the error for debugging
    console.error("API Error:", error.response?.status, error.response?.data || error.message);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login page if needed
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth service endpoints
export const authApi = {
  register: (userData: RegisterUserData) => 
    api.post<AuthResponse>("/auth/register", userData),
  
  login: (credentials: LoginCredentials) => 
    api.post<AuthResponse>("/auth/login", credentials),
  
  getCurrentUser: () => 
    api.get<User>("/auth/users/profile"),
};

// Restaurant service endpoints
export const restaurantApi = {
  createRestaurant: (data: Partial<Restaurant>) => 
    api.post<Restaurant>("/restaurants", data),
  
  getRestaurantById: (id: string) => 
    api.get<{restaurant: Restaurant, businessHours?: BusinessHours}>(`/restaurants/${id}`),
  
  getRestaurantByOwnerId: (ownerId: string) => 
    api.get<{restaurant: Restaurant, businessHours?: BusinessHours}>(`/restaurants/owner/${ownerId}`),
  
    searchRestaurants: (params: {
    name?: string;
    cuisine?: string;
    city?: string;
    priceRange?: PriceRange;
    isOpen?: boolean;
    minRating?: number;
    lat?: number;
    lng?: number;
    distance?: number;
    page?: number;
    limit?: number;
    sort?: string;
  }) => api.get<{restaurants: Restaurant[], pagination: any}>("/restaurants", { params }),
  
  getMenuItems: (restaurantId: string) => 
    api.get<MenuItem[]>(`/menus/restaurant/${restaurantId}`),
  
  createMenuItem: (data: Partial<MenuItem>) => {
    console.log("Sending Menu Item Data:", data); // Debugging log
    return api.post<MenuItem>("/menus", data);
  },
  
  updateMenuItem: (id: string, data: Partial<MenuItem>) => 
    api.put<MenuItem>(`/menus/${id}`, data),
  
  deleteMenuItem: (id: string) => 
    api.delete(`/menus/${id}`),
  
  updateBusinessHours: (restaurantId: string, data: Partial<BusinessHours>) => 
    api.put<BusinessHours>(`/restaurants/${restaurantId}/hours`, data),

  getRestaurantOrders: (restaurantId: string, params?: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    }) => api.get<OrdersResponse>(`/orders/restaurant/${restaurantId}`, { params }),

  /**
   * Update the restaurant's status (isOpen or acceptingOrders).
   * @param restaurantId - The ID of the restaurant to update.
   * @param data - The status fields to update (e.g., { isOpen: true }).
   * @returns A promise resolving to the updated restaurant data.
   */
  updateRestaurantStatus: (restaurantId: string, data: { isOpen?: boolean; acceptingOrders?: boolean }) => {
    return api.patch(`/restaurants/${restaurantId}/status`, data);
  },
};

// Order service endpoints - Importing from orderRoutes.ts for better organization
export { orderRoutes, paymentRoutes };
export const orderApi = orderRoutes;
export const paymentApi = paymentRoutes;

// Delivery service endpoints
export const deliveryApi = {
  registerDeliveryPersonnel: (data: Partial<DeliveryPersonnel>) => 
    api.post<DeliveryPersonnel>("/deliveries/personnel/register", data),
  
  updateLocation: (data: LocationUpdate) => 
    api.post<{success: boolean}>("/locations/update", data),
  
  updateAvailability: (isAvailable: boolean) => 
    api.put<{success: boolean, isAvailable: boolean}>("/deliveries/personnel/availability", { isAvailable }),
  
  getDeliveryPersonnelProfile: () => 
    api.get<DeliveryPersonnel>("/deliveries/personnel/profile"),
  
  getDeliveryById: (id: string) => 
    api.get<Delivery>(`/deliveries/${id}`),
  
  getActiveDeliveries: () => 
    api.get<Delivery[]>("/deliveries", { params: { status: ["assigned", "picked_up", "in_transit"] } }),
  
  updateDeliveryStatus: (id: string, status: DeliveryStatus, notes?: string) => 
    api.put<Delivery>(`/deliveries/${id}/status`, { status, notes }),
  
  rateDelivery: (id: string, rating: number, feedback?: string) => 
    api.post<{success: boolean}>(`/deliveries/${id}/rate`, { rating, feedback }),
};

export default api;