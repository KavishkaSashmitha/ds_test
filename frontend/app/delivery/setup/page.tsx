"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { deliveryApi } from "@/lib/api";
import { Steps, StepContent } from "@/components/steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    title: "Personal Information",
    description: "Provide your basic personal information",
  },
  {
    title: "Vehicle Details",
    description: "Tell us about your delivery vehicle",
  },
];

// Define vehicle types as per the interface
type VehicleType = "motorcycle" | "bicycle" | "car" | "scooter";

export default function DeliverySetup() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Personal information
    name: user?.name || "",
    phone: "",
    email: user?.email || "",

    // Step 2: Vehicle details
    vehicleType: "motorcycle" as VehicleType,
    licenseNumber: "",
  });

  useEffect(() => {
    // Check if the user has already completed the setup
    const checkDeliverySetup = async () => {
      if (user?._id) {
        try {
          // Use getDeliveryPersonnelProfile instead of getDeliveryByUser
          const response = await deliveryApi.getDeliveryPersonnelProfile();

          // If the profile exists, redirect to the dashboard
          if (response.data) {
            router.push("/delivery/dashboard");
          }
        } catch (error) {
          // No delivery profile exists, continue with setup
          console.log("No delivery profile found, proceeding with setup");
        }
      }
    };

    checkDeliverySetup();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Create delivery personnel data matching the required interface
      const deliveryPersonnelData = {
        userId: user?._id || "",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        licenseNumber: formData.licenseNumber,
        isAvailable: true,
        isActive: true,
        rating: 0,
        totalRatings: 0,
        currentLocation: {
          type: "Point" as const,
          coordinates: [0, 0] as [number, number], // Default coordinates, to be updated when app is used
        },
      };

      await deliveryApi.registerDeliveryPersonnel(deliveryPersonnelData);

      // Update the user's profile to indicate setup is complete
      // Instead of directly modifying the user object, we should update it through the API
      // and the auth context will handle the updated user data on the next fetch

      toast({
        title: "Profile created",
        description: "Your delivery profile has been set up successfully!",
      });

      // Redirect to the delivery dashboard
      router.push("/delivery/dashboard");
    } catch (error) {
      console.error("Error setting up delivery profile:", error);
      toast({
        title: "Setup failed",
        description: "There was a problem setting up your delivery profile.",
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
        return !!formData.name && !!formData.phone && !!formData.email;
      case 1:
        return !!formData.vehicleType && !!formData.licenseNumber;
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
              <Truck className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold">Delivery Partner Setup</h1>
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
                  {/* Step 1: Personal Information */}
                  <StepContent step={0} currentStep={currentStep}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
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
                          placeholder="your.email@example.com"
                          readOnly={!!user?.email}
                          className={user?.email ? "bg-gray-50" : ""}
                        />
                        {user?.email && (
                          <p className="text-xs text-gray-500">
                            This is the email you registered with.
                          </p>
                        )}
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

                  {/* Step 2: Vehicle Details */}
                  <StepContent step={1} currentStep={currentStep}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select
                          value={formData.vehicleType}
                          onValueChange={(value) =>
                            handleSelectChange("vehicleType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="motorcycle">
                              Motorcycle
                            </SelectItem>
                            <SelectItem value="bicycle">Bicycle</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="scooter">Scooter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="Enter your license number"
                          required
                        />
                      </div>

                      <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm">
                        <p className="font-medium text-blue-800">
                          Almost done! Complete your profile to start accepting
                          deliveries.
                        </p>
                        <p className="mt-1 text-blue-700">
                          We may need to verify your information before you can
                          begin delivering.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600"
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
