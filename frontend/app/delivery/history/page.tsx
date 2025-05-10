"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { useDelivery } from "@/contexts/delivery-context"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeliveryHistoryCard } from "@/components/delivery-history-card"
import { Card, CardContent } from "@/components/ui/card"

export default function DeliveryHistoryPage() {
  const { orderHistory } = useDelivery()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter orders based on active tab and search query
  const filteredOrders = orderHistory.filter((order) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "delivered" && order.status === "delivered") ||
      (activeTab === "cancelled" && order.status === "cancelled")

    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Delivery History</h1>
        <p className="text-gray-600">View your past deliveries</p>
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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium">No orders found</p>
                <p className="text-center text-gray-500">
                  {searchQuery
                    ? "Try a different search term"
                    : activeTab === "all"
                      ? "You haven't completed any deliveries yet"
                      : `You don't have any ${activeTab} orders`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <DeliveryHistoryCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
