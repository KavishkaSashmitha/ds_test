"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { VehicleType } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicleType: VehicleType;
  licenseNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicleType: string;
  licenseNumber: string;
  password: string;
  confirmPassword: string;
}

export function DeliveryRegistrationForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    vehicleType: "motorcycle",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    phone: "",
    address: "",
    vehicleType: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleVehicleTypeChange = (value: VehicleType) => {
    setFormData((prev) => ({ ...prev, vehicleType: value }));
    if (errors.vehicleType) {
      setErrors((prev) => ({ ...prev, vehicleType: "" }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
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

    // License number validation
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
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
      // Create a simple address object from the address string
      const addressParts = formData.address
        .split(",")
        .map((part) => part.trim());

      await register(
        formData.name,
        formData.email,
        formData.password,
        "delivery",
        {
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          licenseNumber: formData.licenseNumber,
          address: {
            street: addressParts[0] || formData.address,
            city: addressParts[1] || "",
            state: addressParts[2] || "",
            zipCode: addressParts[3] || "",
            country: "USA",
            location: {
              type: "Point",
              coordinates: [0, 0], // Default coordinates, would be updated later
            },
          },
        }
      );

      // Registration is successful if we get here
      // The auth context will handle redirection
      toast({
        title: "Registration successful",
        description: "Your delivery account has been created successfully.",
      });
    } catch (error) {
      // Error handling is done in the auth context
      console.error("Delivery registration error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your.email@example.com"
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
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="123 Main St, City, Country"
          value={formData.address}
          onChange={handleChange}
          required
        />
        {errors.address && (
          <p className="text-xs text-red-500">{errors.address}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleType">Vehicle Type</Label>
        <Select
          value={formData.vehicleType}
          onValueChange={(value) =>
            handleVehicleTypeChange(value as VehicleType)
          }
        >
          <SelectTrigger id="vehicleType">
            <SelectValue placeholder="Select vehicle type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bicycle">Bicycle</SelectItem>
            <SelectItem value="motorcycle">Motorcycle</SelectItem>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="scooter">Scooter</SelectItem>
            <SelectItem value="van">Van</SelectItem>
          </SelectContent>
        </Select>
        {errors.vehicleType && (
          <p className="text-xs text-red-500">{errors.vehicleType}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseNumber">Driver's License Number</Label>
        <Input
          id="licenseNumber"
          name="licenseNumber"
          placeholder="DL12345678"
          value={formData.licenseNumber}
          onChange={handleChange}
          required
        />
        {errors.licenseNumber && (
          <p className="text-xs text-red-500">{errors.licenseNumber}</p>
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
        className="w-full bg-orange-500 hover:bg-orange-600"
        disabled={isLoading}
      >
        {isLoading ? "Registering..." : "Register as Delivery Partner"}
      </Button>
    </form>
  );
}
