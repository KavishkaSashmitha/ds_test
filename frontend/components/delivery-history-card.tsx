"use client"

import { Clock, DollarSign, MapPin } from "lucide-react"

import type { DeliveryOrder } from "@/contexts/delivery-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DeliveryHistoryCardProps {
  order: DeliveryOrder
}

export function DeliveryHistoryCard({ order }: DeliveryHistoryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-medium">{order.restaurantName}</h3>
              <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
            </div>
            <p className="text-sm text-gray-600">Order #{order.id}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{order.distance.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>${order.earnings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="font-medium">${order.total.toFixed(2)}</p>
            <p className="text-sm text-gray-600">
              {order.items.reduce((total, item) => total + item.quantity, 0)} items
            </p>
            <p className="text-sm text-gray-600">{order.estimatedTime}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border p-3">
          <div>
            <p className="text-xs font-medium text-gray-500">PICKUP</p>
            <p className="text-sm">{order.restaurantAddress}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">DELIVERY</p>
            <p className="text-sm">{order.customerAddress}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
