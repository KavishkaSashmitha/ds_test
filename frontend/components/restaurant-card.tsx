import Link from "next/link"
import Image from "next/image"
import { Clock, Star, Truck, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface Restaurant {
  id: string
  name: string
  image: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  minOrder: number
  distance: string
  featured?: boolean
  isActive?: boolean
  acceptingOrders?: boolean
  specialNotice?: string | null
}

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  // Check if restaurant is closed or not accepting orders
  const isClosed = restaurant.isActive === false
  const notAcceptingOrders = restaurant.acceptingOrders === false

  return (
    <Link href={`/customer/restaurants/${restaurant.id}`}>
      <div
        className={`group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${isClosed ? "opacity-70" : ""}`}
      >
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={restaurant.image || "/placeholder.svg"}
            alt={restaurant.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isClosed ? "grayscale" : ""}`}
          />
          {restaurant.featured && (
            <Badge className="absolute left-2 top-2 bg-orange-500 hover:bg-orange-600">Featured</Badge>
          )}
          {isClosed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Badge className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm">CLOSED</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{restaurant.name}</h3>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{restaurant.rating}</span>
            </div>
          </div>
          <p className="mb-3 text-sm text-gray-600">{restaurant.cuisine}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              <span>${restaurant.deliveryFee.toFixed(2)} delivery</span>
            </div>
            <div>
              <span>Min. ${restaurant.minOrder}</span>
            </div>
          </div>

          {/* Status indicators */}
          {(isClosed || notAcceptingOrders || restaurant.specialNotice) && (
            <div className="mt-3 pt-2 border-t">
              {isClosed && (
                <div className="flex items-center text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Currently closed</span>
                </div>
              )}

              {!isClosed && notAcceptingOrders && (
                <div className="flex items-center text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Not accepting orders</span>
                </div>
              )}

              {restaurant.specialNotice && (
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {restaurant.specialNotice === "busy" && "Very busy right now"}
                    {restaurant.specialNotice === "closing" && "Closing soon"}
                    {restaurant.specialNotice === "limited" && "Limited menu available"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
