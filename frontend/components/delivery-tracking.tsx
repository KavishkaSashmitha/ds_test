"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Navigation, Clock, MapPin, Info } from "lucide-react";
import DeliveryMap from "@/components/delivery-map";
import { io, Socket } from "socket.io-client";

// Status labels for UI display
const statusLabels = {
  pending: "Pending",
  assigned: "Driver Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Status colors for UI display
const statusColors = {
  pending: "bg-gray-500",
  assigned: "bg-blue-500",
  picked_up: "bg-yellow-500",
  in_transit: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

interface DeliveryTrackingProps {
  deliveryId: string;
  orderId: string;
  initialStatus?: string;
}

interface DeliveryInfo {
  _id: string;
  status: string;
  deliveryPersonnelId: string;
  restaurantName: string;
  restaurantLocation: {
    coordinates: number[];
  };
  restaurantAddress: string;
  customerLocation: {
    coordinates: number[];
  };
  customerAddress: string;
  deliveryPersonnel?: {
    name: string;
    phone: string;
    vehicleType: string;
    rating: number;
  };
  estimatedDeliveryTime: number;
  assignedAt: string;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export default function DeliveryTracking({
  deliveryId,
  orderId,
  initialStatus = "pending",
}: DeliveryTrackingProps) {
  const { toast } = useToast();
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);

  // Fetch delivery information
  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        const res = await fetch(`/api/deliveries/${deliveryId}`);

        if (!res.ok) {
          throw new Error("Failed to fetch delivery details");
        }

        const data = await res.json();
        setDelivery(data.delivery);
        setStatus(data.delivery.status);

        // If we have a delivery person ID, fetch their current location
        if (data.delivery.deliveryPersonnelId) {
          fetchDriverLocation(data.delivery.deliveryPersonnelId);
        }
      } catch (error) {
        console.error("Error fetching delivery:", error);
        toast({
          title: "Error",
          description: "Failed to load delivery information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryInfo();
  }, [deliveryId, toast]);

  // Fetch driver's location
  const fetchDriverLocation = async (driverId: string) => {
    try {
      const res = await fetch(`/api/location/personnel/${driverId}`);

      if (!res.ok) return;

      const data = await res.json();
      if (data.location) {
        setDriverLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
        });

        // Calculate ETA based on location
        calculateETA(data.location.latitude, data.location.longitude);
      }
    } catch (error) {
      console.error("Error fetching driver location:", error);
    }
  };

  // Calculate estimated time of arrival
  const calculateETA = (driverLat: number, driverLng: number) => {
    if (!delivery) return;

    // Determine destination based on status
    const destCoords =
      status === "picked_up" || status === "in_transit"
        ? delivery.customerLocation.coordinates
        : delivery.restaurantLocation.coordinates;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((destCoords[1] - driverLat) * Math.PI) / 180;
    const dLng = ((destCoords[0] - driverLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((driverLat * Math.PI) / 180) *
        Math.cos((destCoords[1] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Assume average speed of 20 km/h in city traffic
    const timeInMinutes = Math.ceil(distance * 3); // Multiply by 3 for minutes (20 km/h = 1/3 km per minute)

    // Calculate estimated arrival time
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + timeInMinutes);

    // Format arrival time
    const formattedTime = arrivalTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setEstimatedArrival(formattedTime);
  };

  // Setup real-time updates with Socket.IO
  useEffect(() => {
    if (!delivery) return;

    // Connect to WebSocket server with token-based authentication
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    console.log("Connecting to socket server at:", socketUrl);

    const socket = io(socketUrl, {
      transports: ["websocket"], // Use websocket transport for better performance
      reconnectionAttempts: 5, // Try to reconnect 5 times
      reconnectionDelay: 1000, // Start with 1s delay between retries
    });

    socketRef.current = socket;

    // Handle connection events
    socket.on("connect", () => {
      console.log("Socket.IO connected successfully");

      // Join tracking room for this delivery
      socket.emit("track_delivery", deliveryId);
      console.log(`Tracking delivery: ${deliveryId}`);
    });

    // Listen for delivery status updates
    socket.on("delivery_status_update", (data) => {
      console.log("Received delivery status update:", data);
      if (data.deliveryId === deliveryId || data.orderId === orderId) {
        setStatus(data.status);
        toast({
          title: "Delivery Status Updated",
          description: `Your delivery is now ${
            statusLabels[data.status as keyof typeof statusLabels] ||
            data.status
          }`,
        });
      }
    });

    // Listen for location updates from the delivery personnel
    socket.on("location_update", (data) => {
      console.log("Received location update:", data);
      if (data.deliveryId === deliveryId) {
        setDriverLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
        });

        // Update estimated arrival if provided by the server
        if (data.estimatedArrival) {
          const arrivalTime = new Date(
            data.estimatedArrival.estimatedArrivalTime
          );
          setEstimatedArrival(
            arrivalTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        } else {
          // Otherwise calculate locally
          calculateETA(data.location.latitude, data.location.longitude);
        }
      }
    });

    // Listen for tracking updates - this is an alternative event some backends might emit
    socket.on("delivery_tracking_update", (data) => {
      console.log("Received delivery tracking update:", data);
      if (data.deliveryId === deliveryId || data.orderId === orderId) {
        setDriverLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
        });

        // Update status if provided
        if (data.status) {
          setStatus(data.status);
        }

        // Update estimated arrival if provided
        if (data.estimatedArrival) {
          const arrivalTime = new Date(
            data.estimatedArrival.estimatedArrivalTime
          );
          setEstimatedArrival(
            arrivalTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast({
        title: "Connection Error",
        description: "Having trouble connecting to live tracking service",
        variant: "destructive",
      });
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Clean up when component unmounts
    return () => {
      if (socket.connected) {
        console.log("Stopping delivery tracking");
        socket.emit("stop_tracking", deliveryId);
        socket.disconnect();
        console.log("Socket disconnected");
      }
    };
  }, [delivery, deliveryId, orderId, toast]);

  // Create a timer to refresh driver location every 30 seconds as a fallback
  useEffect(() => {
    if (
      !delivery?.deliveryPersonnelId ||
      status === "delivered" ||
      status === "cancelled"
    )
      return;

    const intervalId = setInterval(() => {
      fetchDriverLocation(delivery.deliveryPersonnelId);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [delivery, status]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (!delivery) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Delivery Not Found</h2>
          <p className="text-gray-600">
            Unable to find tracking information for this delivery.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get destination based on status
  const destination =
    status === "pending" || status === "assigned"
      ? {
          lat: delivery.restaurantLocation.coordinates[1],
          lng: delivery.restaurantLocation.coordinates[0],
        }
      : {
          lat: delivery.customerLocation.coordinates[1],
          lng: delivery.customerLocation.coordinates[0],
        };

  // Get driver information
  const driverInfo = delivery.deliveryPersonnel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Track Your Delivery</CardTitle>
            <Badge
              className={
                statusColors[status as keyof typeof statusColors] ||
                "bg-gray-500"
              }
            >
              {statusLabels[status as keyof typeof statusLabels] || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-500" />
            <p className="text-sm">
              {status === "pending" || status === "assigned"
                ? "Restaurant: " + delivery.restaurantName
                : "Delivering to: " + delivery.customerAddress}
            </p>
          </div>

          {estimatedArrival &&
            ["assigned", "picked_up", "in_transit"].includes(status) && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm">Estimated arrival: {estimatedArrival}</p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <DeliveryMap
            currentLocation={driverLocation}
            orders={[]}
            currentOrder={{
              id: orderId,
              restaurantId: delivery.restaurantName,
              restaurantName: delivery.restaurantName,
              restaurantAddress: delivery.restaurantAddress,
              restaurantLocation: {
                lat: delivery.restaurantLocation.coordinates[1],
                lng: delivery.restaurantLocation.coordinates[0],
              },
              customerName: "Customer",
              customerAddress: delivery.customerAddress,
              customerLocation: {
                lat: delivery.customerLocation.coordinates[1],
                lng: delivery.customerLocation.coordinates[0],
              },
              customerPhone: "",
              items: [],
              total: 0,
              status: status as any,
              distance: 0,
              estimatedTime: "",
              earnings: 0,
              createdAt: "",
            }}
            height={300}
            showDirections={true}
          />
        </CardContent>
      </Card>

      {/* Driver Info (only show when assigned) */}
      {driverInfo &&
        ["assigned", "picked_up", "in_transit"].includes(status) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Delivery Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{driverInfo.name}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {driverInfo.vehicleType} • {driverInfo.rating.toFixed(1)}★
                  </p>
                </div>
                <Button className="bg-green-500 hover:bg-green-600" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${driverInfo.phone}`}>Call Driver</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Delivery Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "pending",
              "assigned",
              "picked_up",
              "in_transit",
              "delivered",
            ].map((step, idx) => {
              const isActive =
                ["assigned", "picked_up", "in_transit", "delivered"].indexOf(
                  status
                ) >=
                ["assigned", "picked_up", "in_transit", "delivered"].indexOf(
                  step
                );
              const isCurrent = status === step;

              return (
                <div
                  key={step}
                  className={`flex gap-3 ${
                    idx !== 4
                      ? "pb-4 border-l-2 border-l-gray-200 pl-4 ml-[7px]"
                      : ""
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-1 -ml-[17px] ${
                      isActive ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isCurrent ? "text-orange-500" : ""
                      }`}
                    >
                      {statusLabels[step as keyof typeof statusLabels]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {step === "pending" && "We've received your order"}
                      {step === "assigned" &&
                        "A driver has been assigned to your order"}
                      {step === "picked_up" &&
                        "Your order has been picked up from the restaurant"}
                      {step === "in_transit" &&
                        "Your order is on the way to your location"}
                      {step === "delivered" &&
                        "Your order has been delivered successfully"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Button */}
      <div className="flex justify-center">
        <Button variant="outline" className="flex gap-2">
          <Info className="h-4 w-4" />I need help with this order
        </Button>
      </div>
    </div>
  );
}
