"use client";

import { useState } from "react";
import { Edit, MoreVertical, Trash } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditFoodItemDialog } from "@/components/edit-food-item-dialog";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

interface FoodItemCardProps {
  item: FoodItem;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updatedItem: Partial<FoodItem>) => void;
}

// Category name mapping for common categories
const categoryNameMap: Record<string, string> = {
  appetizers: "Appetizer",
  "main-courses": "Main Course",
  main: "Main Course",
  desserts: "Dessert",
  beverages: "Beverage",
  sides: "Side",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export function FoodItemCard({
  item,
  onToggleAvailability,
  onDelete,
  onEdit,
}: FoodItemCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get a formatted category name
  const getCategoryDisplayName = (category: string): string => {
    // If we have a mapped name, use it
    if (categoryNameMap[category.toLowerCase()]) {
      return categoryNameMap[category.toLowerCase()];
    }

    // Otherwise, capitalize the first letter
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover"
        />
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/90"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">{item.name}</h3>
          <span className="font-medium text-orange-600">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={item.available}
            onCheckedChange={() => onToggleAvailability(item.id)}
            id={`available-${item.id}`}
          />
          <label htmlFor={`available-${item.id}`} className="text-sm">
            {item.available ? "Available" : "Unavailable"}
          </label>
        </div>
        <div className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
          {getCategoryDisplayName(item.category)}
        </div>
      </CardFooter>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {item.name} from your menu. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(item.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditFoodItemDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        item={item}
        onSave={(updatedItem) => {
          onEdit(item.id, updatedItem);
          setIsEditDialogOpen(false);
        }}
      />
    </Card>
  );
}
