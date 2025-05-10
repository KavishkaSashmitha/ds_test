"use client";

import { useState } from "react";
import { useDelivery } from "@/contexts/delivery-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryOrderCard } from "@/components/delivery-order-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DeliveryOrdersPage() {
  const { availableOrders } = useDelivery();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders based on search query
  const filteredOrders = availableOrders.filter((order) => {
    return (
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Active Delivery Orders</h1>
        <p className="text-gray-600">
          Manage and track your active delivery orders
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID, restaurant, or customer..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="mb-2 text-center text-lg font-medium">
              No active orders found
            </p>
            <p className="text-center text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "You currently have no active delivery orders."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <DeliveryOrderCard
              key={order.id}
              order={order}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
