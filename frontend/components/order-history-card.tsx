import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
}

interface Order {
  id: string;
  date: string;
  restaurant: Restaurant;
  items: OrderItem[];
  total: number;
  status: string;
}

interface OrderHistoryCardProps {
  order: Order;
}

export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return (
      status.replace("_", " ").charAt(0).toUpperCase() +
      status.replace("_", " ").slice(1)
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={order.restaurant.image || "/placeholder.svg"}
                alt={order.restaurant.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{order.restaurant.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Order #{order.id}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDate(order.date)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="font-medium">${order.total.toFixed(2)}</p>
            <p className="text-sm text-gray-600">
              {order.items.reduce((total, item) => total + item.quantity, 0)}{" "}
              items
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {order.items.map((item, index) => (
              <span key={index}>
                {item.quantity}x {item.name}
                {index < order.items.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Link
          href={`/customer/orders/${order.id}`}
          className="text-sm text-gray-600 hover:text-orange-500"
        >
          View Order Details
        </Link>
        <Button
          variant="ghost"
          className="text-sm text-orange-500 hover:text-orange-600"
        >
          Reorder
        </Button>
      </CardFooter>
    </Card>
  );
}
