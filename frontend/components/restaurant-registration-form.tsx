"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  password: string;
  confirmPassword: string;
  cuisine: string;
}

interface FormErrors {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  password: string;
  confirmPassword: string;
  cuisine: string;
}

export function RestaurantRegistrationForm() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    password: "",
    confirmPassword: "",
    cuisine: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    password: "",
    confirmPassword: "",
    cuisine: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Restaurant name validation
    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = "Restaurant name is required";
      isValid = false;
    }

    // Owner name validation
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    // Cuisine validation
    if (!formData.cuisine.trim()) {
      newErrors.cuisine = "Cuisine type is required";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Prepare address data with default location (to be updated later with proper geocoding)
      const addressParts = formData.address
        .split(",")
        .map((part) => part.trim());

      // Register the restaurant owner account
      await register(
        formData.ownerName,
        formData.email,
        formData.password,
        "restaurant",
        {
          phone: formData.phone,
          restaurantInfo: {
            name: formData.restaurantName,
            description: formData.description,
            cuisine: formData.cuisine,
            address: {
              street: addressParts[0] || formData.address,
              city: addressParts[1] || "",
              state: addressParts[2] || "",
              zipCode: addressParts[3] || "",
              country: "USA",
              location: {
                type: "Point",
                coordinates: [0, 0], // Default coordinates, to be updated later
              },
            },
          },
        }
      );

      toast({
        title: "Registration successful",
        description:
          "Your restaurant account has been created. You can now set up your restaurant profile.",
      });

      // The auth context will handle redirection to the restaurant dashboard
    } catch (error) {
      // Error handling is done in the auth context
      console.error("Restaurant registration error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="restaurantName">Restaurant Name</Label>
        <Input
          id="restaurantName"
          name="restaurantName"
          type="text"
          placeholder="e.g. Italian Delight"
          value={formData.restaurantName}
          onChange={handleChange}
          required
        />
        {errors.restaurantName && (
          <p className="text-xs text-red-500">{errors.restaurantName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuisine">Cuisine Type</Label>
        <Input
          id="cuisine"
          name="cuisine"
          type="text"
          placeholder="e.g. Italian, Chinese, Indian"
          value={formData.cuisine}
          onChange={handleChange}
          required
        />
        {errors.cuisine && (
          <p className="text-xs text-red-500">{errors.cuisine}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner Name</Label>
        <Input
          id="ownerName"
          name="ownerName"
          type="text"
          placeholder="e.g. John Smith"
          value={formData.ownerName}
          onChange={handleChange}
          required
        />
        {errors.ownerName && (
          <p className="text-xs text-red-500">{errors.ownerName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="restaurant@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="e.g. (123) 456-7890"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Restaurant Address</Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="e.g. 123 Main St, City, State, ZIP"
          value={formData.address}
          onChange={handleChange}
          required
        />
        {errors.address && (
          <p className="text-xs text-red-500">{errors.address}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Restaurant Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Tell us about your restaurant..."
          value={formData.description}
          onChange={handleChange}
          required
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-orange-500 text-white hover:bg-orange-600"
        disabled={isLoading}
      >
        {isLoading ? "Registering..." : "Register Restaurant"}
      </Button>
    </form>
  );
}
