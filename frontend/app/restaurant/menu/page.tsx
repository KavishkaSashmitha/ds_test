"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddFoodItemDialog } from "@/components/add-food-item-dialog";
import { FoodItemCard } from "@/components/food-item-card";
import { restaurantApi } from "@/lib/api";
import type { MenuItem } from "@/lib/api";

// Default food categories
const defaultCategories = [
  { id: "all", name: "All Items" },
  { id: "appetizers", name: "Appetizers" },
  { id: "main-courses", name: "Main Courses" },
  { id: "desserts", name: "Desserts" },
  { id: "beverages", name: "Beverages" },
];

export default function RestaurantMenu() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [categories, setCategories] = useState(defaultCategories);

  // Find restaurant owned by the current user
  useEffect(() => {
    async function fetchRestaurant() {
      if (!user?._id) return;

      try {
        // Get restaurant by owner ID
        const response = await restaurantApi.getRestaurantByOwnerId("me");
        if (response.data.restaurant) {
          setRestaurant({
            id: response.data.restaurant._id || "",
            name: response.data.restaurant.name,
          });

          // Now that we have the restaurant ID, fetch menu items
          fetchMenuItems(response.data.restaurant._id || "");
        } else {
          setError("No restaurant found for this account");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        setError("Failed to load restaurant information");
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [user]);

  // Fetch menu items for the restaurant
  const fetchMenuItems = async (restaurantId: string) => {
    try {
      setLoading(true);
      const response = await restaurantApi.getMenuItems(restaurantId);

      // Check if the response has the expected structure
      const menuItemsData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.menuItems || [];
      setMenuItems(menuItemsData);

      // Extract unique categories from menu items
      const uniqueCategories = new Set<string>();
      uniqueCategories.add("all"); // Always include "all" category

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
        typeof response.data === "object" &&
        response.data !== null &&
        "categories" in response.data &&
        Array.isArray((response.data as any).categories)
      ) {
        (response.data as any).categories.forEach((category: string) => {
          uniqueCategories.add(category);
        });
      }

      // Transform to array of category objects
      const categoryArray = Array.from(uniqueCategories).map((categoryId) => {
        // Find matching predefined category if exists
        const predefinedCategory = defaultCategories.find(
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
      setError("");
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  // Add new food item
  const handleAddFoodItem = async (newItem: any) => {
    if (!restaurant?.id) {
      toast({
        title: "Error",
        description: "Restaurant information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the item for the API
      const menuItemData = {
        restaurantId: restaurant.id,
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image: "/placeholder.svg?height=100&width=100", // Default image
        isAvailable: true,
        featured: false,
        isVegetarian: newItem.isVegetarian || false,
        isVegan: newItem.isVegan || false,
        isGlutenFree: newItem.isGlutenFree || false,
        preparationTime: 15, // Default preparation time in minutes
      };

      // Create the menu item through API
      const response = await restaurantApi.createMenuItem(menuItemData);

      // Add the new menu item to state
      setMenuItems([...menuItems, response.data]);

      toast({
        title: "Success",
        description: "Menu item added successfully",
      });

      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding menu item:", err);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  // Toggle food item availability
  const toggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find((i) => i._id === id);
      if (!item) return;

      // Correct the API endpoint for updating menu item availability
      await restaurantApi.updateMenuItem(`/item/${id}`, {
        isAvailable: !item.isAvailable,
      });


      // Update local state
      setMenuItems(
        menuItems.map((item) =>
          item._id === id ? { ...item, isAvailable: !item.isAvailable } : item
        )
      );

      toast({
        title: "Success",
        description: `Item ${
          !item.isAvailable ? "available" : "unavailable"
        } for ordering`,
      });
    } catch (err) {
      console.error("Error toggling availability:", err);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  // Delete food item
  const deleteItem = async (id: string) => {
    try {
      // Adjust the API endpoint for deleting a menu item
      await restaurantApi.deleteMenuItem(`/item/${id}`);

      // Update local state
      setMenuItems(menuItems.filter((item) => item._id !== id));

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting menu item:", err);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  // Edit food item
  const handleEditFoodItem = async (id: string, updatedItem: Partial<MenuItem>) => {
    try {
      // Adjust the API endpoint for updating a menu item
      await restaurantApi.updateMenuItem(`/item/${id}`, updatedItem);

      // Update local state with the edited item
      setMenuItems(
        menuItems.map((item) =>
          item._id === id ? { ...item, ...updatedItem } : item
        )
      );

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
    } catch (err) {
      console.error("Error editing menu item:", err);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  // Filter food items based on active tab and search query
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeTab === "all" || item.category === activeTab;

    const matchesSearch =
      (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            {restaurant
              ? `Manage menu items for ${restaurant.name}`
              : "Manage your restaurant's menu items"}
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-orange-500 hover:bg-orange-600"
          disabled={!restaurant || loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-lg bg-gray-200"
                ></div>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium">Error</p>
                <p className="text-center text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => restaurant && fetchMenuItems(restaurant.id)}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-2 text-center text-lg font-medium">
                  No items found
                </p>
                <p className="text-center text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first menu item by clicking the 'Add Item' button"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <FoodItemCard
                  key={item._id}
                  item={{
                    id: item._id || "",
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    image:
                      item.image || "/placeholder.svg?height=100&width=100",
                    available: item.isAvailable,
                  }}
                  onToggleAvailability={toggleAvailability}
                  onDelete={deleteItem}
                  onEdit={handleEditFoodItem} // Pass the onEdit function
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddFoodItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddFoodItem}
        categories={categories.filter((c) => c.id !== "all")}
      />
    </div>
  );
}
