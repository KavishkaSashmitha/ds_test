"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus } from "lucide-react"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface MenuItemOption {
  name: string
  choices: {
    id: string
    name: string
    price: number
  }[]
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  available: boolean
  options?: MenuItemOption[]
}

interface MenuItemCardProps {
  item: MenuItem
  restaurantId: string
  restaurantName: string
}

export function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemCardProps) {
  const { addToCart, getRestaurantId } = useCart()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({})

  const handleAddToCart = () => {
    if (!item.available) {
      return
    }

    // If there are options but the dialog hasn't been opened, show the dialog
    if (item.options && item.options.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true)
      return
    }

    // Check if adding from a different restaurant
    const currentRestaurantId = getRestaurantId()
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
      if (!window.confirm("Adding items from a different restaurant will clear your current cart. Continue?")) {
        return
      }
    }

    // Calculate additional price from options
    let additionalPrice = 0
    const selectedOptionsList: { name: string; value: string }[] = []

    if (item.options) {
      item.options.forEach((option) => {
        // Handle radio options (single select)
        const selectedOption = selectedOptions[option.name]
        if (selectedOption) {
          const choice = option.choices.find((c) => c.id === selectedOption)
          if (choice) {
            additionalPrice += choice.price
            selectedOptionsList.push({ name: option.name, value: choice.name })
          }
        }

        // Handle checkbox options (multi select)
        option.choices.forEach((choice) => {
          if (selectedAddons[choice.id]) {
            additionalPrice += choice.price
            selectedOptionsList.push({ name: "Add-on", value: choice.name })
          }
        })
      })
    }

    // Add item to cart
    addToCart({
      id: item.id + JSON.stringify(selectedOptionsList), // Make unique ID based on options
      restaurantId,
      restaurantName,
      name: item.name,
      price: item.price + additionalPrice,
      quantity,
      image: item.image,
      options: selectedOptionsList,
    })

    toast({
      title: "Added to cart",
      description: `${quantity}x ${item.name} added to your cart.`,
    })

    // Reset state
    setIsDialogOpen(false)
    setQuantity(1)
    setSelectedOptions({})
    setSelectedAddons({})
  }

  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value)
    }
  }

  return (
    <>
      <div
        className={`relative flex items-center gap-4 rounded-lg border p-4 transition-colors ${
          item.available ? "hover:border-orange-200 hover:bg-orange-50" : "opacity-50"
        }`}
      >
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{item.name}</h3>
          <p className="line-clamp-2 text-sm text-gray-600">{item.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-medium">${item.price.toFixed(2)}</span>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="h-8 bg-orange-500 hover:bg-orange-600"
              disabled={!item.available}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold text-lg">
            Unavailable
          </div>
        )}
      </div>

      {/* Item customization dialog */}
      {item.options && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{item.name}</DialogTitle>
              <DialogDescription>{item.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {item.options.map((option) => (
                <div key={option.name} className="grid gap-2">
                  <h4 className="font-medium">{option.name}</h4>
                  {option.name === "Add-ons" ? (
                    // Render checkboxes for add-ons
                    <div className="grid gap-2">
                      {option.choices.map((choice) => (
                        <div key={choice.id} className="flex items-center gap-2">
                          <Checkbox
                            id={choice.id}
                            checked={selectedAddons[choice.id] || false}
                            onCheckedChange={(checked) => {
                              setSelectedAddons({
                                ...selectedAddons,
                                [choice.id]: checked === true,
                              })
                            }}
                          />
                          <Label htmlFor={choice.id} className="flex-1">
                            {choice.name}
                          </Label>
                          <span className="text-sm text-gray-500">+${choice.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Render radio buttons for other options
                    <RadioGroup
                      value={selectedOptions[option.name] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions({
                          ...selectedOptions,
                          [option.name]: value,
                        })
                      }}
                    >
                      {option.choices.map((choice) => (
                        <div key={choice.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={choice.id} id={choice.id} />
                            <Label htmlFor={choice.id}>{choice.name}</Label>
                          </div>
                          {choice.price > 0 && (
                            <span className="text-sm text-gray-500">+${choice.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              ))}

              <div className="grid gap-2">
                <h4 className="font-medium">Quantity</h4>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                    className="h-8 w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddToCart} className="bg-orange-500 hover:bg-orange-600">
                Add to Cart - ${(item.price * quantity).toFixed(2)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
