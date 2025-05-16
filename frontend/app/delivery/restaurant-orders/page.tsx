"use client";

import { useState, useEffect } from "react";
import { MapPin, List, Search } from "lucide-react";
import { useDelivery } from "@/contexts/delivery-context";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeliveryOrderCard } from "@/components/delivery-order-card";
import { useToast } from "@/hooks/use-toast";
import { orderApi, OrderStatus } from "@/lib/api";
import DeliveryMap from "@/components/delivery-map";

interface OrderStatusOption {
  id: string;
  name: string;
}

// Order statuses
const orderStatuses: OrderStatusOption[] = [
  { id: "all", name: "All Orders" },
  { id: "ready_for_pickup", name: "Ready for Pickup" },
  { id: "out_for_delivery", name: "Out for Delivery" },
  { id: "delivered", name: "Delivered" },
  { id: "cancelled", name: "Cancelled" },
];

export default function RestaurantOrdersForDelivery() {
  const { toast } = useToast();
  const { acceptOrder, isLoading, currentLocation } = useDelivery();
  const [activeTab, setActiveTab] = useState<string>("ready_for_pickup");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  // Function to fetch restaurant orders that are ready for pickup
  const fetchRestaurantOrders = async () => {
    try {
      setLoading(true);
      // Call the API to get orders that are ready for pickup
      const response = await orderApi.getRestaurantOrders("all", {
        page: 1,
        limit: 50,
      });

      if (response.data.orders) {
        // Format orders for display
        const formattedOrders = response.data.orders.map((order) => ({
          id: order._id || "",
          restaurantId: order.restaurantId,
          restaurantName:
            (order as any).restaurantName ||
            `Restaurant #${order.restaurantId.substring(0, 5)}`,
          restaurantAddress: `${order.deliveryAddress?.street || ""}, ${
            order.deliveryAddress?.city || ""
          }`,
          restaurantLocation: {
            lat: order.deliveryAddress?.location?.coordinates?.[1] || 6.9271,
            lng: order.deliveryAddress?.location?.coordinates?.[0] || 79.8612,
          },
          customerName:
            order.customerName ||
            `Customer #${order.customerId.substring(0, 5)}`,
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
          status: order.status,
          distance: 0,
          estimatedTime: "15-20 min",
          earnings: Math.round(order.total * 0.1),
          createdAt: order.createdAt?.toString() || new Date().toISOString(),
        }));

        setRestaurantOrders(formattedOrders);
        setError(null);
      } else {
        setRestaurantOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch restaurant orders:", err);
      setError("Failed to load restaurant orders. Please try again.");
      toast({
        title: "Error",
        description: "Could not load restaurant orders. Please try again.",
        variant: "destructive",
      });

      setRestaurantOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Call the fetch function when component mounts
  useEffect(() => {
    fetchRestaurantOrders();
  }, []);

  // Filter orders based on active tab and search query
  const filteredOrders = restaurantOrders.filter((order) => {
    const matchesStatus = activeTab === "all" || order.status === activeTab;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle order acceptance
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);

      // Remove the accepted order from the list
      setRestaurantOrders(
        restaurantOrders.filter((order) => order.id !== orderId)
      );

      toast({
        title: "Order Accepted",
        description: "You have successfully accepted this order",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        title: "Failed to Accept Order",
        description:
          "There was an error accepting this order. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle selection on the map
  const handleMapOrderSelection = (orderId: string) => {
    try {
      acceptOrder(orderId);

      // Remove the accepted order from the list
      setRestaurantOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );

      toast({
        title: "Order Accepted",
        description: "You have successfully accepted this order",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        title: "Failed to Accept Order",
        description:
          "There was an error accepting this order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Restaurant Orders</h1>
        <p className="text-muted-foreground">
          View and accept orders ready for pickup
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, restaurant, or customer..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("map")}
            className="h-10 w-10 rounded-full"
          >
            <MapPin className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-10 w-10 rounded-full"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={() => {
            // Refresh the orders list
            setLoading(true);
            fetchRestaurantOrders();
          }}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      <Tabs
        defaultValue="ready_for_pickup"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          {orderStatuses.map((status) => (
            <TabsTrigger key={status.id} value={status.id}>
              {status.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-10">
                <p>Loading orders...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center justify-center py-10">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium">
                  No orders found
                </p>
                <p className="text-center text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "There are no orders ready for pickup"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "map" && (
                <div className="mb-4">
                  <DeliveryMap
                    currentLocation={currentLocation}
                    orders={filteredOrders}
                    height={400}
                    onMarkerClick={handleMapOrderSelection}
                  />
                </div>
              )}
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    showActions={true}
                    onSelect={handleAcceptOrder}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
