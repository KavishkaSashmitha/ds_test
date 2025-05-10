"use client"

import { useState } from "react"
import { BarChart, Calendar, DollarSign } from "lucide-react"

import { useDelivery } from "@/contexts/delivery-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock earnings data
const mockEarningsData = {
  daily: [
    { date: "2023-06-01", earnings: 45.75, deliveries: 6, hours: 4.5 },
    { date: "2023-06-02", earnings: 52.25, deliveries: 7, hours: 5.0 },
    { date: "2023-06-03", earnings: 38.5, deliveries: 5, hours: 4.0 },
    { date: "2023-06-04", earnings: 60.0, deliveries: 8, hours: 6.0 },
    { date: "2023-06-05", earnings: 42.75, deliveries: 6, hours: 4.5 },
    { date: "2023-06-06", earnings: 35.75, deliveries: 5, hours: 3.5 },
    { date: "2023-06-07", earnings: 48.25, deliveries: 7, hours: 5.0 },
  ],
  weekly: [
    { week: "May 29 - Jun 4", earnings: 196.5, deliveries: 26, hours: 19.5 },
    { week: "Jun 5 - Jun 11", earnings: 245.5, deliveries: 32, hours: 24.0 },
    { week: "Jun 12 - Jun 18", earnings: 210.75, deliveries: 28, hours: 21.5 },
    { week: "Jun 19 - Jun 25", earnings: 225.25, deliveries: 30, hours: 22.0 },
  ],
  monthly: [
    { month: "January", earnings: 850.25, deliveries: 112, hours: 85.0 },
    { month: "February", earnings: 780.5, deliveries: 104, hours: 78.0 },
    { month: "March", earnings: 920.75, deliveries: 122, hours: 92.0 },
    { month: "April", earnings: 875.25, deliveries: 116, hours: 87.5 },
    { month: "May", earnings: 950.5, deliveries: 126, hours: 95.0 },
    { month: "June", earnings: 450.25, deliveries: 60, hours: 45.0 },
  ],
}

export default function EarningsPage() {
  const { earnings } = useDelivery()
  const [activeTab, setActiveTab] = useState("daily")
  const [dateRange, setDateRange] = useState({
    start: "2023-06-01",
    end: "2023-06-07",
  })

  // Get data based on active tab
  const data = mockEarningsData[activeTab as keyof typeof mockEarningsData]

  // Calculate totals
  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0)
  const totalDeliveries = data.reduce((sum, item) => sum + item.deliveries, 0)
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0)
  const averagePerDelivery = totalEarnings / totalDeliveries
  const averagePerHour = totalEarnings / totalHours

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-600">Track your delivery earnings and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${earnings.today.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${earnings.week.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${earnings.month.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Per Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${averagePerDelivery.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Date Range:</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-auto"
                />
              </div>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Tabs */}
      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>
                {activeTab === "daily"
                  ? "Your daily earnings for the selected period"
                  : activeTab === "weekly"
                    ? "Your weekly earnings for the selected period"
                    : "Your monthly earnings for the selected period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Total Earnings</div>
                  <div className="mt-1 text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Total Deliveries</div>
                  <div className="mt-1 text-2xl font-bold">{totalDeliveries}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Avg. Per Hour</div>
                  <div className="mt-1 text-2xl font-bold">${averagePerHour.toFixed(2)}</div>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">
                        {activeTab === "daily" ? "Date" : activeTab === "weekly" ? "Week" : "Month"}
                      </th>
                      <th className="py-2 text-right font-medium">Deliveries</th>
                      <th className="py-2 text-right font-medium">Hours</th>
                      <th className="py-2 text-right font-medium">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          {activeTab === "daily"
                            ? new Date(item.date).toLocaleDateString()
                            : activeTab === "weekly"
                              ? item.week
                              : item.month}
                        </td>
                        <td className="py-3 text-right">{item.deliveries}</td>
                        <td className="py-3 text-right">{item.hours}</td>
                        <td className="py-3 text-right font-medium">${item.earnings.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Earnings Chart (Placeholder) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
          <CardDescription>Visual representation of your earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
            <div className="text-center">
              <BarChart className="mx-auto mb-2 h-10 w-10 text-gray-400" />
              <p className="text-gray-500">Earnings chart visualization would appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
