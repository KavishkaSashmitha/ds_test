"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Steps, Step } from "@/components/steps";
import { Order, OrderStatus, Payment } from "@/lib/api";
import { orderApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is a new order with success status
    if (searchParams.get("status") === "success") {
      setShowSuccessMessage(true);

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }

    // Fetch order details from API
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getOrderById(orderId);
        setOrder(response.data.order);
        setPayment(response.data.payment || null);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch order details:", err);
        setError(err.response?.data?.message || "Failed to load order details");
        toast({
          title: "Error",
          description: "Could not load order details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, searchParams, toast]);

  // Get current step based on order status
  const getCurrentStep = () => {
    if (!order) return 0;

    switch (order.status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 1;
      case "ready_for_pickup":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const cancelOrder = async () => {
    if (!order || !orderId) return;

    try {
      await orderApi.cancelOrder(orderId, {
        reason: "Customer requested cancellation",
      });

      // Refresh order details
      const response = await orderApi.getOrderById(orderId);
      setOrder(response.data.order);
      setPayment(response.data.payment || null);

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      });
    } catch (err: any) {
      console.error("Failed to cancel order:", err);
      toast({
        title: "Error",
        description:
          err.response?.data?.message ||
          "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-red-500">Error Loading Order</h2>
        <p className="mt-2 text-gray-600">{error || "Order not found"}</p>
        <Link href="/customer/orders" className="mt-6">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  // Calculate order totals if not already provided
  const subtotal =
    order.subtotal ||
    order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const deliveryFee = order.deliveryFee || 0;
  const tax = order.tax || 0;
  const total = order.total || subtotal + deliveryFee + tax;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/customer/orders"
          className="mb-4 flex items-center text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Order #{order._id?.slice(-6).toUpperCase()}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              order.status === "delivered"
                ? "bg-green-100 text-green-600"
                : order.status === "cancelled"
                ? "bg-red-100 text-red-600"
                : "bg-orange-100 text-orange-600"
            }`}
          >
            {order.status
              ?.replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </span>
        </div>
        <p className="text-gray-600">{formatDate(order.createdAt)}</p>
      </div>

      {showSuccessMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <p>
            Your order has been placed successfully! The restaurant will confirm
            it shortly.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {order.status === "cancelled" ? (
                <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
                  <p className="font-medium">This order has been cancelled</p>
                  {order.refundReason && (
                    <p className="mt-2 text-sm">Reason: {order.refundReason}</p>
                  )}
                </div>
              ) : (
                <Steps currentStep={getCurrentStep()}>
                  <Step
                    title="Order Placed"
                    description="Restaurant received your order"
                  />
                  <Step
                    title="Preparing"
                    description="Restaurant is preparing your food"
                  />
                  <Step
                    title="Ready for Pickup"
                    description="Your order is ready for pickup"
                  />
                  <Step
                    title="Out for Delivery"
                    description="Driver is on the way"
                  />
                  <Step title="Delivered" description="Enjoy your meal!" />
                </Steps>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>
                    {order.estimatedDeliveryTime
                      ? `Estimated delivery time: ${formatDate(
                          order.estimatedDeliveryTime
                        )}`
                      : "Estimated delivery time will be provided soon"}
                  </span>
                </div>

                {order.status === "pending" && (
                  <Button variant="destructive" onClick={cancelOrder}>
                    Cancel Order
                  </Button>
                )}

                {[
                  "out_for_delivery",
                  "confirmed",
                  "preparing",
                  "ready_for_pickup",
                ].includes(order.status) && (
                  <Button variant="outline">Track Order</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image
                    src="/placeholder.svg"
                    alt="Restaurant"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{order.restaurantId}</h3>
                  <div className="mt-2 flex items-center gap-4">
                    <Button variant="outline" size="sm" className="h-8">
                      View Menu
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-gray-600">
                    {order.deliveryAddress?.street},{" "}
                    {order.deliveryAddress?.city},{" "}
                    {order.deliveryAddress?.state}{" "}
                    {order.deliveryAddress?.zipCode}
                  </p>
                  {order.deliveryInstructions && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Instructions: </span>
                      {order.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>

              {order.status === "out_for_delivery" &&
                order.deliveryPersonId && (
                  <div className="mt-4 rounded-lg border p-4">
                    <p className="mb-2 font-medium">Delivery Person</p>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src="/placeholder-user.jpg"
                          alt="Delivery Person"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p>Delivery Person ID: {order.deliveryPersonId}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        Call
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Order Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">
                  Items ({order.items.length})
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.menuItemId || index}>
                      <div className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.options.map((option, idx) => (
                            <span key={idx}>
                              {option.name}: {option.value}
                              {idx < item.options!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      )}
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
                {order.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip</span>
                    <span>${order.tip.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium">Payment Method</p>
                <p>
                  {order.paymentMethod
                    ?.replace(/_/g, " ")
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </p>
                <p className="mt-1 font-medium">Payment Status</p>
                <p>
                  {order.paymentStatus?.charAt(0).toUpperCase() +
                    order.paymentStatus?.slice(1) || "N/A"}
                </p>
              </div>

              {order.specialInstructions && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium">Special Instructions</p>
                  <p>{order.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
