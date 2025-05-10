"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleCheck, Clock, DollarSign, ShoppingBag } from "lucide-react"

export default function RestaurantDashboard() {
  const { user } = useAuth()

  // Mock data for dashboard
  const stats = [
    {
      title: "Today's Orders",
      value: "12",
      description: "3 pending",
      icon: <ShoppingBag className="h-5 w-5 text-orange-500" />,
    },
    {
      title: "Today's Revenue",
      value: "$348.50",
      description: "+12% from yesterday",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
    },
    {
      title: "Avg. Preparation Time",
      value: "18 min",
      description: "2 min faster than avg",
      icon: <Clock className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Completed Orders",
      value: "9",
      description: "75% completion rate",
      icon: <CircleCheck className="h-5 w-5 text-green-500" />,
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Restaurant Owner"}</h1>
        <p className="text-muted-foreground">Here's what's happening with your restaurant today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((order) => (
                <div key={order} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Order #{Math.floor(Math.random() * 10000)}</div>
                    <div className="text-sm text-muted-foreground">2 items • $24.99</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                      Pending
                    </div>
                    <button className="text-xs text-orange-500 hover:underline">View</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
            <CardDescription>Your best-selling menu items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Chicken Burger", "Margherita Pizza", "Beef Tacos"].map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <div>
                      <div className="font-medium">{item}</div>
                      <div className="text-sm text-muted-foreground">{20 - index * 3} orders today</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">${(12.99 - index * 1.5).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
