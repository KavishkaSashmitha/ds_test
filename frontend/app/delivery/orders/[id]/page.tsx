"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  X,
} from "lucide-react";

import { useDelivery, type OrderStatus } from "@/contexts/delivery-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Steps, Step } from "@/components/steps";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Dynamically import the map component to avoid SSR issues
const DeliveryMap = dynamic(() => import("@/components/delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-lg border bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
    </div>
  ),
});

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const {
    currentOrder,
    currentLocation,
    updateOrderStatus,
    completeOrder,
    cancelOrder,
    startLocationTracking,
  } = useDelivery();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);

  // If there's no current order or the ID doesn't match, redirect to dashboard
  useEffect(() => {
    if (!currentOrder || currentOrder.id !== orderId) {
      router.push("/delivery/dashboard");
      return;
    }

    // Start location tracking to ensure accurate directions and ETA
    startLocationTracking();

    // Calculate ETA based on current location and destination
    if (currentLocation) {
      // In a real app, this would use the Google Maps Distance Matrix API
      // Here we're just simulating an ETA calculation
      const destination =
        currentOrder.status === "ready_for_pickup"
          ? currentOrder.restaurantLocation
          : currentOrder.customerLocation;

      // Basic ETA calculation (distance in km * 2 minutes per km + 5 minutes buffer)
      const distanceInKm = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        destination.lat,
        destination.lng
      );

      const minutesEstimated = Math.ceil(distanceInKm * 2) + 5;
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + minutesEstimated * 60000);

      // Format arrival time
      const formattedTime = arrivalTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      setEstimatedArrival(formattedTime);
    }
  }, [currentOrder, orderId, router, currentLocation, startLocationTracking]);

  // Calculate distance between two coordinates
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
    return R * c;
  };

  // Get current step based on order status
  const getCurrentStep = () => {
    switch (currentOrder?.status) {
      case "ready_for_pickup":
        return 0;
      case "picked_up":
        return 1;
      case "on_the_way":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  // Get next status based on current status
  const getNextStatus = (): OrderStatus | null => {
    if (!currentOrder) return null;

    switch (currentOrder.status) {
      case "ready_for_pickup":
        return "picked_up";
      case "picked_up":
        return "on_the_way";
      case "on_the_way":
        return "delivered";
      default:
        return null;
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus || !currentOrder) return;

    if (nextStatus === "delivered") {
      await completeOrder(currentOrder.id);
    } else {
      await updateOrderStatus(currentOrder.id, nextStatus);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelReason.trim() || !currentOrder) return;
    await cancelOrder(currentOrder.id, cancelReason);
    setIsCancelDialogOpen(false);
  };

  // Open navigation app with directions
  const openNavigation = () => {
    if (!currentOrder || !currentLocation) return;

    const destination =
      currentOrder.status === "ready_for_pickup"
        ? `${currentOrder.restaurantLocation.lat},${currentOrder.restaurantLocation.lng}`
        : `${currentOrder.customerLocation.lat},${currentOrder.customerLocation.lng}`;

    // Universal URL scheme that works on both iOS and Android
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}&travelmode=driving`;

    window.open(url, "_blank");
  };

  // Make a phone call
  const makePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, "_self");
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Get button text based on current status
  const getButtonText = () => {
    if (!currentOrder) return "Update Status";

    switch (currentOrder.status) {
      case "ready_for_pickup":
        return "Confirm Pickup";
      case "picked_up":
        return "Start Delivery";
      case "on_the_way":
        return "Complete Delivery";
      default:
        return "Update Status";
    }
  };

  // Get destination label based on current status
  const getDestinationLabel = () => {
    if (!currentOrder) return "";

    return currentOrder.status === "ready_for_pickup"
      ? "Restaurant"
      : "Customer";
  };

  if (!currentOrder) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/delivery/dashboard"
          className="mb-4 flex items-center text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order #{currentOrder.id}</h1>
          <Badge
            variant="outline"
            className={`px-3 py-1 ${
              currentOrder.status === "delivered"
                ? "bg-green-100 text-green-800 border-green-200"
                : currentOrder.status === "cancelled"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-orange-100 text-orange-600 border-orange-200"
            }`}
          >
            {currentOrder.status
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>
        <p className="text-gray-600">
          Received at {formatTime(currentOrder.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {/* Map View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Delivery Route</span>
                {estimatedArrival && (
                  <Badge variant="secondary" className="ml-2">
                    ETA: {estimatedArrival}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                currentLocation={currentLocation}
                orders={[currentOrder]}
                currentOrder={currentOrder}
                height={300}
                showDirections={true}
              />
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={openNavigation}
                >
                  <Navigation className="h-4 w-4" />
                  Navigate to {getDestinationLabel()}
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() =>
                    makePhoneCall(
                      currentOrder.status === "ready_for_pickup"
                        ? "0123456789" // Restaurant phone (would come from API)
                        : currentOrder.customerPhone
                    )
                  }
                >
                  <Phone className="h-4 w-4" />
                  Call {getDestinationLabel()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Steps 
                currentStep={getCurrentStep()}
                steps={[
                  {
                    title: "Ready for Pickup",
                    description: "Pickup order from restaurant"
                  },
                  {
                    title: "Picked Up",
                    description: "Order collected from restaurant"
                  },
                  {
                    title: "On the Way", 
                    description: "Delivering to customer" 
                  },
                  {
                    title: "Delivered", 
                    description: "Order completed" 
                  }
                ]}
              />

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>
                    Estimated delivery time: {currentOrder.estimatedTime}
                    {estimatedArrival && ` (${estimatedArrival})`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{currentOrder.restaurantName}</p>
                <p className="text-gray-600 mb-1">
                  {currentOrder.restaurantAddress}
                </p>
                <p className="text-sm text-gray-500">
                  {currentLocation && (
                    <>
                      {calculateDistance(
                        currentLocation.lat,
                        currentLocation.lng,
                        currentOrder.restaurantLocation.lat,
                        currentOrder.restaurantLocation.lng
                      ).toFixed(1)}{" "}
                      km away
                    </>
                  )}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => makePhoneCall("0123456789")} // Restaurant phone (would come from API)
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Restaurant
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{currentOrder.customerName}</p>
                <p className="text-gray-600 mb-1">
                  {currentOrder.customerAddress}
                </p>
                <p className="text-sm text-gray-500">
                  {currentLocation && (
                    <>
                      {calculateDistance(
                        currentLocation.lat,
                        currentLocation.lng,
                        currentOrder.customerLocation.lat,
                        currentOrder.customerLocation.lng
                      ).toFixed(1)}{" "}
                      km away
                    </>
                  )}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => makePhoneCall(currentOrder.customerPhone)}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Customer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          {/* Order Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">
                  Items ({currentOrder.items.length})
                </h3>
                <div className="space-y-2">
                  {currentOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>Rs.{currentOrder.total.toFixed(2)}</span>
              </div>

              <div className="rounded-lg bg-green-50 p-3 text-sm">
                <p className="font-medium">Delivery Earnings</p>
                <p className="text-green-600">
                  Rs.{currentOrder.earnings.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleUpdateStatus}
                  disabled={!getNextStatus()}
                >
                  {getButtonText()}
                </Button>
                {currentOrder.status !== "delivered" && (
                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This
              information will be shared with the customer and restaurant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={!cancelReason.trim()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
