"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Package,
  MapPin,
  Clock,
  User,
  Phone,
  AlertCircle,
  MapPinned,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TestHeader } from "@/components/test-header";
import { orderRoutes } from "@/lib/orderRoutes";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface Order {
  id: string;
  deliveryId?: string;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: OrderAddress;
}

export default function TestOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available");

  // Fetch orders ready for pickup
  const fetchReadyForPickupOrders = async () => {
    setIsLoading(true);
    try {
      // Use the official API route for orders ready for pickup
      const response = await orderRoutes.getReadyForPickupOrders();
      const data = response.data;

      if (data && data.orders) {
        setOrders(data.orders);
        toast({
          title: "Orders loaded",
          description: `Found ${data.orders.length} orders ready for pickup`,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Accept an order
  const acceptOrder = async (orderId: string) => {
    try {
      // Use the official API route to accept an order
      const response = await orderRoutes.acceptOrder(orderId);
      const data = response.data;

      toast({
        title: "Order accepted",
        description: "You have accepted this order for delivery.",
      });

      // Update the order status locally
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);

      // Set the selected order as the current order
      const acceptedOrder = orders.find((order) => order.id === orderId);
      if (acceptedOrder) {
        setSelectedOrder(acceptedOrder);
        setActiveTab("current");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Load orders on initial render
  useEffect(() => {
    fetchReadyForPickupOrders();
  }, []);

  return (
    <div className="container max-w-7xl mx-auto pb-8 px-4">
      <TestHeader />

      <h1 className="text-3xl font-bold mb-8 text-center">
        Orders Ready for Pickup
      </h1>

      <div className="mb-6 flex justify-end">
        <Button
          onClick={fetchReadyForPickupOrders}
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Package className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`} />
          Refresh Orders
        </Button>
      </div>

      <Tabs
        defaultValue="available"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Orders</TabsTrigger>
          <TabsTrigger value="current">Current Order</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {orders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No orders available</AlertTitle>
              <AlertDescription>
                There are currently no orders ready for pickup. Check back
                later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2 bg-orange-500 text-white">
                          {order.status.replace("_", " ")}
                        </Badge>
                        <CardTitle className="text-xl">
                          {order.restaurantName}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-gray-500">
                        {formatDate(order.createdAt)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Order Items
                        </h3>
                        <ul className="space-y-1">
                          {order.items.map((item, index) => (
                            <li
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                          <div className="text-sm">
                            <p>{order.deliveryAddress.street}</p>
                            <p>
                              {order.deliveryAddress.city},{" "}
                              {order.deliveryAddress.state}{" "}
                              {order.deliveryAddress.zipCode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <p className="text-sm">{order.customerName}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-sm">{order.customerPhone}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        onClick={() => acceptOrder(order.id)}
                      >
                        Accept Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="current">
          {selectedOrder ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 bg-green-500 text-white">
                        Accepted
                      </Badge>
                      <CardTitle className="text-xl">
                        {selectedOrder.restaurantName}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-gray-500">
                      {formatDate(selectedOrder.createdAt)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Order Details
                      </h3>
                      <ul className="space-y-1">
                        {selectedOrder.items.map((item, index) => (
                          <li
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax</span>
                          <span>{formatCurrency(selectedOrder.tax)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Delivery Fee</span>
                          <span>
                            {formatCurrency(selectedOrder.deliveryFee)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium mt-2">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500">
                        Delivery Information
                      </h3>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                        <div className="text-sm">
                          <p>{selectedOrder.deliveryAddress.street}</p>
                          <p>
                            {selectedOrder.deliveryAddress.city},{" "}
                            {selectedOrder.deliveryAddress.state}{" "}
                            {selectedOrder.deliveryAddress.zipCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">{selectedOrder.customerName}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">{selectedOrder.customerPhone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Call Customer
                      </Button>

                      <Button className="w-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Navigate to Restaurant
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No current order</AlertTitle>
              <AlertDescription>
                You haven't accepted any orders yet. Go to the Available Orders
                tab to accept an order.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
