"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Clock, MapPin, Info, ExternalLink } from "lucide-react";
import DeliveryMap from "@/components/delivery-map";
import {
  subscribeToLocationUpdates,
  fetchDriverLocation,
} from "@/lib/socketService";
import { ShareTrackingLink } from "@/components/share-tracking-link";
import Link from "next/link";

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
}: Readonly<DeliveryTrackingProps>) {
  const { toast } = useToast();
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState<boolean>(true);
  const unsubscribeRef = useRef<Function | null>(null);

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

        // If we have a delivery, setup location tracking
        if (data.delivery) {
          setupLocationTracking(deliveryId, orderId, data.delivery.status);
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

  // Setup real-time location tracking
  const setupLocationTracking = (
    deliveryId: string,
    orderId: string,
    currentStatus: string
  ) => {
    // Clean up previous subscription if any
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Don't track if delivery is complete or cancelled
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      return;
    }

    // First get the current location
    getInitialDriverLocation(orderId);

    // Then subscribe to real-time updates
    const unsubscribe = subscribeToLocationUpdates(deliveryId, (data: any) => {
      handleLocationUpdate(data);
    });

    unsubscribeRef.current = unsubscribe;
  };

  // Fetch initial driver location using REST API
  const getInitialDriverLocation = async (orderId: string) => {
    try {
      const locationData = await fetchDriverLocation(orderId);

      if (locationData?.location) {
        setDriverLocation({
          lat: locationData.location.latitude,
          lng: locationData.location.longitude,
        });

        // Update status if needed
        if (locationData.status && status !== locationData.status) {
          setStatus(locationData.status);
        }

        // Update estimated arrival
        if (locationData.estimatedArrival) {
          setEstimatedArrival(
            `${
              locationData.estimatedArrival.estimatedMinutes
            } minutes (${new Date(
              locationData.estimatedArrival.estimatedTime
            ).toLocaleTimeString()})`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching initial driver location:", error);
    }
  };

  // Handle location updates from Socket.io
  const handleLocationUpdate = (data: any) => {
    // Update driver location on map
    if (data.location) {
      setDriverLocation({
        lat: data.location.latitude,
        lng: data.location.longitude,
      });
    }

    // Update delivery status if changed
    if (data.status && status !== data.status) {
      setStatus(data.status);
    }

    // Update estimated arrival
    if (data.estimatedArrival) {
      setEstimatedArrival(
        `${data.estimatedArrival.estimatedMinutes} minutes (${new Date(
          data.estimatedArrival.estimatedTime
        ).toLocaleTimeString()})`
      );
    }
  };

  // Clean up socket connection on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Create a timer to refresh driver location every 30 seconds as a fallback
  useEffect(() => {
    if (!delivery || status === "delivered" || status === "cancelled") return;

    const intervalId = setInterval(() => {
      getInitialDriverLocation(orderId);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [delivery, status, orderId]);

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

      {/* Tracking Actions */}
      {["assigned", "picked_up", "in_transit"].includes(status) && (
        <div className="flex gap-2 justify-center">
          <ShareTrackingLink deliveryId={deliveryId} orderId={orderId} />
          
          <Link href={`/track?deliveryId=${deliveryId}&orderId=${orderId}`} target="_blank" passHref>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Full Screen Tracking
            </Button>
          </Link>
        </div>
      )}

      {/* Help Button */}
      <div className="flex justify-center mt-4">
        <Button variant="outline" className="flex gap-2">
          <Info className="h-4 w-4" />I need help with this order
        </Button>
      </div>
    </div>
  );
}
