"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { orderApi, Order, OrderStatus, restaurantApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/order-card";
import { useToast } from "@/hooks/use-toast";

interface OrderStatusOption {
  id: string;
  name: string;
}

// Order statuses
const orderStatuses: OrderStatusOption[] = [
  { id: "all", name: "All Orders" },
  { id: "pending", name: "Pending" },
  { id: "confirmed", name: "Confirmed" },
  { id: "preparing", name: "Preparing" },
  { id: "ready_for_pickup", name: "Ready for Pickup" },
  { id: "out_for_delivery", name: "Out for Delivery" },
  { id: "delivered", name: "Delivered" },
  { id: "cancelled", name: "Cancelled" },
];

// Interface for the format expected by OrderCard component
interface FormattedOrder {
  id: string;
  customerName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string;
  time: string;
  address: string;
  phone: string;
}

export default function RestaurantOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // First fetch the restaurant ID for the current user
  useEffect(() => {
    if (!user?._id) return;

    const fetchRestaurantId = async () => {
      try {
        const response = await restaurantApi.getRestaurantByOwnerId("me");
        if (response.data.restaurant && response.data.restaurant._id) {
          setRestaurantId(response.data.restaurant._id);
        } else {
          setError("No restaurant found for this account");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch restaurant:", err);
        setError("Failed to find your restaurant. Please try again.");
        toast({
          title: "Error",
          description: "Could not find restaurant information.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchRestaurantId();
  }, [user, toast]);

  // Then fetch orders once we have the restaurant ID
  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Correct the API endpoint for fetching orders
        const response = await orderApi.getRestaurantOrders(`order/restaurants/${restaurantId}/orders`, {
          status: activeTab !== "all" ? (activeTab as OrderStatus) : undefined,
        });

        setOrders(response.data.orders || []);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again.");
        toast({
          title: "Error",
          description: "Could not load orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurantId, activeTab, toast]);

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    return (
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);

      if (!restaurantId) {
        toast({
          title: "Error",
          description: "Restaurant information is missing. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      // Refresh the orders list
      const response = await orderApi.getRestaurantOrders(restaurantId, {
        status: activeTab !== "all" ? (activeTab as OrderStatus) : undefined,
      });

      setOrders(response.data.orders || []);

      toast({
        title: "Status Updated",
        description: "Order status has been successfully updated.",
      });
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      toast({
        title: "Error",
        description: "Could not update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format order data for the OrderCard component
  const formatOrderForCard = (order: Order): FormattedOrder => {
    return {
      id: order._id || "",
      customerName: `Customer ${order.customerId.substring(0, 8)}...`, // Using shortened ID for demo
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      status: order.status,
      time: new Date(order.createdAt || Date.now()).toLocaleString(),
      address: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
      phone: "Contact through app", // For privacy reasons, use generic text
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or customer ID..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Export</Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap">
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
                    : "You don't have any orders in this category"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={formatOrderForCard(order)}
                  onUpdateStatus={updateOrderStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
