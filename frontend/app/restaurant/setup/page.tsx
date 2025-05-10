"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { restaurantApi } from "@/lib/api";
import { Steps, StepContent } from "@/components/steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const steps = [
  {
    title: "Basic Restaurant Details",
    description: "Provide essential information about your restaurant",
  },
  {
    title: "Address & Contact",
    description: "Add your restaurant location and contact information",
  },
  {
    title: "Additional Information",
    description: "Tell us more about your restaurant",
  },
];

export default function RestaurantSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic details
    name: "",
    cuisine: "",
    description: "",
    
    // Step 2: Address & Contact
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: user?.email || "",
    website: "",
    
    // Step 3: Additional info
    priceRange: "$" as "$" | "$$" | "$$$" | "$$$$",
    openingHours: "09:00",
    closingHours: "22:00",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const restaurantData = {
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates: [0, 0] as [number, number], // Default coordinates
          country: "US", // Adding required country property
          location: { type: "Point" as const, coordinates: [0, 0] as [number, number] }, // Adding required location property
        },
        contactInfo: {
          phone: formData.phone,
          email: formData.email,
          website: formData.website || undefined,
        },
        priceRange: formData.priceRange,
      };

      await restaurantApi.createRestaurant(restaurantData);

      // Also create default business hours
      const defaultTimeSlot = { open: formData.openingHours, close: formData.closingHours };
      await restaurantApi.updateBusinessHours(restaurantData.name, {
        monday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        tuesday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        wednesday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        thursday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        friday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        saturday: { isOpen: true, timeSlots: [defaultTimeSlot] },
        sunday: { isOpen: false, timeSlots: [] },
      });

      toast({
        title: "Restaurant profile created",
        description: "Your restaurant profile has been set up successfully!",
      });

      // Redirect to the restaurant dashboard
      router.push("/restaurant/dashboard");
    } catch (error) {
      console.error("Error setting up restaurant:", error);
      toast({
        title: "Setup failed",
        description: "There was a problem setting up your restaurant profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    // Basic validation for each step
    switch (currentStep) {
      case 0:
        return !!formData.name && !!formData.cuisine && !!formData.description;
      case 1:
        return (
          !!formData.street &&
          !!formData.city &&
          !!formData.state &&
          !!formData.zipCode &&
          !!formData.phone
        );
      case 2:
        return !!formData.priceRange;
      default:
        return false;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="container mx-auto flex max-w-6xl flex-1 items-start py-10">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left sidebar with steps */}
          <div className="p-4 md:col-span-1">
            <div className="mb-8 flex items-center gap-3">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold">Restaurant Setup</h1>
            </div>
            <Steps currentStep={currentStep} steps={steps} />
          </div>

          {/* Right side with form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>
                  {steps[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Basic details */}
                  <StepContent step={0} currentStep={currentStep}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Restaurant Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your restaurant's name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cuisine">Cuisine Type</Label>
                        <Select
                          value={formData.cuisine}
                          onValueChange={(value) => handleSelectChange("cuisine", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cuisine type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="American">American</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Chinese">Chinese</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Mexican">Mexican</SelectItem>
                            <SelectItem value="Thai">Thai</SelectItem>
                            <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Tell us about your restaurant..."
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        onClick={goToNextStep}
                        disabled={!validateCurrentStep()}
                      >
                        Next
                      </Button>
                    </div>
                  </StepContent>

                  {/* Step 2: Address & Contact */}
                  <StepContent step={1} currentStep={currentStep}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="123 Main St"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="New York"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="NY"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          placeholder="10001"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(123) 456-7890"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="restaurant@example.com"
                          readOnly
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">This is the email you registered with.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website (Optional)</Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://yourrestaurant.com"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={goToNextStep}
                        disabled={!validateCurrentStep()}
                      >
                        Next
                      </Button>
                    </div>
                  </StepContent>

                  {/* Step 3: Additional Information */}
                  <StepContent step={2} currentStep={currentStep}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="priceRange">Price Range</Label>
                        <Select
                          value={formData.priceRange}
                          onValueChange={(value) => handleSelectChange("priceRange", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select price range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="$">$ (Inexpensive)</SelectItem>
                            <SelectItem value="$$">$$ (Moderate)</SelectItem>
                            <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                            <SelectItem value="$$$$">$$$$ (Very Expensive)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="openingHours">Opening Hours</Label>
                          <Input
                            id="openingHours"
                            name="openingHours"
                            type="time"
                            value={formData.openingHours}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="closingHours">Closing Hours</Label>
                          <Input
                            id="closingHours"
                            name="closingHours"
                            type="time"
                            value={formData.closingHours}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-md bg-orange-50 p-4 text-sm">
                        <p className="font-medium text-orange-800">
                          Almost done! Complete your profile to start receiving orders.
                        </p>
                        <p className="mt-1 text-orange-700">
                          You'll be able to add more details like menu items and business hours
                          after setup.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={isSubmitting || !validateCurrentStep()}
                      >
                        {isSubmitting ? "Setting up..." : "Complete Setup"}
                      </Button>
                    </div>
                  </StepContent>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}