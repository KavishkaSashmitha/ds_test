"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RealtimeLocationView from "@/components/realtime-location-view";
import { Card, CardContent } from "@/components/ui/card";

export default function TrackDeliveryPage() {
  const searchParams = useSearchParams();
  const deliveryId = searchParams.get("deliveryId");
  const orderId = searchParams.get("orderId");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deliveryId && !orderId) {
      setError("Missing delivery or order ID. Please check the tracking link.");
    }
  }, [deliveryId, orderId]);

  if (error) {
    return (
      <div className="container max-w-md mx-auto mt-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Tracking Unavailable</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-lg font-semibold">Delivery Tracking</h1>
        </div>
      </header>

      <main>
        {deliveryId && orderId ? (
          <RealtimeLocationView deliveryId={deliveryId} orderId={orderId} />
        ) : (
          <div className="container max-w-md mx-auto mt-8 px-4">
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">
                  Invalid Tracking Link
                </h2>
                <p className="text-gray-600">
                  Please check your tracking link or try again later.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        <p>© 2025 Restaurant Delivery App. All rights reserved.</p>
      </footer>
    </div>
  );
}
