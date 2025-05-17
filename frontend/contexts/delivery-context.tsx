"use client";

import type React from "react";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import orderRoutes from "@/lib/orderRoutes";

// Define delivery status types
export type DeliveryStatus = "available" | "busy" | "offline";
export type OrderStatus =
  | "ready_for_pickup"
  | "picked_up"
  | "on_the_way"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

// Define order interface
export interface DeliveryOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLocation: {
    lat: number;
    lng: number;
  };
  customerName: string;
  customerAddress: string;
  customerLocation: {
    lat: number;
    lng: number;
  };
  customerPhone: string;
  items: {
    name: string;
    quantity: number;
  }[];
  total: number;
  status: OrderStatus;
  distance: number;
  estimatedTime: string;
  earnings: number;
  createdAt: string;
}

// Define delivery context interface
interface DeliveryContextType {
  status: DeliveryStatus;
  setStatus: (status: DeliveryStatus) => void;
  currentLocation: { lat: number; lng: number } | null;
  updateLocation: (location: { lat: number; lng: number }) => void;
  availableOrders: DeliveryOrder[];
  currentOrder: DeliveryOrder | null;
  acceptOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  orderHistory: DeliveryOrder[];
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  isLoading: boolean;
  locationWatchId: number | null;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  refreshOrders: () => void;
  calculateDistance: (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => number;
}

// Create the delivery context
const DeliveryContext = createContext<DeliveryContextType | undefined>(
  undefined
);

// Delivery provider component
export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<DeliveryStatus>("offline");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(null);
  const [orderHistory, setOrderHistory] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [earnings, setEarnings] = useState({
    today: 1050,
    week: 7350,
    month: 29400,
  });
  const locationWatchIdRef = useRef<number | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Number(distance.toFixed(1));
  };

  // Update orders with current distances whenever location changes
  const updateOrderDistances = (location: { lat: number; lng: number }) => {
    if (!location) return;

    // Update available orders with current distance
    const updatedOrders = availableOrders.map((order) => {
      const destination =
        order.status === "ready_for_pickup"
          ? order.restaurantLocation
          : order.customerLocation;

      const distance = calculateDistance(
        location.lat,
        location.lng,
        destination.lat,
        destination.lng
      );

      return { ...order, distance };
    });

    setAvailableOrders(updatedOrders);

    // Update current order with current distance if exists
    if (currentOrder) {
      const destination =
        currentOrder.status === "ready_for_pickup"
          ? currentOrder.restaurantLocation
          : currentOrder.customerLocation;

      const distance = calculateDistance(
        location.lat,
        location.lng,
        destination.lat,
        destination.lng
      );

      setCurrentOrder({ ...currentOrder, distance });
    }
  };

  // Real-time location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing watch
    if (locationWatchIdRef.current) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    // Start watching position with high accuracy
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(newLocation);
        updateOrderDistances(newLocation);

        // In a real app, send location updates to backend
        console.log("Location updated (real-time):", newLocation);
      },
      (error) => {
        console.error("Error tracking location:", error);

        // Handle specific error codes
        if (error.code === 3) {
          // TIMEOUT error
          toast({
            title: "Location Timeout",
            description:
              "Getting your location is taking longer than expected. Trying with lower accuracy...",
            variant: "destructive",
          });

          // Try again with lower accuracy as a fallback
          setTimeout(() => {
            const fallbackWatchId = navigator.geolocation.watchPosition(
              (position) => {
                const newLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                setCurrentLocation(newLocation);
                updateOrderDistances(newLocation);
              },
              (fallbackError) => {
                console.error("Fallback location error:", fallbackError);
                toast({
                  title: "Location Error",
                  description:
                    "Could not determine your location. Please check your device settings.",
                  variant: "destructive",
                });

                // Set a default location if everything fails (user's approximate location or central city location)
                // Only for demo purposes - in production you should handle this differently
                if (!currentLocation) {
                  const defaultLocation = { lat: 6.9271, lng: 79.8612 }; // Default to Colombo city center
                  setCurrentLocation(defaultLocation);
                  updateOrderDistances(defaultLocation);
                  toast({
                    title: "Using Default Location",
                    description:
                      "Using an approximate location. Please enable location services for better accuracy.",
                  });
                }
              },
              {
                enableHighAccuracy: false, // Try with lower accuracy
                maximumAge: 60000, // Accept positions up to 1 minute old
                timeout: 20000, // Wait longer
              }
            );
            locationWatchIdRef.current = fallbackWatchId;
          }, 1000);
        } else if (error.code === 1) {
          // PERMISSION_DENIED
          toast({
            title: "Location Access Denied",
            description:
              "Please enable location services to use the delivery features.",
            variant: "destructive",
          });
        } else {
          // Other errors
          toast({
            title: "Location Error",
            description: `Failed to track location: ${error.message}`,
            variant: "destructive",
          });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000, // Accept positions up to 15 seconds old
        timeout: 15000, // Wait up to 15 seconds before timing out
      }
    );

    locationWatchIdRef.current = watchId;
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
  };

  // Refresh available orders
  const refreshOrders = async () => {
    if (status !== "available") return;

    setIsLoading(true);

    try {
      // Fetch new orders from the backend using the proper API call
      const response = await orderRoutes.getReadyForPickupOrders();

      if (response?.data?.orders) {
        const apiOrders = response.data.orders;
        console.log("Received orders from API:", apiOrders);

        // Convert API orders to the format expected by the UI
        const convertedOrders: DeliveryOrder[] = apiOrders.map((order) => ({
          id: order._id || "", // Ensure 'id' is always a string
          restaurantId: order.restaurantId,
          restaurantName: `Restaurant #${order.restaurantId.substring(0, 5)}`,
          restaurantAddress:
            order.deliveryAddress?.street || "Restaurant address",
          restaurantLocation: {
            lat: order.deliveryAddress?.location?.coordinates?.[1] || 6.9271,
            lng: order.deliveryAddress?.location?.coordinates?.[0] || 79.8612,
          },
          customerName: `Customer #${order.customerId.substring(0, 5)}`,
          customerAddress: `${order.deliveryAddress?.street || ""}, ${
            order.deliveryAddress?.city || ""
          }`,
          customerLocation: {
            lat: order.deliveryAddress?.location?.coordinates?.[1] || 6.9271,
            lng: order.deliveryAddress?.location?.coordinates?.[0] || 79.8612,
          },
          customerPhone: "N/A",
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })),
          total: order.total,
          status: order.status as OrderStatus,
          distance: 0,
          estimatedTime: "15-20 min",
          earnings: Math.round(order.total * 0.1),
          createdAt:
            typeof order.createdAt === "string"
              ? order.createdAt
              : order.createdAt?.toISOString() || new Date().toISOString(), // Ensure 'createdAt' is always a string
        }));

        setAvailableOrders(convertedOrders);

        if (currentLocation) {
          updateOrderDistances(currentLocation);
        }

        toast({
          title: "Orders Updated",
          description: `Found ${convertedOrders.length} orders ready for pickup`,
        });
      } else {
        setAvailableOrders([]);
        toast({
          title: "No Orders",
          description: "No orders are currently ready for pickup",
        });
      }
    } catch (error) {
      console.error("Error refreshing orders:", error);
      toast({
        title: "Failed to refresh orders",
        description: "Please try again later",
        variant: "destructive",
      });

      // For demonstration purposes only, provide some mock data
      // so the app doesn't look empty. Remove this in production.
      setAvailableOrders([
        {
          id: "mock-1",
          restaurantId: "rest-1",
          restaurantName: "Burger Palace",
          restaurantAddress: "123 Main St",
          restaurantLocation: { lat: 6.9271, lng: 79.8612 },
          customerName: "John D.",
          customerAddress: "456 Side St, Colombo",
          customerLocation: { lat: 6.9344, lng: 79.8528 },
          customerPhone: "N/A",
          items: [{ name: "Burger", quantity: 2 }],
          total: 1200,
          status: "ready_for_pickup",
          distance: 2.3,
          estimatedTime: "15-20 min",
          earnings: 200,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize location and load available orders when status changes
  useEffect(() => {
    if (status === "available") {
      // Start location tracking
      startLocationTracking();

      // Load available orders
      refreshOrders();
    } else if (status === "offline") {
      // Stop location tracking when offline
      stopLocationTracking();
      setAvailableOrders([]);
    }

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [status]);

  // Update location manually (called from UI)
  const updateLocation = (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    updateOrderDistances(location);

    // In a real app, this would call the Location Service microservice
    console.log("Location manually updated:", location);
  };

  // Accept an order
  const acceptOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      // Call the backend API to accept the order
      const response = await orderRoutes.acceptOrder(orderId);

      // Find the order in available orders
      const order = availableOrders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Update order status to out_for_delivery (matching backend status)
      const updatedOrder = {
        ...order,
        status: "out_for_delivery" as OrderStatus,
      };
      setCurrentOrder(updatedOrder);
      setStatus("busy");

      // Remove from available orders
      setAvailableOrders(availableOrders.filter((o) => o.id !== orderId));

      toast({
        title: "Order accepted",
        description: `You've accepted order #${orderId}`,
      });

      // Navigate to the order detail page
      router.push(`/delivery/orders/${orderId}`);
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        title: "Failed to accept order",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the Order Service and Delivery Service microservices
      // to update the order status

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update current order status
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, status });
      }

      toast({
        title: "Order status updated",
        description: `Order #${orderId} is now ${status.replace(/_/g, " ")}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Failed to update order status",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Complete an order
  const completeOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the Order Service, Delivery Service, and Payment Service microservices
      // to mark the order as delivered and update earnings

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (currentOrder && currentOrder.id === orderId) {
        // Add to order history
        const completedOrder = {
          ...currentOrder,
          status: "delivered" as OrderStatus,
        };
        setOrderHistory([completedOrder, ...orderHistory]);

        // Update earnings
        setEarnings({
          ...earnings,
          today: earnings.today + completedOrder.earnings,
          week: earnings.week + completedOrder.earnings,
          month: earnings.month + completedOrder.earnings,
        });

        // Clear current order
        setCurrentOrder(null);
        setStatus("available");

        toast({
          title: "Order completed",
          description: `You've earned Rs.${completedOrder.earnings.toFixed(
            2
          )} for this delivery`,
        });

        // Navigate back to dashboard
        router.push("/delivery/dashboard");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Failed to complete order",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel an order
  const cancelOrder = async (orderId: string, reason: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the Order Service and Delivery Service microservices
      // to cancel the order and reassign it to another driver

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (currentOrder && currentOrder.id === orderId) {
        // Add to order history with cancelled status
        const cancelledOrder = {
          ...currentOrder,
          status: "cancelled" as OrderStatus,
        };
        setOrderHistory([cancelledOrder, ...orderHistory]);

        // Clear current order
        setCurrentOrder(null);
        setStatus("available");

        toast({
          title: "Order cancelled",
          description: `Order #${orderId} has been cancelled`,
        });

        // Navigate back to dashboard
        router.push("/delivery/dashboard");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Failed to cancel order",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DeliveryContext.Provider
      value={{
        status,
        setStatus,
        currentLocation,
        updateLocation,
        availableOrders,
        currentOrder,
        acceptOrder,
        updateOrderStatus,
        completeOrder,
        cancelOrder,
        orderHistory,
        earnings,
        isLoading,
        locationWatchId: locationWatchIdRef.current,
        startLocationTracking,
        stopLocationTracking,
        refreshOrders,
        calculateDistance,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

// Custom hook to use delivery context
export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error("useDelivery must be used within a DeliveryProvider");
  }
  return context;
}
