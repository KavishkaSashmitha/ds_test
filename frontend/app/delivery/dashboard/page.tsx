"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  DollarSign,
  MapPin,
  Package,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { DeliveryOrder, useDelivery } from "@/contexts/delivery-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeliveryOrderCard } from "@/components/delivery-order-card";

// Dynamically import the map component to avoid SSR issues
const DeliveryMap = dynamic(() => import("@/components/delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-lg border bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
    </div>
  ),
});

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  showActions?: boolean;
  onSelect?: () => void;
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const {
    status,
    setStatus,
    currentLocation,
    availableOrders,
    currentOrder,
    earnings,
    isLoading,
    startLocationTracking,
    refreshOrders,
  } = useDelivery();
  const [activeTab, setActiveTab] = useState("available");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Filter orders by distance
  const nearbyOrders = availableOrders.filter((order) => order.distance <= 5);
  const furtherOrders = availableOrders.filter((order) => order.distance > 5);

  // If there's a current order, redirect to the order page
  useEffect(() => {
    if (currentOrder) {
      setActiveTab("current");
    }
  }, [currentOrder]);

  // Handle marker click on map
  const handleMarkerClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    const element = document.getElementById(`order-card-${orderId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    startLocationTracking();
    refreshOrders();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || "Driver"}</p>
      </div>

      {/* Online/Offline Toggle with Refresh Button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm flex-1">
          <div>
            <h2 className="font-medium">Availability Status</h2>
            <p className="text-sm text-gray-600">
              {status === "offline"
                ? "You're currently offline"
                : status === "busy"
                ? "You're currently on a delivery"
                : "You're online and available for orders"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="dashboard-online-mode"
              checked={status !== "offline"}
              onCheckedChange={(checked) =>
                setStatus(checked ? "available" : "offline")
              }
              disabled={!!currentOrder}
            />
            <Label htmlFor="dashboard-online-mode" className="font-medium">
              {status === "offline" ? "Offline" : "Online"}
            </Label>
          </div>
        </div>

        {status === "available" && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="h-full flex gap-2 items-center"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                Rs.{earnings.today.toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                Rs.{earnings.week.toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Available Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="mr-2 h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">
                {availableOrders.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div
                className={`mr-2 h-3 w-3 rounded-full ${
                  status === "offline"
                    ? "bg-gray-400"
                    : status === "busy"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              />
              <span className="text-lg font-medium capitalize">{status}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {status === "offline" ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="mb-2 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-center text-lg font-medium">
              You're currently offline
            </p>
            <p className="mb-6 text-center text-gray-500">
              Go online to start receiving delivery requests
            </p>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setStatus("available")}
            >
              Go Online
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Map View */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Your Location</h2>
              {currentLocation && (
                <span className="text-sm flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {currentLocation.lat.toFixed(4)},{" "}
                  {currentLocation.lng.toFixed(4)}
                </span>
              )}
            </div>
            <Card>
              <CardContent className="p-1 sm:p-3">
                <DeliveryMap
                  currentLocation={currentLocation}
                  orders={availableOrders}
                  currentOrder={currentOrder}
                  height={400}
                  onMarkerClick={handleMarkerClick}
                />
              </CardContent>
            </Card>
          </div>

          {/* Orders Tabs */}
          <Tabs
            defaultValue="available"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="available" disabled={!!currentOrder}>
                Available Orders ({availableOrders.length})
              </TabsTrigger>
              <TabsTrigger value="current" disabled={!currentOrder}>
                Current Order {currentOrder ? "(1)" : "(0)"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-0">
              {availableOrders.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No available orders</AlertTitle>
                  <AlertDescription>
                    There are currently no orders available in your area. Please
                    check back later.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {nearbyOrders.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-medium">
                        Nearby Orders (within 5km)
                      </h3>
                      <div className="space-y-4">
                        {nearbyOrders.map((order) => (
                          <div
                            id={`order-card-${order.id}`}
                            key={order.id}
                            className={`transition-all duration-300 ${
                              selectedOrderId === order.id
                                ? "ring-2 ring-orange-500 shadow-lg rounded-lg"
                                : ""
                            }`}
                          >
                            <DeliveryOrderCard
                              order={order}
                              onSelect={() => setSelectedOrderId(order.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {furtherOrders.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-medium">
                        Other Available Orders
                      </h3>
                      <div className="space-y-4">
                        {furtherOrders.map((order) => (
                          <div
                            id={`order-card-${order.id}`}
                            key={order.id}
                            className={`transition-all duration-300 ${
                              selectedOrderId === order.id
                                ? "ring-2 ring-orange-500 shadow-lg rounded-lg"
                                : ""
                            }`}
                          >
                            <DeliveryOrderCard
                              order={order}
                              onSelect={() => setSelectedOrderId(order.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="current" className="mt-0">
              {currentOrder ? (
                <div className="space-y-4">
                  <DeliveryOrderCard order={currentOrder} showActions={false} />
                  <div className="flex justify-center">
                    <Link href={`/delivery/orders/${currentOrder.id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        View Order Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No active order</AlertTitle>
                  <AlertDescription>
                    You don't have any active orders at the moment. Accept an
                    order to get started.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
