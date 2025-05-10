"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Filter, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RestaurantCard } from "@/components/restaurant-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { restaurantApi, Restaurant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");

  // Cuisine types for filter dropdown
  const cuisineTypes = [
    "All",
    "American",
    "Italian",
    "Japanese",
    "Indian",
    "Mexican",
    "Chinese",
    "Thai",
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [cuisineFilter, sortBy]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      // Build search parameters
      const params: Record<string, any> = {
        sort: sortBy,
        limit: 20,
      };

      if (cuisineFilter && cuisineFilter !== "All") {
        params.cuisine = cuisineFilter;
      }

      // Call API to get restaurants
      const response = await restaurantApi.searchRestaurants(params);
      // Check if the response data exists and has the expected structure
      if (
        response &&
        response.data &&
        Array.isArray(response.data.restaurants)
      ) {
        setRestaurants(response.data.restaurants);
      } else {
        // Fallback to empty array if structure is unexpected
        setRestaurants([]);
        console.warn("Unexpected API response structure:", response);
      }
    } catch (err: any) {
      console.error("Error fetching restaurants:", err);
      setError(err.response?.data?.message || "Failed to load restaurants");
      toast({
        title: "Error",
        description: "Failed to load restaurants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter restaurants based on active tab and search query
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "featured" && restaurant.rating.average >= 4.5);

    const matchesSearch =
      searchQuery === "" ||
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link
          href="/customer/dashboard"
          className="mb-4 flex items-center text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <p className="text-gray-600">Find your favorite restaurants</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for restaurants or cuisines..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by cuisine" />
            </SelectTrigger>
            <SelectContent>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="distance">Nearest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Restaurants</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
              <span className="ml-3">Loading restaurants...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium text-red-500">
                  Error loading restaurants
                </p>
                <p className="mb-6 text-center text-gray-500">{error}</p>
                <Button
                  onClick={() => fetchRestaurants()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredRestaurants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium">
                  No restaurants found
                </p>
                <p className="text-center text-gray-500">
                  {searchQuery
                    ? "Try a different search term"
                    : "No restaurants available for the selected filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={{
                    id: restaurant._id || "",
                    name: restaurant.name,
                    image: restaurant.images?.cover || "/placeholder.svg",
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating.average,
                    deliveryTime: "20-30 min", // This would come from a real API
                    deliveryFee: 2.99, // This would come from a real API
                    minOrder: 10, // This would come from a real API
                    distance: "1.2 km", // This would come from a real API
                    featured: restaurant.rating.average >= 4.5,
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
