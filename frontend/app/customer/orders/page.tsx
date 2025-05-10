"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistoryCard } from "@/components/order-history-card";
import { Order, OrderStatus } from "@/lib/api";
import { orderApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface OrderStatusGroup {
  id: string;
  name: string;
  statuses?: OrderStatus[];
}

// Order status groupings
const orderStatuses: OrderStatusGroup[] = [
  { id: "all", name: "All Orders" },
  {
    id: "active",
    name: "Active",
    statuses: [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
    ],
  },
  { id: "completed", name: "Completed", statuses: ["delivered"] },
  { id: "cancelled", name: "Cancelled", statuses: ["cancelled"] },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Get status filter based on active tab
        const activeGroup = orderStatuses.find((s) => s.id === activeTab);
        const statusFilter = activeGroup?.statuses
          ? activeGroup.statuses[0]
          : undefined;

        // Make API call to get orders
        const response = await orderApi.getCustomerOrders({
          status: statusFilter,
          page: 1,
          limit: 20,
        });

        setOrders(response.data.orders);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError(err.response?.data?.message || "Failed to load orders");
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, toast]);

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const orderId = order._id || "";
    const restaurantId = order.restaurantId || "";
    const itemNames =
      order.items?.map((item) => item.name.toLowerCase()).join(" ") || "";

    const searchLower = searchQuery.toLowerCase();

    return (
      orderId.toLowerCase().includes(searchLower) ||
      restaurantId.toLowerCase().includes(searchLower) ||
      itemNames.includes(searchLower)
    );
  });

  // Function to format date
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-gray-600">View and track your orders</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID or restaurant..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          {orderStatuses.map((status) => (
            <TabsTrigger key={status.id} value={status.id}>
              {status.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
              <span>Loading orders...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium text-red-500">
                  Error loading orders
                </p>
                <p className="mb-6 text-center text-gray-500">{error}</p>
                <Button
                  onClick={() => handleTabChange(activeTab)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Clock className="mb-2 h-10 w-10 text-gray-400" />
                <p className="mb-2 text-center text-lg font-medium">
                  No orders found
                </p>
                <p className="mb-6 text-center text-gray-500">
                  {searchQuery
                    ? "Try a different search term"
                    : activeTab === "all"
                    ? "You haven't placed any orders yet"
                    : `You don't have any ${activeTab.toLowerCase()} orders`}
                </p>
                <Link href="/customer/restaurants">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Browse Restaurants
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Link
                  href={`/customer/orders/${order._id}`}
                  key={order._id}
                  className="block transition-opacity hover:opacity-90"
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              Order #{order._id?.slice(-6).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-600"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              {order.status
                                ?.replace(/_/g, " ")
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium">
                            Restaurant ID: {order.restaurantId}
                          </p>
                        </div>

                        <div className="mb-3">
                          {order.items.slice(0, 2).map((item, index) => (
                            <p key={index} className="text-sm">
                              {item.quantity}× {item.name}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-500">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            ${order.total.toFixed(2)}
                          </span>
                          <Button variant="outline" size="sm" className="h-8">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
