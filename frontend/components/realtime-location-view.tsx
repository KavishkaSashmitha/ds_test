"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeliveryMap from "@/components/delivery-map";
import { subscribeToLocationUpdates, fetchDriverLocation } from "@/lib/socketService";

interface RealtimeLocationViewProps {
  deliveryId: string;
  orderId: string;
}

export default function RealtimeLocationView({
  deliveryId,
  orderId,
}: Readonly<RealtimeLocationViewProps>) {
  const { toast } = useToast();
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    phone?: string;
    rating?: number;
    vehicleType?: string;
  } | null>(null);
  const [destination, setDestination] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [origin, setOrigin] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("in_transit");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Function | null>(null);
  const lastUpdateTimeRef = useRef<Date | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Fetch initial location data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const locationData = await fetchDriverLocation(orderId);
        
        if (!locationData) {
          setError("No location data available for this delivery");
          return;
        }
        
        // Set driver location
        if (locationData.location) {
          setDriverLocation({
            lat: locationData.location.latitude,
            lng: locationData.location.longitude,
          });
          lastUpdateTimeRef.current = new Date(locationData.location.lastUpdate || Date.now());
          setLastUpdateTime(lastUpdateTimeRef.current.toLocaleTimeString());
        }
        
        // Set driver info
        if (locationData.driverInfo) {
          setDriverInfo(locationData.driverInfo);
        }
        
        // Set status
        if (locationData.status) {
          setStatus(locationData.status);
        }
        
        // Set destination & origin based on order data
        if (locationData.delivery) {
          setDestination({
            lat: locationData.delivery.customerLocation.coordinates[1],
            lng: locationData.delivery.customerLocation.coordinates[0],
            address: locationData.delivery.customerAddress || "Delivery location"
          });
          
          setOrigin({
            lat: locationData.delivery.restaurantLocation.coordinates[1],
            lng: locationData.delivery.restaurantLocation.coordinates[0],
            address: locationData.delivery.restaurantName || "Restaurant"
          });
        }
        
        // Set ETA
        if (locationData.estimatedArrival) {
          setEstimatedArrival(
            `${locationData.estimatedArrival.estimatedMinutes} minutes (${new Date(
              locationData.estimatedArrival.estimatedTime
            ).toLocaleTimeString()})`
          );
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
        setError("Failed to fetch location data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [orderId]);
  
  // Setup real-time location tracking
  useEffect(() => {
    if (loading || error) return;
    
    // Don't track if delivery is complete or cancelled
    if (status === 'delivered' || status === 'cancelled') {
      return;
    }
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToLocationUpdates(deliveryId, (data: any) => {
      // Update driver location on map
      if (data.location) {
        setDriverLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
        });
        
        // Update last update time
        lastUpdateTimeRef.current = new Date();
        setLastUpdateTime(lastUpdateTimeRef.current.toLocaleTimeString());
      }
      
      // Update delivery status if changed
      if (data.status && status !== data.status) {
        setStatus(data.status);
        
        toast({
          title: "Status Updated",
          description: `Delivery status: ${data.status}`,
        });
      }
      
      // Update estimated arrival
      if (data.estimatedArrival) {
        setEstimatedArrival(
          `${data.estimatedArrival.estimatedMinutes} minutes (${new Date(
            data.estimatedArrival.estimatedTime
          ).toLocaleTimeString()})`
        );
      }
    });
    
    unsubscribeRef.current = unsubscribe;
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [deliveryId, loading, error, status, toast]);
  
  // Set up update interval to show "last updated" time
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (lastUpdateTimeRef.current) {
        const now = new Date();
        const diff = now.getTime() - lastUpdateTimeRef.current.getTime();
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) {
          setLastUpdateTime(`${seconds} seconds ago`);
        } else if (seconds < 3600) {
          setLastUpdateTime(`${Math.floor(seconds / 60)} minutes ago`);
        } else {
          setLastUpdateTime(lastUpdateTimeRef.current.toLocaleTimeString());
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="container max-w-md mx-auto mt-8 px-4">
        <Card>
          <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container max-w-md mx-auto mt-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Location Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href={`/customer/orders/${orderId}`} passHref>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Completed delivery state
  if (status === 'delivered' || status === 'cancelled') {
    return (
      <div className="container max-w-md mx-auto mt-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">
              {status === 'delivered' ? 'Delivery Completed' : 'Delivery Cancelled'}
            </h2>
            <p className="text-gray-600 mb-4">
              {status === 'delivered' 
                ? 'Your order has been delivered successfully.' 
                : 'This delivery has been cancelled.'}
            </p>
            <Link href={`/customer/orders/${orderId}`} passHref>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto mt-8 px-4 mb-12">
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Tracking
            </CardTitle>
            <Badge
              variant="outline"
              className={
                status === 'in_transit' 
                  ? 'bg-orange-500 text-white' 
                  : status === 'picked_up' 
                    ? 'bg-yellow-500 text-white'
                    : 'bg-blue-500 text-white'
              }
            >
              {status === 'in_transit' 
                ? 'On The Way' 
                : status === 'picked_up' 
                  ? 'Picked Up'
                  : 'Assigned'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {estimatedArrival && (
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <p className="text-sm">Arriving in: {estimatedArrival}</p>
            </div>
          )}
          
          {lastUpdateTime && (
            <p className="text-xs text-gray-500">Last updated: {lastUpdateTime}</p>
          )}
        </CardContent>
      </Card>
      
      {/* Map */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[300px] w-full relative">
            {driverLocation && destination && (
              <DeliveryMap
                currentLocation={driverLocation}
                orders={[]}
                currentOrder={{
                  id: orderId,
                  restaurantId: origin?.address || "",
                  restaurantName: origin?.address || "",
                  restaurantAddress: origin?.address || "",
                  restaurantLocation: origin || { lat: 0, lng: 0 },
                  customerName: "Customer",
                  customerAddress: destination.address,
                  customerLocation: destination,
                  customerPhone: "",
                  items: [],
                  total: 0,
                  status: status as any,
                  distance: 0,
                  estimatedTime: "",
                  earnings: 0,
                  createdAt: "",
                }}
                height={300}
                showDirections={true}
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Driver Info */}
      {driverInfo && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium">{driverInfo.name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {driverInfo.vehicleType || "Delivery Driver"}
                  {driverInfo.rating && ` • ${driverInfo.rating.toFixed(1)}★`}
                </p>
              </div>
              {driverInfo.phone && (
                <Button className="ml-auto bg-green-500 hover:bg-green-600" size="sm">
                  <a href={`tel:${driverInfo.phone}`}>Call Driver</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Journey info */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-1">A</div>
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-sm text-gray-500">{origin?.address || "Restaurant"}</p>
              </div>
            </div>
            
            <div className="ml-3 h-6 border-l-2 border-dashed border-gray-300"></div>
            
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs mt-1">B</div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-gray-500">{destination?.address || "Your location"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Link href={`/customer/orders/${orderId}`} passHref>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </Link>
        
        <Button 
          onClick={() => window.location.reload()}
          variant="ghost"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
