"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Category {
  id: string
  name: string
}

interface AddFoodItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: any) => void
  categories: Category[]
}

export function AddFoodItemDialog({ isOpen, onClose, onAdd, categories }: AddFoodItemDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      let imageUrl = "/placeholder.svg?height=100&width=100" // Default image

      // If there's an image file, upload it
      if (imageFile) {
        // In a real application, you would upload the image to your server or a service like Cloudinary/S3
        // For now, we'll simulate an upload and use the preview as the URL
        // This is just for demonstration - in production, implement proper image upload

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // In a real app, you would get the URL from your upload response
        imageUrl = imagePreview || imageUrl
      }

      // Call the onAdd function with form data and image URL
      onAdd({
        ...formData,
        price: Number.parseFloat(formData.price),
        image: imageUrl,
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        available: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error adding menu item:", error)
      alert("Failed to add menu item. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>Create a new food item for your restaurant menu.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Chicken Burger"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your food item..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="9.99"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={handleSelectChange} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload Section */}
            <div className="grid gap-2">
              <Label htmlFor="image">Item Image</Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-md overflow-hidden">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Food item preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
                <Input
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Dietary Options */}
            <div className="grid gap-2">
              <Label>Dietary Options</Label>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isVegetarian"
                    checked={formData.isVegetarian}
                    onCheckedChange={(checked) => handleSwitchChange("isVegetarian", checked)}
                  />
                  <Label htmlFor="isVegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isVegan"
                    checked={formData.isVegan}
                    onCheckedChange={(checked) => handleSwitchChange("isVegan", checked)}
                  />
                  <Label htmlFor="isVegan">Vegan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onCheckedChange={(checked) => handleSwitchChange("isGlutenFree", checked)}
                  />
                  <Label htmlFor="isGlutenFree">Gluten Free</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="available">Available</Label>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleSwitchChange("available", checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isUploading}>
              {isUploading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
