"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { restaurantApi } from "@/lib/api";
import type { MenuItem, Restaurant } from "@/lib/api"; // Import the MenuItem and Restaurant types

// Extend the Restaurant type to include the missing properties
interface ExtendedRestaurant extends Restaurant {
  isOpen?: boolean;
  acceptingOrders?: boolean;
}

// Days of the week
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Initial hours
const initialHours = daysOfWeek.map((day) => ({
  day,
  isOpen: day !== "Sunday",
  openTime: "09:00",
  closeTime: "22:00",
}));

export default function RestaurantAvailability() {
  const [restaurantOpen, setRestaurantOpen] = useState(true); // Default to open
  const [acceptingOrders, setAcceptingOrders] = useState(true); // Default to accepting orders
  const [hours, setHours] = useState(initialHours);
  const [foodItems, setFoodItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState("hours");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null); // Add state for restaurantId

  // Fetch restaurant ID and status dynamically
  useEffect(() => {
    async function fetchRestaurantStatus() {
      try {
        setLoading(true);
        const response = await restaurantApi.getRestaurantByOwnerId("me");
        const restaurant = response.data.restaurant as ExtendedRestaurant; // Use the extended type
        if (restaurant) {
          const { _id, isOpen, acceptingOrders } = restaurant;
          setRestaurantId(_id ?? null);
          setRestaurantOpen(isOpen ?? true); // Default to true if undefined
          setAcceptingOrders(acceptingOrders ?? true); // Default to true if undefined
        } else {
          setError("No restaurant found for this account");
        }
      } catch (err) {
        console.error("Error fetching restaurant status:", err);
        setError("Failed to load restaurant status");
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantStatus();
  }, []);

  // Fetch menu items dynamically
  useEffect(() => {
    async function fetchMenuItems() {
      if (!restaurantId) return; // Wait until restaurantId is available

      try {
        setLoading(true);
        setError("");

        const response = await restaurantApi.getMenuItems(restaurantId); // Use the actual restaurantId

        const menuItemsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.menuItems || [];

        const formattedItems = menuItemsData.map((item: any) => ({
          id: item._id || "",
          name: item.name,
          category: item.category || "Uncategorized",
          available: item.isAvailable,
        }));

        setFoodItems(formattedItems);
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    }

    fetchMenuItems();
  }, [restaurantId]); // Fetch menu items when restaurantId is available

  // Update restaurant status
  const updateRestaurantStatus = async (field: "isOpen" | "acceptingOrders", value: boolean) => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      await restaurantApi.updateRestaurantStatus(restaurantId, { [field]: value });
      if (field === "isOpen") setRestaurantOpen(value);
      if (field === "acceptingOrders") setAcceptingOrders(value);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      setError(`Failed to update ${field}`);
    } finally {
      setLoading(false);
    }
  };

  // Update day hours
  const updateHours = (day: string, field: "isOpen" | "openTime" | "closeTime", value: any) => {
    setHours(hours.map((item) => (item.day === day ? { ...item, [field]: value } : item)));
  };

  // Toggle food item availability
  const toggleFoodAvailability = (id: string) => {
    setFoodItems(
      foodItems.map((item) =>
        item._id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Availability Management</h1>
        <p className="text-muted-foreground">Manage your restaurant's availability and menu items</p>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Restaurant Status</CardTitle>
            <CardDescription>Control your restaurant's overall availability</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="restaurant-open">Restaurant Open</Label>
                    <p className="text-sm text-muted-foreground">Turn off to mark your restaurant as closed</p>
                  </div>
                  <Switch
                    id="restaurant-open"
                    checked={restaurantOpen}
                    onCheckedChange={(checked) => updateRestaurantStatus("isOpen", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="accepting-orders">Accepting Orders</Label>
                    <p className="text-sm text-muted-foreground">Turn off to temporarily stop receiving new orders</p>
                  </div>
                  <Switch
                    id="accepting-orders"
                    checked={acceptingOrders}
                    onCheckedChange={(checked) => updateRestaurantStatus("acceptingOrders", checked)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage special situations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Estimated Preparation Time</Label>
                <Select defaultValue="15">
                  <SelectTrigger>
                    <SelectValue placeholder="Select preparation time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Special Notice</Label>
                <div className="flex gap-2">
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select notice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No special notice</SelectItem>
                      <SelectItem value="busy">We're very busy</SelectItem>
                      <SelectItem value="closing">Closing soon</SelectItem>
                      <SelectItem value="limited">Limited menu available</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Apply</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hours" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="hours">
            <Clock className="mr-2 h-4 w-4" />
            Business Hours
          </TabsTrigger>
          <TabsTrigger value="items">
            <Calendar className="mr-2 h-4 w-4" />
            Menu Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set your restaurant's operating hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hours.map((day) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <div className="w-28">
                      <span className="font-medium">{day.day}</span>
                    </div>
                    <Switch
                      checked={day.isOpen}
                      onCheckedChange={(checked) => updateHours(day.day, "isOpen", checked)}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <Select
                        value={day.openTime}
                        onValueChange={(value) => updateHours(day.day, "openTime", value)}
                        disabled={!day.isOpen}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Open" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            return (
                              <SelectItem key={`open-${hour}:00`} value={`${hour}:00`}>
                                {`${hour}:00`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={day.closeTime}
                        onValueChange={(value) => updateHours(day.day, "closeTime", value)}
                        disabled={!day.isOpen}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Close" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            return (
                              <SelectItem key={`close-${hour}:00`} value={`${hour}:00`}>
                                {`${hour}:00`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items Availability</CardTitle>
              <CardDescription>Manage which items are available for ordering</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-500">Loading menu items...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : (
                <div className="space-y-4">
                  {foodItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.isAvailable ? "Available" : "Unavailable"}</span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => toggleFoodAvailability(item._id ?? "")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
