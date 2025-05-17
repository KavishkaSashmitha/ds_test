"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DeliveryTracking from "@/components/delivery-tracking";
import { DriverLocationSender } from "@/components/driver-location-sender";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import { TestHeader } from "@/components/test-header";
import { initializeSocket } from "@/lib/socketService";

// Mock data
const MOCK_DELIVERY_ID = "delivery_12345";
const MOCK_ORDER_ID = "order_67890";
const MOCK_AUTH_TOKEN = "mock_jwt_token_for_testing";

export default function TestTrackingPage() {
  const { toast } = useToast();
  const [driverActive, setDriverActive] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("assigned");
  const [showTracking, setShowTracking] = useState(true);

  // Initialize socket connection
  useState(() => {
    initializeSocket();
  });

  // Toggle the driver's active status
  const toggleDriver = () => {
    setDriverActive(!driverActive);

    toast({
      title: !driverActive ? "Driver activated" : "Driver deactivated",
      description: !driverActive
        ? "Location tracking has been started"
        : "Location tracking has been stopped",
    });
  };

  // Update the delivery status
  const updateStatus = (newStatus: string) => {
    setCurrentStatus(newStatus);

    toast({
      title: "Status updated",
      description: `Delivery status changed to: ${newStatus}`,
    });
  };

  return (
    <div className="container max-w-7xl mx-auto pb-8 px-4">
      <TestHeader />

      <h1 className="text-3xl font-bold mb-4 text-center">
        Location Tracking Test
      </h1>

      <p className="text-gray-500 text-center mb-6 max-w-2xl mx-auto">
        This demo allows you to test real-time location tracking between
        delivery drivers and customers. Use the driver panel to share your
        location and the customer view to track it.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Driver Panel */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Driver Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Driver Status</h3>
                  <Button
                    onClick={toggleDriver}
                    variant={driverActive ? "destructive" : "default"}
                  >
                    {driverActive ? "Stop Driving" : "Start Driving"}
                  </Button>
                </div>

                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="text-sm mb-1">
                    Delivery ID: {MOCK_DELIVERY_ID}
                  </p>
                  <p className="text-sm mb-1">Order ID: {MOCK_ORDER_ID}</p>
                  <p className="text-sm">Current Status: {currentStatus}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={
                        currentStatus === "assigned" ? "secondary" : "outline"
                      }
                      onClick={() => updateStatus("assigned")}
                    >
                      Assigned
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        currentStatus === "picked_up" ? "secondary" : "outline"
                      }
                      onClick={() => updateStatus("picked_up")}
                    >
                      Picked Up
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        currentStatus === "in_transit" ? "secondary" : "outline"
                      }
                      onClick={() => updateStatus("in_transit")}
                    >
                      In Transit
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        currentStatus === "delivered" ? "secondary" : "outline"
                      }
                      onClick={() => updateStatus("delivered")}
                    >
                      Delivered
                    </Button>
                  </div>
                </div>
              </div>

              {/* Driver Location Sender */}
              {driverActive && (
                <div className="mt-6">
                  <DriverLocationSender
                    deliveryId={MOCK_DELIVERY_ID}
                    isActive={true}
                    authToken={MOCK_AUTH_TOKEN}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <p>
                  <strong>1.</strong> Click "Start Driving" to begin sharing
                  your location
                </p>
                <p>
                  <strong>2.</strong> Allow location access when prompted by
                  your browser
                </p>
                <p>
                  <strong>3.</strong> Use the status buttons to simulate
                  different delivery stages
                </p>
                <p>
                  <strong>4.</strong> Switch to the customer view to see the
                  real-time updates
                </p>
                <p>
                  <strong>5.</strong> Try the "Full Screen Tracking" and "Share
                  Tracking" features
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Note: This is a test environment. Location updates are
                  simulated using your current location.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer View */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer View</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="compact" className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="compact"
                    onClick={() => setShowTracking(true)}
                  >
                    Compact View
                  </TabsTrigger>
                  <TabsTrigger
                    value="fullscreen"
                    onClick={() => setShowTracking(false)}
                  >
                    Fullscreen View
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="compact" className="mt-4">
                  {showTracking && (
                    <DeliveryTracking
                      deliveryId={MOCK_DELIVERY_ID}
                      orderId={MOCK_ORDER_ID}
                      initialStatus={currentStatus}
                    />
                  )}
                </TabsContent>
                <TabsContent value="fullscreen" className="mt-4">
                  <div className="h-[600px] border rounded-lg overflow-hidden">
                    <iframe
                      src={`/track?deliveryId=${MOCK_DELIVERY_ID}&orderId=${MOCK_ORDER_ID}`}
                      className="w-full h-full border-0"
                      title="Fullscreen tracking"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
