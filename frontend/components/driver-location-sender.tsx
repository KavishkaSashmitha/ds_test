"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { sendLocationUpdate, initializeSocket } from "@/lib/socketService";

interface DriverLocationSenderProps {
  deliveryId?: string;
  isActive: boolean;
  authToken: string;
}

export function DriverLocationSender({
  deliveryId,
  isActive,
  authToken,
}: DriverLocationSenderProps) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (authToken) {
      initializeSocket(authToken);
    }
  }, [authToken]);

  // Start location tracking when active
  useEffect(() => {
    if (isActive && !isTracking) {
      startLocationTracking();
    } else if (!isActive && isTracking) {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isActive]);

  // Start tracking the driver's location
  const startLocationTracking = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    try {
      setIsTracking(true);

      // Show notification that tracking has started
      toast({
        title: "Location Tracking Started",
        description: "Your location is now being shared",
      });

      // Use watchPosition to continuously track location
      watchIdRef.current = navigator.geolocation.watchPosition(
        // Success callback
        (position) => {
          const { latitude, longitude } = position.coords;

          // Update local state
          setCurrentLocation({ latitude, longitude });
          setLastUpdateTime(new Date());

          // Send to server
          sendLocationUpdate({
            latitude,
            longitude,
            deliveryId,
          });
        },
        // Error callback
        (err) => {
          console.error("Error getting location:", err);
          setError(`Error getting location: ${err.message}`);
          setIsTracking(false);

          toast({
            title: "Location Error",
            description: `Could not track your location: ${err.message}`,
            variant: "destructive",
          });
        },
        // Options
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // Accept positions up to 10 seconds old
          timeout: 5000, // Time out after 5 seconds
        }
      );
    } catch (err) {
      console.error("Failed to start location tracking:", err);
      setError("Failed to start location tracking");
      setIsTracking(false);
    }
  };

  // Stop tracking the driver's location
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    toast({
      title: "Location Tracking Stopped",
      description: "Your location is no longer being shared",
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Location Sharing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">
                Status:{" "}
                <span
                  className={isTracking ? "text-green-500" : "text-gray-500"}
                >
                  {isTracking ? "Active" : "Inactive"}
                </span>
              </p>
              {lastUpdateTime && (
                <p className="text-xs text-gray-500">
                  Last update: {lastUpdateTime.toLocaleTimeString()}
                </p>
              )}
              {currentLocation && (
                <p className="text-xs text-gray-500 mt-1">
                  Current coordinates: {currentLocation.latitude.toFixed(6)},{" "}
                  {currentLocation.longitude.toFixed(6)}
                </p>
              )}
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <Button
              size="sm"
              variant={isTracking ? "destructive" : "default"}
              onClick={
                isTracking ? stopLocationTracking : startLocationTracking
              }
              className="min-w-[100px]"
            >
              {isTracking ? "Stop Sharing" : "Start Sharing"}
            </Button>
          </div>
          {isTracking && (
            <p className="text-xs text-muted-foreground">
              Your location is being shared in real-time. The customer can see
              your current position on their tracking map.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
