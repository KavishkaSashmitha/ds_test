"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Clock, Info, MapPin, Star, Truck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MenuItemCard } from "@/components/menu-item-card";
import { restaurantApi } from "@/lib/api";
import { Restaurant, MenuItem, BusinessHours } from "@/lib/api";

// Fallback mock menu categories (in case the API doesn't provide categories)
const menuCategories = [
  { id: "popular", name: "Popular Items" },
  { id: "starters", name: "Starters" },
  { id: "main", name: "Main Courses" },
  { id: "sides", name: "Sides" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" },
];

export default function RestaurantPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  // Fetch restaurant data and menu items
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        // Fetch restaurant details
        const restaurantResponse = await restaurantApi.getRestaurantById(
          restaurantId
        );
        setRestaurant(restaurantResponse.data.restaurant);

        if (restaurantResponse.data.businessHours) {
          setBusinessHours(restaurantResponse.data.businessHours);
        }

        // Fetch menu items
        const menuResponse = await restaurantApi.getMenuItems(restaurantId);

        // Check if the response has the expected structure
        const menuItemsData = Array.isArray(menuResponse.data)
          ? menuResponse.data
          : (menuResponse.data as any)?.menuItems || [];
        setMenuItems(menuItemsData);

        // Extract unique categories from menu items
        const uniqueCategories = new Set<string>();

        // Always include "all" category
        uniqueCategories.add("all");

        // Add categories from menu items
        if (Array.isArray(menuItemsData)) {
          menuItemsData.forEach((item) => {
            if (item.category) {
              uniqueCategories.add(item.category);
            }
            // Also mark featured items as "popular"
            if (item.featured) {
              uniqueCategories.add("popular");
            }
          });
        }

        // If API returns categories directly, use those too
        if (
          typeof menuResponse.data === "object" &&
          menuResponse.data !== null &&
          "categories" in menuResponse.data &&
          Array.isArray((menuResponse.data as any).categories)
        ) {
          (menuResponse.data as any).categories.forEach((category: string) => {
            uniqueCategories.add(category);
          });
        }

        // Transform to array of category objects
        const categoryArray = Array.from(uniqueCategories).map((categoryId) => {
          // Find matching predefined category if exists
          const predefinedCategory = menuCategories.find(
            (c) => c.id.toLowerCase() === categoryId.toLowerCase()
          );
          return {
            id: categoryId,
            name: predefinedCategory
              ? predefinedCategory.name
              : categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          };
        });

        // Sort categories with "all" and "popular" at the beginning
        const sortedCategories = categoryArray.sort((a, b) => {
          if (a.id === "all") return -1;
          if (b.id === "all") return 1;
          if (a.id === "popular") return -1;
          if (b.id === "popular") return 1;
          return a.name.localeCompare(b.name);
        });

        setCategories(sortedCategories);
        setActiveCategory("all");
      } catch (err) {
        console.error("Error fetching restaurant data:", err);
        setError("Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  // Get human-readable business hours
  const getFormattedBusinessHours = () => {
    if (!businessHours) return "Hours not available";

    // For simplicity, show a basic version of hours
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const openDays = days.filter((day) => {
      const daySchedule = businessHours[day as keyof typeof businessHours];
      return (
        daySchedule &&
        typeof daySchedule === "object" &&
        "isOpen" in daySchedule &&
        daySchedule.isOpen
      );
    });

    if (openDays.length === 0) return "Hours not available";

    // Get first open day's hours as example
    const firstOpenDay = openDays[0];
    const daySchedule =
      businessHours[firstOpenDay as keyof typeof businessHours];

    // Type check before accessing timeSlots
    if (
      !daySchedule ||
      typeof daySchedule !== "object" ||
      !("timeSlots" in daySchedule) ||
      !Array.isArray(daySchedule.timeSlots) ||
      daySchedule.timeSlots.length === 0
    ) {
      return "Hours not available";
    }

    const timeSlots = daySchedule.timeSlots;

    const { open, close } = timeSlots[0];

    // Format 24h time to 12h time
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    return `${formatTime(open)} - ${formatTime(close)}`;
  };

  // Filter menu items based on active category and search query
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "all" ||
      item.category === activeCategory ||
      (activeCategory === "popular" && item.featured);

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading restaurant information...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Restaurant not found</h2>
        <p className="mb-6 text-gray-600">
          The restaurant you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/customer/dashboard">
          <Button className="bg-orange-500 hover:bg-orange-600">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/customer/dashboard"
          className="mb-4 flex items-center text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to restaurants
        </Link>
      </div>

      {/* Restaurant Header */}
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="relative h-48 w-full md:h-64">
          <Image
            src={
              restaurant.images?.cover ||
              "/placeholder.svg?height=300&width=800"
            }
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <p className="text-gray-600">{restaurant.cuisine}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-600">
                <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                <span>{restaurant.rating?.average || "N/A"}</span>
                <span className="text-gray-500">
                  ({restaurant.rating?.count || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>20-30 min</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-orange-500" />
              <span>Delivery Fee: Contact restaurant</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-orange-500" />
              <span>{restaurant.address?.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4 text-orange-500" />
              <span>Min. order: Contact restaurant</span>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600">{restaurant.description}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="font-medium">Address:</span>{" "}
              {`${restaurant.address?.street}, ${restaurant.address?.city}, ${restaurant.address?.state} ${restaurant.address?.zipCode}`}
            </div>
            <div>
              <span className="font-medium">Hours:</span>{" "}
              {getFormattedBusinessHours()}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Menu</h2>
          <div className="mt-4">
            <Input
              type="search"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        <Tabs
          defaultValue="all"
          value={activeCategory}
          onValueChange={setActiveCategory}
        >
          <div className="mb-6 overflow-x-auto">
            <TabsList className="inline-flex w-auto">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-0">
            {filteredMenuItems.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border">
                <p className="text-lg font-medium">No items found</p>
                <p className="text-sm text-gray-500">
                  Try a different category or search term
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMenuItems.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={{
                      id: item._id || "",
                      name: item.name,
                      description: item.description,
                      price: item.price,
                      image:
                        item.image || "/placeholder.svg?height=120&width=120",
                      category: item.category,
                      options: item.options?.map((option) => ({
                        name: option.name,
                        choices: option.choices.map((choice) => ({
                          id: choice.name.toLowerCase().replace(/\s+/g, "-"),
                          name: choice.name,
                          price: choice.price,
                        })),
                      })),
                      available: item.isAvailable, // Pass availability status
                    }}
                    restaurantId={restaurant._id || ""}
                    restaurantName={restaurant.name}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
