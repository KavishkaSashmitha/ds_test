"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, MapPin } from "lucide-react";

import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { orderApi, paymentApi } from "@/lib/api";

// Mock saved addresses
const savedAddresses = [
  {
    id: "1",
    name: "Home",
    address: "123 Main Street, Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    isDefault: true,
    coordinates: [-74.005941, 40.712784] as [number, number], // [longitude, latitude]
  },
  {
    id: "2",
    name: "Work",
    address: "456 Business Avenue, Floor 10",
    city: "New York",
    state: "NY",
    zipCode: "10002",
    isDefault: false,
    coordinates: [-73.987465, 40.748817] as [number, number], // [longitude, latitude]
  },
];

// Payment methods matching backend PaymentMethod type
const paymentMethods = [
  {
    id: "credit_card",
    name: "Credit/Debit Card",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "cash",
    name: "Cash on Delivery",
    icon: <CreditCard className="h-5 w-5" />,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses.find((a) => a.isDefault)?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const [specialInstructions, setSpecialInstructions] = useState("");

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 3.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Get the selected address
      const selectedAddress = savedAddresses.find(
        (address) => address.id === selectedAddressId
      );
      if (!selectedAddress) {
        throw new Error("Please select a delivery address");
      }

      // Format items for the API
      const orderItems = cartItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options?.map((option) => ({
          name: option.name,
          value: option.value,
          price: 0, // Assuming the price is already included in the item price
        })),
      }));

      // Create order request
      const orderData = {
        restaurantId: cartItems[0].restaurantId,
        items: orderItems,
        subtotal,
        tax,
        deliveryFee,
        tip: 0, // Can be added as a feature later
        total,
        paymentMethod: paymentMethod as any, // Using the value directly from state
        deliveryAddress: {
          street: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          coordinates: selectedAddress.coordinates,
          location: {
            type: "Point" as const,
            coordinates: selectedAddress.coordinates, // Make sure coordinates are in [longitude, latitude] format
          },
        },
        deliveryInstructions: "",
        specialInstructions: specialInstructions,
      };

      // Create order
      const orderResponse = await orderApi.createOrder(orderData);

      // Process payment if not cash on delivery
      if (paymentMethod !== "cash") {
        // Extract card details
        const paymentDetails = {
          cardLast4: cardDetails.cardNumber.slice(-4),
          cardBrand: getCardBrand(cardDetails.cardNumber),
        };

        // Process payment
        await paymentApi.processPayment({
          orderId: orderResponse.data.order._id!,
          paymentMethod: paymentMethod as any,
          paymentDetails,
        });
      }

      // Clear cart
      clearCart();

      // Navigate to order details page
      router.push(
        `/customer/orders/${orderResponse.data.order._id}?status=success`
      );

      toast({
        title: "Order placed successfully!",
        description: "Your food is being prepared.",
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Failed to place order",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to determine card brand from number
  const getCardBrand = (cardNumber: string): string => {
    // Very basic detection, can be expanded
    if (cardNumber.startsWith("4")) return "visa";
    if (cardNumber.startsWith("5")) return "mastercard";
    if (cardNumber.startsWith("3")) return "amex";
    if (cardNumber.startsWith("6")) return "discover";
    return "unknown";
  };

  if (cartItems.length === 0) {
    router.push("/customer/cart");
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/customer/cart"
          className="mb-4 flex items-center text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={setSelectedAddressId}
                  className="space-y-4"
                >
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start space-x-2"
                    >
                      <RadioGroupItem
                        value={address.id}
                        id={`address-${address.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`address-${address.id}`}
                          className="flex items-center gap-2 font-medium"
                        >
                          {address.name}
                          {address.isDefault && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                              Default
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {address.address}, {address.city}, {address.state}{" "}
                          {address.zipCode}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-4">
                  <Button
                    variant="outline"
                    type="button"
                    className="text-orange-500"
                  >
                    + Add New Address
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={method.id}
                        id={`payment-${method.id}`}
                      />
                      <Label
                        htmlFor={`payment-${method.id}`}
                        className="flex items-center gap-2"
                      >
                        {method.icon}
                        {method.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {paymentMethod === "credit_card" && (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cardNumber: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardDetails.cardName}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cardName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                expiryDate: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                cvv: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special instructions for your order or delivery..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium">
                    Items ({cartItems.length})
                  </h3>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Place Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
